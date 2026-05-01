import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Percent,
  Target,
  TrendingUp,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardSnapshot, MetricKey, NormalizedMetricRow } from "@/lib/dashboard/types";
import { formatDeltaValue, formatMetricValue, statusFromDelta } from "@/lib/dashboard/format";
import { Sparkline } from "./Sparkline";

type Status = "Норма" | "Внимание" | "Риск";
type AggregateMode = "sum" | "average";

type MetricConfig = {
  key: MetricKey;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  aggregate: AggregateMode;
  summaryLabel: string;
  latestLabel: string;
  compact?: boolean;
};

type Kpi = {
  key: MetricKey;
  label: string;
  value: string;
  valueCaption: string;
  latestValue: string;
  latestCaption: string;
  delta: string;
  positive: boolean;
  status: Status;
  statusNote: string;
  data: number[];
  icon: LucideIcon;
  primary?: boolean;
};

const KPI_CONFIG: MetricConfig[] = [
  {
    key: "revenue",
    label: "Выручка",
    icon: DollarSign,
    primary: true,
    aggregate: "sum",
    summaryLabel: "Итог выбранного периода",
    latestLabel: "Последний месяц",
    compact: true,
  },
  {
    key: "margin",
    label: "Маржа",
    icon: Percent,
    aggregate: "average",
    summaryLabel: "Среднее за период",
    latestLabel: "Последний месяц",
  },
  {
    key: "newCustomers",
    label: "Новые клиенты",
    icon: Users,
    aggregate: "sum",
    summaryLabel: "Итог выбранного периода",
    latestLabel: "Последний месяц",
  },
  {
    key: "churnRate",
    label: "Отток",
    icon: UserMinus,
    aggregate: "average",
    summaryLabel: "Среднее за период",
    latestLabel: "Последний месяц",
  },
  {
    key: "cac",
    label: "CAC",
    icon: Target,
    aggregate: "average",
    summaryLabel: "Среднее за период",
    latestLabel: "Последний месяц",
    compact: true,
  },
  {
    key: "ltvCacRatio",
    label: "LTV/CAC",
    icon: TrendingUp,
    aggregate: "average",
    summaryLabel: "Среднее за период",
    latestLabel: "Последний месяц",
  },
];

const statusStyles: Record<Status, string> = {
  Норма: "border-primary/40 bg-primary/10 text-primary",
  Внимание: "border-warning/40 bg-warning/10 text-warning",
  Риск: "border-destructive/40 bg-destructive/10 text-destructive",
};

