import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

const DEFAULT_MODEL = "baidu/qianfan-ocr-fast-20260420:free";

const metricSchema = z.object({
  label: z.string(),
  unit: z.string(),
  currentValue: z.string(),
  previousValue: z.string(),
  change: z.string(),
});

const attentionSchema = z.object({
  title: z.string(),
  severity: z.string(),
  message: z.string(),
});

const datasetSummarySchema = z.object({
  datasetName: z.string(),
  periodLabel: z.string(),
  healthScore: z.number(),
  sourceName: z.string(),
  metrics: z.array(metricSchema),
  attention: z.array(attentionSchema),
});

const comparisonInputSchema = z.object({
  current: datasetSummarySchema,
  previous: datasetSummarySchema,
});

const comparisonResponseSchema = z.object({
  summary: z.string(),
  whatImproved: z.string(),
  whatWorsened: z.string(),
  whatToCheckFirst: z.string(),
  caveat: z.string(),
  model: z.string(),
  generatedAt: z.string(),
});

export type DatasetComparisonInsightResponse = z.infer<typeof comparisonResponseSchema>;

function resolveOpenRouterSettings() {
  const env = typeof process !== "undefined" ? process.env : undefined;
  const apiKey = env?.OPENROUTER_API_KEY;
  const model = env?.OPENROUTER_MODEL || DEFAULT_MODEL;

  return { apiKey, model };
}

function parseComparisonContent(content: string, model: string): DatasetComparisonInsightResponse {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const pick = (prefix: string, fallback: string) =>
    lines
      .find((line) => line.toLowerCase().startsWith(prefix.toLowerCase()))
      ?.slice(prefix.length)
      .trim() || fallback;

  return comparisonResponseSchema.parse({
    summary: pick("Короткий вывод:", content.trim()),
    whatImproved: pick("Что улучшилось:", "Модель не выделила отдельный блок улучшений."),
    whatWorsened: pick("Что ухудшилось:", "Модель не выделила отдельный блок ухудшений."),
    whatToCheckFirst: pick(
      "Что проверить первым:",
      "Сначала сверьте разницу по CAC, марже и оттоку.",
    ),
    caveat: pick(
      "Ограничение:",
      "Сравнение основано только на загруженных таблицах и их метриках.",
    ),
    model,
    generatedAt: new Date().toISOString(),
  });
}

function buildPrompt(input: z.infer<typeof comparisonInputSchema>) {
  const system = [
    "Ты аналитик портфельной компании.",
    "Сравни две версии бизнес-таблицы и используй только переданные цифры.",
    "Не придумывай причины, которых нет в данных.",
    "Пиши кратко, на русском языке, в тоне для руководителя.",
    "Верни ровно пять строк с такими префиксами:",
    "Что улучшилось:",
    "Что ухудшилось:",
    "Что проверить первым:",
    "Короткий вывод:",
    "Ограничение:",
  ].join(" ");

  const user = [
    `Текущий набор: ${input.current.datasetName}.`,
    `Текущий период: ${input.current.periodLabel}.`,
    `Предыдущий набор: ${input.previous.datasetName}.`,
    `Предыдущий период: ${input.previous.periodLabel}.`,
    `Текущий health score: ${input.current.healthScore}.`,
    `Предыдущий health score: ${input.previous.healthScore}.`,
    `Сравнение метрик: ${JSON.stringify(input.current.metrics)}.`,
    `Текущие risk-сигналы: ${JSON.stringify(input.current.attention)}.`,
    `Предыдущие risk-сигналы: ${JSON.stringify(input.previous.attention)}.`,
    "Сошлись на конкретные цифры и изменения между старой и новой таблицей.",
  ].join("\n");

  return { system, user };
}

function buildFallbackComparisonInsight(input: z.infer<typeof comparisonInputSchema>) {
  const topCurrentRisk = input.current.attention[0];
  const topPreviousRisk = input.previous.attention[0];
  const improved = input.current.healthScore > input.previous.healthScore;

  return comparisonResponseSchema.parse({
    summary: improved
      ? `Новый набор выглядит сильнее: health score ${input.previous.healthScore} → ${input.current.healthScore}.`
      : `Новый набор не стал сильнее: health score ${input.previous.healthScore} → ${input.current.healthScore}.`,
    whatImproved: improved
      ? `Качество набора улучшилось по итоговой оценке: ${input.previous.healthScore} → ${input.current.healthScore}.`
      : "По итоговой оценке явного улучшения не видно.",
    whatWorsened:
      topCurrentRisk?.message ??
      topPreviousRisk?.message ??
      "Явного нового ухудшения rule-based слой не выделил.",
    whatToCheckFirst: topCurrentRisk
      ? `Сначала проверьте блок «${topCurrentRisk.title}», потому что он остается главным сигналом в новой таблице.`
      : "Сначала сравните CAC, маржу и отток между старой и новой таблицей.",
    caveat:
      "Это резервный rule-based вывод по двум загруженным таблицам. Для финального сравнения используйте ответ модели.",
    model: "Предварительное comparison summary",
    generatedAt: new Date().toISOString(),
  });
}

export const generateDatasetComparisonInsight = createServerFn({ method: "POST" })
  .inputValidator((input) => comparisonInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { apiKey, model } = resolveOpenRouterSettings();

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY не настроен на сервере.");
    }

    const prompt = buildPrompt(data);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_completion_tokens: 260,
        reasoning: {
          effort: "none",
          exclude: true,
        },
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

    const message = payload.choices?.[0]?.message;
    const content =
      typeof message?.content === "string"
        ? message.content.trim()
        : Array.isArray(message?.content)
          ? message.content
              .map((part) => (typeof part?.text === "string" ? part.text : ""))
              .join("\n")
              .trim()
          : typeof message?.reasoning === "string"
            ? message.reasoning.trim()
            : "";

    if (!content) {
      return {
        ...buildFallbackComparisonInsight(data),
        model: payload.model || model,
      };
    }

    try {
      return parseComparisonContent(content, payload.model || model);
    } catch {
      return {
        ...buildFallbackComparisonInsight(data),
        model: payload.model || model,
      };
    }
  });
