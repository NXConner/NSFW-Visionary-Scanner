export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function roundTo(n: number, decimals: number): number {
  const d = Math.pow(10, Math.max(0, Math.min(6, decimals)));
  return Math.round(n * d) / d;
}

export function formatTimecode(seconds: number): string {
  const s = Math.max(0, Number(seconds || 0));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const ms = Math.floor((s - Math.floor(s)) * 1000);

  const base =
    hh > 0
      ? `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
      : `${mm}:${String(ss).padStart(2, "0")}`;

  return `${base}.${String(ms).padStart(3, "0")}`;
}
