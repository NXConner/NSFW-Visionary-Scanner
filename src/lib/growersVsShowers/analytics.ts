import type { MeasurementContext, GrowersVsShowersSummary } from "./types";
import type { ScanEntry } from "@/hooks/useEncryptedStorage";

function mean(values: number[]): number | null {
  const finite = values.filter(v => Number.isFinite(v));
  if (finite.length === 0) return null;
  return finite.reduce((a, b) => a + b, 0) / finite.length;
}

function safePercent(delta: number | null, base: number | null): number | null {
  if (delta == null || base == null || !Number.isFinite(base) || base === 0) return null;
  return (delta / base) * 100;
}

function getContext(scan: ScanEntry): MeasurementContext | undefined {
  const anyScan = scan as ScanEntry & { measurement_context?: unknown };
  if (!anyScan.measurement_context || typeof anyScan.measurement_context !== "object") return;
  return anyScan.measurement_context as MeasurementContext;
}

function extractFlaccid(scan: ScanEntry): { length: number; girth: number } | null {
  const ctx = getContext(scan);
  const state = ctx?.state ?? "unknown";
  const length = scan.length;
  const girth = scan.circumference;
  if (!Number.isFinite(length) || !Number.isFinite(girth) || length <= 0 || girth <= 0) return null;
  if (state === "flaccid" || state === "paired") {
    return { length, girth };
  }
  return null;
}

function extractErect(scan: ScanEntry): { length: number; girth: number } | null {
  const ctx = getContext(scan);
  const state = ctx?.state ?? "unknown";

  const anyScan = scan as ScanEntry & {
    erect_length?: unknown;
    erect_circumference?: unknown;
  };
  const pairedLen = typeof anyScan.erect_length === "number" ? anyScan.erect_length : null;
  const pairedGirth =
    typeof anyScan.erect_circumference === "number" ? anyScan.erect_circumference : null;

  if (
    Number.isFinite(pairedLen) &&
    Number.isFinite(pairedGirth) &&
    pairedLen! > 0 &&
    pairedGirth! > 0
  ) {
    return { length: pairedLen!, girth: pairedGirth! };
  }

  // If the scan itself is tagged erect, treat length/circumference as erect.
  if (state === "erect") {
    const length = scan.length;
    const girth = scan.circumference;
    if (!Number.isFinite(length) || !Number.isFinite(girth) || length <= 0 || girth <= 0)
      return null;
    return { length, girth };
  }

  return null;
}

function isPaired(scan: ScanEntry): boolean {
  const ctx = getContext(scan);
  const state = ctx?.state ?? "unknown";
  if (state === "paired") return true;
  const anyScan = scan as ScanEntry & { erect_length?: unknown; erect_circumference?: unknown };
  return (
    typeof anyScan.erect_length === "number" && typeof anyScan.erect_circumference === "number"
  );
}

