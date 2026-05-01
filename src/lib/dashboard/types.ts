export const RANGE_OPTIONS = ["3m", "6m", "12m"] as const;
export const COMPARE_OPTIONS = ["none", "prev", "h1h2"] as const;

export type RangeKey = (typeof RANGE_OPTIONS)[number];
export type CompareMode = (typeof COMPARE_OPTIONS)[number];

export type MetricKey =
  | "revenue"
  | "newCustomers"
  | "ltv"
  | "churnRate"
  | "margin"
  | "cac"
  | "ltvCacRatio";

export type MetricUnit = "currency" | "count" | "percent" | "ratio";
export type AttentionSeverity = "healthy" | "watch" | "risk";

export type MetricDescriptor = {
  key: MetricKey;
  label: string;
  unit: MetricUnit;
  higherIsBetter: boolean;
  aggregate: "sum" | "average";
};

export type NormalizedMetricRow = {
  monthLabel: string;
  monthShort: string;
  monthIndex: number;
  revenue: number;
  newCustomers: number;
  ltv: number;
  churnRate: number;
  margin: number;
  cac: number;
  ltvCacRatio: number;
};

export type MetricSummary = {
  key: MetricKey;
  label: string;
  unit: MetricUnit;
  higherIsBetter: boolean;
  first: number;
  last: number;
  min: number;
  max: number;
  average: number;
  netChangeAbs: number;
  netChangePct: number | null;
};

export type MetricDelta = {
  key: MetricKey;
  label: string;
  unit: MetricUnit;
  higherIsBetter: boolean;
  currentValue: number;
  previousValue: number | null;
  deltaAbs: number | null;
  deltaPct: number | null;
  isImproving: boolean | null;
};

export type AttentionSignal = {
  key: MetricKey;
  title: string;
  severity: AttentionSeverity;
  message: string;
  currentValue: number;
  previousValue: number | null;
  deltaAbs: number | null;
  deltaPct: number | null;
};

export type DashboardFilters = {
  range: RangeKey;
  compare: CompareMode;
};

export type DashboardComparison = {
  mode: CompareMode;
  selectedRows: NormalizedMetricRow[];
  selectedLabel: string;
  currentRows: NormalizedMetricRow[];
  previousRows: NormalizedMetricRow[];
  currentLabel: string;
  previousLabel: string | null;
  comparisonUnavailableReason: string | null;
};

export type DashboardSnapshot = {
  sourceUrl: string;
  generatedAt: string;
  filters: DashboardFilters;
  allRows: NormalizedMetricRow[];
  comparison: DashboardComparison;
  summaries: Record<MetricKey, MetricSummary>;
  deltas: Record<MetricKey, MetricDelta>;
  attention: AttentionSignal[];
};
