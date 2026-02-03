import type { AddonManifest } from "./types";
import { manifest as nsfwScannerManifest } from "./nsfw-scanner/manifest";
import { manifest as advancedDetectionManifest } from "./nsfw-advanced-detection/manifest";

export const ADDON_MANIFESTS: AddonManifest[] = [
  nsfwScannerManifest,
  advancedDetectionManifest,
];

export function listAddonManifests(): AddonManifest[] {
  return [...ADDON_MANIFESTS];
}
