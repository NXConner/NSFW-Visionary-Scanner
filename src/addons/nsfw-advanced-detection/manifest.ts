import type { AddonManifest } from "../types";

export const NSFW_ADVANCED_DETECTION_ADDON_ID = "nsfw-advanced-detection";

export const manifest: AddonManifest = {
  id: NSFW_ADVANCED_DETECTION_ADDON_ID,
  name: "Advanced NSFW Detection DLC",
  version: "1.0.0",
  minAppVersion: "1.0.0",
  description:
    "Advanced NSFW detection modes: model selection, ensemble scoring, and opt-in detection history (no image content stored).",
  enabledByDefault: false,
  requirements: {
    requiresAgeVerification: true,
    requiredDlcFeatureIds: ["advanced_nsfw_detection"],
  },
};
