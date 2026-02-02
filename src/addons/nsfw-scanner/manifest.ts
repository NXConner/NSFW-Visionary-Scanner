import type { AddonManifest } from "../types";
import { ADDON_MANIFEST_SCHEMA_VERSION } from "../compatibility";

export const NSFW_SCANNER_ADDON_ID = "nsfw-scanner";

export const manifest: AddonManifest = {
  id: NSFW_SCANNER_ADDON_ID,
  name: "NSFW Scanner DLC",
  manifestVersion: ADDON_MANIFEST_SCHEMA_VERSION,
  version: "1.0.0",
  minAppVersion: "0.9.0-beta.1",
  description:
    "Adult-only scanning mode with explicit-content detection controls and privacy-safe behavior. Disabled by default even when owned.",
  enabledByDefault: false,
  compatibility: {
    entries: [
      {
        minAppVersion: "0.9.0-beta.1",
        buildVariants: [
          {
            appVersion: "nsfw",
            distribution: "direct",
            allowAdultBundle: true,
          },
        ],
        status: "supported",
        notes: ["Requires direct NSFW build with adult bundle enabled."],
      },
    ],
    defaultStatus: "blocked",
    lastUpdated: "2026-02-02",
  },
  requirements: {
    requiresAgeVerification: true,
    requiredDlcFeatureIds: ["nsfw_scanner_mode"],
  },
};

