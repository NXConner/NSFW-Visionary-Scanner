export type DLCLicenseType = "one_time" | "subscription" | "gift" | "promo";

export type DLCLicense = {
  id: string;
  userId: string;
  packageId: string;

  licenseKey: string;
  licenseType: DLCLicenseType;

  purchaseDate: Date;
  purchasePrice?: number;
  purchaseCurrency?: string;
  paymentProvider?: string;
  paymentId?: string;

  subscriptionStatus?: string;
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  subscriptionPauseUntil?: Date;
  autoRenew?: boolean;

  isActive: boolean;
  activatedAt?: Date;
  deactivatedAt?: Date;

  maxDevices?: number;

  offlineCacheExpiresAt?: Date;
  lastOnlineValidation?: Date;
  gracePeriodUntil?: Date;

  refundedAt?: Date;
  refundReason?: string;

  createdAt: Date;
  updatedAt: Date;
};

export type LicenseValidationResult = {
  isValid: boolean;
  license?: DLCLicense;
  /** String code used for UI messaging and telemetry */
  error?: string;
  deviceAuthorized: boolean;
  expiresAt?: Date;
  offlineValidUntil?: Date;
};

