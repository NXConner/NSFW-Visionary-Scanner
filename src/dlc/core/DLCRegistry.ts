/**
 * DLC Registry
 * Manages the catalog of available DLC packages and bundles
 */

import type { DLCPackage, DLCBundleManifest, DLCFeature, DLCFeatureCategory } from "./types";
import { DLC_PACKAGES } from "./dlcRegistryParts/packages";
import { BUNDLE_MANIFESTS } from "./dlcRegistryParts/manifests";

export { DLC_PACKAGES, BUNDLE_MANIFESTS };

function newId(): string {
  try {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export class DLCRegistry {
  private packages: Map<string, DLCPackage> = new Map();
  private manifests: Map<string, DLCBundleManifest> = new Map();

  constructor() {
    this.initializePackages();
  }

  private initializePackages(): void {
    Object.entries(DLC_PACKAGES).forEach(([id, pkg]) => {
      this.packages.set(id, {
        ...pkg,
        id: newId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    Object.entries(BUNDLE_MANIFESTS).forEach(([id, manifest]) => {
      this.manifests.set(id, manifest);
    });
  }

  getAllPackages(): DLCPackage[] {
    return Array.from(this.packages.values())
      .filter(pkg => pkg.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Runtime registration (used by addon system).
   * Must be idempotent: repeated calls should not duplicate or throw.
   */
  registerPackages(packages: Record<string, DLCPackage>): void {
    for (const [key, pkg] of Object.entries(packages || {})) {
      const packageId = String(pkg?.packageId || key).trim();
      if (!packageId) continue;
      if (this.packages.has(packageId)) continue;
      this.packages.set(packageId, {
        ...pkg,
        id: pkg.id || newId(),
        createdAt: pkg.createdAt || new Date(),
        updatedAt: pkg.updatedAt || new Date(),
      });
    }
  }

  registerManifests(manifests: Record<string, DLCBundleManifest>): void {
    for (const [key, manifest] of Object.entries(manifests || {})) {
      const id = String((manifest as any)?.id || key).trim();
      if (!id) continue;
      if (this.manifests.has(id)) continue;
      this.manifests.set(id, manifest as DLCBundleManifest);
    }
  }

  getPackage(packageId: string): DLCPackage | undefined {
    return this.packages.get(packageId);
  }

  getFeaturedPackages(): DLCPackage[] {
    return this.getAllPackages().filter(pkg => pkg.isFeatured);
  }

  getIndividualPackages(): DLCPackage[] {
    return this.getAllPackages().filter(pkg => pkg.packageType === "individual");
  }

  getBundlePackages(): DLCPackage[] {
    return this.getAllPackages().filter(pkg => pkg.packageType === "bundle");
  }

  getSubscriptionPackages(): DLCPackage[] {
    return this.getAllPackages().filter(pkg => pkg.packageType === "subscription");
  }

  getManifest(packageId: string): DLCBundleManifest | undefined {
    return this.manifests.get(packageId);
  }

  getAllFeaturesForPackage(packageId: string): DLCFeature[] {
    const pkg = this.getPackage(packageId);
    if (!pkg) return [];

    const features = [...pkg.features];

    if (pkg.includedPackages) {
      pkg.includedPackages.forEach(includedId => {
        const includedPkg = this.getPackage(includedId);
        if (!includedPkg) return;
        includedPkg.features.forEach(feature => {
          if (!features.some(f => f.id === feature.id)) features.push(feature);
        });
      });
    }

    return features;
  }

  hasFeature(packageId: string, featureId: string): boolean {
    return this.getAllFeaturesForPackage(packageId).some(f => f.id === featureId);
  }

  getFeaturesByCategory(category: DLCFeatureCategory): DLCFeature[] {
    const allFeatures: DLCFeature[] = [];

    this.packages.forEach(pkg => {
      pkg.features.forEach(feature => {
        if (feature.category !== category) return;
        if (!allFeatures.some(f => f.id === feature.id)) allFeatures.push(feature);
      });
    });

    return allFeatures;
  }

  calculateUpgradePrice(targetPackageId: string, ownedPackageIds: string[]): number {
    const targetPkg = this.getPackage(targetPackageId);
    if (!targetPkg) return 0;

    const targetFeatureIds = new Set(this.getAllFeaturesForPackage(targetPackageId).map(f => f.id));

    const ownedValue = ownedPackageIds.reduce((acc, ownedId) => {
      const ownedPkg = this.getPackage(ownedId);
      if (!ownedPkg) return acc;

      const ownedFeatureIds = new Set(ownedPkg.features.map(f => f.id));
      const isSubset = [...ownedFeatureIds].every(id => targetFeatureIds.has(id));
      return isSubset ? acc + ownedPkg.priceUsd : acc;
    }, 0);

    return Math.max(0, targetPkg.priceUsd - ownedValue);
  }

  getLocalizedName(packageId: string, locale: string): string {
    const pkg = this.getPackage(packageId);
    if (!pkg) return "";
    return pkg.localizedNames?.[locale] || pkg.packageName;
  }

  getLocalizedDescription(packageId: string, locale: string): string {
    const pkg = this.getPackage(packageId);
    if (!pkg) return "";
    return pkg.localizedDescriptions?.[locale] || pkg.safeDescription;
  }

  getRegionalPrice(packageId: string, currency: string): number {
    const pkg = this.getPackage(packageId);
    if (!pkg) return 0;
    return pkg.regionalPricing?.[currency] || pkg.priceUsd;
  }
}

export const dlcRegistry = new DLCRegistry();
