import { useMemo, useState } from "react";
import { ArrowUpRight, Download, Search } from "lucide-react";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { formatMetricValue, formatTimestampLabel, rowHealthStatus } from "@/lib/dashboard/format";

type Status = "Норма" | "Внимание" | "Риск";

const statusStyles: Record<Status, string> = {
  Норма: "border-primary/40 bg-primary/10 text-primary",
  Внимание: "border-warning/40 bg-warning/10 text-warning",
  Риск: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function CsvTable({ snapshot }: { snapshot: DashboardSnapshot }) {
  const [query, setQuery] = useState("");
  const [showRiskOnly, setShowRiskOnly] = useState(false);

  const selectedMonthIndexes = useMemo(
    () => new Set(snapshot.comparison.selectedRows.map((row) => row.monthIndex)),
    [snapshot.comparison.selectedRows],
  );

  const rows = useMemo(
    () =>
      snapshot.allRows
        .map((row, index, allRows) => ({
          monthIndex: row.monthIndex,
          month: row.monthLabel,
          revenue: formatMetricValue("currency", row.revenue, { compact: true }),
          newCustomers: formatMetricValue("count", row.newCustomers),
          ltv: formatMetricValue("currency", row.ltv, { compact: true }),
          churn: formatMetricValue("percent", row.churnRate),
          margin: formatMetricValue("percent", row.margin),
          cac: formatMetricValue("currency", row.cac, { compact: true }),
          status: rowHealthStatus(row, allRows[index - 1]),
          isSelected: selectedMonthIndexes.has(row.monthIndex),
        }))
        .filter((row) => row.isSelected),
    [selectedMonthIndexes, snapshot.allRows],
  );

  const filteredRows = rows.filter((row) => {
    const matchesQuery = row.month.toLowerCase().includes(query.trim().toLowerCase());
    const matchesRisk = showRiskOnly ? row.status !== "Норма" : true;
    return matchesQuery && matchesRisk;
  });

  return (
    <div id="table" className="scroll-mt-dashboard card-surface overflow-hidden animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">Таблица исходных данных</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Синхронизировано {formatTimestampLabel(snapshot.generatedAt)}
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-card-elevated/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {snapshot.comparison.selectedLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Таблица показывает месяцы из выбранного периода. На этих же строках построены KPI,
            графики, сигналы риска и AI-инсайт.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-border bg-card-elevated/60 px-3 py-2 sm:flex">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти месяц"
              className="w-40 bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowRiskOnly((current) => !current)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors ${
              showRiskOnly
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-border bg-card-elevated/60 text-foreground hover:bg-card-elevated"
            }`}
          >
            {showRiskOnly ? "Показаны риск-месяцы" : "Только риск и внимание"}
          </button>

          <a
            href={snapshot.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card-elevated/60 px-3 py-2 text-sm hover:bg-card-elevated"
          >
            <Download className="h-3.5 w-3.5" />
            Открыть CSV
          </a>

          <a
            href={snapshot.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:shadow-[0_0_20px_-4px_var(--primary-glow)]"
          >
            Источник
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left">
              {["Месяц", "Выручка", "Новые клиенты", "LTV", "Отток", "Маржа", "CAC", "Статус"].map(
                (header) => (
                  <th key={header} className="label-xs px-5 py-3 text-[10px] font-semibold">
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr
                key={row.monthIndex}
                className="border-t border-border transition-colors hover:bg-card-elevated/40"
              >
                <td className="px-5 py-3.5 font-medium text-foreground">{row.month}</td>
                <td className="num-display px-5 py-3.5 text-foreground">{row.revenue}</td>
                <td className="num-display px-5 py-3.5 text-muted-foreground">
                  {row.newCustomers}
                </td>
                <td className="num-display px-5 py-3.5 text-muted-foreground">{row.ltv}</td>
                <td className="num-display px-5 py-3.5 text-muted-foreground">{row.churn}</td>
                <td className="num-display px-5 py-3.5 text-muted-foreground">{row.margin}</td>
                <td className="num-display px-5 py-3.5 text-muted-foreground">{row.cac}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[row.status]}`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background/40 px-5 py-3 text-xs text-muted-foreground">
        <span>
          Показано {filteredRows.length} из {rows.length} строк выбранного периода
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> CSV-источник подключен
          </span>
          <span>·</span>
          <span>В исходном CSV: {snapshot.allRows.length} месяцев</span>
          <span>·</span>
          <span>Текущий анализ: {snapshot.comparison.selectedLabel}</span>
        </div>
      </div>
    </div>
  );
}
