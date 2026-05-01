import { useEffect, useMemo, useState } from "react";
import { assertRequiredHeaders, normalizeMetricRecords, type RawMetricRecord } from "./normalize";
import type { NormalizedMetricRow } from "./types";
import type { WorkBook } from "xlsx";

const STORAGE_KEY = "pulse-business-datasets:v1";
const HEADER_ALIASES: Record<keyof RawMetricRecord, string[]> = {
  Месяц: ["месяц", "month"],
  Выручка: ["выручка", "revenue"],
  "Новые клиенты": ["новые клиенты", "new customers", "customers", "new_customers"],
  LTV: ["ltv"],
  Отток: ["отток", "churn", "churn rate", "churn_rate"],
  Маржа: ["маржа", "margin"],
  CAC: ["cac"],
};

export type StoredDataset = {
  id: string;
  name: string;
  sourceName: string;
  sourceType: "upload";
  fileType: string;
  createdAt: string;
  rows: NormalizedMetricRow[];
};

type DatasetStore = {
  datasets: StoredDataset[];
  activeDatasetId: string | null;
  comparisonDatasetId: string | null;
};

const EMPTY_STORE: DatasetStore = {
  datasets: [],
  activeDatasetId: null,
  comparisonDatasetId: null,
};

function makeDatasetId() {
  return `dataset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readStore(): DatasetStore {
  if (typeof window === "undefined") {
    return EMPTY_STORE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_STORE;
    }

    const parsed = JSON.parse(raw) as DatasetStore;
    if (!parsed || !Array.isArray(parsed.datasets)) {
      return EMPTY_STORE;
    }

    return {
      datasets: parsed.datasets,
      activeDatasetId: parsed.activeDatasetId ?? null,
      comparisonDatasetId: parsed.comparisonDatasetId ?? null,
    };
  } catch {
    return EMPTY_STORE;
  }
}

function writeStore(store: DatasetStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function getStringValue(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function normalizeHeaderName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveHeaderMap(headers: string[]) {
  const headerLookup = new Map(headers.map((header) => [normalizeHeaderName(header), header]));

  const resolvedEntries = (Object.keys(HEADER_ALIASES) as Array<keyof RawMetricRecord>).map(
    (canonicalHeader) => {
      const matchedAlias = HEADER_ALIASES[canonicalHeader].find((alias) =>
        headerLookup.has(normalizeHeaderName(alias)),
      );
      return [
        canonicalHeader,
        matchedAlias ? (headerLookup.get(normalizeHeaderName(matchedAlias)) ?? null) : null,
      ] as const;
    },
  );

  const missingHeaders = resolvedEntries
    .filter(([, actualHeader]) => !actualHeader)
    .map(([canonicalHeader]) => canonicalHeader);
  assertRequiredHeaders(
    resolvedEntries
      .filter(([, actualHeader]) => actualHeader)
      .map(([canonicalHeader]) => canonicalHeader),
  );

  if (missingHeaders.length > 0) {
    throw new Error(`В таблице отсутствуют обязательные колонки: ${missingHeaders.join(", ")}`);
  }

  return Object.fromEntries(resolvedEntries) as Record<keyof RawMetricRecord, string>;
}

function workbookToRecords(workbook: WorkBook, xlsx: typeof import("xlsx")): RawMetricRecord[] {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error("В загруженном файле не найден первый лист с данными.");
  }

  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (rows.length === 0) {
    throw new Error("Файл не содержит строк для анализа.");
  }

  const headers = Object.keys(rows[0]).map((header) => header.trim());
  const headerMap = resolveHeaderMap(headers);

  return rows.map((row) => ({
    Месяц: getStringValue(row[headerMap.Месяц]),
    Выручка: getStringValue(row[headerMap.Выручка]),
    "Новые клиенты": getStringValue(row[headerMap["Новые клиенты"]]),
    LTV: getStringValue(row[headerMap.LTV]),
    Отток: getStringValue(row[headerMap.Отток]),
    Маржа: getStringValue(row[headerMap.Маржа]),
    CAC: getStringValue(row[headerMap.CAC]),
  }));
}

export async function parseDatasetFile(file: File): Promise<StoredDataset> {
  const xlsx = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = xlsx.read(buffer, { type: "array" });
  const rows = normalizeMetricRecords(workbookToRecords(workbook, xlsx));

  if (rows.length === 0) {
    throw new Error("После нормализации файл не содержит валидных строк.");
  }

  return {
    id: makeDatasetId(),
    name: file.name.replace(/\.[^.]+$/, ""),
    sourceName: file.name,
    sourceType: "upload",
    fileType: file.name.split(".").pop()?.toLowerCase() ?? "unknown",
    createdAt: new Date().toISOString(),
    rows,
  };
}

export function useDatasetLibrary() {
  const [store, setStore] = useState<DatasetStore>(EMPTY_STORE);

  useEffect(() => {
    setStore(readStore());
  }, []);

  const datasets = useMemo(
    () => [...store.datasets].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [store.datasets],
  );

  const activeDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === store.activeDatasetId) ?? null,
    [datasets, store.activeDatasetId],
  );

  const comparisonDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === store.comparisonDatasetId) ?? null,
    [datasets, store.comparisonDatasetId],
  );

  function updateStore(next: DatasetStore) {
    setStore(next);
    writeStore(next);
  }

  function addDataset(dataset: StoredDataset) {
    const previousActiveId = store.activeDatasetId;
    const nextStore: DatasetStore = {
      datasets: [dataset, ...store.datasets.filter((item) => item.id !== dataset.id)],
      activeDatasetId: dataset.id,
      comparisonDatasetId:
        previousActiveId && previousActiveId !== dataset.id
          ? previousActiveId
          : store.comparisonDatasetId,
    };

    updateStore(nextStore);
  }

  function setActiveDatasetId(id: string | null) {
    updateStore({
      ...store,
      activeDatasetId: id,
    });
  }

  function setComparisonDatasetId(id: string | null) {
    updateStore({
      ...store,
      comparisonDatasetId: id,
    });
  }

  function removeDataset(id: string) {
    const nextDatasets = store.datasets.filter((dataset) => dataset.id !== id);
    updateStore({
      datasets: nextDatasets,
      activeDatasetId: store.activeDatasetId === id ? null : store.activeDatasetId,
      comparisonDatasetId: store.comparisonDatasetId === id ? null : store.comparisonDatasetId,
    });
  }

  function resetToDefaultSource() {
    updateStore({
      ...store,
      activeDatasetId: null,
    });
  }

  return {
    datasets,
    activeDataset,
    comparisonDataset,
    activeDatasetId: store.activeDatasetId,
    comparisonDatasetId: store.comparisonDatasetId,
    addDataset,
    setActiveDatasetId,
    setComparisonDatasetId,
    removeDataset,
    resetToDefaultSource,
  };
}
