import type { UnitSystem } from "./types";

export function cmToIn(cm: number): number {
  return cm / 2.54;
}

export function inToCm(inches: number): number {
  return inches * 2.54;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatLength(cm: number, unit: UnitSystem): string {
  if (!Number.isFinite(cm)) return "—";
  if (unit === "imperial") return `${round1(cmToIn(cm))} in`;
  if (unit === "metric") return `${round1(cm)} cm`;
  return `${round1(cm)} cm (${round1(cmToIn(cm))} in)`;
}

export function formatLengthDual(cm: number): string {
  return formatLength(cm, "dual");
}

export function formatLengthShort(cm: number, unit: UnitSystem): string {
  if (!Number.isFinite(cm)) return "—";
  if (unit === "imperial") return `${round1(cmToIn(cm))}`;
  if (unit === "metric") return `${round1(cm)}`;
  return `${round1(cm)} / ${round1(cmToIn(cm))}`;
}

export function readOptionalNumberEnv(key: string): number | null {
  // Vite's ImportMetaEnv is string-indexable at runtime; keep it typed safely.
  const env = import.meta.env as ImportMetaEnv & Record<string, string | undefined>;
  const raw: unknown = env[key];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
