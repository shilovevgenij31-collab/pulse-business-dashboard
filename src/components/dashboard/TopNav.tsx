import { useEffect, useRef } from "react";
import { Activity, Database, SlidersHorizontal } from "lucide-react";
import type { CompareMode, RangeKey } from "@/lib/dashboard/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tabs = [
  { id: "overview", label: "Обзор" },
  { id: "insight", label: "AI-инсайт" },
  { id: "metrics", label: "Метрики" },
  { id: "table", label: "Таблица" },
];

const rangeLabels: Record<RangeKey, string> = {
  "3m": "3 месяца",
  "6m": "6 месяцев",
  "12m": "12 месяцев",
};

const compareLabels: Record<CompareMode, string> = {
  none: "Без сравнения",
  prev: "К предыдущему периоду",
  h1h2: "Первая vs вторая половина",
};

type TopNavProps = {
  range: RangeKey;
  compare: CompareMode;
  loading: boolean;
  datasetLabel: string;
  onRangeChange: (next: RangeKey) => void;
  onCompareChange: (next: CompareMode) => void;
  onOpenDatasetManager: () => void;
};

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function TopNav({
  range,
  compare,
  loading,
  datasetLabel,
  onRangeChange,
  onCompareChange,
  onOpenDatasetManager,
}: TopNavProps) {
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }

    const updateHeaderHeight = () => {
      document.documentElement.style.setProperty(
        "--dashboard-header-height",
        `${header.offsetHeight}px`,
      );
    };

    updateHeaderHeight();

    const observer = new ResizeObserver(() => {
      updateHeaderHeight();
    });

    observer.observe(header);
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 border-b border-border bg-background/72 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-1.5 px-6 py-2">
        <div className="flex min-w-0 flex-col gap-1.5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground animate-glow-pulse">
              <Activity className="h-4 w-4" strokeWidth={2.5} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-secondary ring-2 ring-background" />
            </div>
            <div className="min-w-0 leading-none">
              <span className="block truncate text-sm font-semibold tracking-tight">
                Пульс бизнеса
              </span>
              <span className="label-xs mt-0.5 block text-[9px]">Дашборд портфельной компании</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5 2xl:flex-row 2xl:items-center 2xl:justify-end">
            <nav className="hidden items-center gap-1 self-end rounded-full border border-border bg-card/60 p-1 md:flex 2xl:self-auto">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-card-elevated hover:text-foreground animate-rise"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/60 p-1.5 xl:w-auto xl:flex-nowrap">
              <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card-elevated/50 px-3 text-xs text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>{loading ? "Обновляем..." : "Фильтры периода"}</span>
              </div>

              <button
                type="button"
                title={datasetLabel}
                onClick={onOpenDatasetManager}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card-elevated/50 px-3.5 text-xs font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card-elevated hover:shadow-[0_0_24px_-10px_var(--primary-glow)]"
              >
                <Database className="h-3.5 w-3.5 text-primary" />
                <span>Наборы данных</span>
              </button>

              <Select value={range} onValueChange={(value) => onRangeChange(value as RangeKey)}>
                <SelectTrigger className="h-10 w-[148px] rounded-xl border-border bg-card-elevated/60 text-foreground">
                  <SelectValue placeholder="Период" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(rangeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={compare}
                onValueChange={(value) => onCompareChange(value as CompareMode)}
              >
                <SelectTrigger className="h-10 min-w-[220px] flex-1 rounded-xl border-border bg-card-elevated/60 text-foreground xl:w-[300px] xl:flex-none">
                  <SelectValue placeholder="Сравнение" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(compareLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
