import type { AddonManifest } from "../types";
import { ADDON_MANIFEST_SCHEMA_VERSION } from "../compatibility";

export const NSFW_ADVANCED_DETECTION_ADDON_ID = "nsfw-advanced-detection";

export const manifest: AddonManifest = {
  id: NSFW_ADVANCED_DETECTION_ADDON_ID,
  name: "Advanced NSFW Detection DLC",
  manifestVersion: ADDON_MANIFEST_SCHEMA_VERSION,
  version: "1.0.0",
  minAppVersion: "0.9.0-beta.1",
  description:
    "Advanced NSFW detection modes: model selection, ensemble scoring, and opt-in detection history (no image content stored).",
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
    requiredDlcFeatureIds: ["advanced_nsfw_detection"],
  },
};
