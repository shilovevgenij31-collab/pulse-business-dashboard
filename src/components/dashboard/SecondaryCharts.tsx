import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardSnapshot, MetricDelta } from "@/lib/dashboard/types";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { formatDeltaValue, formatMetricValue, statusFromDelta } from "@/lib/dashboard/format";

type SecondaryMetricKey = "newCustomers" | "ltvCac" | "churnRate" | "margin";

function CardShell({
  title,
  desc,
  badge,
  badgeTone,
  takeaway,
  children,
  delay,
}: {
  title: string;
  desc: string;
  badge: string;
  badgeTone: "primary" | "warning" | "destructive";
  takeaway: string;
  children: React.ReactNode;
  delay: number;
}) {
  const tones = {
    primary: "border-primary/40 bg-primary/10 text-primary",
    warning: "border-warning/40 bg-warning/10 text-warning",
    destructive: "border-destructive/40 bg-destructive/10 text-destructive",
  };

  return (
    <div
      className="card-surface card-interactive p-5 animate-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tones[badgeTone]}`}
        >
          {badge}
        </span>
      </div>
      <div className="mt-4 h-28">{children}</div>
      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{takeaway}</p>
    </div>
  );
}

function badgeToneFromDelta(delta: MetricDelta) {
  const status = statusFromDelta(delta);
  if (status === "Риск") {
    return "destructive" as const;
  }

  if (status === "Внимание") {
    return "warning" as const;
  }

  return "primary" as const;
}

type SecondaryChartsProps = {
  snapshot: DashboardSnapshot;
  className?: string;
  cardKeys?: SecondaryMetricKey[];
  showHeader?: boolean;
  title?: string;
  description?: string;
  gridClassName?: string;
};

export function SecondaryCharts({
  snapshot,
  className,
  cardKeys = ["newCustomers", "ltvCac", "churnRate", "margin"],
  showHeader = true,
  title = "Вторичные метрики",
  description = "Детализация по притоку клиентов, юнит-экономике, удержанию и прибыльности.",
  gridClassName = "grid grid-cols-1 gap-4 md:grid-cols-2",
}: SecondaryChartsProps) {
  const rows = snapshot.comparison.selectedRows.map((row) => ({
    month: row.monthShort.toUpperCase(),
    monthLabel: row.monthLabel,
    ltv: row.ltv,
    cac: row.cac,
    churnRate: row.churnRate,
    margin: row.margin,
    newCustomers: row.newCustomers,
  }));

  const customerDelta = snapshot.deltas.newCustomers;
  const unitDelta = snapshot.deltas.ltvCacRatio;
  const churnDelta = snapshot.deltas.churnRate;
  const marginDelta = snapshot.deltas.margin;

  const cards: Record<SecondaryMetricKey, React.ReactNode> = {
    newCustomers: (
      <CardShell
        title="Приток клиентов"
        desc="Новые клиенты по месяцам"
        badge={statusFromDelta(customerDelta)}
        badgeTone={badgeToneFromDelta(customerDelta)}
        takeaway={`Изменение к базе: ${formatDeltaValue(customerDelta)}. Используйте график, чтобы увидеть пики и провалы по месяцам.`}
        delay={0}
      >
        <ChartContainer
          className="h-full w-full"
          config={{ newCustomers: { label: "Новые клиенты", color: "var(--color-primary)" } }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid vertical={false} strokeDasharray="3 4" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-6">
                        <span className="text-muted-foreground">Новые клиенты</span>
                        <span className="font-mono font-medium text-foreground">
                          {formatMetricValue("count", Number(value))}
                        </span>
                      </div>
                    )}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.monthLabel ?? label}
                  />
                }
              />
              <Bar
                dataKey="newCustomers"
                radius={[8, 8, 0, 0]}
                fill="var(--color-primary)"
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardShell>
    ),
    ltvCac: (
      <CardShell
        title="LTV и CAC"
        desc="Сопоставление ценности и стоимости привлечения"
        badge={statusFromDelta(unitDelta)}
        badgeTone={badgeToneFromDelta(unitDelta)}
        takeaway={`Коэффициент LTV/CAC изменился на ${formatDeltaValue(unitDelta)}. Если CAC растет быстрее LTV, рост становится менее качественным.`}
        delay={80}
      >
        <ChartContainer
          className="h-full w-full"
          config={{
            ltv: { label: "LTV", color: "var(--color-primary)" },
            cac: { label: "CAC", color: "var(--color-secondary)" },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid vertical={false} strokeDasharray="3 4" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-6">
                        <span className="text-muted-foreground">
                          {name === "ltv" ? "LTV" : "CAC"}
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {formatMetricValue("currency", Number(value), { compact: true })}
                        </span>
                      </div>
                    )}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.monthLabel ?? label}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="ltv"
                stroke="var(--color-primary)"
                strokeWidth={2.4}
                dot={false}
                animationDuration={880}
              />
              <Line
                type="monotone"
                dataKey="cac"
                stroke="var(--color-secondary)"
                strokeWidth={2.4}
                dot={false}
                animationDuration={980}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardShell>
    ),
    churnRate: (
      <CardShell
        title="Отток"
        desc="Риск удержания по месяцам"
        badge={statusFromDelta(churnDelta)}
        badgeTone={badgeToneFromDelta(churnDelta)}
        takeaway={`Отток изменился на ${formatDeltaValue(churnDelta)}. Наведите на точки, чтобы увидеть месяцы с максимальным давлением на retention.`}
        delay={160}
      >
        <ChartContainer
          className="h-full w-full"
          config={{ churnRate: { label: "Отток", color: "var(--color-destructive)" } }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows}>
              <CartesianGrid vertical={false} strokeDasharray="3 4" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-6">
                        <span className="text-muted-foreground">Отток</span>
                        <span className="font-mono font-medium text-foreground">
                          {formatMetricValue("percent", Number(value))}
                        </span>
                      </div>
                    )}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.monthLabel ?? label}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="churnRate"
                stroke="var(--color-destructive)"
                fill="var(--color-destructive)"
                fillOpacity={0.18}
                strokeWidth={2.4}
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardShell>
    ),
    margin: (
      <CardShell
        title="Маржа"
        desc="Качество роста и прибыльность"
        badge={statusFromDelta(marginDelta)}
        badgeTone={badgeToneFromDelta(marginDelta)}
        takeaway={`Маржа изменилась на ${formatDeltaValue(marginDelta)}. Если она падает при росте выручки, нужно проверить качество каналов и скидочную нагрузку.`}
        delay={240}
      >
        <ChartContainer
          className="h-full w-full"
          config={{ margin: { label: "Маржа", color: "var(--color-warning)" } }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows}>
              <CartesianGrid vertical={false} strokeDasharray="3 4" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-6">
                        <span className="text-muted-foreground">Маржа</span>
                        <span className="font-mono font-medium text-foreground">
                          {formatMetricValue("percent", Number(value))}
                        </span>
                      </div>
                    )}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.monthLabel ?? label}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="margin"
                stroke="var(--color-warning)"
                fill="var(--color-warning)"
                fillOpacity={0.14}
                strokeWidth={2.4}
                animationDuration={940}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardShell>
    ),
  };

  return (
    <div className={className}>
      {showHeader ? (
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      ) : null}

      <div className={gridClassName}>
        {cardKeys.map((key) => (
          <div key={key}>{cards[key]}</div>
        ))}
      </div>
    </div>
  );
}
