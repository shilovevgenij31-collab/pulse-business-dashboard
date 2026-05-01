import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { DashboardSnapshot, RangeKey } from "@/lib/dashboard/types";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { formatMetricValue } from "@/lib/dashboard/format";

const periods: Array<{ key: RangeKey; label: string }> = [
  { key: "3m", label: "3М" },
  { key: "6m", label: "6М" },
  { key: "12m", label: "12М" },
];

type RevenueChartProps = {
  snapshot: DashboardSnapshot;
  range: RangeKey;
  onRangeChange: (next: RangeKey) => void;
};

function LegendItem({ color, label, axis }: { color: string; label: string; axis: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card-elevated/55 px-3 py-1.5 text-xs text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-muted-foreground/75">{axis}</span>
    </div>
  );
}

export function RevenueChart({ snapshot, range, onRangeChange }: RevenueChartProps) {
  const rows = snapshot.comparison.selectedRows;
  const data = rows.map((row) => ({
    month: row.monthShort.toUpperCase(),
    monthLabel: row.monthLabel,
    revenue: row.revenue,
    newCustomers: row.newCustomers,
  }));

  const lastPoint = data.at(-1);
  const customerPeak = rows.reduce(
    (best, row) => (row.newCustomers > best.newCustomers ? row : best),
    rows[0],
  );
  const periodRevenue = rows.reduce((total, row) => total + row.revenue, 0);
  const periodCustomers = rows.reduce((total, row) => total + row.newCustomers, 0);

  return (
    <div className="card-surface p-6 animate-rise">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Динамика выручки и новых клиентов</h2>
            <span className="rounded-full border border-border bg-card-elevated px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              CSV
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Лаймовая линия — выручка по левой оси, фиолетовая — новые клиенты по правой оси.
          </p>
        </div>

        <div className="flex rounded-full border border-border bg-card-elevated p-1">
          {periods.map((period) => {
            const active = period.key === range;
            return (
              <button
                key={period.key}
                onClick={() => onRangeChange(period.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {period.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <LegendItem color="var(--color-primary)" label="Выручка" axis="левая ось" />
        <LegendItem color="var(--color-secondary)" label="Новые клиенты" axis="правая ось" />
        <span className="rounded-full border border-border bg-card-elevated/55 px-3 py-1.5 text-xs text-muted-foreground">
          {snapshot.comparison.selectedLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card-elevated/50 px-4 py-3">
          <div className="label-xs">Выручка за период</div>
          <div className="mt-1 num-display text-xl text-foreground">
            {formatMetricValue("currency", periodRevenue, { compact: true })}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card-elevated/50 px-4 py-3">
          <div className="label-xs">Новые клиенты за период</div>
          <div className="mt-1 num-display text-xl text-foreground">
            {formatMetricValue("count", periodCustomers)}
          </div>
        </div>
      </div>

      <div className="mt-6 h-[340px]">
        <ChartContainer
          className="h-full w-full"
          config={{
            revenue: { label: "Выручка", color: "var(--color-primary)" },
            newCustomers: { label: "Новые клиенты", color: "var(--color-secondary)" },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 12, left: -6, bottom: 6 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 4" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickFormatter={(value) => formatMetricValue("currency", value, { compact: true })}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickFormatter={(value) => formatMetricValue("count", value)}
              />
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-6">
                        <span className="text-muted-foreground">
                          {name === "revenue" ? "Выручка" : "Новые клиенты"}
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {name === "revenue"
                            ? formatMetricValue("currency", Number(value), { compact: true })
                            : formatMetricValue("count", Number(value))}
                        </span>
                      </div>
                    )}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.monthLabel ?? label}
                  />
                }
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.18}
                strokeWidth={2.8}
                animationDuration={950}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="newCustomers"
                stroke="var(--color-secondary)"
                strokeWidth={2.4}
                dot={{ r: 3.5, fill: "var(--color-secondary)", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                animationDuration={1050}
              />
              {lastPoint ? (
                <ReferenceDot
                  yAxisId="left"
                  x={lastPoint.month}
                  y={lastPoint.revenue}
                  r={6}
                  fill="var(--color-background)"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-card-elevated/60 p-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <TrendingUp className="h-3.5 w-3.5" />
        </div>
        <p className="text-sm text-muted-foreground">
          Пик притока новых клиентов пришелся на {customerPeak.monthLabel}, а последняя точка
          периода закрылась выручкой{" "}
          {lastPoint ? formatMetricValue("currency", lastPoint.revenue, { compact: true }) : "—"}.
        </p>
      </div>
    </div>
  );
}
