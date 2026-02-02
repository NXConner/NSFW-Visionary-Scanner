export type JsonObject = Record<string, unknown>;

export interface TwoFactorAuthentication {
  id: string;
  user_id: string;
  method: "totp" | "sms" | "email" | "backup_codes";
  totp_secret_encrypted: string | null;
  totp_backup_codes_encrypted: string[] | null;
  phone_number_encrypted: string | null;
  email_address: string | null;
  is_enabled: boolean;
  is_verified: boolean;
  verified_at: string | null;
  recovery_codes_encrypted: string[] | null;
  recovery_codes_used: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface TwoFactorSetupResult {
  qr_code?: string;
  secret?: string;
  backup_codes?: string[];
  recovery_codes?: string[];
}

export interface ActiveSession {
  id: string;
  user_id: string;
  session_token_hash: string;
  device_name: string | null;
  device_type: string | null;
  platform: string | null;
  browser: string | null;
  ip_address: string | null;
  location_city: string | null;
  location_country: string | null;
  is_active: boolean;
  is_current_session: boolean;
  last_activity_at: string;
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface SecurityAlert {
  id: string;
  user_id: string;
  alert_type:
    | "login_attempt"
    | "password_change"
    | "device_added"
    | "suspicious_activity"
    | "data_export"
    | "permission_change"
    | "other";
  alert_severity: "low" | "medium" | "high" | "critical";
  alert_title: string;
  alert_message: string;
  details: JsonObject | null;
  is_read: boolean;
  created_at: string;
}

export interface PrivacyControls {
  id: string;
  user_id: string;
  share_analytics: boolean;
  share_usage_data: boolean;
  share_location_data: boolean;
  anonymize_data: boolean;
  profile_visibility: "private" | "friends" | "public";
  created_at: string;
  updated_at: string;
}

export interface LoginHistory {
  id: string;
  user_id: string;
  login_method: "password" | "biometric" | "2fa" | "oauth" | "magic_link";
  login_status: "success" | "failed" | "blocked";
  location_city: string | null;
  location_country: string | null;
  is_suspicious: boolean;
  failure_reason: string | null;
  logged_at: string;
}
