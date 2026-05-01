import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Database, FileUp, LoaderCircle, RefreshCcw, ShieldCheck, Trash2 } from "lucide-react";
import { createDashboardSnapshot } from "@/lib/dashboard/metrics";
import { parseDatasetFile, type StoredDataset } from "@/lib/dashboard/datasets";
import {
  generateDatasetComparisonInsight,
  type DatasetComparisonInsightResponse,
} from "@/lib/dashboard/dataset-comparison-insight";
import { calculateHealthScore, formatTimestampLabel } from "@/lib/dashboard/format";
import type { DashboardFilters, DashboardSnapshot, MetricKey } from "@/lib/dashboard/types";

type DatasetManagerProps = {
  open: boolean;
  onClose: () => void;
  datasets: StoredDataset[];
  activeDataset: StoredDataset | null;
  comparisonDataset: StoredDataset | null;
  onAddDataset: (dataset: StoredDataset) => void;
  onSetActiveDatasetId: (id: string | null) => void;
  onSetComparisonDatasetId: (id: string | null) => void;
  onRemoveDataset: (id: string) => void;
  onResetToDefaultSource: () => void;
  filters: DashboardFilters;
  currentSnapshot: DashboardSnapshot;
};

const COMPARE_KEYS: MetricKey[] = [
  "revenue",
  "newCustomers",
  "margin",
  "churnRate",
  "cac",
  "ltvCacRatio",
];

function aggregate(rows: DashboardSnapshot["comparison"]["selectedRows"], key: MetricKey) {
  if (rows.length === 0) {
    return 0;
  }

  if (key === "revenue" || key === "newCustomers") {
    return rows.reduce((total, row) => total + row[key], 0);
  }

  return rows.reduce((total, row) => total + row[key], 0) / rows.length;
}

function getCurrentSourceMeta(
  activeDataset: StoredDataset | null,
  currentSnapshot: DashboardSnapshot,
) {
  if (activeDataset) {
    return {
      id: activeDataset.id,
      name: activeDataset.name,
      sourceName: activeDataset.sourceName,
      fileType: activeDataset.fileType,
    };
  }

  return {
    id: "base_csv",
    name: "Базовый CSV",
    sourceName: currentSnapshot.sourceUrl,
    fileType: "csv",
  };
}

