// ============================================
// Age Verification Types
// ============================================

export type AgeVerificationMethod = "self_declared" | "id_check" | "credit_card";

export interface AgeVerification {
  id: string;
  userId: string;
  verifiedAt: Date;
  verificationMethod: AgeVerificationMethod;
  declaredAge?: number;
  dateOfBirth?: Date;
  isVerified: boolean;
  termsAccepted: boolean;
  termsAcceptedAt?: Date;
  termsVersion?: string;
  adultContentConsent: boolean;
  ipAddress?: string;
  userAgent?: string;
  countryCode?: string;
}
