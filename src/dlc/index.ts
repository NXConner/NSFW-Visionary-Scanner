/**
 * DLC System
 * Main entry point for the DLC add-on system
 */

// Core
export * from "./core";

// Context
export * from "./context";

// Hooks
export * from "./hooks";

// Components
export * from "./components";

// Modules
export * from "./modules";

// Security
export * from "./security";

// Re-export key items for convenience
export { DLCProvider, useDLC } from "./context/DLCContext";
export { dlcManager } from "./core/DLCManager";
export { dlcRegistry, DLC_PACKAGES } from "./core/DLCRegistry";
export { dlcContentLoader } from "./core/ContentLoader";
export { downloadManager } from "./core/DownloadManager";
export { DLCStore, LockedFeature, FeatureGate, LicenseActivation } from "./components";
export { PositionsGallery, AIIntimacyChat } from "./modules";
export { contentEncryption, integrityChecker, secureDownloader } from "./security";
export { useDLCStore, useDLCDownload } from "./hooks";
