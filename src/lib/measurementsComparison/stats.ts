import type { MeasurementPoint, MeasurementSummary } from "./types";

function mean(values: number[]): number | null {
  const finite = values.filter(v => Number.isFinite(v));
  if (finite.length === 0) return null;
  return finite.reduce((a, b) => a + b, 0) / finite.length;
}

export function summarize(points: MeasurementPoint[]): MeasurementSummary {
  const lengths = points.map(p => p.lengthCm).filter(n => n > 0);
  const girths = points.map(p => p.girthCm).filter(n => n > 0);
  return {
    avgLengthCm: mean(lengths),
    avgGirthCm: mean(girths),
    sampleSize: Math.max(lengths.length, girths.length, points.length),
  };
}

export function deltaVsAverage(
  value: number,
  avg: number | null,
): { absolute: number | null; percent: number | null } {
  if (!Number.isFinite(value) || avg == null || !Number.isFinite(avg) || avg === 0) {
    return { absolute: null, percent: null };
  }
  const absolute = value - avg;
  const percent = (absolute / avg) * 100;
  return { absolute, percent };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
