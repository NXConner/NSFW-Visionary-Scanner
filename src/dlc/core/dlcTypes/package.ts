import type { DLCFeature } from "./feature";

export type DLCPackageType = "individual" | "bundle" | "subscription";

export type DLCPriceType = "one_time" | "subscription";

export type DLCSubscriptionInterval = "monthly" | "yearly";

export type DLCPackageContentRating = "18+" | "adult" | "mature" | "safe";

export type DLCContentChangelogEntry = {
  version: string;
  changes: string[];
  releasedAtIso?: string;
};

export type DLCPackage = {
  /** DB primary key (UUID) */
  id: string;

  /** Stable external identifier (e.g. "dlc-videos") */
  packageId: string;
  packageName: string;
  packageType: DLCPackageType;

  safeDescription: string;
  fullDescription?: string;
  marketingTagline?: string;

  priceUsd: number;
  priceType: DLCPriceType;
  subscriptionInterval?: DLCSubscriptionInterval;
  regionalPricing?: Record<string, number>;

  features: DLCFeature[];
  includedPackages?: string[];

  /** Optional distribution metadata (used for offline install flows) */
  downloadUrl?: string;
  downloadSizeBytes?: number;
  checksumSha256?: string;
  encryptionKeyId?: string;

  version: string;
  contentVersion?: string;
  minAppVersion?: string;
  maxAppVersion?: string;
  contentChangelog?: DLCContentChangelogEntry[];

  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  contentRating?: DLCPackageContentRating;

  previewImages?: string[];
  previewVideoUrl?: string;

  localizedNames?: Record<string, string>;
  localizedDescriptions?: Record<string, string>;

  stripeProductId?: string;
  stripePriceId?: string;

  createdAt: Date;
  updatedAt: Date;
};

