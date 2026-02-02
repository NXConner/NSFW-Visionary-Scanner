export type HapticPatternName =
  | "focus_lock"
  | "object_detected"
  | "tracking_lost"
  | "capture"
  | "error";

export interface HapticOptions {
  enabled?: boolean;
}

const patterns: Record<HapticPatternName, number | number[]> = {
  focus_lock: 40,
  object_detected: [25, 40, 25],
  tracking_lost: [80, 60, 80],
  capture: [15, 20, 60],
  error: [40, 30, 40, 30, 80],
};

export function canHaptic(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

export function triggerHaptic(name: HapticPatternName, options: HapticOptions = {}): boolean {
  if (!options.enabled) return false;
  if (!canHaptic()) return false;
  try {
    return navigator.vibrate(patterns[name]);
  } catch {
    return false;
  }
}
