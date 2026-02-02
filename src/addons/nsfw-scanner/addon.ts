import type { AddonModule } from "../types";
import { manifest } from "./manifest";
import { NsfwScannerSettingsCard } from "./settings/NsfwScannerSettingsCard";

// DLC runtime objects (for addon registration)
import type { DLCPackage, DLCModule } from "@/dlc/core/types";

const NSFW_SCANNER_PACKAGE_ID = "dlc-nsfw-scanner";

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
    packageId: NSFW_SCANNER_PACKAGE_ID,
    packageName: "NSFW Scanner Mode",
    packageType: "individual",
    safeDescription: "Adult-only scanning mode with explicit-content detection controls.",
    fullDescription:
      "Unlocks NSFW Scanner Mode: on-device explicit-content detection controls, thresholds, and safety policy options. Disabled by default; you must enable it in Settings after age verification.",
    marketingTagline: "Adult-only scanning mode",
    priceUsd: 6.99,
    priceType: "one_time",
    regionalPricing: { EUR: 5.99, GBP: 5.49, CAD: 8.99 },
    features: [
      {
        id: "nsfw_scanner_mode",
        name: "NSFW Scanner Mode",
        description: "Enable adult-only scanning mode and policy controls",
        icon: "Shield",
        category: "advanced",
      },
      {
        id: "explicit_content_detection",
        name: "Explicit Content Detection",
        description: "On-device explicit content detection (TFJS/NSFWJS)",
        icon: "Eye",
        category: "advanced",
      },
    ],
    version: "1.0.0",
    contentVersion: "2025.12.27",
    minAppVersion: "1.0.0",
    isActive: true,
    isFeatured: false,
    displayOrder: 11,
    contentRating: "18+",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createModule(): DLCModule {
  return {
    id: "nsfw_scanner",
    name: "NSFW Scanner",
    version: "1.0.0",
    packageId: NSFW_SCANNER_PACKAGE_ID,
    components: {},
    routes: [],
    navigationItems: [],
    features: ["nsfw_scanner_mode", "explicit_content_detection"],
  };
}

const addon: AddonModule = {
  manifest,
  register: ({ dlc }) => {
    // Register DLC package/module so it participates in the existing entitlement system.
    // This is a fallback path when DB-backed dlc_packages is unavailable.
    dlc.registerPackages({ [NSFW_SCANNER_PACKAGE_ID]: createPackage() });
    dlc.registerModules({ nsfw_scanner: createModule() });
    return { contributions: { settingsCards: NsfwScannerSettingsCard } };
  },
};

export default addon;
