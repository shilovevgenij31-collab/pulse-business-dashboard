import { AlertTriangle } from "lucide-react";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { severityToLabel } from "@/lib/dashboard/format";

const toneClasses = {
  Риск: "border-destructive/40 bg-destructive/10 text-destructive",
  Внимание: "border-warning/40 bg-warning/10 text-warning",
  Норма: "border-primary/40 bg-primary/10 text-primary",
};

function conciseMessage(message: string) {
  return message
    .replace("относительно базы сравнения.", "")
    .replace("что ухудшает качество бизнеса.", "давит на качество бизнеса.")
    .trim();
}

export function NeedsAttention({ snapshot }: { snapshot: DashboardSnapshot }) {
  const items =
    snapshot.attention.length > 0
      ? snapshot.attention.slice(0, 3).map((item, index) => ({
          n: index + 1,
          title: item.title,
          desc: conciseMessage(item.message),
          badge: severityToLabel(item.severity),
        }))
      : [
          {
            n: 1,
            title: "Сильных предупреждений нет",
            desc: "В выбранном режиме сравнения существенного ухудшения ключевых метрик не найдено.",
            badge: "Норма" as const,
          },
        ];

  return (
    <div id="risks" className="card-surface p-6 animate-rise">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive animate-float-soft">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Что требует внимания</h2>
            <p className="text-sm text-muted-foreground">
              Топ-3 сигнала, которые менеджменту стоит проверить в первую очередь.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
          {items.length} сигнала
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.n} className="rounded-2xl border border-border bg-card-elevated/60 p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background/60 num-display text-base text-muted-foreground/70">
                {String(item.n).padStart(2, "0")}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{item.title}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${toneClasses[item.badge]}`}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
