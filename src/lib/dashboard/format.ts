import type { AttentionSeverity, MetricDelta, MetricUnit, NormalizedMetricRow } from "./types";

export function formatMetricValue(
  unit: MetricUnit,
  value: number,
  options?: { compact?: boolean },
) {
  const compact = options?.compact ?? false;

  if (unit === "currency") {
    if (compact) {
      if (Math.abs(value) >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(2)} млн ₽`;
      }

      if (Math.abs(value) >= 1_000) {
        return `${(value / 1_000).toFixed(1)} тыс ₽`;
      }
    }

    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: value >= 10_000 ? 0 : 1,
    }).format(value);
  }

  if (unit === "count") {
    return new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (unit === "percent") {
    return `${value.toFixed(1)}%`;
  }

  return `${value.toFixed(2)}x`;
}

export function formatDeltaValue(delta: MetricDelta) {
  if (delta.deltaAbs === null && delta.deltaPct === null) {
    return "без сравнения";
  }

  if (delta.key === "margin" || delta.key === "churnRate") {
    const amount = delta.deltaAbs ?? 0;
    return `${amount >= 0 ? "+" : ""}${amount.toFixed(1)} п.п.`;
  }

  if (delta.unit === "ratio" && delta.deltaPct === null) {
    const amount = delta.deltaAbs ?? 0;
    return `${amount >= 0 ? "+" : ""}${amount.toFixed(2)}x`;
  }

  const amount = delta.deltaPct ?? 0;
  return `${amount >= 0 ? "+" : ""}${amount.toFixed(1)}%`;
}

export function formatSignedMetricValue(unit: MetricUnit, value: number) {
  if (unit === "percent") {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)} п.п.`;
  }

  if (unit === "ratio") {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}x`;
  }

  if (unit === "count") {
    return `${value >= 0 ? "+" : ""}${Math.round(value).toLocaleString("ru-RU")}`;
  }

  return `${value >= 0 ? "+" : "-"}${formatMetricValue(unit, Math.abs(value), { compact: true })}`;
}

export function severityToLabel(severity: AttentionSeverity) {
  if (severity === "risk") {
    return "Риск";
  }

  if (severity === "watch") {
    return "Внимание";
  }

  return "Норма";
}

export function statusFromDelta(delta: MetricDelta, severity?: AttentionSeverity) {
  if (severity === "risk") {
    return "Риск";
  }

  if (severity === "watch") {
    return "Внимание";
  }

  if (delta.isImproving === false) {
    return "Внимание";
  }

  return "Норма";
}

export function formatTimestampLabel(isoString: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(isoString));
}

export function rowHealthStatus(row: NormalizedMetricRow, previousRow?: NormalizedMetricRow) {
  if (!previousRow) {
    return "Норма" as const;
  }

  let issues = 0;

  if (row.churnRate > previousRow.churnRate + 0.5) {
    issues += 1;
  }

  if (row.cac > previousRow.cac * 1.08) {
    issues += 1;
  }

  if (row.margin < previousRow.margin - 2) {
    issues += 1;
  }

  if (row.ltv < previousRow.ltv * 0.96) {
    issues += 1;
  }

  if (issues >= 2) {
    return "Риск" as const;
  }

  if (issues === 1) {
    return "Внимание" as const;
  }

  return "Норма" as const;
}

export function calculateHealthScore(
  attention: Array<{ severity: AttentionSeverity }>,
  deltas: Record<string, MetricDelta>,
) {
  const riskCount = attention.filter((item) => item.severity === "risk").length;
  const watchCount = attention.filter((item) => item.severity === "watch").length;

  let score = 88 - riskCount * 14 - watchCount * 6;

  if (deltas.revenue?.isImproving) {
    score += 5;
  }

  if (deltas.newCustomers?.isImproving) {
    score += 4;
  }

  if (deltas.churnRate?.isImproving) {
    score += 5;
  }

  if (deltas.margin?.isImproving) {
    score += 5;
  }

  return Math.max(38, Math.min(96, Math.round(score)));
}

export function healthStatusLabel(score: number) {
  if (score >= 82) {
    return { label: "Стабильно", tone: "primary" as const };
  }

  if (score >= 68) {
    return { label: "Под наблюдением", tone: "warning" as const };
  }

  return { label: "Требует действий", tone: "destructive" as const };
}
