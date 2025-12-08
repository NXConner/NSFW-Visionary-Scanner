-- Migration: Enhanced Privacy Settings
-- Creates table for advanced privacy controls

CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  app_lock_enabled BOOLEAN DEFAULT false,
  app_lock_method TEXT DEFAULT 'biometric' CHECK (app_lock_method IN ('pin', 'biometric', 'both')),
  content_lock_enabled BOOLEAN DEFAULT false,
  locked_content_ids TEXT[] DEFAULT '{}',
  hidden_mode_enabled BOOLEAN DEFAULT false,
  private_browsing_enabled BOOLEAN DEFAULT false,
  incognito_mode_enabled BOOLEAN DEFAULT false,
  data_anonymization_enabled BOOLEAN DEFAULT false,
  privacy_dashboard_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON user_privacy_settings(user_id);

-- Enable RLS
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own privacy settings" ON user_privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings" ON user_privacy_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings" ON user_privacy_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_privacy_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_privacy_settings_updated_at
  BEFORE UPDATE ON user_privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_privacy_settings_updated_at();

