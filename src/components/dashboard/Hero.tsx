import { useEffect, useRef, useState } from "react";
import { Calendar, Database, FileText, Sparkles } from "lucide-react";
import { calculateHealthScore, healthStatusLabel, severityToLabel } from "@/lib/dashboard/format";
import type { DashboardSnapshot } from "@/lib/dashboard/types";

function HealthScore({ snapshot }: { snapshot: DashboardSnapshot }) {
  const score = calculateHealthScore(snapshot.attention, snapshot.deltas);
  const scoreState = healthStatusLabel(score);
  const circumference = 2 * Math.PI * 44;
  const topSignal = snapshot.attention[0];
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const previousScoreRef = useRef(0);

  const toneClass =
    scoreState.tone === "primary"
      ? "border-primary/40 bg-primary/10 text-primary"
      : scoreState.tone === "warning"
        ? "border-warning/40 bg-warning/10 text-warning"
        : "border-destructive/40 bg-destructive/10 text-destructive";

  useEffect(() => {
    const fromScore = previousScoreRef.current;
    const toScore = score;
    const duration = 1200;
    const start = performance.now();
    let frame = 0;

    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const nextValue = fromScore + (toScore - fromScore) * eased;

      setAnimatedProgress(nextValue);
      setAnimatedScore(Math.round(nextValue));

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        previousScoreRef.current = toScore;
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [score]);

  const dash = (animatedProgress / 100) * circumference;

  return (
    <div className="card-surface relative overflow-hidden p-6 animate-rise">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "var(--gradient-lime-glow)" }}
      />
      <div className="relative flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="label-xs">Индекс здоровья бизнеса</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${toneClass}`}
            >
              {scoreState.label}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="num-display text-5xl text-foreground">{animatedScore}</span>
            <span className="text-lg text-muted-foreground">/ 100</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {topSignal
              ? `${topSignal.title}: ${topSignal.message}`
              : "Серьезных отклонений по данным выбранного периода не найдено."}
          </p>
        </div>

        <div className="relative h-28 w-28 shrink-0 animate-float-soft">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="var(--color-border-strong)"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{
                filter: "drop-shadow(0 0 10px var(--primary-glow))",
                transition: "stroke-dasharray 220ms ease-out",
              }}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop
                  offset="80%"
                  stopColor={
                    scoreState.tone === "destructive"
                      ? "var(--color-destructive)"
                      : "var(--color-warning)"
                  }
                />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="label-xs text-[9px]">оценка</span>
            <span className="num-display text-xl">{animatedScore}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero({ snapshot }: { snapshot: DashboardSnapshot }) {
  const topSignal = snapshot.attention[0];
  const badges = [
    { icon: Calendar, text: `${snapshot.comparison.selectedRows.length} мес. в анализе` },
    { icon: Sparkles, text: "AI-инсайт по цифрам" },
    { icon: Database, text: "Источник: Google Sheets CSV" },
    {
      icon: FileText,
      text: topSignal ? `Фокус: ${severityToLabel(topSignal.severity)}` : "Исполнительное summary",
    },
  ];

  return (
    <section id="overview" className="scroll-mt-dashboard grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="animate-rise">
        <span className="label-xs inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Портфельная компания • управленческий дашборд
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Что происходит <span className="text-muted-foreground">с бизнесом</span>
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          Один экран для чтения динамики бизнеса: рост, ухудшение эффективности, ключевые риски и
          первый вывод по данным.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {badges.map((badge, index) => (
            <span
              key={badge.text}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs text-muted-foreground animate-rise"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <badge.icon className="h-3.5 w-3.5" />
              {badge.text}
            </span>
          ))}
        </div>
      </div>

      <HealthScore snapshot={snapshot} />
    </section>
  );
}
