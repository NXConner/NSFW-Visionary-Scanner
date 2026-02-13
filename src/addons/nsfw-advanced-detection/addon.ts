import type { AddonModule } from "../types";
import { manifest } from "./manifest";
import { AdvancedNsfwDetectionSettingsCard } from "./settings/AdvancedNsfwDetectionSettingsCard";

import type { DLCPackage } from "@/dlc/core/types";
import { ADVANCED_NSFW_DETECTION_FEATURES } from "@/dlc/core/dlcRegistryParts/features";

const PACKAGE_ID = "dlc-advanced-nsfw-detection";

function newId(): string {
  try {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function createPackage(): DLCPackage {
  return {
    id: newId(),
    packageId: PACKAGE_ID,
    packageName: "Advanced NSFW Detection Modes",
    packageType: "subscription",
    safeDescription: "Advanced detection, ensemble scoring, and detailed breakdowns (adult).",
    fullDescription:
      "Unlock advanced NSFW detection modes: configurable model selection, ensemble scoring, and opt-in detection history (no image content stored).",
    marketingTagline: "More control. More confidence.",
    priceUsd: 14.99,
    priceType: "subscription",
    subscriptionInterval: "monthly",
    regionalPricing: { EUR: 13.99, GBP: 12.99, CAD: 19.99 },
    features: ADVANCED_NSFW_DETECTION_FEATURES,
    version: "1.0.0",
    contentVersion: "2025.12.27",
    minAppVersion: "1.0.0",
    isActive: true,
    isFeatured: false,
    displayOrder: 12,
    contentRating: "18+",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const addon: AddonModule = {
  manifest,
  register: ({ dlc }) => {
    // Provide fallback catalog entry when DB-backed catalog is unavailable.
    dlc.registerPackages({ [PACKAGE_ID]: createPackage() });
    return { contributions: { settingsCards: AdvancedNsfwDetectionSettingsCard } };
  },
};

export default addon;
