import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { fetchBusinessMetricRows, resolveCsvSourceUrl } from "./csv";
import { createDashboardSnapshot } from "./metrics";
import { COMPARE_OPTIONS, RANGE_OPTIONS } from "./types";

export const dashboardFiltersSchema = z.object({
  range: z.enum(RANGE_OPTIONS).default("12m"),
  compare: z.enum(COMPARE_OPTIONS).default("prev"),
});

export const getDashboardSnapshot = createServerFn({ method: "GET" })
  .inputValidator((input) => dashboardFiltersSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const sourceUrl = resolveCsvSourceUrl();
    const rows = await fetchBusinessMetricRows(sourceUrl);

    return createDashboardSnapshot(rows, data, sourceUrl);
  });
