/**
 * DLC Modules Index
 * Central registry of all DLC modules
 */

import type { DLCModule } from "../core/types";

// Export module components
export { PositionsGallery } from "./PositionsGallery";
export { AIIntimacyChat } from "./AIIntimacyChat";

// Export module manifests (real definitions live in dedicated folders)
export { PositionsModule } from "./positions";
export { VideosModule } from "./videos";
export { AnalyticsModule } from "./analytics";
export { CommunityModule } from "./community";
export { AdvancedModule } from "./advanced";

import { PositionsModule } from "./positions";
import { VideosModule } from "./videos";
import { AnalyticsModule } from "./analytics";
import { CommunityModule } from "./community";
import { AdvancedModule } from "./advanced";

// All available modules
export const DLC_MODULES: Record<string, DLCModule> = {
  positions: PositionsModule,
  videos: VideosModule,
  analytics: AnalyticsModule,
  community: CommunityModule,
  advanced: AdvancedModule,
};

/**
 * Allow runtime registration of DLC modules (used by addon system).
 * Idempotent: existing keys are not overwritten.
 */
export function registerDlcModules(modules: Record<string, DLCModule>): void {
  for (const [key, mod] of Object.entries(modules || {})) {
    const id = String(mod?.id || key).trim();
    if (!id) continue;
    if (DLC_MODULES[id]) continue;
    DLC_MODULES[id] = mod;
  }
}

// Module to package mapping
export const MODULE_PACKAGE_MAP: Record<string, string[]> = {
  "dlc-positions": ["positions"],
  "dlc-videos": ["videos"],
  "dlc-intimate": ["positions", "analytics"],
  // Standalone packages (newer catalogs / NSFW add-ons showcase)
  "dlc-analytics": ["analytics"],
  "dlc-creator": ["videos", "community"],
  "dlc-community": ["community"],
  "dlc-advanced": ["positions", "videos", "advanced"],
  "dlc-complete": ["positions", "videos", "analytics", "community", "advanced"],
  "dlc-subscription": ["positions", "videos", "analytics", "community", "advanced"],
};

/**
 * Get modules included in a package
 */
export function getModulesForPackage(packageId: string): DLCModule[] {
  const moduleIds = MODULE_PACKAGE_MAP[packageId] || [];
  return moduleIds.map(id => DLC_MODULES[id]).filter(Boolean);
}

/**
 * Get all feature IDs from modules
 */
export function getAllModuleFeatures(): string[] {
  const features: string[] = [];

  Object.values(DLC_MODULES).forEach(module => {
    module.features.forEach(feature => {
      if (!features.includes(feature)) {
        features.push(feature);
      }
    });
  });

  return features;
}

/**
 * Get module by feature ID
 */
export function getModuleByFeature(featureId: string): DLCModule | undefined {
  return Object.values(DLC_MODULES).find(module => module.features.includes(featureId));
}

/**
 * Get navigation items for installed packages
 */
export function getNavigationItems(installedPackageIds: string[]): DLCModule["navigationItems"] {
  const items: DLCModule["navigationItems"] = [];
  const addedModules = new Set<string>();

  installedPackageIds.forEach(packageId => {
    const modules = getModulesForPackage(packageId);
    modules.forEach(module => {
      if (!addedModules.has(module.id)) {
        items.push(...module.navigationItems);
        addedModules.add(module.id);
      }
    });
  });

  return items.sort((a, b) => a.order - b.order);
}

/**
 * Get routes for installed packages
 */
export function getRoutes(installedPackageIds: string[]): DLCModule["routes"] {
  const routes: DLCModule["routes"] = [];
  const addedModules = new Set<string>();

  installedPackageIds.forEach(packageId => {
    const modules = getModulesForPackage(packageId);
    modules.forEach(module => {
      if (!addedModules.has(module.id)) {
        routes.push(...module.routes);
        addedModules.add(module.id);
      }
    });
  });

  return routes;
}
