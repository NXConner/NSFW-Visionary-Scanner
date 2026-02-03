import type { ComponentType } from "react";

export type DLCFeatureCategory =
  | "positions"
  | "videos"
  | "analytics"
  | "community"
  | "advanced"
  | "topics"
  | "marketplace"
  | "other";

export type DLCFeature = {
  id: string;
  name: string;
  description?: string;
  category: DLCFeatureCategory;
  icon?: string;
  tags?: string[];
};

export type DLCPackageType = "individual" | "bundle" | "subscription";
export type DLCPriceType = "one-time" | "one_time" | "subscription" | "free";

export type DLCPackage = {
  id?: string;
  packageId: string;
  packageName: string;
  safeDescription: string;
  fullDescription?: string;
  marketingTagline?: string;
  contentRating?: string;
  version: string;
  contentVersion?: string;
  minAppVersion?: string;
  priceUsd: number;
  currency: string;
  priceType: DLCPriceType;
  subscriptionInterval?: string;
  packageType: DLCPackageType;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  requiresBasePack: boolean;
  basePackId?: string | null;
  previewImages?: string[];
  previewVideoUrl?: string | null;
  tags?: string[];
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  regionalPricing?: Record<string, number>;
  includedPackages?: string[];
  features: DLCFeature[];
  downloadUrl?: string | null;
  checksum?: string | null;
  downloadSizeBytes?: number | null;
  releaseDate?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type DLCLicense = {
  id: string;
  userId: string;
  packageId?: string | null;
  licenseKey: string;
  purchaseDate?: string | null;
  expirationDate?: string | null;
  subscriptionEnd?: string | null;
  deviceId?: string | null;
  contentVersion?: string | null;
  signature?: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type DLCInstallation = {
  packageId: string;
  installedVersion: string;
  installedAt?: string | null;
  fileSizeBytes?: number | null;
  checksum?: string | null;
  isValid?: boolean | null;
};

export type DownloadStatus =
  | "pending"
  | "downloading"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type DownloadProgress = {
  packageId: string;
  status: DownloadStatus;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  speedBps: number;
  estimatedTimeRemaining: number;
  error?: string;
  startedAt?: number;
  updatedAt?: number;
};

export type DLCUpdate = {
  packageId: string;
  version: string;
  updateType?: string | null;
  changelog?: string[] | null;
  isRequired?: boolean;
  releaseDate?: string | null;
  downloadUrl?: string | null;
  sizeBytes?: number | null;
};

export type LicenseValidationResult = {
  success: boolean;
  packageId?: string;
  error?: string;
  license?: DLCLicense;
};

export type DLCStoreState = {
  packages: DLCPackage[];
  ownedPackages: string[];
  installedPackages: string[];
  licenses: DLCLicense[];
  installations: DLCInstallation[];
};

export type DLCModuleRoute = {
  path: string;
  component: string;
  protected?: boolean;
};

export type DLCNavigationItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
  order: number;
};

export type DLCModule = {
  id: string;
  name: string;
  version: string;
  packageId: string;
  components: Record<string, ComponentType<any>>;
  routes: DLCModuleRoute[];
  navigationItems: DLCNavigationItem[];
  features: string[];
  onLoad?: () => Promise<void>;
  onUnload?: () => Promise<void>;
};
