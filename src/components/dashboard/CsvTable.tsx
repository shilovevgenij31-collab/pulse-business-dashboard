import { Search, Download, ArrowUpRight } from "lucide-react";

type Status = "Healthy" | "Watch" | "Risk";
type Row = {
  month: string; revenue: string; profit: string; customers: string;
  churn: string; cac: string; conversion: string; status: Status;
};

const rows: Row[] = [
  { month: "May 2024", revenue: "$162.0K", profit: "$66.4K", customers: "10,400", churn: "4.5%", cac: "$36", conversion: "5.6%", status: "Healthy" },
  { month: "Jun 2024", revenue: "$178.2K", profit: "$71.3K", customers: "10,800", churn: "4.7%", cac: "$37", conversion: "5.6%", status: "Healthy" },
  { month: "Jul 2024", revenue: "$184.5K", profit: "$73.1K", customers: "11,100", churn: "5.0%", cac: "$38", conversion: "5.4%", status: "Watch" },
  { month: "Aug 2024", revenue: "$195.7K", profit: "$76.3K", customers: "11,400", churn: "5.2%", cac: "$39", conversion: "5.3%", status: "Watch" },
  { month: "Sep 2024", revenue: "$208.9K", profit: "$80.4K", customers: "11,700", churn: "5.5%", cac: "$40", conversion: "5.1%", status: "Watch" },
  { month: "Oct 2024", revenue: "$219.3K", profit: "$83.3K", customers: "12,000", churn: "5.7%", cac: "$41", conversion: "5.0%", status: "Watch" },
  { month: "Nov 2024", revenue: "$232.1K", profit: "$86.2K", customers: "12,250", churn: "5.9%", cac: "$41.5", conversion: "4.9%", status: "Risk" },
  { month: "Dec 2024", revenue: "$248.4K", profit: "$94.9K", customers: "12,450", churn: "6.1%", cac: "$42", conversion: "4.8%", status: "Risk" },
];

const statusStyles: Record<Status, string> = {
  Healthy: "border-primary/40 bg-primary/10 text-primary",
  Watch: "border-warning/40 bg-warning/10 text-warning",
  Risk: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function CsvTable() {
  return (
    <div className="card-surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">CSV Data Preview</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Synced 2m ago
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Monthly business metrics loaded from source</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-border bg-card-elevated/60 px-3 py-2 sm:flex">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search metric"
              className="w-40 bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card-elevated/60 px-3 py-2 text-sm hover:bg-card-elevated">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:shadow-[0_0_20px_-4px_var(--primary-glow)]">
            View all rows
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left">
              {["Month", "Revenue", "Profit", "Customers", "Churn", "CAC", "Conversion", "Status"].map((h) => (
                <th key={h} className="label-xs px-5 py-3 text-[10px] font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month} className="border-t border-border transition-colors hover:bg-card-elevated/40">
                <td className="px-5 py-3.5 font-medium text-foreground">{r.month}</td>
                <td className="num-display px-5 py-3.5 text-foreground">{r.revenue}</td>
                <td className="num-display px-5 py-3.5 text-muted-foreground">{r.profit}</td>
                <td className="num-display px-5 py-3.5 text-muted-foreground">{r.customers}</td>
                <td className="num-display px-5 py-3.5 text-muted-foreground">{r.churn}</td>
                <td className="num-display px-5 py-3.5 text-muted-foreground">{r.cac}</td>
                <td className="num-display px-5 py-3.5 text-muted-foreground">{r.conversion}</td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[r.status]}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background/40 px-5 py-3 text-xs text-muted-foreground">
        <span>Showing 8 of 12 rows</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> CSV source connected
          </span>
          <span>·</span>
          <span>Analyzing 12 monthly rows</span>
          <span>·</span>
          <span>Server-side API route</span>
        </div>
      </div>
    </div>
  );
}
