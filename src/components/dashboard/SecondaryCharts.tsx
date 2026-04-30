import { Sparkline } from "./Sparkline";

const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function CardShell({
  title, desc, badge, badgeTone, takeaway, children,
}: {
  title: string; desc: string; badge: string; badgeTone: "primary" | "warning" | "destructive";
  takeaway: string; children: React.ReactNode;
}) {
  const tones = {
    primary: "border-primary/40 bg-primary/10 text-primary",
    warning: "border-warning/40 bg-warning/10 text-warning",
    destructive: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tones[badgeTone]}`}>
          {badge}
        </span>
      </div>
      <div className="mt-4">{children}</div>
      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{takeaway}</p>
    </div>
  );
}

function CustomerGrowth() {
  const data = [9100, 9400, 9800, 10100, 10400, 10800, 11100, 11400, 11700, 12000, 12250, 12450];
  const max = Math.max(...data);
  return (
    <CardShell
      title="Customer Growth"
      desc="Monthly active customers"
      badge="Healthy"
      badgeTone="primary"
      takeaway="Customer base keeps growing, but growth slowed in Q4."
    >
      <div className="flex h-24 items-end gap-1.5">
        {data.map((v, i) => {
          const isLast = i >= data.length - 2;
          const heightPct = (v / max) * 100;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`w-full rounded-t-md ${isLast ? "bg-primary shadow-[0_0_12px_-2px_var(--primary-glow)]" : "bg-card-elevated"}`}
                style={{ height: `${heightPct}%` }}
              />
              <span className="text-[9px] text-muted-foreground/60">{months[i]}</span>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

function CacArpu() {
  const cac = [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 41.5, 42];
  const arpu = [58, 59, 60, 60, 61, 62, 62, 61, 60, 59, 58, 57];
  const max = Math.max(...cac, ...arpu);
  return (
    <CardShell
      title="CAC vs ARPU"
      desc="Acquisition cost vs revenue per user"
      badge="Watch"
      badgeTone="warning"
      takeaway="CAC increased faster than ARPU in the last quarter."
    >
      <div className="flex h-24 items-end gap-2">
        {cac.map((c, i) => {
          const a = arpu[i];
          return (
            <div key={i} className="flex flex-1 items-end gap-0.5">
              <div className="w-1/2 rounded-t-sm bg-secondary/70" style={{ height: `${(c / max) * 100}%` }} />
              <div className="w-1/2 rounded-t-sm bg-primary/80" style={{ height: `${(a / max) * 100}%` }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-secondary/70" />CAC</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary/80" />ARPU</span>
      </div>
    </CardShell>
  );
}

function ChurnRetention() {
  const churn = [3.8, 4.0, 4.2, 4.3, 4.5, 4.7, 5.0, 5.2, 5.5, 5.7, 5.9, 6.1];
  return (
    <CardShell
      title="Churn & Retention"
      desc="Monthly churn percentage"
      badge="Risk"
      badgeTone="destructive"
      takeaway="Churn has been rising for 3 consecutive months."
    >
      <div className="h-24">
        <Sparkline data={churn} color="var(--color-destructive)" height={96} />
      </div>
    </CardShell>
  );
}

function Conversion() {
  const conv = [5.6, 5.7, 5.8, 5.9, 5.7, 5.6, 5.4, 5.3, 5.1, 5.0, 4.9, 4.8];
  return (
    <CardShell
      title="Conversion Rate"
      desc="Visitor to customer rate"
      badge="Watch"
      badgeTone="warning"
      takeaway="Conversion dropped slightly after mid-year peak."
    >
      <div className="h-24">
        <Sparkline data={conv} color="var(--color-warning)" height={96} />
      </div>
    </CardShell>
  );
}

export function SecondaryCharts() {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CustomerGrowth />
      <CacArpu />
      <ChurnRetention />
      <Conversion />
    </section>
  );
}
