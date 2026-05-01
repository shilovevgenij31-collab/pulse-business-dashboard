import type { NormalizedMetricRow } from "./types";
import { assertRequiredHeaders, normalizeMetricRecords, type RawMetricRecord } from "./normalize";

const DEFAULT_CSV_SOURCE_URL =
  "https://docs.google.com/spreadsheets/d/1CiXEJboFXmUznr3xuBpzuk8_sgWBVqZExHeGfguQO64/export?format=csv&gid=0";

function readCsvRows(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '"') {
      const nextChar = text[index + 1];
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[index + 1] === "\n") {
        index += 1;
      }

      currentRow.push(currentField);
      if (currentRow.some((value) => value.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((value) => value.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function toRecord(headers: string[], row: string[]) {
  const record = {} as RawMetricRecord;

  headers.forEach((header, index) => {
    (record as Record<string, string>)[header] = row[index]?.trim() ?? "";
  });

  return record;
}

function parseCsvRecords(text: string) {
  const [rawHeaders, ...rawRows] = readCsvRows(text);

  if (!rawHeaders) {
    throw new Error("CSV-файл пуст");
  }

  const headers = rawHeaders.map((header) => header.replace(/^\uFEFF/, "").trim());
  assertRequiredHeaders(headers);

  return rawRows.map((row) => toRecord(headers, row));
}

export function resolveCsvSourceUrl() {
  const processEnvUrl =
    typeof process !== "undefined" && process.env ? process.env.CSV_SOURCE_URL : undefined;
  const viteEnvUrl =
    typeof import.meta !== "undefined" ? import.meta.env.VITE_CSV_SOURCE_URL : undefined;

  return processEnvUrl || viteEnvUrl || DEFAULT_CSV_SOURCE_URL;
}

export async function fetchBusinessMetricRows(
  sourceUrl = resolveCsvSourceUrl(),
): Promise<NormalizedMetricRow[]> {
  const response = await fetch(sourceUrl, {
    headers: {
      accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить CSV-источник: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  return normalizeMetricRecords(parseCsvRecords(csvText));
}
