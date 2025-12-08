-- Migration: Advanced Security & Privacy Enhancements
-- Creates tables for 2FA, biometric auth, session management, device management, security alerts, E2E encryption, and privacy controls

-- Two-Factor Authentication
CREATE TABLE IF NOT EXISTS two_factor_authentication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 2FA method
  method TEXT NOT NULL CHECK (method IN ('totp', 'sms', 'email', 'backup_codes')),
  
  -- TOTP
  totp_secret_encrypted TEXT,
  totp_backup_codes_encrypted TEXT[],
  
  -- SMS/Email
  phone_number_encrypted TEXT,
  email_address TEXT,
  
  -- Status
  is_enabled BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- Recovery
  recovery_codes_encrypted TEXT[],
  recovery_codes_used TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, method)
);

-- Biometric Authentication
CREATE TABLE IF NOT EXISTS biometric_authentication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Biometric type
  biometric_type TEXT NOT NULL CHECK (biometric_type IN ('fingerprint', 'face_id', 'touch_id', 'iris', 'voice')),
  
  -- Device
  device_id TEXT NOT NULL,
  device_name TEXT,
  
  -- Status
  is_enabled BOOLEAN DEFAULT false,
  is_registered BOOLEAN DEFAULT false,
  registered_at TIMESTAMPTZ,
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, device_id, biometric_type)
);

-- Active Sessions
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session details
  session_token_hash TEXT NOT NULL UNIQUE,
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'wearable', 'other')),
  platform TEXT,
  browser TEXT,
  
  -- Location
  ip_address INET,
  location_country TEXT,
  location_city TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_current_session BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

-- Device Management
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Device details
  device_name TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'wearable', 'other')),
  device_identifier TEXT NOT NULL UNIQUE,
  platform TEXT,
  os_version TEXT,
  app_version TEXT,
  
  -- Trust
  is_trusted BOOLEAN DEFAULT false,
  trusted_at TIMESTAMPTZ,
  trust_level TEXT DEFAULT 'unknown' CHECK (trust_level IN ('unknown', 'low', 'medium', 'high', 'verified')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Security
  has_biometric BOOLEAN DEFAULT false,
  has_pin BOOLEAN DEFAULT false,
  encryption_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Alerts
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('login_attempt', 'password_change', 'device_added', 'suspicious_activity', 'data_export', 'permission_change', 'other')),
  alert_severity TEXT DEFAULT 'medium' CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')),
  alert_title TEXT NOT NULL,
  alert_message TEXT NOT NULL,
  
  -- Context
  ip_address INET,
  device_id UUID REFERENCES user_devices(id),
  location_country TEXT,
  location_city TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  
  -- Action
  action_taken TEXT,
  action_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login History
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Login details
  login_method TEXT NOT NULL CHECK (login_method IN ('password', 'biometric', '2fa', 'oauth', 'magic_link')),
  login_status TEXT NOT NULL CHECK (login_status IN ('success', 'failed', 'blocked')),
  
  -- Device & Location
  device_id UUID REFERENCES user_devices(id),
  ip_address INET,
  user_agent TEXT,
  location_country TEXT,
  location_city TEXT,
  
  -- Security
  is_suspicious BOOLEAN DEFAULT false,
  suspicious_reasons TEXT[],
  
  -- Failure details
  failure_reason TEXT,
  
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- End-to-End Encryption Keys
CREATE TABLE IF NOT EXISTS e2e_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Key details
  key_type TEXT NOT NULL CHECK (key_type IN ('master_key', 'data_key', 'recovery_key')),
  key_encrypted TEXT NOT NULL, -- Encrypted with user's password
  key_hash TEXT NOT NULL UNIQUE,
  
  -- Key metadata
  key_version INTEGER DEFAULT 1,
  algorithm TEXT DEFAULT 'AES-256-GCM',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_recovery BOOLEAN DEFAULT false,
  
  -- Usage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ
);

-- Privacy Controls
CREATE TABLE IF NOT EXISTS privacy_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Data sharing
  share_analytics BOOLEAN DEFAULT false,
  share_usage_data BOOLEAN DEFAULT false,
  share_location_data BOOLEAN DEFAULT false,
  
  -- Anonymization
  anonymize_data BOOLEAN DEFAULT false,
  anonymization_level TEXT DEFAULT 'none' CHECK (anonymization_level IN ('none', 'partial', 'full')),
  
  -- Data retention
  auto_delete_enabled BOOLEAN DEFAULT false,
  retention_period_days INTEGER,
  
  -- Visibility
  profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  show_in_search BOOLEAN DEFAULT false,
  
  -- GDPR
  gdpr_consent_given BOOLEAN DEFAULT false,
  gdpr_consent_date DATE,
  data_processing_consent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Privacy Audit Log
CREATE TABLE IF NOT EXISTS privacy_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action
  action_type TEXT NOT NULL CHECK (action_type IN ('data_access', 'data_export', 'data_deletion', 'consent_change', 'privacy_setting_change', 'data_anonymization')),
  action_description TEXT NOT NULL,
  
  -- Data involved
  data_types TEXT[],
  data_count INTEGER,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Result
  action_result TEXT CHECK (action_result IN ('success', 'failure', 'partial')),
  
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_two_factor_authentication_user_id ON two_factor_authentication(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_authentication_user_id ON biometric_authentication(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_active ON active_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_identifier ON user_devices(device_identifier);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_read ON security_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_logged_at ON login_history(logged_at);
CREATE INDEX IF NOT EXISTS idx_e2e_encryption_keys_user_id ON e2e_encryption_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_controls_user_id ON privacy_controls(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_user_id ON privacy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_performed_at ON privacy_audit_log(performed_at);

-- RLS Policies
ALTER TABLE two_factor_authentication ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_authentication ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2e_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;

-- Two-Factor Authentication: Users can view their own
CREATE POLICY "Users can manage own 2FA"
  ON two_factor_authentication FOR ALL
  USING (auth.uid() = user_id);

-- Biometric Authentication: Users can view their own
CREATE POLICY "Users can manage own biometric auth"
  ON biometric_authentication FOR ALL
  USING (auth.uid() = user_id);

-- Active Sessions: Users can view their own
CREATE POLICY "Users can manage own sessions"
  ON active_sessions FOR ALL
  USING (auth.uid() = user_id);

-- User Devices: Users can view their own
CREATE POLICY "Users can manage own devices"
  ON user_devices FOR ALL
  USING (auth.uid() = user_id);

-- Security Alerts: Users can view their own
CREATE POLICY "Users can manage own security alerts"
  ON security_alerts FOR ALL
  USING (auth.uid() = user_id);

-- Login History: Users can view their own
CREATE POLICY "Users can view own login history"
  ON login_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create login history"
  ON login_history FOR INSERT
  WITH CHECK (true);

-- E2E Encryption Keys: Users can view their own
CREATE POLICY "Users can manage own encryption keys"
  ON e2e_encryption_keys FOR ALL
  USING (auth.uid() = user_id);

-- Privacy Controls: Users can view their own
CREATE POLICY "Users can manage own privacy controls"
  ON privacy_controls FOR ALL
  USING (auth.uid() = user_id);

-- Privacy Audit Log: Users can view their own
CREATE POLICY "Users can view own privacy audit log"
  ON privacy_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create privacy audit log"
  ON privacy_audit_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