function groupByKey(
  scans: ScanEntry[],
  getKey: (c: MeasurementContext) => string | null,
): Array<{ key: string; n: number; avgErectLen: number | null; avgFlaccidLen: number | null }> {
  const buckets = new Map<string, { erect: number[]; flaccid: number[] }>();
  for (const s of scans) {
    const ctx = getContext(s);
    if (!ctx) continue;
    const key = getKey(ctx);
    if (!key) continue;
    const b = buckets.get(key) ?? { erect: [], flaccid: [] };
    const f = extractFlaccid(s);
    const e = extractErect(s);
    if (f) b.flaccid.push(f.length);
    if (e) b.erect.push(e.length);
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .map(([key, v]) => ({
      key,
      n: Math.max(v.erect.length, v.flaccid.length),
      avgErectLen: mean(v.erect),
      avgFlaccidLen: mean(v.flaccid),
    }))
    .filter(r => r.n > 0)
    .sort((a, b) => b.n - a.n);
}

export function summarizeGrowersVsShowers(
  scans: ScanEntry[],
  opts?: {
    showerMaxDeltaCm?: number;
    growerMinDeltaCm?: number;
    minPerState?: number;
  },
): GrowersVsShowersSummary {
  const showerMaxDeltaCm = opts?.showerMaxDeltaCm ?? 2.54; // 1 inch
  const growerMinDeltaCm = opts?.growerMinDeltaCm ?? 5.08; // 2 inches
  const minPerState = opts?.minPerState ?? 3;

  const flaccid = scans.map(extractFlaccid).filter(Boolean) as Array<{
    length: number;
    girth: number;
  }>;
  const erect = scans.map(extractErect).filter(Boolean) as Array<{ length: number; girth: number }>;
  const pairedCount = scans.filter(isPaired).length;

  const flaccidLen = mean(flaccid.map(x => x.length));
  const flaccidGirth = mean(flaccid.map(x => x.girth));
  const erectLen = mean(erect.map(x => x.length));
  const erectGirth = mean(erect.map(x => x.girth));

  const deltaLen = erectLen != null && flaccidLen != null ? erectLen - flaccidLen : null;
  const deltaGirth = erectGirth != null && flaccidGirth != null ? erectGirth - flaccidGirth : null;

  const warnings: string[] = [];
  if (pairedCount === 0) {
    warnings.push(
      "No paired (flaccid + erect) entries found. Add paired measurements for the clearest classification.",
    );
  }
  if (flaccid.length < minPerState || erect.length < minPerState) {
    warnings.push(
      `Not enough labeled data yet. Aim for at least ${minPerState} flaccid and ${minPerState} erect (or paired) entries.`,
    );
  }

  let classification: GrowersVsShowersSummary["classification"] = "insufficient-data";
  let rationale = "Add more labeled measurements (flaccid and erect) to classify.";
  if (deltaLen != null && flaccid.length >= minPerState && erect.length >= minPerState) {
    if (deltaLen <= showerMaxDeltaCm) {
      classification = "shower";
      rationale = `Average length change is ${deltaLen.toFixed(2)} cm, which is ≤ ${showerMaxDeltaCm.toFixed(
        2,
      )} cm.`;
    } else if (deltaLen >= growerMinDeltaCm) {
      classification = "grower";
      rationale = `Average length change is ${deltaLen.toFixed(2)} cm, which is ≥ ${growerMinDeltaCm.toFixed(
        2,
      )} cm.`;
    } else {
      classification = "hybrid";
      rationale = `Average length change is ${deltaLen.toFixed(
        2,
      )} cm, between ${showerMaxDeltaCm.toFixed(2)} and ${growerMinDeltaCm.toFixed(2)} cm.`;
    }
  }

  const insights: GrowersVsShowersSummary["insights"] = [];
  const byTime = groupByKey(scans, c =>
    c.timeOfDay && c.timeOfDay !== "unknown" ? c.timeOfDay : null,
  );
  if (byTime.length >= 2) {
    const top = byTime.slice(0, 3);
    insights.push({
      key: "timeOfDay",
      title: "Time-of-day patterns",
      description: `Most logged times: ${top
        .map(t => `${t.key} (n=${t.n})`)
        .join(", ")}. Add more entries to strengthen comparisons.`,
      sampleSize: top.reduce((a, t) => a + t.n, 0),
    });
  }

  const byMethod = groupByKey(scans, c => (c.method && c.method !== "unknown" ? c.method : null));
  if (byMethod.length >= 2) {
    const top = byMethod.slice(0, 2);
    insights.push({
      key: "method",
      title: "Method consistency",
      description: `Tracked methods: ${top.map(t => `${t.key} (n=${t.n})`).join(", ")}. Consistent method improves signal.`,
      sampleSize: top.reduce((a, t) => a + t.n, 0),
    });
  }

  return {
    classification,
    rationale,
    sample: {
      flaccidCount: flaccid.length,
      erectCount: erect.length,
      pairedCount,
      totalScans: scans.length,
    },
    averages: {
      flaccidLengthCm: flaccidLen,
      flaccidGirthCm: flaccidGirth,
      erectLengthCm: erectLen,
      erectGirthCm: erectGirth,
    },
    deltas: {
      lengthCm: deltaLen,
      lengthPercent: safePercent(deltaLen, flaccidLen),
      girthCm: deltaGirth,
      girthPercent: safePercent(deltaGirth, flaccidGirth),
    },
    thresholds: { showerMaxDeltaCm, growerMinDeltaCm },
    insights,
    warnings,
  };
}
