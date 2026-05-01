import type {
  AttentionSeverity,
  AttentionSignal,
  DashboardComparison,
  DashboardFilters,
  DashboardSnapshot,
  MetricDelta,
  MetricDescriptor,
  MetricKey,
  MetricSummary,
  NormalizedMetricRow,
  RangeKey,
} from "./types";

const METRIC_DESCRIPTORS: MetricDescriptor[] = [
  { key: "revenue", label: "Выручка", unit: "currency", higherIsBetter: true, aggregate: "sum" },
  {
    key: "newCustomers",
    label: "Новые клиенты",
    unit: "count",
    higherIsBetter: true,
    aggregate: "sum",
  },
  { key: "ltv", label: "LTV", unit: "currency", higherIsBetter: true, aggregate: "average" },
  {
    key: "churnRate",
    label: "Отток",
    unit: "percent",
    higherIsBetter: false,
    aggregate: "average",
  },
  { key: "margin", label: "Маржа", unit: "percent", higherIsBetter: true, aggregate: "average" },
  { key: "cac", label: "CAC", unit: "currency", higherIsBetter: false, aggregate: "average" },
  {
    key: "ltvCacRatio",
    label: "LTV/CAC",
    unit: "ratio",
    higherIsBetter: true,
    aggregate: "average",
  },
];

