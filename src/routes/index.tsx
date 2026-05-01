import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { TopNav } from "@/components/dashboard/TopNav";
import { Hero } from "@/components/dashboard/Hero";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { AiInsight } from "@/components/dashboard/AiInsight";
import { NeedsAttention } from "@/components/dashboard/NeedsAttention";
import { SecondaryCharts } from "@/components/dashboard/SecondaryCharts";
import { CsvTable } from "@/components/dashboard/CsvTable";
import { createDashboardSnapshot } from "@/lib/dashboard/metrics";
import { getDashboardSnapshot } from "@/lib/dashboard/server";
import { useDatasetLibrary } from "@/lib/dashboard/datasets";
import type { CompareMode, DashboardFilters, RangeKey } from "@/lib/dashboard/types";

const DatasetManager = lazy(async () => {
  const module = await import("@/components/dashboard/DatasetManager");
  return { default: module.DatasetManager };
});

export const Route = createFileRoute("/")({
  loader: () => getDashboardSnapshot({ data: { range: "12m", compare: "h1h2" } }),
  component: Dashboard,
});

function Dashboard() {
  const initialSnapshot = Route.useLoaderData();
  const requestSnapshot = useServerFn(getDashboardSnapshot);
  const [filters, setFilters] = useState<DashboardFilters>(initialSnapshot.filters);
  const [serverSnapshot, setServerSnapshot] = useState(initialSnapshot);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDatasetManagerOpen, setIsDatasetManagerOpen] = useState(false);
  const initializedRef = useRef(false);
  const leftColumnRef = useRef<HTMLDivElement | null>(null);
  const [insightHeight, setInsightHeight] = useState<number | null>(null);
  const {
    datasets,
    activeDataset,
    comparisonDataset,
    addDataset,
    setActiveDatasetId,
    setComparisonDatasetId,
    removeDataset,
    resetToDefaultSource,
  } = useDatasetLibrary();

  const localSnapshot = useMemo(
    () =>
      activeDataset
        ? createDashboardSnapshot(activeDataset.rows, filters, `local://${activeDataset.id}`)
        : null,
    [activeDataset, filters],
  );

  const snapshot = localSnapshot ?? serverSnapshot;

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    if (activeDataset) {
      return;
    }

    let cancelled = false;

    async function refreshSnapshot() {
      setIsRefreshing(true);
      setErrorMessage(null);

      try {
        const nextSnapshot = await requestSnapshot({ data: filters });
        if (!cancelled) {
          setServerSnapshot(nextSnapshot);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Не удалось обновить дашборд.");
        }
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    }

    void refreshSnapshot();

    return () => {
      cancelled = true;
    };
  }, [activeDataset, filters, requestSnapshot]);

  useEffect(() => {
    const element = leftColumnRef.current;
    if (!element) {
      return;
    }

    const syncHeight = () => {
      if (window.innerWidth < 1280) {
        setInsightHeight(null);
        return;
      }

      setInsightHeight(Math.round(element.getBoundingClientRect().height));
    };

    syncHeight();

    const observer = new ResizeObserver(() => {
      syncHeight();
    });

    observer.observe(element);
    window.addEventListener("resize", syncHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, [snapshot.generatedAt, snapshot.filters.compare, snapshot.filters.range]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        range={filters.range}
        compare={filters.compare}
        loading={isRefreshing}
        datasetLabel={activeDataset ? activeDataset.name : "Базовый CSV"}
        onRangeChange={(next) => setFilters((current) => ({ ...current, range: next as RangeKey }))}
        onCompareChange={(next) =>
          setFilters((current) => ({ ...current, compare: next as CompareMode }))
        }
        onOpenDatasetManager={() => setIsDatasetManagerOpen(true)}
      />

      <main className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
        <Hero snapshot={snapshot} />

        {errorMessage ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <KpiCards snapshot={snapshot} />

        <section
          id="insight"
          className="scroll-mt-dashboard grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.62fr)_minmax(360px,0.98fr)]"
        >
          <div ref={leftColumnRef} className="flex min-w-0 flex-col gap-6">
            <RevenueChart
              snapshot={snapshot}
              range={filters.range}
              onRangeChange={(next) => setFilters((current) => ({ ...current, range: next }))}
            />
            <NeedsAttention snapshot={snapshot} />
          </div>

          <div
            className="min-w-0 xl:self-start"
            style={insightHeight ? { height: `${insightHeight}px` } : undefined}
          >
            <AiInsight snapshot={snapshot} />
          </div>
        </section>

        <SecondaryCharts snapshot={snapshot} />
        <CsvTable snapshot={snapshot} />

        <footer className="flex flex-wrap items-center justify-between gap-3 pb-6 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Пульс бизнеса · v1.0
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>AI-инсайт работает через OpenRouter</span>
            <span>·</span>
            <span>{snapshot.comparison.selectedLabel}</span>
            <span>·</span>
            <span>
              {snapshot.comparison.selectedRows.length} из {snapshot.allRows.length} строк участвуют
              в текущем анализе
            </span>
          </div>
        </footer>
      </main>

      <Suspense fallback={null}>
        <DatasetManager
          open={isDatasetManagerOpen}
          onClose={() => setIsDatasetManagerOpen(false)}
          datasets={datasets}
          activeDataset={activeDataset}
          comparisonDataset={comparisonDataset}
          onAddDataset={addDataset}
          onSetActiveDatasetId={setActiveDatasetId}
          onSetComparisonDatasetId={setComparisonDatasetId}
          onRemoveDataset={removeDataset}
          onResetToDefaultSource={resetToDefaultSource}
          filters={filters}
          currentSnapshot={snapshot}
        />
      </Suspense>
    </div>
  );
}
