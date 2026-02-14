/**
 * DLC Core Module
 * Central exports for the DLC system
 */

// Types
export * from "./types";

// Core Classes
export { DLCManager, dlcManager } from "./dlcManager";
export { DLCRegistry, dlcRegistry, DLC_PACKAGES, BUNDLE_MANIFESTS } from "./DLCRegistry";
// NOTE: keep casing consistent for Linux/macOS (case-sensitive FS).
export { LicenseValidator, licenseValidator } from "./licenseValidator";
export { dlcContentLoader, dlcContentLoader as contentLoader } from "./ContentLoader";
export { downloadManager } from "./DownloadManager";

// Re-export commonly used types
export type {
  DLCPackage,
  DLCLicense,
  DLCInstallation,
  DLCFeature,
  DLCFeatureCategory,
  LicenseValidationResult,
  DownloadProgress,
  DLCUpdate,
  DLCStoreState,
  DevicePlatform,
  AgeVerification,
  PromoCode,
  GiftCode,
} from "./types";
