import type { NormalizedMetricRow } from "./types";

export type RawMetricRecord = {
  Месяц: string;
  Выручка: string | number;
  "Новые клиенты": string | number;
  LTV: string | number;
  Отток: string | number;
  Маржа: string | number;
  CAC: string | number;
};

export const REQUIRED_HEADERS: Array<keyof RawMetricRecord> = [
  "Месяц",
  "Выручка",
  "Новые клиенты",
  "LTV",
  "Отток",
  "Маржа",
  "CAC",
];

const MONTH_INDEX_BY_NAME: Record<string, number> = {
  Январь: 0,
  Февраль: 1,
  Март: 2,
  Апрель: 3,
  Май: 4,
  Июнь: 5,
  Июль: 6,
  Август: 7,
  Сентябрь: 8,
  Октябрь: 9,
  Ноябрь: 10,
  Декабрь: 11,
};

const MONTH_SHORT_BY_INDEX = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

export function normalizeNumberString(value: string) {
  const sanitized = value.replace(/\u00a0/g, "").replace(/[^\d,.-]/g, "");

  if (!sanitized) {
    return "0";
  }

  const lastCommaIndex = sanitized.lastIndexOf(",");
  const lastDotIndex = sanitized.lastIndexOf(".");
  const separatorIndex = Math.max(lastCommaIndex, lastDotIndex);

  if (separatorIndex === -1) {
    return sanitized;
  }

  const integerPart = sanitized.slice(0, separatorIndex).replace(/[.,]/g, "");
  const fractionalPart = sanitized.slice(separatorIndex + 1).replace(/[.,]/g, "");

  if (!fractionalPart) {
    return integerPart || "0";
  }

  return `${integerPart || "0"}.${fractionalPart}`;
}

export function parseNumericValue(value: string | number) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Некорректное числовое значение: ${value}`);
    }
    return value;
  }

  const normalized = normalizeNumberString(value);
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Не удалось распарсить числовое значение: ${value}`);
  }

  return parsed;
}

export function assertRequiredHeaders(headers: string[]) {
  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(`В таблице отсутствует обязательная колонка: ${requiredHeader}`);
    }
  }
}

export function normalizeMetricRecord(record: RawMetricRecord): NormalizedMetricRow {
  const monthLabel = String(record.Месяц).trim();
  const monthIndex = MONTH_INDEX_BY_NAME[monthLabel];

  if (monthIndex === undefined) {
    throw new Error(`Неизвестное название месяца: ${monthLabel}`);
  }

  const revenue = parseNumericValue(record.Выручка);
  const newCustomers = parseNumericValue(record["Новые клиенты"]);
  const ltv = parseNumericValue(record.LTV);
  const churnRate = parseNumericValue(record.Отток);
  const margin = parseNumericValue(record.Маржа);
  const cac = parseNumericValue(record.CAC);

  return {
    monthLabel,
    monthShort: MONTH_SHORT_BY_INDEX[monthIndex] ?? monthLabel.slice(0, 3).toLowerCase(),
    monthIndex,
    revenue,
    newCustomers,
    ltv,
    churnRate,
    margin,
    cac,
    ltvCacRatio: cac === 0 ? 0 : ltv / cac,
  };
}

export function normalizeMetricRecords(records: RawMetricRecord[]) {
  return records
    .map(normalizeMetricRecord)
    .sort((left, right) => left.monthIndex - right.monthIndex);
}
