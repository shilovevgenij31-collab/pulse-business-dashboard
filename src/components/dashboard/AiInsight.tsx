import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ArrowRight,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  buildFallbackInsight,
  buildInsightPromptPayload,
  generateExecutiveInsight,
  type InsightResponse,
} from "@/lib/dashboard/insight";
import { formatDeltaValue, formatMetricValue, formatTimestampLabel } from "@/lib/dashboard/format";
import type { DashboardSnapshot } from "@/lib/dashboard/types";

const rowTones = {
  primary: "bg-primary/10 text-primary border-primary/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  secondary: "bg-secondary/10 text-accent border-secondary/30",
};

function InsightRows({ insight }: { insight: InsightResponse }) {
  const rows = [
    {
      icon: TrendingUp,
      label: "Что изменилось",
      text: insight.whatChanged,
      tone: "primary" as const,
    },
    {
      icon: AlertTriangle,
      label: "Что выглядит рискованно",
      text: insight.whatLooksRisky,
      tone: "warning" as const,
    },
    {
      icon: Search,
      label: "Что проверить первым",
      text: insight.whatToCheckFirst,
      tone: "secondary" as const,
    },
  ];

  return (
    <div className="mt-4 grid gap-2.5">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div
            key={row.label}
            className="flex items-center gap-3 rounded-xl border border-border bg-card-elevated/60 p-3"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg border ${rowTones[row.tone]}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="label-xs text-[10px]">{row.label}</div>
              <div className="mt-0.5 text-sm text-foreground">{row.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InsightResult({
  insight,
  badge,
  badgeTone,
}: {
  insight: InsightResponse;
  badge: string;
  badgeTone: string;
}) {
  return (
    <div className="rounded-2xl border border-border-strong bg-background/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${badgeTone}`}
        >
          {badge}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground/70">
          {formatTimestampLabel(insight.generatedAt)}
        </span>
      </div>

      <p className="text-[15px] leading-relaxed text-foreground">{insight.summary}</p>
      <InsightRows insight={insight} />

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{insight.model}</span>
        <span>·</span>
        <span>{insight.caveat}</span>
      </div>
    </div>
  );
}

function MetricTile({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-xl border border-border bg-card-elevated/55 p-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{delta}</div>
    </div>
  );
}

function ContextTile({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card-elevated/55 p-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold leading-snug text-foreground">{title}</div>
      <div className="mt-1 text-xs leading-snug text-muted-foreground">{description}</div>
    </div>
  );
}

export function AiInsight({ snapshot }: { snapshot: DashboardSnapshot }) {
  const fallbackInsight = useMemo(() => buildFallbackInsight(snapshot), [snapshot]);
  const promptPayload = useMemo(() => buildInsightPromptPayload(snapshot), [snapshot]);
  const generateInsight = useServerFn(generateExecutiveInsight);
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setInsight(null);
    setErrorMessage(null);
  }, [snapshot.generatedAt, snapshot.filters.range, snapshot.filters.compare]);

  async function handleGenerateInsight() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await generateInsight({
        data: {
          payload: promptPayload,
        },
      });

      setInsight(response);
    } catch {
      setInsight(null);
      setErrorMessage(
        "AI-инсайт не удалось сгенерировать. Проверьте OPENROUTER_API_KEY и серверные логи.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const rows = snapshot.comparison.selectedRows;
  const periodRevenue = rows.reduce((total, row) => total + row.revenue, 0);
  const periodCustomers = rows.reduce((total, row) => total + row.newCustomers, 0);
  const latestMonth = rows.at(-1);
  const primarySignal = snapshot.attention[0];
  const compareLabel = snapshot.comparison.previousLabel ?? "Без базы сравнения";
  const primarySignalShort = primarySignal?.message
    ? primarySignal.message.split(".")[0]
    : "В выбранном периоде критичных ухудшений не найдено.";

  const payloadSummary = [
    snapshot.comparison.selectedLabel,
    snapshot.comparison.previousLabel ? "есть база сравнения" : "без базы сравнения",
    `${snapshot.attention.length} risk-сигнала`,
  ].join(" · ");

  const metrics = [
    {
      label: "Выручка",
      value: formatMetricValue("currency", periodRevenue, { compact: true }),
      delta: formatDeltaValue(snapshot.deltas.revenue),
    },
    {
      label: "Клиенты",
      value: formatMetricValue("count", periodCustomers),
      delta: formatDeltaValue(snapshot.deltas.newCustomers),
    },
  ];

  return (
    <div className="card-surface relative flex h-full w-full flex-col overflow-hidden p-5">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-purple-glow)" }}
      />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex h-full flex-col">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-background">
              <Sparkles className="h-5 w-5" strokeWidth={2.5} />
              <span className="absolute -inset-0.5 -z-10 rounded-2xl bg-gradient-to-br from-secondary to-primary opacity-40 blur-md" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">AI-инсайт</h2>
                <span className="rounded-full border border-secondary/40 bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  OpenRouter
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Короткий вывод по периоду: тренд, риски и первый управленческий фокус.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateInsight}
            disabled={isLoading}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[0_0_24px_-4px_var(--primary-glow)] disabled:cursor-wait disabled:opacity-70"
          >
            {isLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isLoading ? "Генерируем..." : "Сгенерировать инсайт"}
            {!isLoading ? (
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            ) : null}
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">{payloadSummary}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {metrics.map((metric) => (
            <MetricTile
              key={metric.label}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-1 flex-col">
          {!insight && !errorMessage && !isLoading ? (
            <InsightResult
              insight={fallbackInsight}
              badge="Предварительный rule-based insight"
              badgeTone="border-warning/40 bg-warning/10 text-warning"
            />
          ) : null}

          {isLoading ? (
            <div className="rounded-2xl border border-secondary/30 bg-background/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin text-accent" />
                Генерируем insight через OpenRouter...
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                В модель отправляются подготовленные числа и risk-флаги. Ключ остается на сервере.
              </p>
            </div>
          ) : null}

          {insight ? (
            <InsightResult
              insight={insight}
              badge="Результат OpenRouter"
              badgeTone="border-secondary/40 bg-secondary/10 text-accent"
            />
          ) : null}

          {errorMessage ? (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {errorMessage}
              </div>
              <InsightResult
                insight={fallbackInsight}
                badge="Предварительный rule-based insight"
                badgeTone="border-warning/40 bg-warning/10 text-warning"
              />
            </div>
          ) : null}

          <div className="mt-4 flex-1">
            <div className="flex h-full flex-col rounded-2xl border border-border-strong bg-background/45 p-4">
              <div className="label-xs">Контекст для решения</div>
              <div className="mt-3 grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2">
                <ContextTile
                  label="Период"
                  title={snapshot.comparison.selectedLabel}
                  description={compareLabel}
                />
                <ContextTile
                  label="Последний месяц"
                  title={latestMonth?.monthLabel ?? "Нет данных"}
                  description={
                    latestMonth
                      ? `Выручка ${formatMetricValue("currency", latestMonth.revenue, { compact: true })}`
                      : "Нет данных для последней точки."
                  }
                />
                <ContextTile
                  label="Главный сигнал"
                  title={primarySignal?.title ?? "Сильных рисков нет"}
                  description={primarySignalShort}
                />
                <ContextTile
                  label="Что смотреть"
                  title="Качество роста"
                  description="Сверьте CAC, маржу и отток с динамикой выручки и новых клиентов."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
          API-ключ хранится только на серверной стороне.
        </div>
      </div>
    </div>
  );
}
