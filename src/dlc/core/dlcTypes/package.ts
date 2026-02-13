// ============================================
// Package Types
// ============================================

export type DLCPackageType = "individual" | "bundle" | "subscription";
export type DLCPriceType = "one_time" | "subscription";
export type SubscriptionInterval = "monthly" | "yearly";
export type ContentRating = "18+" | "adult" | "mature";

export interface DLCFeature {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: DLCFeatureCategory;
}

export type DLCFeatureCategory =
  | "positions"
  | "videos"
  | "analytics"
  | "community"
  | "advanced"
  | "topics"
  | "marketplace";

export interface ContentChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface DLCPackage {
  id: string;
  packageId: string;
  packageName: string;
  packageType: DLCPackageType;

  // Descriptions
  safeDescription: string;
  fullDescription?: string;
  marketingTagline?: string;

  // Pricing
  priceUsd: number;
  priceType: DLCPriceType;
  subscriptionInterval?: SubscriptionInterval;
  regionalPricing?: Record<string, number>;

  // Features
  features: DLCFeature[];
  includedPackages?: string[];

  // Distribution
  downloadUrl?: string;
  downloadSizeBytes?: number;
  checksumSha256?: string;
  encryptionKeyId?: string;

  // Versioning
  version: string;
  contentVersion: string;
  minAppVersion?: string;
  maxAppVersion?: string;
  contentChangelog?: ContentChangelogEntry[];

  // Status
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;

  // Metadata
  contentRating: ContentRating;
  previewImages?: string[];
  previewVideoUrl?: string;

  // Localization
  localizedNames?: Record<string, string>;
  localizedDescriptions?: Record<string, string>;

  createdAt: Date;
  updatedAt: Date;
}
