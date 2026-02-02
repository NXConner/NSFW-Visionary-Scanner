import { DEFAULT_ADVANCED_NSFW_DETECTION_POLICY, type AdvancedNsfwDetectionPolicy } from "../types";

const KEY = "morphoscan_nsfw_advanced_detection_policy_v1";

function clamp01(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function safeParse(raw: string | null): AdvancedNsfwDetectionPolicy | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<AdvancedNsfwDetectionPolicy>;
    if (!v || typeof v !== "object") return null;
    const next: AdvancedNsfwDetectionPolicy = {
      ...DEFAULT_ADVANCED_NSFW_DETECTION_POLICY,
      ...v,
    };
    next.enabled = Boolean(next.enabled);
    next.storeDetectionHistory = Boolean((next as any).storeDetectionHistory);
    next.showDetailedBreakdown = Boolean((next as any).showDetailedBreakdown);
    next.enableComparisonMode = Boolean((next as any).enableComparisonMode);
    next.confidenceThreshold = clamp01(
      (next as any).confidenceThreshold,
      DEFAULT_ADVANCED_NSFW_DETECTION_POLICY.confidenceThreshold,
    );
    return next;
  } catch {
    return null;
  }
}

export function readAdvancedNsfwDetectionPolicy(): AdvancedNsfwDetectionPolicy {
  try {
    if (typeof window === "undefined") return DEFAULT_ADVANCED_NSFW_DETECTION_POLICY;
    return safeParse(window.localStorage.getItem(KEY)) ?? DEFAULT_ADVANCED_NSFW_DETECTION_POLICY;
  } catch {
    return DEFAULT_ADVANCED_NSFW_DETECTION_POLICY;
  }
}

export function writeAdvancedNsfwDetectionPolicy(next: AdvancedNsfwDetectionPolicy): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("nsfw-advanced-detection-policy-changed"));
  } catch {
    // ignore
  }
}
