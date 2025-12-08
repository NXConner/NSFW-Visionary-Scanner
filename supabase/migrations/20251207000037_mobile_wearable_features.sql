-- Migration: Advanced Mobile Features & Wearable Integration
-- Creates tables for mobile widgets, app shortcuts, haptic feedback, background processing, and wearable device integration

-- Mobile Widget Configurations
CREATE TABLE IF NOT EXISTS mobile_widget_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Widget details
  widget_type TEXT NOT NULL CHECK (widget_type IN ('scanner_quick', 'health_summary', 'progress_tracker', 'routine_reminder', 'custom')),
  widget_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'both')),
  
  -- Widget configuration
  widget_config JSONB NOT NULL, -- Size, position, data to display, etc.
  refresh_frequency_minutes INTEGER DEFAULT 15,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Shortcuts
CREATE TABLE IF NOT EXISTS app_shortcuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Shortcut details
  shortcut_type TEXT NOT NULL CHECK (shortcut_type IN ('scan', 'diary_entry', 'routine_start', 'quick_action', 'custom')),
  shortcut_name TEXT NOT NULL,
  shortcut_icon TEXT,
  shortcut_action JSONB NOT NULL, -- What action to perform
  
  -- Platform
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'both')),
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Haptic Feedback Preferences
CREATE TABLE IF NOT EXISTS haptic_feedback_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Preferences
  haptic_enabled BOOLEAN DEFAULT true,
  haptic_intensity TEXT DEFAULT 'medium' CHECK (haptic_intensity IN ('light', 'medium', 'strong')),
  
  -- Event-specific settings
  haptic_patterns JSONB NOT NULL, -- Different patterns for different events
  
  -- Battery optimization
  disable_on_low_battery BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Background Processing Jobs
CREATE TABLE IF NOT EXISTS background_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job details
  job_type TEXT NOT NULL CHECK (job_type IN ('scan_processing', 'data_sync', 'analytics', 'notification', 'backup')),
  job_name TEXT NOT NULL,
  
  -- Scheduling
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
  scheduled_at TIMESTAMPTZ,
  recurrence_pattern TEXT, -- Cron-like pattern
  
  -- Status
  job_status TEXT DEFAULT 'pending' CHECK (job_status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- Execution
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Battery optimization
  requires_charging BOOLEAN DEFAULT false,
  requires_wifi BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wearable Devices
CREATE TABLE IF NOT EXISTS wearable_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Device details
  device_type TEXT NOT NULL CHECK (device_type IN ('apple_watch', 'wear_os', 'fitbit', 'other')),
  device_name TEXT NOT NULL,
  device_model TEXT,
  device_identifier TEXT UNIQUE, -- Unique device identifier
  
  -- Connection
  is_connected BOOLEAN DEFAULT false,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  last_connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  
  -- Capabilities
  capabilities JSONB, -- What the device can do (heart rate, notifications, etc.)
  
  -- Settings
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 5,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wearable Data Sync
CREATE TABLE IF NOT EXISTS wearable_data_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wearable_id UUID NOT NULL REFERENCES wearable_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Sync details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('health_data', 'notification', 'reminder', 'quick_action')),
  data_type TEXT NOT NULL,
  
  -- Data
  synced_data JSONB NOT NULL,
  
  -- Direction
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('to_wearable', 'from_wearable', 'bidirectional')),
  
  -- Status
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wearable Notifications
CREATE TABLE IF NOT EXISTS wearable_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wearable_id UUID REFERENCES wearable_devices(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'alert', 'achievement', 'routine', 'health_alert')),
  notification_title TEXT NOT NULL,
  notification_body TEXT NOT NULL,
  
  -- Delivery
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'dismissed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  -- Action
  action_data JSONB, -- Action to take if user interacts
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location-Based Features
CREATE TABLE IF NOT EXISTS location_based_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feature details
  feature_type TEXT NOT NULL CHECK (feature_type IN ('reminder', 'doctor_finder', 'content', 'geofence')),
  feature_name TEXT NOT NULL,
  
  -- Location
  location_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius_meters INTEGER, -- For geofencing
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  trigger_on_enter BOOLEAN DEFAULT true,
  trigger_on_exit BOOLEAN DEFAULT false,
  
  -- Action
  action_data JSONB NOT NULL, -- What to do when triggered
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mobile_widget_configurations_user_id ON mobile_widget_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_app_shortcuts_user_id ON app_shortcuts(user_id);
CREATE INDEX IF NOT EXISTS idx_haptic_feedback_preferences_user_id ON haptic_feedback_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_background_processing_jobs_user_id ON background_processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_background_processing_jobs_status ON background_processing_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_user_id ON wearable_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_data_sync_wearable_id ON wearable_data_sync(wearable_id);
CREATE INDEX IF NOT EXISTS idx_wearable_data_sync_user_id ON wearable_data_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_notifications_user_id ON wearable_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_location_based_features_user_id ON location_based_features(user_id);

-- RLS Policies
ALTER TABLE mobile_widget_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE haptic_feedback_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_based_features ENABLE ROW LEVEL SECURITY;

-- Mobile Widget Configurations: Users can view their own
CREATE POLICY "Users can manage own widget configurations"
  ON mobile_widget_configurations FOR ALL
  USING (auth.uid() = user_id);

-- App Shortcuts: Users can view their own
CREATE POLICY "Users can manage own app shortcuts"
  ON app_shortcuts FOR ALL
  USING (auth.uid() = user_id);

-- Haptic Feedback Preferences: Users can view their own
CREATE POLICY "Users can manage own haptic preferences"
  ON haptic_feedback_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Background Processing Jobs: Users can view their own
CREATE POLICY "Users can manage own background jobs"
  ON background_processing_jobs FOR ALL
  USING (auth.uid() = user_id);

-- Wearable Devices: Users can view their own
CREATE POLICY "Users can manage own wearable devices"
  ON wearable_devices FOR ALL
  USING (auth.uid() = user_id);

-- Wearable Data Sync: Users can view their own
CREATE POLICY "Users can view own wearable sync data"
  ON wearable_data_sync FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create wearable sync data"
  ON wearable_data_sync FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Wearable Notifications: Users can view their own
CREATE POLICY "Users can manage own wearable notifications"
  ON wearable_notifications FOR ALL
  USING (auth.uid() = user_id);

-- Location-Based Features: Users can view their own
CREATE POLICY "Users can manage own location features"
  ON location_based_features FOR ALL
  USING (auth.uid() = user_id);

