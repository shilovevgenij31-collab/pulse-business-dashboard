import { TrendingUp, Info } from "lucide-react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const revenue = [120, 132, 138, 150, 162, 178, 184, 195, 208, 219, 232, 248];
const profit = [50, 56, 58, 62, 66, 71, 73, 76, 80, 83, 86, 95];

const periods = ["3M", "6M", "12M", "Custom"];

export function RevenueChart() {
  const w = 800;
  const h = 280;
  const padX = 36;
  const padY = 24;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const allValues = [...revenue, ...profit];
  const max = Math.max(...allValues) * 1.1;
  const min = 0;
  const range = max - min;
  const step = innerW / (months.length - 1);

  const toPath = (data: number[]) =>
    data
      .map((v, i) => {
        const x = padX + i * step;
        const y = padY + innerH - ((v - min) / range) * innerH;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");

  const toArea = (data: number[]) => {
    const line = toPath(data);
    return `${line} L${padX + innerW},${padY + innerH} L${padX},${padY + innerH} Z`;
  };

  // Highlight October (index 9)
  const hi = 9;
  const hx = padX + hi * step;
  const hy = padY + innerH - ((revenue[hi] - min) / range) * innerH;

  return (
    <div className="card-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Revenue vs Profit Trend</h2>
            <span className="rounded-full border border-border bg-card-elevated px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              CSV
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Monthly performance from CSV source</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Revenue
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              Profit
            </span>
          </div>
          <div className="flex rounded-full border border-border bg-card-elevated p-1">
            {periods.map((p) => {
              const active = p === "12M";
              return (
                <button
                  key={p}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 -mx-2">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 280 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={p}
              x1={padX}
              x2={padX + innerW}
              y1={padY + innerH * p}
              y2={padY + innerH * p}
              stroke="var(--color-border)"
              strokeDasharray="3 4"
            />
          ))}

          {/* areas */}
          <path d={toArea(revenue)} fill="url(#revGrad)" />
          <path d={toArea(profit)} fill="url(#profGrad)" />

          {/* lines */}
          <path d={toPath(profit)} fill="none" stroke="var(--color-secondary)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d={toPath(revenue)}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 2px 6px var(--primary-glow))" }}
          />

          {/* highlight */}
          <line x1={hx} x2={hx} y1={padY} y2={padY + innerH} stroke="var(--color-primary)" strokeOpacity="0.3" strokeDasharray="3 4" />
          <circle cx={hx} cy={hy} r="6" fill="var(--color-background)" stroke="var(--color-primary)" strokeWidth="2.5" />

          {/* labels */}
          {months.map((m, i) => (
            <text
              key={m}
              x={padX + i * step}
              y={h - 4}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-muted-foreground)"
            >
              {m}
            </text>
          ))}

          {/* tooltip */}
          <g transform={`translate(${hx + 10}, ${hy - 46})`}>
            <rect width="118" height="42" rx="10" fill="var(--color-card-elevated)" stroke="var(--color-border-strong)" />
            <text x="10" y="16" fontSize="9.5" fill="var(--color-muted-foreground)" style={{ letterSpacing: "0.1em" }}>OCT 2024</text>
            <text x="10" y="32" fontSize="13" fill="var(--color-foreground)" fontWeight="600">$219K</text>
            <text x="68" y="32" fontSize="11" fill="var(--color-primary)" fontWeight="600">+5.3%</text>
          </g>
        </svg>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-card-elevated/60 p-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <TrendingUp className="h-3.5 w-3.5" />
        </div>
        <p className="text-sm text-muted-foreground">
          Revenue increased over the selected period, but profit margin weakened in the last quarter.
        </p>
        <Info className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/60" />
      </div>
    </div>
  );
}
