export type DLCErrorCode =
  | "license_not_found"
  | "license_revoked"
  | "subscription_expired"
  | "age_verification_required"
  | "device_not_authorized"
  | "network_error"
  | "unknown_error";

export type DLCError = {
  code: DLCErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

