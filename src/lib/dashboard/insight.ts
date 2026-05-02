import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { formatDeltaValue, formatMetricValue, formatSignedMetricValue } from "./format";
import type { DashboardSnapshot } from "./types";

const DEFAULT_MODEL = "deepseek/deepseek-chat-v3-0324:free";

const insightResponseSchema = z.object({
  summary: z.string(),
  whatChanged: z.string(),
  whatLooksRisky: z.string(),
  whatToCheckFirst: z.string(),
  caveat: z.string(),
  model: z.string(),
  generatedAt: z.string(),
});

export type InsightResponse = z.infer<typeof insightResponseSchema>;

const insightPromptPayloadSchema = z.object({
  comparisonMode: z.string(),
  currentPeriodLabel: z.string(),
  previousPeriodLabel: z.string().nullable(),
  rows: z.array(
    z.object({
      month: z.string(),
      revenue: z.number(),
      newCustomers: z.number(),
      ltv: z.number(),
      churnRate: z.number(),
      margin: z.number(),
      cac: z.number(),
      ltvCacRatio: z.number(),
    }),
  ),
  deltas: z.array(
    z.object({
      label: z.string(),
      currentValue: z.string(),
      previousValue: z.string(),
      delta: z.string(),
      improving: z.boolean().nullable(),
    }),
  ),
  attention: z.array(
    z.object({
      title: z.string(),
      severity: z.string(),
      message: z.string(),
    }),
  ),
});

export type InsightPromptPayload = z.infer<typeof insightPromptPayloadSchema>;

function resolveOpenRouterSettings() {
  const env = typeof process !== "undefined" ? process.env : undefined;
  const apiKey = env?.OPENROUTER_API_KEY;
  const model = env?.OPENROUTER_MODEL || DEFAULT_MODEL;

  return { apiKey, model };
}

export function buildInsightPromptPayload(snapshot: DashboardSnapshot): InsightPromptPayload {
  return {
    comparisonMode: snapshot.comparison.mode,
    currentPeriodLabel: snapshot.comparison.currentLabel,
    previousPeriodLabel: snapshot.comparison.previousLabel,
    rows: snapshot.comparison.selectedRows.map((row) => ({
      month: row.monthLabel,
      revenue: row.revenue,
      newCustomers: row.newCustomers,
      ltv: row.ltv,
      churnRate: row.churnRate,
      margin: row.margin,
      cac: row.cac,
      ltvCacRatio: Number(row.ltvCacRatio.toFixed(2)),
    })),
    deltas: Object.values(snapshot.deltas).map((delta) => ({
      label: delta.label,
      currentValue: formatMetricValue(delta.unit, delta.currentValue, { compact: true }),
      previousValue:
        delta.previousValue === null
          ? "без сравнения"
          : formatMetricValue(delta.unit, delta.previousValue, { compact: true }),
      delta: formatDeltaValue(delta),
      improving: delta.isImproving,
    })),
    attention: snapshot.attention.map((item) => ({
      title: item.title,
      severity: item.severity,
      message: item.message,
    })),
  };
}

function buildPrompt(payload: InsightPromptPayload) {
  const system = [
    "Ты аналитик портфельной компании.",
    "Используй только переданные цифры и не придумывай факты или причины, которых нет в данных.",
    "Если уверенного вывода нет, скажи об этом прямо.",
    "Пиши кратко, на русском языке и в тоне для руководителя.",
    "Верни ровно пять строк с такими префиксами:",
    "Что изменилось:",
    "Что настораживает:",
    "Что проверить первым:",
    "Короткий вывод:",
    "Ограничение:",
  ].join(" ");

  const user = [
    `Режим сравнения: ${payload.comparisonMode}.`,
    `Текущий период: ${payload.currentPeriodLabel}.`,
    `Базовый период: ${payload.previousPeriodLabel ?? "нет"}.`,
    `Ряды: ${JSON.stringify(payload.rows)}.`,
    `Дельты: ${JSON.stringify(payload.deltas)}.`,
    `Сигналы риска: ${JSON.stringify(payload.attention)}.`,
    "Ссылайся на конкретные числа и изменения.",
  ].join("\n");

  return { system, user };
}

