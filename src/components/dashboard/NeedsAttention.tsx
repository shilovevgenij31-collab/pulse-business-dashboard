import { AlertTriangle, ChevronRight } from "lucide-react";

const items = [
  {
    n: "01",
    title: "Churn Rate",
    desc: "Up +1.8pp versus previous period. Retention risk is increasing.",
    badge: "Risk",
    tone: "destructive" as const,
  },
  {
    n: "02",
    title: "Profit Margin",
    desc: "Down -3.6pp while revenue is still growing.",
    badge: "Watch",
    tone: "warning" as const,
  },
  {
    n: "03",
    title: "CAC",
    desc: "Up +11.5%, growing faster than customer count.",
    badge: "Watch",
    tone: "warning" as const,
  },
];

const toneClasses = {
  destructive: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-warning/40 bg-warning/10 text-warning",
};

export function NeedsAttention() {
  return (
    <div className="card-surface p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Needs Attention</h2>
            <p className="text-sm text-muted-foreground">Top 3 metrics flagged this period</p>
          </div>
        </div>
        <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
          3 Issues
        </span>
      </div>

      <div className="mt-5 space-y-2.5">
        {items.map((it) => (
          <div
            key={it.n}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card-elevated/60 p-4 transition-colors hover:border-border-strong"
          >
            <span className="num-display text-2xl text-muted-foreground/50">{it.n}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{it.title}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${toneClasses[it.tone]}`}>
                  {it.badge}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
}
