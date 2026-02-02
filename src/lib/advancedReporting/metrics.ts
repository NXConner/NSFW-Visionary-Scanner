import { logger } from "@/lib/logger";
import type { DateRange, JsonObject, ScanRow } from "./types";

function isJsonObject(v: unknown): v is JsonObject {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function getNumberFromJson(obj: JsonObject | null | undefined, key: string): number | null {
  if (!obj) return null;
  const raw = obj[key];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export type MetricSeriesPoint = { date: string; value: number };

export type MetricSnapshot = {
  scan_count: number;
  length_avg?: number;
  girth_avg?: number;
  erect_length_avg?: number;
  erect_girth_avg?: number;
  eq_score_avg?: number;
  hardness_avg?: number;
};

export async function fetchScansInRange(dateRange: DateRange): Promise<ScanRow[]> {
  try {
    // scans table doesn't exist in current schema - return empty array
    // In the future, this will query the scans table when it's created
    logger.debug("fetchScansInRange: scans table not yet available", { dateRange });
    return [];
  } catch (error) {
    logger.error("fetchScansInRange error", { error });
    return [];
  }
}

export function computeSnapshot(scans: ScanRow[]): MetricSnapshot {
  const numeric = (vals: Array<number | null | undefined>): number[] =>
    vals.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const avg = (vals: number[]): number | undefined =>
    vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined;

  const eqVals: number[] = [];
  const hardnessVals: number[] = [];

  scans.forEach(s => {
    const ar = isJsonObject(s.analysis_result) ? s.analysis_result : null;
    const eq = getNumberFromJson(ar, "eq_score") ?? getNumberFromJson(ar, "eqScore");
    const hard = getNumberFromJson(ar, "hardness");
    if (eq != null) eqVals.push(eq);
    if (hard != null) hardnessVals.push(hard);
  });

  return {
    scan_count: scans.length,
    length_avg: avg(numeric(scans.map(s => s.length))),
    girth_avg: avg(numeric(scans.map(s => s.girth))),
    erect_length_avg: avg(numeric(scans.map(s => s.erect_length))),
    erect_girth_avg: avg(numeric(scans.map(s => s.erect_girth))),
    eq_score_avg: avg(eqVals),
    hardness_avg: avg(hardnessVals),
  };
}

export function buildMetricSeries(scans: ScanRow[], metricId: string): MetricSeriesPoint[] {
  const points: MetricSeriesPoint[] = [];

  for (const s of scans) {
    const date = s.scanned_at;
    let value: number | null = null;

    if (metricId === "length") value = s.length;
    else if (metricId === "girth") value = s.girth;
    else if (metricId === "erect_length") value = s.erect_length;
    else if (metricId === "erect_girth") value = s.erect_girth;
    else if (metricId === "eq_score" || metricId === "hardness") {
      const ar = isJsonObject(s.analysis_result) ? s.analysis_result : null;
      value =
        metricId === "eq_score"
          ? (getNumberFromJson(ar, "eq_score") ?? getNumberFromJson(ar, "eqScore"))
          : getNumberFromJson(ar, "hardness");
    } else if (metricId === "scan_count") value = 1;

    if (typeof value === "number" && Number.isFinite(value)) points.push({ date, value });
  }

  return points;
}
