import { ArrowUpRight, ArrowDownRight, DollarSign, Percent, Users, UserMinus, Target, MousePointerClick } from "lucide-react";
import { Sparkline } from "./Sparkline";

type Status = "Healthy" | "Watch" | "Risk";
type Kpi = {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  status: Status;
  data: number[];
  icon: typeof DollarSign;
  primary?: boolean;
};

const kpis: Kpi[] = [
  { label: "Revenue", value: "$248.4K", delta: "+18.4%", positive: true, status: "Healthy", icon: DollarSign,
    data: [120, 132, 138, 150, 162, 178, 184, 195, 208, 219, 232, 248], primary: true },
  { label: "Profit Margin", value: "38.2%", delta: "-3.6pp", positive: false, status: "Watch", icon: Percent,
    data: [42, 43, 41.8, 41, 40.5, 40, 39.6, 39.4, 39, 38.8, 38.5, 38.2] },
  { label: "Customers", value: "12,450", delta: "+9.2%", positive: true, status: "Healthy", icon: Users,
    data: [9100, 9400, 9800, 10100, 10400, 10800, 11100, 11400, 11700, 12000, 12250, 12450] },
  { label: "Churn Rate", value: "6.1%", delta: "+1.8pp", positive: false, status: "Risk", icon: UserMinus,
    data: [3.8, 4.0, 4.2, 4.3, 4.5, 4.7, 5.0, 5.2, 5.5, 5.7, 5.9, 6.1] },
  { label: "CAC", value: "$42", delta: "+11.5%", positive: false, status: "Watch", icon: Target,
    data: [32, 33, 34, 34.5, 35, 36, 37, 38, 39, 40, 41, 42] },
  { label: "Conversion Rate", value: "4.8%", delta: "-0.7pp", positive: false, status: "Watch", icon: MousePointerClick,
    data: [5.6, 5.7, 5.8, 5.9, 5.7, 5.6, 5.4, 5.3, 5.1, 5.0, 4.9, 4.8] },
];

const statusStyles: Record<Status, string> = {
  Healthy: "border-primary/40 bg-primary/10 text-primary",
  Watch: "border-warning/40 bg-warning/10 text-warning",
  Risk: "border-destructive/40 bg-destructive/10 text-destructive",
};

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  const isPrimary = kpi.primary;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 transition-all hover:-translate-y-0.5 ${
        isPrimary
          ? "border-primary/40 bg-primary text-primary-foreground glow-lime"
          : "card-surface text-foreground"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span
            className={`label-xs ${isPrimary ? "text-primary-foreground/70" : ""}`}
          >
            {kpi.label}
          </span>
          <div className="mt-2 num-display text-3xl">{kpi.value}</div>
        </div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            isPrimary ? "bg-primary-foreground/10 text-primary-foreground" : "bg-card-elevated text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
          isPrimary
            ? "bg-primary-foreground/10 text-primary-foreground"
            : kpi.positive ? "text-primary" : "text-destructive"
        }`}>
          {kpi.positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
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
          color={isPrimary ? "var(--color-primary-foreground)" : kpi.positive ? "var(--color-primary)" : "var(--color-destructive)"}
        />
      </div>
    </div>
  );
}

export function KpiCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((k) => (
        <KpiCard key={k.label} kpi={k} />
      ))}
    </section>
  );
}
