// ============================================
// Error Types
// ============================================

export class DLCError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DLCError";
  }
}

export type DLCErrorCode =
  | "PACKAGE_NOT_FOUND"
  | "LICENSE_INVALID"
  | "LICENSE_EXPIRED"
  | "DEVICE_NOT_AUTHORIZED"
  | "DOWNLOAD_FAILED"
  | "INSTALL_FAILED"
  | "INTEGRITY_CHECK_FAILED"
  | "DECRYPTION_FAILED"
  | "NETWORK_ERROR"
  | "STORAGE_FULL"
  | "VERSION_INCOMPATIBLE"
  | "AGE_VERIFICATION_REQUIRED"
  | "PURCHASE_FAILED"
  | "PROMO_CODE_INVALID"
  | "GIFT_CODE_INVALID";
