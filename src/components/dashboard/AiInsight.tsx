import { Sparkles, ShieldCheck, ArrowRight, TrendingUp, AlertTriangle, Search } from "lucide-react";

const rows = [
  { icon: TrendingUp, label: "What changed", text: "Revenue and customer base increased", tone: "primary" as const },
  { icon: AlertTriangle, label: "What looks risky", text: "Churn and CAC are rising", tone: "warning" as const },
  { icon: Search, label: "What to check first", text: "Acquisition efficiency and retention drivers", tone: "secondary" as const },
];

const tones = {
  primary: "bg-primary/10 text-primary border-primary/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  secondary: "bg-secondary/10 text-accent border-secondary/30",
};

export function AiInsight() {
  return (
    <div className="card-surface relative overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-purple-glow)" }} />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-background">
              <Sparkles className="h-5 w-5" strokeWidth={2.5} />
              <span className="absolute -inset-0.5 -z-10 rounded-2xl bg-gradient-to-br from-secondary to-primary opacity-40 blur-md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">AI Executive Insight</h2>
                <span className="rounded-full border border-secondary/40 bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Claude
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Generated from selected period metrics, deltas, and anomalies.
              </p>
            </div>
          </div>

          <button className="group hidden items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[0_0_24px_-4px_var(--primary-glow)] sm:inline-flex">
            <Sparkles className="h-4 w-4" />
            Generate Insight
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Insight body */}
        <div className="mt-5 rounded-2xl border border-border-strong bg-background/50 p-5">
          <div className="label-xs mb-2 flex items-center gap-2 text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Insight output
            <span className="ml-auto text-[9px] text-muted-foreground/60">Generated 2 min ago</span>
          </div>
          <p className="text-[15px] leading-relaxed text-foreground">
            Revenue grew by{" "}
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 font-semibold text-primary">+18.4%</span>{" "}
            over the selected period, but growth quality weakened. Profit margin declined by{" "}
            <span className="rounded-md bg-warning/15 px-1.5 py-0.5 font-semibold text-warning">-3.6pp</span>{" "}
            while CAC increased by{" "}
            <span className="rounded-md bg-destructive/15 px-1.5 py-0.5 font-semibold text-destructive">+11.5%</span>.
            The first thing to check is whether acquisition costs are rising faster than customer value.
          </p>

          <div className="mt-5 grid gap-2.5">
            {rows.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="flex items-center gap-3 rounded-xl border border-border bg-card-elevated/60 p-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${tones[r.tone]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="label-xs text-[10px]">{r.label}</div>
                    <div className="mt-0.5 truncate text-sm text-foreground">{r.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
          Uses secure server-side API route. API key is stored in environment variables.
        </div>
      </div>
    </div>
  );
}
