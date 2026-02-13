// ============================================
// License Types
// ============================================

export type LicenseType = "one_time" | "subscription" | "gift" | "promo";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "paused";

export type DevicePlatform = "android" | "ios" | "web";

export interface DLCLicense {
  id: string;
  userId: string;
  packageId: string;

  // License Info
  licenseKey: string;
  licenseType: LicenseType;

  // Purchase Info
  purchaseDate: Date;
  purchasePrice?: number;
  purchaseCurrency: string;
  paymentProvider?: string;
  paymentId?: string;

  // Subscription Info
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  subscriptionPauseUntil?: Date;
  autoRenew: boolean;

  // Activation
  isActive: boolean;
  activatedAt?: Date;
  deactivatedAt?: Date;

  // Device Binding
  maxDevices: number;

  // Offline Support
  offlineCacheExpiresAt?: Date;
  lastOnlineValidation?: Date;
  gracePeriodUntil?: Date;

  // Refund
  refundedAt?: Date;
  refundReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface LicenseDevice {
  id: string;
  licenseId: string;
  deviceId: string;
  deviceFingerprint?: string;
  deviceName?: string;
  devicePlatform: DevicePlatform;
  deviceModel?: string;
  isPrimary: boolean;
  isActive: boolean;
  registeredAt: Date;
  lastUsedAt?: Date;
  lastValidationAt?: Date;
}

export type LicenseValidationError =
  | "license_not_found"
  | "license_expired"
  | "license_revoked"
  | "device_not_authorized"
  | "max_devices_reached"
  | "subscription_expired"
  | "subscription_cancelled"
  | "network_error"
  | "validation_failed";

export interface LicenseValidationResult {
  isValid: boolean;
  license?: DLCLicense;
  error?: LicenseValidationError;
  expiresAt?: Date;
  deviceAuthorized: boolean;
  contentKey?: string;
  checkAgainAt?: Date;
  offlineValidUntil?: Date;
}
