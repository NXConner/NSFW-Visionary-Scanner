export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const t = Math.max(0, Math.min(1, q)) * (sorted.length - 1);
  const i = Math.floor(t);
  const f = t - i;
  const a = sorted[i] ?? sorted[sorted.length - 1];
  const b = sorted[Math.min(sorted.length - 1, i + 1)] ?? a;
  return lerp(a, b, f);
}

