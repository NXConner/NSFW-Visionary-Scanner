// ============================================
// Update Types
// ============================================

import type { DLCPriceType } from "./package";

export type UpdateType = "patch" | "minor" | "major" | "content_add";
export type UpdatePolicy = "auto" | "notify" | "manual";

export interface DLCUpdate {
  packageId: string;
  currentVersion: string;
  latestVersion: string;
  updateType: UpdateType;
  updatePolicy: UpdatePolicy;
  changelog: string[];
  downloadSizeBytes: number;
  isRequired: boolean;
  releaseDate: Date;
}

export type UpdateSource = "store" | "website";

export interface AppUpdateSource {
  userId: string;
  deviceId: string;
  originalInstallSource: "google_play" | "app_store" | "website" | "direct";
  currentUpdateSource: UpdateSource;
  sourceChangedAt?: Date;
  sourceChangeReason?: string;
  currentAppVersion?: string;
  lastUpdateCheck?: Date;
  lastUpdateInstalled?: Date;
  availableUpdateVersion?: string;
  updateSourceAcknowledged: boolean;
  acknowledgedAt?: Date;
}

// ============================================
// Promo & Gift Types
// ============================================

export type DiscountType = "percentage" | "fixed" | "free";

export interface PromoCode {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  appliesTo: string[]; // package IDs or ['all']
  maxRedemptions?: number;
  currentRedemptions: number;
  maxPerUser: number;
  validFrom: Date;
  validUntil?: Date;
  affiliateId?: string;
  affiliateCommission?: number;
  isActive: boolean;
  campaignName?: string;
  createdAt: Date;
}

export interface GiftCode {
  id: string;
  code: string;
  packageId: string;
  purchasedBy?: string;
  purchasePrice?: number;
  purchasedAt: Date;
  redeemedBy?: string;
  redeemedAt?: Date;
  giftMessage?: string;
  recipientEmail?: string;
  expiresAt?: Date;
  isActive: boolean;
}

export interface PromoRedemption {
  id: string;
  promoCodeId: string;
  userId: string;
  packageId: string;
  originalPrice: number;
  discountApplied: number;
  finalPrice: number;
  redeemedAt: Date;
}

// ============================================
// Bundle Manifest Types
// ============================================

export interface DLCBundleManifest {
  id: string;
  name: string;
  version: string;
  contentVersion: string;

  description: {
    safe: string;
    full?: string;
  };

  includes: DLCBundleModule[];
  dependencies: string[];

  pricing: {
    type: DLCPriceType;
    price: number;
    currency: string;
  };

  requirements: {
    minAppVersion: string;
    maxAppVersion?: string;
    ageVerification: boolean;
  };

  distribution: {
    downloadSize: string;
    installSize: string;
    checksum: string;
  };
}

export interface DLCBundleModule {
  module: string;
  features: string[];
}
