import { DEFAULT_NSFW_SCANNER_POLICY, type NsfwScannerPolicy } from "../scanner/types";

const KEY = "morphoscan_nsfw_scanner_policy_v1";

function safeParse(raw: string | null): NsfwScannerPolicy | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<NsfwScannerPolicy>;
    if (!v || typeof v !== "object") return null;
    const next: NsfwScannerPolicy = {
      ...DEFAULT_NSFW_SCANNER_POLICY,
      ...v,
    };
    // clamp
    next.explicitThreshold = Math.max(0.5, Math.min(0.99, Number(next.explicitThreshold) || 0.7));
    next.suggestiveThreshold = Math.max(
      0.5,
      Math.min(0.99, Number(next.suggestiveThreshold) || 0.7),
    );
    next.enabled = Boolean(next.enabled);
    next.allowExplicit = Boolean(next.allowExplicit);
    next.enableOnDeviceDetection = Boolean(next.enableOnDeviceDetection);
    next.storeClassificationMetadata = Boolean((next as any).storeClassificationMetadata);
    return next;
  } catch {
    return null;
  }
}

export function readNsfwScannerPolicy(): NsfwScannerPolicy {
  try {
    if (typeof window === "undefined") return DEFAULT_NSFW_SCANNER_POLICY;
    return safeParse(window.localStorage.getItem(KEY)) ?? DEFAULT_NSFW_SCANNER_POLICY;
  } catch {
    return DEFAULT_NSFW_SCANNER_POLICY;
  }
}

export function writeNsfwScannerPolicy(next: NsfwScannerPolicy): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("nsfw-scanner-policy-changed"));
  } catch {
    // ignore
  }
}
