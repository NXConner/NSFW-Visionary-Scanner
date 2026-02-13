/**
 * Content Manifest - Single Point of Truth for Repo Differences
 * 
 * This file is the "Bridge" between SFW and NSFW variants.
 * Only this file (and buildFlags.ts) should differ between repositories.
 */

import { BUILD_APP_VERSION, BUILD_DISTRIBUTION_CHANNEL, BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";

export interface ContentManifest {
  version: "sfw" | "nsfw";
  distributionChannel: "store" | "direct";
  enabledScanners: string[];
  filterSensitivity: number;
  adultContentEnabled: boolean;
  apiEndpoints: Record<string, string>;
  features: {
    healthAnalysis: boolean;
    measurementTracking: boolean;
    aiEnhancedScanning: boolean;
    dlcStore: boolean;
    adultDlc: boolean;
    communityFeatures: boolean;
    expertConsultations: boolean;
  };
}

/**
 * Dynamic configuration based on build flags.
 * This automatically adapts to the build variant.
 */
export const APP_CONFIG: ContentManifest = {
  version: BUILD_APP_VERSION === "nsfw" ? "nsfw" : "sfw",
  distributionChannel: BUILD_DISTRIBUTION_CHANNEL === "store" ? "store" : "direct",
  
  enabledScanners: [
    "standard_vision",
    "curvature_analysis",
    "measurement_engine",
    "quality_assessment",
    ...(BUILD_ALLOW_ADULT_BUNDLE ? ["adult_content_scanner"] : []),
  ],
  
  filterSensitivity: BUILD_ALLOW_ADULT_BUNDLE ? 0.3 : 0.9,
  adultContentEnabled: BUILD_ALLOW_ADULT_BUNDLE,
  
  apiEndpoints: {
    scanner_v1: "/api/scanner/v1",
    ai_analysis: "/api/ai/analyze",
    measurements: "/api/measurements",
  },
  
  features: {
    healthAnalysis: true,
    measurementTracking: true,
    aiEnhancedScanning: true,
    dlcStore: true,
    adultDlc: BUILD_ALLOW_ADULT_BUNDLE,
    communityFeatures: BUILD_DISTRIBUTION_CHANNEL !== "store",
    expertConsultations: true,
  },
};

/**
 * Helper to check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof ContentManifest["features"]): boolean {
  return APP_CONFIG.features[feature] ?? false;
}

/**
 * Helper to check if a scanner is enabled
 */
export function isScannerEnabled(scannerId: string): boolean {
  return APP_CONFIG.enabledScanners.includes(scannerId);
}

/**
 * Get API endpoint URL
 */
export function getApiEndpoint(key: keyof typeof APP_CONFIG.apiEndpoints): string {
  return APP_CONFIG.apiEndpoints[key] ?? "";
}
