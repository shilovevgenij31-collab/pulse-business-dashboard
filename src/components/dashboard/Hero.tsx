import { Sparkles, Database, FileText, Calendar } from "lucide-react";

const badges = [
  { icon: Calendar, text: "12 months of data" },
  { icon: Sparkles, text: "Claude insight" },
  { icon: Database, text: "Live CSV source" },
  { icon: FileText, text: "Executive summary" },
];

function HealthScore() {
  const score = 78;
  const circumference = 2 * Math.PI * 44;
  const dash = (score / 100) * circumference;

  return (
    <div className="card-surface relative overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "var(--gradient-lime-glow)" }} />
      <div className="relative flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="label-xs">Business Health Score</span>
            <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
              Watch
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="num-display text-5xl text-foreground">{score}</span>
            <span className="text-lg text-muted-foreground">/ 100</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Growth is positive, but efficiency metrics need attention.
          </p>
        </div>

        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-border-strong)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ filter: "drop-shadow(0 0 8px var(--primary-glow))" }}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="80%" stopColor="var(--color-warning)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="label-xs text-[9px]">Score</span>
            <span className="num-display text-xl">{score}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <span className="label-xs inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Portfolio dashboard · Q4
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Portfolio company <span className="text-muted-foreground">health</span>
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          AI-powered business metrics analysis from a live CSV source.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b.text}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs text-muted-foreground"
            >
              <b.icon className="h-3.5 w-3.5" />
              {b.text}
            </span>
          ))}
        </div>
      </div>

      <HealthScore />
    </section>
  );
}