function aggregateRows(rows: NormalizedMetricRow[], key: MetricKey, aggregate: AggregateMode) {
  const values = rows.map((row) => row[key]);
  if (values.length === 0) {
    return 0;
  }

  if (aggregate === "sum") {
    return values.reduce((total, value) => total + value, 0);
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function getLatestMonthLabel(rows: NormalizedMetricRow[]) {
  return rows.at(-1)?.monthLabel ?? "Последний месяц";
}

function buildMetricNarrative(key: MetricKey, rows: NormalizedMetricRow[]) {
  const latest = rows.at(-1);
  const worst = rows.reduce(
    (selected, row) =>
      key === "churnRate" || key === "cac"
        ? row[key] > selected[key]
          ? row
          : selected
        : row[key] < selected[key]
          ? row
          : selected,
    rows[0],
  );
  const best = rows.reduce(
    (selected, row) =>
      key === "churnRate" || key === "cac"
        ? row[key] < selected[key]
          ? row
          : selected
        : row[key] > selected[key]
          ? row
          : selected,
    rows[0],
  );

  if (!latest) {
    return "Нет данных для детализации.";
  }

  if (key === "revenue") {
    return `Пик выручки пришелся на ${best.monthLabel}, а последняя точка периода — ${latest.monthLabel}.`;
  }

  if (key === "newCustomers") {
    return `Максимальный приток клиентов был в ${best.monthLabel}, а самый слабый месяц — ${worst.monthLabel}.`;
  }

  if (key === "margin") {
    return `Маржа опускалась до минимума в ${worst.monthLabel}, после чего восстановилась ближе к концу периода.`;
  }

  if (key === "churnRate") {
    return `Самый высокий отток наблюдался в ${worst.monthLabel}; это главный сигнал для retention-команды.`;
  }

  if (key === "cac") {
    return `Стоимость привлечения была максимальной в ${worst.monthLabel}, что давило на окупаемость каналов.`;
  }

  return `Лучшее значение коэффициента было в ${best.monthLabel}, худшее — в ${worst.monthLabel}.`;
}

function kpiStatus(config: MetricConfig, snapshot: DashboardSnapshot) {
  const delta = snapshot.deltas[config.key];
  const signal = snapshot.attention.find(
    (item) => item.key === config.key && item.title === config.label,
  );

  if (config.key === "revenue") {
    return statusFromDelta(delta) as Status;
  }

  return statusFromDelta(delta, signal?.severity) as Status;
}

function kpiNote(config: MetricConfig, snapshot: DashboardSnapshot) {
  if (config.key === "revenue") {
    const growthQualitySignal = snapshot.attention.find((item) => item.title === "Качество роста");
    return growthQualitySignal
      ? "Рост есть, но качество роста нужно проверить отдельно."
      : "Показывает объем бизнеса за выбранный период.";
  }

  if (config.key === "newCustomers") {
    return "Показывает общий объем нового притока за выбранный период.";
  }

  if (config.key === "cac") {
    return "Ниже — лучше. Карточка показывает средний CAC за выбранный период.";
  }

  if (config.key === "ltvCacRatio") {
    return "Выше — лучше. Карточка показывает средний коэффициент по периоду.";
  }

  if (config.key === "margin") {
    return "Средняя маржа по периоду помогает читать качество роста, а не только один месяц.";
  }

  return "Ниже — лучше. Карточка показывает средний отток за выбранный период.";
}

function MetricModal({
  snapshot,
  config,
  onClose,
}: {
  snapshot: DashboardSnapshot;
  config: MetricConfig;
  onClose: () => void;
}) {
  const summary = snapshot.summaries[config.key];
  const delta = snapshot.deltas[config.key];
  const rows = snapshot.comparison.selectedRows;
  const points = rows.map((row) => ({ month: row.monthShort, value: row[config.key] }));
  const narrative = buildMetricNarrative(config.key, rows);
  const selectedAggregate = aggregateRows(rows, config.key, config.aggregate);
  const latestValue = rows.at(-1)?.[config.key] ?? 0;
  const bestValue = summary.higherIsBetter ? summary.max : summary.min;
  const status = kpiStatus(config, snapshot);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Закрыть окно"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-border bg-card-elevated/70 p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div>
          <h3 className="text-xl font-semibold text-foreground">{config.label}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Детализация по метрике за период «{snapshot.comparison.selectedLabel}».
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card-elevated/60 p-4">
            <div className="label-xs">{config.summaryLabel}</div>
            <div className="mt-2 num-display text-2xl text-foreground">
              {formatMetricValue(summary.unit, selectedAggregate, { compact: config.compact })}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card-elevated/60 p-4">
            <div className="label-xs">{config.latestLabel}</div>
            <div className="mt-2 num-display text-2xl text-foreground">
              {formatMetricValue(summary.unit, latestValue, { compact: config.compact })}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card-elevated/60 p-4">
            <div className="label-xs">Лучший уровень</div>
            <div className="mt-2 num-display text-2xl text-foreground">
              {formatMetricValue(summary.unit, bestValue, { compact: config.compact })}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card-elevated/60 p-4">
            <div className="label-xs">Изменение к базе</div>
            <div className="mt-2 num-display text-2xl text-foreground">
              {formatDeltaValue(delta)}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-card-elevated/55 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Динамика по месяцам</h4>
              <p className="mt-1 text-xs text-muted-foreground">{narrative}</p>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[status]}`}
            >
              {status}
            </span>
          </div>

          <div className="mt-5 h-32">
            <Sparkline
              data={points.map((point) => point.value)}
              color={
                delta.isImproving === false ? "var(--color-destructive)" : "var(--color-primary)"
              }
              height={120}
            />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {points.map((point) => (
              <div
                key={`${config.key}-${point.month}`}
                className="rounded-2xl border border-border bg-background/60 p-3"
              >
                <div className="label-xs">{point.month}</div>
                <div className="mt-1 num-display text-sm text-foreground">
                  {formatMetricValue(summary.unit, point.value, { compact: config.compact })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ kpi, onOpen }: { kpi: Kpi; onOpen: () => void }) {
  const Icon = kpi.icon;
  const isPrimary = kpi.primary;

  return (
    <button
      className={`card-interactive relative w-full overflow-hidden rounded-3xl border p-5 text-left ${
        isPrimary
          ? "border-primary/40 bg-primary text-primary-foreground glow-lime"
          : "card-surface text-foreground"
      }`}
      type="button"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`label-xs ${isPrimary ? "text-primary-foreground/70" : ""}`}>
            {kpi.label}
          </span>
          <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80">
            <span className={isPrimary ? "text-primary-foreground/70" : ""}>
              {kpi.valueCaption}
            </span>
          </div>
          <div className="mt-2 num-display text-3xl">{kpi.value}</div>
          <p
            className={`mt-2 text-xs ${isPrimary ? "text-primary-foreground/75" : "text-muted-foreground"}`}
          >
            {kpi.latestCaption}: {kpi.latestValue}
          </p>
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            isPrimary
              ? "bg-primary-foreground/10 text-primary-foreground"
              : "bg-card-elevated text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
            isPrimary
              ? "bg-primary-foreground/10 text-primary-foreground"
              : kpi.positive
                ? "text-primary"
                : "text-destructive"
          }`}
        >
          {kpi.positive ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {kpi.delta}
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            isPrimary
              ? "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground"
              : statusStyles[kpi.status]
          }`}
        >
          {kpi.status}
        </span>
      </div>

      <div className="mt-3 -mx-1">
        <Sparkline
          data={kpi.data}
          color={
            isPrimary
              ? "var(--color-primary-foreground)"
              : kpi.positive
                ? "var(--color-primary)"
                : "var(--color-destructive)"
          }
        />
      </div>

      <p
        className={`mt-3 text-xs leading-relaxed ${isPrimary ? "text-primary-foreground/75" : "text-muted-foreground"}`}
      >
        {kpi.statusNote}
      </p>
    </button>
  );
}

export function KpiCards({ snapshot }: { snapshot: DashboardSnapshot }) {
  const rows = snapshot.comparison.selectedRows;
  const latestMonthLabel = getLatestMonthLabel(rows);
  const [activeKey, setActiveKey] = useState<MetricKey | null>(null);

  useEffect(() => {
    if (!activeKey) {
      document.body.style.removeProperty("overflow");
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveKey(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.removeProperty("overflow");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeKey]);

  const kpis: Kpi[] = KPI_CONFIG.map((config) => {
    const summary = snapshot.summaries[config.key];
    const delta = snapshot.deltas[config.key];
    const selectedAggregate = aggregateRows(rows, config.key, config.aggregate);
    const latestValue = rows.at(-1)?.[config.key] ?? 0;
    const status = kpiStatus(config, snapshot);
    const data = rows.map((row) => row[config.key]);

    return {
      key: config.key,
      label: config.label,
      value: formatMetricValue(summary.unit, selectedAggregate, { compact: config.compact }),
      valueCaption: config.summaryLabel,
      latestValue: formatMetricValue(summary.unit, latestValue, { compact: config.compact }),
      latestCaption: latestMonthLabel,
      delta: formatDeltaValue(delta),
      positive: delta.isImproving !== false,
      status,
      statusNote: kpiNote(config, snapshot),
      data,
      icon: config.icon,
      primary: config.primary,
    };
  });

  const activeConfig = useMemo(
    () => KPI_CONFIG.find((config) => config.key === activeKey) ?? null,
    [activeKey],
  );

  return (
    <>
      <section
        id="metrics"
        className="scroll-mt-dashboard grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        {kpis.map((kpi, index) => (
          <div
            key={kpi.label}
            className="animate-rise"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <KpiCard kpi={kpi} onOpen={() => setActiveKey(kpi.key)} />
          </div>
        ))}
      </section>

      {activeConfig ? (
        <MetricModal snapshot={snapshot} config={activeConfig} onClose={() => setActiveKey(null)} />
      ) : null}
    </>
  );
}
