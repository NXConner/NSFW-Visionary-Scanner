import type { DLCPackage, DLCFeature, DLCFeatureCategory } from "./types";
import type { DLCBundleManifest } from "./dlcRegistryParts/manifests";
import { DLC_MODULES, MODULE_PACKAGE_MAP } from "../modules";

type PackageMeta = {
  packageName: string;
  safeDescription: string;
  fullDescription?: string;
  packageType: DLCPackage["packageType"];
  priceType: DLCPackage["priceType"];
  contentRating?: string;
  isFeatured?: boolean;
  includedPackages?: string[];
  regionalPricing?: Record<string, number>;
};

const FEATURE_NAME_OVERRIDES: Record<string, string> = {
  positions_gallery: "Positions Gallery",
  position_details: "Position Details",
  position_favorites: "Favorites",
  position_filters: "Advanced Filters",
  position_playlists: "Playlists",
  video_library: "Video Library",
  video_lessons: "Video Lessons",
  wellness_analytics: "Wellness Analytics",
  private_forum: "Private Community",
  multi_camera: "Advanced Capture",
};

const PACKAGE_META: Record<string, PackageMeta> = {
  "dlc-positions": {
    packageName: "Positions Collection",
    safeDescription: "Unlock the curated positions library with guides, filters, and favorites.",
    packageType: "individual",
    priceType: "one-time",
    contentRating: "18+",
    isFeatured: true,
  },
  "dlc-videos": {
    packageName: "Video Library",
    safeDescription: "Premium instructional videos with safety guidance and progress tracking.",
    packageType: "individual",
    priceType: "one-time",
    contentRating: "18+",
  },
  "dlc-analytics": {
    packageName: "Wellness Analytics",
    safeDescription: "Advanced analytics dashboards and trend insights.",
    packageType: "individual",
    priceType: "one-time",
  },
  "dlc-community": {
    packageName: "Community",
    safeDescription: "Private community access with discussions and expert events.",
    packageType: "individual",
    priceType: "one-time",
  },
  "dlc-advanced": {
    packageName: "Advanced Toolkit",
    safeDescription: "Advanced modules and pro tools bundled together.",
    packageType: "bundle",
    priceType: "one-time",
    contentRating: "18+",
    isFeatured: true,
  },
  "dlc-intimate": {
    packageName: "Intimate Bundle",
    safeDescription: "A bundled experience with positions and analytics upgrades.",
    packageType: "bundle",
    priceType: "one-time",
    contentRating: "18+",
  },
  "dlc-creator": {
    packageName: "Creator Suite",
    safeDescription: "Video + community tools for creators and partners.",
    packageType: "bundle",
    priceType: "one-time",
  },
  "dlc-complete": {
    packageName: "Complete Bundle",
    safeDescription: "All DLC modules in one premium bundle.",
    packageType: "bundle",
    priceType: "one-time",
    contentRating: "18+",
    isFeatured: true,
  },
  "dlc-subscription": {
    packageName: "DLC Subscription",
    safeDescription: "Subscription access to all DLC modules with continuous updates.",
    packageType: "subscription",
    priceType: "subscription",
    contentRating: "18+",
    isFeatured: true,
  },
};

const PACKAGE_ORDER = Object.keys(MODULE_PACKAGE_MAP);

const featureNameFromId = (featureId: string): string => {
  const override = FEATURE_NAME_OVERRIDES[featureId];
  if (override) return override;
  return featureId
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const categoryFromModule = (moduleId: string): DLCFeatureCategory => {
  const allowed: DLCFeatureCategory[] = [
    "positions",
    "videos",
    "analytics",
    "community",
    "advanced",
    "topics",
    "marketplace",
  ];
  return allowed.includes(moduleId as DLCFeatureCategory)
    ? (moduleId as DLCFeatureCategory)
    : "other";
};

const buildFeaturesForPackage = (packageId: string): DLCFeature[] => {
  const moduleIds = MODULE_PACKAGE_MAP[packageId] || [];
  const features: DLCFeature[] = [];
  const seen = new Set<string>();

  moduleIds.forEach(moduleId => {
    const module = DLC_MODULES[moduleId];
    if (!module) return;
    const category = categoryFromModule(moduleId);
    module.features.forEach(featureId => {
      if (seen.has(featureId)) return;
      seen.add(featureId);
      features.push({
        id: featureId,
        name: featureNameFromId(featureId),
        category,
      });
    });
  });

  return features;
};

const buildPackage = (packageId: string, index: number): DLCPackage => {
  const meta = PACKAGE_META[packageId];
  const moduleIds = MODULE_PACKAGE_MAP[packageId] || [];
  const fallbackName = moduleIds.length
    ? DLC_MODULES[moduleIds[0]]?.name || packageId
    : packageId;
  return {
    packageId,
    packageName: meta?.packageName || fallbackName,
    safeDescription: meta?.safeDescription || "Premium DLC package.",
    fullDescription: meta?.fullDescription,
    contentRating: meta?.contentRating,
    version: "1.0.0",
    priceUsd: 0,
    currency: "USD",
    priceType: meta?.priceType || "one-time",
    packageType: meta?.packageType || "individual",
    isActive: true,
    isFeatured: Boolean(meta?.isFeatured),
    displayOrder: index,
    requiresBasePack: false,
    basePackId: null,
    features: buildFeaturesForPackage(packageId),
    includedPackages: meta?.includedPackages,
    regionalPricing: meta?.regionalPricing,
    tags: [],
  };
};

export const DLC_PACKAGES: DLCPackage[] = PACKAGE_ORDER.map(buildPackage);

class DLCRegistry {
  private packages = new Map<string, DLCPackage>(
    DLC_PACKAGES.map(pkg => [pkg.packageId, pkg] as const),
  );
  private bundleManifests = new Map<string, DLCBundleManifest>();

  getAllPackages(): DLCPackage[] {
    return Array.from(this.packages.values());
  }

  getPackage(packageId: string): DLCPackage | undefined {
    return this.packages.get(packageId);
  }

  getAllFeaturesForPackage(packageId: string): DLCFeature[] {
    return this.getPackage(packageId)?.features || [];
  }

  getRegionalPrice(packageId: string, currency: string): number {
    const pkg = this.getPackage(packageId);
    if (!pkg) return 0;
    const regional = pkg.regionalPricing?.[currency.toUpperCase()];
    return typeof regional === "number" ? regional : pkg.priceUsd;
  }

  registerPackages(packages: Record<string, DLCPackage>): void {
    Object.entries(packages || {}).forEach(([key, pkg]) => {
      const packageId = pkg.packageId || key;
      const existing = this.packages.get(packageId);
      this.packages.set(packageId, {
        ...(existing || {}),
        ...pkg,
        packageId,
      });
    });
  }

  registerManifests(manifests: Record<string, DLCBundleManifest>): void {
    Object.entries(manifests || {}).forEach(([key, manifest]) => {
      const id = manifest.id || key;
      this.bundleManifests.set(id, { ...manifest, id });
    });
  }

  getManifests(): DLCBundleManifest[] {
    return Array.from(this.bundleManifests.values());
  }
}

export const dlcRegistry = new DLCRegistry();
