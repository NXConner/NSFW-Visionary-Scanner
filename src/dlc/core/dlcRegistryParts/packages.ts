import type { DLCPackage } from "../dlcTypes/package";

// Base packages - core functionality
const BASE_PACKAGES: Record<string, Omit<DLCPackage, "id" | "createdAt" | "updatedAt">> = {
  "base-scanner": {
    packageId: "base-scanner",
    packageName: "Base Scanner Package",
    packageType: "individual",
    safeDescription: "Core scanning functionality and measurement tools",
    fullDescription: "Essential scanning features for all users",
    priceUsd: 0,
    priceType: "one_time",
    version: "1.0.0",
    contentVersion: "1.0.0",
    isActive: true,
    isFeatured: false,
    displayOrder: 0,
    contentRating: "18+",
    features: [
      { id: "basic-scan", name: "Basic Scanning", description: "Core scanning functionality", category: "advanced" },
      { id: "measurements", name: "Measurement Tools", description: "Accurate measurement tools", category: "analytics" },
    ],
    previewImages: [],
  },
};

// Topic packages - specialized content
const TOPIC_PACKAGES: Record<string, Omit<DLCPackage, "id" | "createdAt" | "updatedAt">> = {
  "health-insights": {
    packageId: "health-insights",
    packageName: "Health Insights Pack",
    packageType: "individual",
    safeDescription: "Advanced health analysis and personalized recommendations",
    fullDescription: "Comprehensive health tracking and AI-powered insights",
    priceUsd: 4.99,
    priceType: "one_time",
    version: "1.0.0",
    contentVersion: "1.0.0",
    isActive: true,
    isFeatured: true,
    displayOrder: 1,
    contentRating: "18+",
    features: [
      { id: "health-trends", name: "Health Trends", description: "Track health trends over time", category: "analytics" },
      { id: "ai-analysis", name: "AI Analysis", description: "AI-powered health analysis", category: "advanced" },
    ],
    previewImages: [],
  },
};

// NSFW add-ons - content modules and educational packs
const NSFW_ADDON_PACKAGES: Record<string, Omit<DLCPackage, "id" | "createdAt" | "updatedAt">> = {
  "dlc-cock-worshiping": {
    packageId: "dlc-cock-worshiping",
    packageName: "Cock Worshiping (Education)",
    packageType: "individual",
    safeDescription: "Consent-first educational guide focused on communication and emotional safety.",
    fullDescription:
      "Educational module: consent, communication frameworks, boundaries, examples, and aftercare. Non-graphic by design.",
    marketingTagline: "Connection-first education",
    priceUsd: 2.99,
    priceType: "one_time",
    version: "1.0.0",
    contentVersion: "2025.12.28",
    minAppVersion: "1.0.0",
    isActive: true,
    isFeatured: false,
    displayOrder: 13,
    contentRating: "18+",
    features: [
      {
        id: "cock_worshiping_education",
        name: "Cock Worshiping (Education)",
        description: "Access the Cock Worshiping educational module",
        icon: "BookOpen",
        category: "topics",
      },
    ],
    previewImages: [],
  },
};

// Enabled additions - dynamically enabled packages
const ENABLED_PACKAGE_ADDITIONS: Record<string, Omit<DLCPackage, "id" | "createdAt" | "updatedAt">> = {};

export const DLC_PACKAGES: Record<string, Omit<DLCPackage, "id" | "createdAt" | "updatedAt">> = {
  ...BASE_PACKAGES,
  ...NSFW_ADDON_PACKAGES,
  ...ENABLED_PACKAGE_ADDITIONS,
  ...TOPIC_PACKAGES,
};
