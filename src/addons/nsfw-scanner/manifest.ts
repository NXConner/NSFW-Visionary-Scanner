import type { AddonManifest } from "../types";

export const NSFW_SCANNER_ADDON_ID = "nsfw-scanner";

export const manifest: AddonManifest = {
  id: NSFW_SCANNER_ADDON_ID,
  name: "NSFW Scanner DLC",
  version: "1.0.0",
  minAppVersion: "1.0.0",
  description:
    "Adult-only scanning mode with explicit-content detection controls and privacy-safe behavior. Disabled by default even when owned.",
  enabledByDefault: false,
  requirements: {
    requiresAgeVerification: true,
    requiredDlcFeatureIds: ["nsfw_scanner_mode"],
  },
};