function parseInsightContent(content: string, model: string): InsightResponse {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const pick = (prefix: string, fallback: string) =>
    lines
      .find((line) => line.toLowerCase().startsWith(prefix.toLowerCase()))
      ?.slice(prefix.length)
      .trim() || fallback;

  const summary = pick("Короткий вывод:", content.trim());
  const whatChanged = pick(
    "Что изменилось:",
    "Модель вернула общий ответ без отдельной строки про изменения.",
  );
  const whatLooksRisky = pick("Что настораживает:", "Модель не выделила отдельный блок рисков.");
  const whatToCheckFirst = pick(
    "Что проверить первым:",
    "Модель не указала первый приоритет для проверки.",
  );
  const caveat = pick(
    "Ограничение:",
    "Используйте вывод только как первый проход по имеющимся данным.",
  );

  return insightResponseSchema.parse({
    summary,
    whatChanged,
    whatLooksRisky,
    whatToCheckFirst,
    caveat,
    model,
    generatedAt: new Date().toISOString(),
  });
}

function extractTextContent(message: {
  content?: string | null | Array<{ type?: string; text?: string }>;
  reasoning?: string | null;
}) {
  if (typeof message.content === "string" && message.content.trim()) {
    return message.content.trim();
  }

  if (Array.isArray(message.content)) {
    const joined = message.content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();

    if (joined) {
      return joined;
    }
  }

  if (typeof message.reasoning === "string" && message.reasoning.trim()) {
    return message.reasoning.trim();
  }

  return "";
}

export const generateExecutiveInsight = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ payload: insightPromptPayloadSchema }).parse(input))
  .handler(async ({ data }) => {
    const { apiKey, model } = resolveOpenRouterSettings();

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY не настроен на сервере.");
    }

    const prompt = buildPrompt(data.payload);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 260,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter вернул ошибку: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const payload = (await response.json()) as {
      model?: string;
      choices?: Array<{
        message?: {
          content?: string | null | Array<{ type?: string; text?: string }>;
          reasoning?: string | null;
        };
      }>;
    };

    const content = extractTextContent(payload.choices?.[0]?.message ?? {});

    if (!content) {
      throw new Error("OpenRouter не вернул пригодный текст для AI-инсайта.");
    }

    try {
      return parseInsightContent(content, payload.model || model);
    } catch {
      throw new Error("Ответ OpenRouter не удалось корректно разобрать.");
    }
  });

export function buildFallbackInsight(snapshot: DashboardSnapshot) {
  const topRisk = snapshot.attention[0];
  const revenueDelta = snapshot.deltas.revenue;
  const customerDelta = snapshot.deltas.newCustomers;

  return {
    summary:
      topRisk?.message ||
      `Выручка изменилась на ${formatDeltaValue(revenueDelta)}, а новые клиенты — на ${formatDeltaValue(customerDelta)} в выбранном сравнении.`,
    whatChanged: `Выручка: ${formatSignedMetricValue(revenueDelta.unit, revenueDelta.deltaAbs ?? 0)}, новые клиенты: ${formatSignedMetricValue(customerDelta.unit, customerDelta.deltaAbs ?? 0)}.`,
    whatLooksRisky: topRisk?.message || "Пока нет явного сигнала риска до генерации AI-инсайта.",
    whatToCheckFirst: topRisk
      ? `Сначала стоит проверить блок «${topRisk.title}», потому что это самый сильный сигнал в данных.`
      : "Сначала проверьте CAC, отток и маржу в связке.",
    caveat:
      "Это предварительный rule-based вывод. Нажмите «Сгенерировать инсайт», чтобы получить ответ модели.",
    model: "Предварительный rule-based вывод",
    generatedAt: snapshot.generatedAt,
  };
}
