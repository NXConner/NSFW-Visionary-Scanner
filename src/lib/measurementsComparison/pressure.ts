import type { PressureUnitSystem } from "./types";
import { round1 } from "./units";

// Vacuum pump pressure is commonly displayed as inches of mercury (inHg) or kilopascals (kPa).
// 1 inHg = 3.386389 kPa
const INHG_TO_KPA = 3.386389;

export function inHgToKpa(inHg: number): number {
  return inHg * INHG_TO_KPA;
}

export function kpaToInHg(kpa: number): number {
  return kpa / INHG_TO_KPA;
}

export function formatPressureFromInHg(inHg: number, unit: PressureUnitSystem): string {
  if (!Number.isFinite(inHg)) return "—";
  if (unit === "imperial") return `${round1(inHg)} inHg`;
  if (unit === "metric") return `${round1(inHgToKpa(inHg))} kPa`;
  return `${round1(inHg)} inHg (${round1(inHgToKpa(inHg))} kPa)`;
}

export function formatPressureRangeFromInHg(
  minInHg: number,
  maxInHg: number,
  unit: PressureUnitSystem,
): string {
  if (!Number.isFinite(minInHg) || !Number.isFinite(maxInHg)) return "—";
  const min = Math.min(minInHg, maxInHg);
  const max = Math.max(minInHg, maxInHg);
  if (unit === "imperial") return `${round1(min)}–${round1(max)} inHg`;
  if (unit === "metric") return `${round1(inHgToKpa(min))}–${round1(inHgToKpa(max))} kPa`;
  return `${round1(min)}–${round1(max)} inHg (${round1(inHgToKpa(min))}–${round1(inHgToKpa(max))} kPa)`;
}

/**
 * Parses simple inHg strings like "2-3 inHg" or "5 inHg" and returns a dual/converted display.
 * If parsing fails, returns the original string.
 */
export function formatPressureTextInHg(input: string, unit: PressureUnitSystem): string {
  const raw = (input || "").trim();
  if (!raw) return raw;
  const cleaned = raw.replace(/\s+/g, " ").toLowerCase();
  if (!cleaned.includes("inhg") && !cleaned.includes("in hg")) return raw;

  const nums = cleaned
    .replace("in hg", "inhg")
    .replace("inhg", "")
    .trim()
    .match(/-?\d+(\.\d+)?/g);

  if (!nums || nums.length === 0) return raw;
  const a = Number(nums[0]);
  const b = nums.length > 1 ? Number(nums[1]) : a;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return raw;

  if (nums.length > 1) return formatPressureRangeFromInHg(a, b, unit);
  return formatPressureFromInHg(a, unit);
}