const RANGE_TO_SIZE: Record<RangeKey, number> = {
  "3m": 3,
  "6m": 6,
  "12m": 12,
};

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function percentDelta(currentValue: number, previousValue: number) {
  if (previousValue === 0) {
    return null;
  }

  return roundTo(((currentValue - previousValue) / previousValue) * 100);
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function aggregateMetric(rows: NormalizedMetricRow[], descriptor: MetricDescriptor) {
  const values = rows.map((row) => row[descriptor.key]);
  if (values.length === 0) {
    return 0;
  }

  if (descriptor.aggregate === "sum") {
    return roundTo(values.reduce((total, value) => total + value, 0));
  }

  return roundTo(average(values));
}

function summarizeMetric(rows: NormalizedMetricRow[], descriptor: MetricDescriptor): MetricSummary {
  const values = rows.map((row) => row[descriptor.key]);
  const first = values[0] ?? 0;
  const last = values.at(-1) ?? 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = average(values);

  return {
    key: descriptor.key,
    label: descriptor.label,
    unit: descriptor.unit,
    higherIsBetter: descriptor.higherIsBetter,
    first: roundTo(first),
    last: roundTo(last),
    min: roundTo(min),
    max: roundTo(max),
    average: roundTo(avg),
    netChangeAbs: roundTo(last - first),
    netChangePct: percentDelta(last, first),
  };
}

function describeRange(range: RangeKey) {
  if (range === "3m") {
    return "Последние 3 месяца";
  }

  if (range === "6m") {
    return "Последние 6 месяцев";
  }

  return "Все 12 месяцев";
}

function monthRangeLabel(rows: NormalizedMetricRow[]) {
  const first = rows[0];
  const last = rows.at(-1);

  if (!first || !last) {
    return "";
  }

  if (first.monthLabel === last.monthLabel) {
    return first.monthLabel;
  }

  return `${first.monthLabel} - ${last.monthLabel}`;
}

function composeSelectedLabel(range: RangeKey, rows: NormalizedMetricRow[]) {
  const monthLabel = monthRangeLabel(rows);
  const rangeLabel = describeRange(range);

  return monthLabel ? `${rangeLabel} (${monthLabel})` : rangeLabel;
}

function buildComparison(
  allRows: NormalizedMetricRow[],
  filters: DashboardFilters,
): DashboardComparison {
  const selectedRows = allRows.slice(-RANGE_TO_SIZE[filters.range]);
  const selectedLabel = composeSelectedLabel(filters.range, selectedRows);

  if (filters.compare === "none") {
    return {
      mode: filters.compare,
      selectedRows,
      selectedLabel,
      currentRows: selectedRows,
      previousRows: [],
      currentLabel: selectedLabel,
      previousLabel: null,
      comparisonUnavailableReason: null,
    };
  }

  if (filters.compare === "prev") {
    const previousRows = allRows.slice(
      -(RANGE_TO_SIZE[filters.range] * 2),
      -RANGE_TO_SIZE[filters.range],
    );

    return {
      mode: filters.compare,
      selectedRows,
      selectedLabel,
      currentRows: selectedRows,
      previousRows,
      currentLabel: selectedLabel,
      previousLabel:
        previousRows.length > 0 ? `Предыдущий период (${monthRangeLabel(previousRows)})` : null,
      comparisonUnavailableReason:
        previousRows.length > 0
          ? null
          : "Для выбранного диапазона в CSV нет полного предыдущего периода для сравнения.",
    };
  }

  const splitIndex = Math.floor(selectedRows.length / 2);
  const previousRows = selectedRows.slice(0, splitIndex);
  const currentRows = selectedRows.slice(splitIndex);

  return {
    mode: filters.compare,
    selectedRows,
    selectedLabel,
    currentRows,
    previousRows,
    currentLabel:
      currentRows.length > 0
        ? `Вторая часть (${monthRangeLabel(currentRows)})`
        : "Вторая часть периода",
    previousLabel:
      previousRows.length > 0 ? `Первая часть (${monthRangeLabel(previousRows)})` : null,
    comparisonUnavailableReason:
      previousRows.length > 0 ? null : "Недостаточно месяцев, чтобы разделить период на две части.",
  };
}

function compareMetric(comparison: DashboardComparison, descriptor: MetricDescriptor): MetricDelta {
  const currentValue = aggregateMetric(comparison.currentRows, descriptor);

  if (comparison.previousRows.length === 0) {
    return {
      key: descriptor.key,
      label: descriptor.label,
      unit: descriptor.unit,
      higherIsBetter: descriptor.higherIsBetter,
      currentValue,
      previousValue: null,
      deltaAbs: null,
      deltaPct: null,
      isImproving: null,
    };
  }

  const previousValue = aggregateMetric(comparison.previousRows, descriptor);
  const deltaAbs = roundTo(currentValue - previousValue);
  const deltaPct = percentDelta(currentValue, previousValue);
  const isImproving = descriptor.higherIsBetter ? deltaAbs >= 0 : deltaAbs <= 0;

  return {
    key: descriptor.key,
    label: descriptor.label,
    unit: descriptor.unit,
    higherIsBetter: descriptor.higherIsBetter,
    currentValue,
    previousValue,
    deltaAbs,
    deltaPct,
    isImproving,
  };
}

function severityRank(severity: AttentionSeverity) {
  if (severity === "risk") {
    return 3;
  }

  if (severity === "watch") {
    return 2;
  }

  return 1;
}

function severityFromDelta(
  descriptor: MetricDescriptor,
  deltaPct: number | null,
  deltaAbs: number | null,
): AttentionSeverity | null {
  if (deltaPct === null || deltaAbs === null) {
    return null;
  }

  if (descriptor.higherIsBetter) {
    if (deltaPct <= -12 || deltaAbs <= -5) {
      return "risk";
    }

    if (deltaPct <= -5 || deltaAbs < 0) {
      return "watch";
    }

    return null;
  }

  if (deltaPct >= 18 || deltaAbs >= 1.2) {
    return "risk";
  }

  if (deltaPct >= 8 || deltaAbs > 0) {
    return "watch";
  }

  return null;
}

function buildAttentionSignal(
  descriptor: MetricDescriptor,
  delta: MetricDelta,
): AttentionSignal | null {
  const severity = severityFromDelta(descriptor, delta.deltaPct, delta.deltaAbs);

  if (!severity) {
    return null;
  }

  const percentText =
    delta.deltaPct === null
      ? "без сравнения"
      : `${delta.deltaPct >= 0 ? "рост" : "падение"} ${Math.abs(delta.deltaPct).toFixed(1)}%`;

  const message = descriptor.higherIsBetter
    ? `${descriptor.label}: ${percentText} относительно базы сравнения.`
    : `${descriptor.label}: ${percentText}, что ухудшает качество бизнеса.`;

  return {
    key: descriptor.key,
    title: descriptor.label,
    severity,
    message,
    currentValue: delta.currentValue,
    previousValue: delta.previousValue,
    deltaAbs: delta.deltaAbs,
    deltaPct: delta.deltaPct,
  };
}

function buildGrowthQualitySignal(deltas: Record<MetricKey, MetricDelta>): AttentionSignal | null {
  const revenueDelta = deltas.revenue.deltaPct ?? 0;
  const negativeEfficiencySignals = [
    deltas.churnRate,
    deltas.cac,
    deltas.margin,
    deltas.ltv,
    deltas.ltvCacRatio,
  ].filter((delta) => delta.isImproving === false);

  if (revenueDelta <= 0 || negativeEfficiencySignals.length < 2) {
    return null;
  }

  return {
    key: "revenue",
    title: "Качество роста",
    severity: negativeEfficiencySignals.length >= 3 ? "risk" : "watch",
    message: "Выручка растет, но одновременно ухудшаются несколько метрик эффективности.",
    currentValue: deltas.revenue.currentValue,
    previousValue: deltas.revenue.previousValue,
    deltaAbs: deltas.revenue.deltaAbs,
    deltaPct: deltas.revenue.deltaPct,
  };
}

export function createDashboardSnapshot(
  allRows: NormalizedMetricRow[],
  filters: DashboardFilters,
  sourceUrl: string,
): DashboardSnapshot {
  if (allRows.length === 0) {
    throw new Error("Нет строк с метриками для построения дашборда");
  }

  const comparison = buildComparison(allRows, filters);

  const summaries = Object.fromEntries(
    METRIC_DESCRIPTORS.map((descriptor) => [
      descriptor.key,
      summarizeMetric(comparison.selectedRows, descriptor),
    ]),
  ) as Record<MetricKey, MetricSummary>;

  const deltas = Object.fromEntries(
    METRIC_DESCRIPTORS.map((descriptor) => [descriptor.key, compareMetric(comparison, descriptor)]),
  ) as Record<MetricKey, MetricDelta>;

  const attention = METRIC_DESCRIPTORS.map((descriptor) =>
    buildAttentionSignal(descriptor, deltas[descriptor.key]),
  ).filter((signal): signal is AttentionSignal => signal !== null);

  const growthQualitySignal = buildGrowthQualitySignal(deltas);
  if (growthQualitySignal) {
    attention.push(growthQualitySignal);
  }

  attention.sort((left, right) => severityRank(right.severity) - severityRank(left.severity));

  return {
    sourceUrl,
    generatedAt: new Date().toISOString(),
    filters,
    allRows,
    comparison,
    summaries,
    deltas,
    attention: attention.slice(0, 4),
  };
}
