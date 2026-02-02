import type React from "react";

export type AddonId = string;

export type AddonRequirement = {
  /**
   * If true, the addon must be age-verified (18+) to be usable.
   * The project already has DLC age verification; we reuse that.
   */
  requiresAgeVerification?: boolean;

  /**
   * DLC feature IDs that must be available via the existing DLC entitlement system.
   * Example: ["video_library"] or ["topics_library"].
   */
  requiredDlcFeatureIds?: string[];
};

export interface AddonManifest {
  id: AddonId;
  name: string;
  version: string;
  /**
   * Minimum app version required for this addon (semantic version).
   * Used for compatibility checks and admin diagnostics.
   */
  minAppVersion?: string;
  description: string;
  enabledByDefault: boolean;
  requirements?: AddonRequirement;
}

export type AddonContributions = {
  /**
   * Optional settings UI injection. The Settings panel can render these when available.
   * Kept generic so each addon can decide how/where to render.
   */
  settingsCards?: React.ComponentType;
};

export interface AddonModule {
  manifest: AddonManifest;
  /**
   * Called once at app start to register contributions (DLC packages, modules, routes, etc.).
   * Must be idempotent.
   */
  register: (ctx: AddonRegisterContext) => Promise<AddonRegisterResult> | AddonRegisterResult;
}

export interface AddonRegisterContext {
  dlc: {
    registerPackages: (
      packages: Record<string, import("@/dlc/core/types").DLCPackage>,
    ) => void;
    registerManifests: (manifests: Record<string, import("@/dlc/core/dlcRegistryParts/manifests").DLCBundleManifest>) => void;
    registerModules: (modules: Record<string, import("@/dlc/core/types").DLCModule>) => void;
  };
}

export interface AddonRegisterResult {
  contributions?: AddonContributions;
}

