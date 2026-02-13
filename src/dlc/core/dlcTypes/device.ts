export type DevicePlatform = "android" | "ios" | "web";

export type AgeVerification = {
  id: string;
  userId: string;

  verifiedAt: Date;
  expiresAt?: Date;

  verificationMethod: string;
  declaredAge?: number;

  termsAccepted: boolean;
  termsAcceptedAt?: Date;
  termsVersion?: string;

  adultContentConsent: boolean;

  ipAddress?: string;
  userAgent?: string;
};

export type AppUpdateSource = {
  id?: string;
  userId: string;
  deviceId: string;
  originalInstallSource?: "google_play" | "app_store" | "website" | "direct";
  currentUpdateSource: "store" | "website";
  sourceChangedAt?: Date;
  sourceChangeReason?: string;
  updateSourceAcknowledged: boolean;
  acknowledgedAt?: Date;
};