function buildComparisonPayload(
  currentSnapshot: DashboardSnapshot,
  previousSnapshot: DashboardSnapshot,
  currentMeta: { name: string; sourceName: string },
  previousDataset: StoredDataset,
) {
  const currentHealthScore = calculateHealthScore(
    currentSnapshot.attention,
    currentSnapshot.deltas,
  );
  const previousHealthScore = calculateHealthScore(
    previousSnapshot.attention,
    previousSnapshot.deltas,
  );

  const metrics = COMPARE_KEYS.map((key) => {
    const currentSummary = currentSnapshot.summaries[key];
    const currentValueRaw = aggregate(currentSnapshot.comparison.selectedRows, key);
    const previousValueRaw = aggregate(previousSnapshot.comparison.selectedRows, key);
    const unit = currentSummary.unit;
    const delta = currentValueRaw - previousValueRaw;
    const pctDelta =
      previousValueRaw !== 0
        ? ((currentValueRaw - previousValueRaw) / previousValueRaw) * 100
        : null;

    const change =
      unit === "percent"
        ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} п.п.`
        : unit === "ratio"
          ? `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}x`
          : pctDelta === null
            ? "без базы"
            : `${pctDelta >= 0 ? "+" : ""}${pctDelta.toFixed(1)}%`;

    return {
      label: currentSummary.label,
      unit,
      currentValue: currentValueRaw,
      previousValue: previousValueRaw,
      change,
    };
  });

  return {
    current: {
      datasetName: currentMeta.name,
      sourceName: currentMeta.sourceName,
      periodLabel: currentSnapshot.comparison.selectedLabel,
      healthScore: currentHealthScore,
      metrics,
      attention: currentSnapshot.attention.map((item) => ({
        title: item.title,
        severity: item.severity,
        message: item.message,
      })),
    },
    previous: {
      datasetName: previousDataset.name,
      sourceName: previousDataset.sourceName,
      periodLabel: previousSnapshot.comparison.selectedLabel,
      healthScore: previousHealthScore,
      metrics,
      attention: previousSnapshot.attention.map((item) => ({
        title: item.title,
        severity: item.severity,
        message: item.message,
      })),
    },
  };
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-3 py-2">
      <div className="label-xs">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function DatasetManager({
  open,
  onClose,
  datasets,
  activeDataset,
  comparisonDataset,
  onAddDataset,
  onSetActiveDatasetId,
  onSetComparisonDatasetId,
  onRemoveDataset,
  onResetToDefaultSource,
  filters,
  currentSnapshot,
}: DatasetManagerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const compareInsight = useServerFn(generateDatasetComparisonInsight);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<DatasetComparisonInsightResponse | null>(
    null,
  );
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);

  const previousSnapshot = useMemo(() => {
    if (!comparisonDataset) {
      return null;
    }

    return createDashboardSnapshot(
      comparisonDataset.rows,
      filters,
      `local://${comparisonDataset.id}`,
    );
  }, [comparisonDataset, filters]);

  const currentMeta = useMemo(
    () => getCurrentSourceMeta(activeDataset, currentSnapshot),
    [activeDataset, currentSnapshot],
  );
  const isDefaultSourceActive = !activeDataset;

  if (!open) {
    return null;
  }

  async function handleFilePick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setSourceNotice(null);

    try {
      const dataset = await parseDatasetFile(file);
      onAddDataset(dataset);
      setComparisonResult(null);
      setComparisonError(null);
      setSourceNotice(`Загружен новый набор: ${dataset.name}. Он сразу стал активным источником.`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Не удалось загрузить таблицу.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleResetToDefaultSource() {
    setComparisonResult(null);
    setComparisonError(null);

    if (isDefaultSourceActive) {
      setSourceNotice("Базовый Google Sheets CSV уже активен.");
      return;
    }

    onResetToDefaultSource();
    setSourceNotice("Активный источник переключен на базовый Google Sheets CSV.");
  }

  async function handleCompareDatasets() {
    if (!comparisonDataset || !previousSnapshot) {
      return;
    }

    setIsComparing(true);
    setComparisonError(null);

    try {
      const response = await compareInsight({
        data: buildComparisonPayload(
          currentSnapshot,
          previousSnapshot,
          currentMeta,
          comparisonDataset,
        ),
      });
      setComparisonResult(response);
    } catch {
      setComparisonError(
        "AI-сравнение таблиц не удалось сгенерировать. Проверьте OPENROUTER_API_KEY и серверные логи.",
      );
      setComparisonResult(null);
    } finally {
      setIsComparing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-label="Закрыть окно"
      />

      <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">Наборы данных</h3>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Владелец может загрузить новую таблицу, сохранить ее локально в браузере и при
              необходимости сравнить новый набор со старым через AI.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Закрыть
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6 pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatChip label="Локально сохранено" value={`${datasets.length} наборов`} />
            <StatChip label="Активный источник" value={currentMeta.name} />
            <StatChip label="Период анализа" value={currentSnapshot.comparison.selectedLabel} />
          </div>

          <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <div className="grid gap-4">
              <div className="rounded-2xl border border-border bg-card-elevated/55 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Загрузка новой таблицы
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Поддерживаются CSV, XLS, XLSX, TSV и ODS. После загрузки таблица остается в
                      локальном хранилище браузера.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-70"
                  >
                    {isUploading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileUp className="h-4 w-4" />
                    )}
                    {isUploading ? "Загружаем..." : "Загрузить таблицу"}
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.tsv,.ods"
                    className="hidden"
                    onChange={handleFilePick}
                  />
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background/35 px-3 py-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Файлы не отправляются в клиентский код и не публикуются автоматически. Наборы
                  хранятся локально на этом устройстве.
                </div>

                {uploadError ? (
                  <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {uploadError}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-border bg-card-elevated/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Активный источник</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Можно вернуться к базовому Google Sheets CSV или выбрать любой сохраненный
                      набор.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToDefaultSource}
                    disabled={isDefaultSourceActive}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card-elevated/50 px-3 py-2 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card-elevated hover:shadow-[0_0_24px_-10px_var(--primary-glow)] disabled:cursor-default disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:border-border disabled:hover:bg-card-elevated/50 disabled:hover:shadow-none"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    {isDefaultSourceActive ? "Базовый CSV активен" : "Вернуться к базовому CSV"}
                  </button>
                </div>

                {sourceNotice ? (
                  <div className="mt-3 rounded-xl border border-primary/25 bg-primary/8 px-3 py-2 text-sm text-primary">
                    {sourceNotice}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3">
                  <label className="grid gap-1 text-sm">
                    <span className="text-muted-foreground">Активный набор</span>
                    <select
                      value={activeDataset?.id ?? ""}
                      onChange={(event) => {
                        onSetActiveDatasetId(event.target.value || null);
                        setSourceNotice(null);
                        setComparisonResult(null);
                      }}
                      className="rounded-xl border border-border bg-background/70 px-3 py-2 text-foreground"
                    >
                      <option value="">Базовый Google Sheets CSV</option>
                      {datasets.map((dataset) => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="text-muted-foreground">Набор для AI-сравнения</span>
                    <select
                      value={comparisonDataset?.id ?? ""}
                      onChange={(event) => {
                        onSetComparisonDatasetId(event.target.value || null);
                        setComparisonResult(null);
                        setComparisonError(null);
                      }}
                      className="rounded-xl border border-border bg-background/70 px-3 py-2 text-foreground"
                    >
                      <option value="">Не выбран</option>
                      {datasets
                        .filter((dataset) => dataset.id !== activeDataset?.id)
                        .map((dataset) => (
                          <option key={dataset.id} value={dataset.id}>
                            {dataset.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card-elevated/55 p-4">
                <div className="text-sm font-semibold text-foreground">Сохраненные наборы</div>
                <div className="mt-4 grid gap-3">
                  {datasets.length === 0 ? (
                    <div className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground">
                      Пока нет локально сохраненных наборов. После первой загрузки дашборд начнет их
                      запоминать в браузере.
                    </div>
                  ) : (
                    datasets.map((dataset) => (
                      <div
                        key={dataset.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{dataset.name}</span>
                            {activeDataset?.id === dataset.id ? (
                              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                                Активный
                              </span>
                            ) : null}
                            {comparisonDataset?.id === dataset.id ? (
                              <span className="rounded-full border border-secondary/40 bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                                Сравнение
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {dataset.sourceName} · {dataset.rows.length} строк ·{" "}
                            {formatTimestampLabel(dataset.createdAt)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveDataset(dataset.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Удалить
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-border bg-card-elevated/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      AI-сравнение старой и новой таблицы
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Сравнивает текущий источник с выбранным предыдущим набором по текущему периоду
                      и фильтрам дашборда.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCompareDatasets}
                    disabled={!comparisonDataset || isComparing}
                    className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-60"
                  >
                    {isComparing ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
                    {isComparing ? "Сравниваем..." : "Сравнить через AI"}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-background/40 p-3">
                    <div className="label-xs">Текущий набор</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {currentMeta.name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {currentSnapshot.comparison.selectedLabel}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/40 p-3">
                    <div className="label-xs">База сравнения</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {comparisonDataset?.name ?? "Не выбрана"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {previousSnapshot?.comparison.selectedLabel ?? "Выберите сохраненный набор"}
                    </div>
                  </div>
                </div>

                {comparisonError ? (
                  <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {comparisonError}
                  </div>
                ) : null}

                {comparisonResult ? (
                  <div className="mt-4 rounded-2xl border border-border bg-background/45 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-secondary/40 bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                        OpenRouter
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {comparisonResult.model}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground">
                      {comparisonResult.summary}
                    </p>
                    <div className="mt-4 grid gap-2">
                      <div className="rounded-xl border border-border bg-card-elevated/50 p-3 text-sm text-foreground">
                        <span className="label-xs">Что улучшилось</span>
                        <div className="mt-1">{comparisonResult.whatImproved}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-card-elevated/50 p-3 text-sm text-foreground">
                        <span className="label-xs">Что ухудшилось</span>
                        <div className="mt-1">{comparisonResult.whatWorsened}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-card-elevated/50 p-3 text-sm text-foreground">
                        <span className="label-xs">Что проверить первым</span>
                        <div className="mt-1">{comparisonResult.whatToCheckFirst}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {comparisonResult.caveat}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-border bg-background/45 p-4 text-sm text-muted-foreground">
                    Выберите источник для сравнения и запустите AI-анализ. Результат строится по
                    агрегатам периода, risk-сигналам и health score двух таблиц.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
