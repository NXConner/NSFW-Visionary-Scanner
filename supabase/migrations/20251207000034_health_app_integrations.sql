-- Migration: Health App Integrations
-- Creates tables for Apple Health, Google Fit, Fitbit, MyFitnessPal, nutrition tracking, and sleep tracking integrations

-- Health App Integrations
CREATE TABLE IF NOT EXISTS health_app_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Integration details
  integration_type TEXT NOT NULL CHECK (integration_type IN ('apple_health', 'google_fit', 'fitbit', 'myfitnesspal', 'nutrition_app', 'sleep_app', 'other')),
  integration_name TEXT NOT NULL,
  
  -- OAuth/API credentials (encrypted)
  access_token_encrypted TEXT, -- Encrypted access token
  refresh_token_encrypted TEXT, -- Encrypted refresh token
  api_key_encrypted TEXT, -- Encrypted API key if needed
  
  -- Connection status
  is_connected BOOLEAN DEFAULT false,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error', 'expired')),
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed')),
  last_error TEXT,
  
  -- Sync settings
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 60,
  sync_data_types TEXT[] NOT NULL, -- What data to sync
  
  -- Permissions
  permissions_granted TEXT[],
  permissions_required TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, integration_type)
);

-- Health Data Sync History
CREATE TABLE IF NOT EXISTS health_data_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES health_app_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Sync details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('import', 'export', 'bidirectional')),
  data_type TEXT NOT NULL, -- 'steps', 'heart_rate', 'sleep', 'nutrition', etc.
  
  -- Sync results
  records_synced INTEGER DEFAULT 0,
  records_added INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Status
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed', 'partial')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Errors
  error_message TEXT,
  error_details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Data Mapping
CREATE TABLE IF NOT EXISTS health_data_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES health_app_integrations(id) ON DELETE CASCADE,
  
  -- Mapping configuration
  source_field TEXT NOT NULL, -- Field from external app
  target_field TEXT NOT NULL, -- Field in our system
  data_type TEXT NOT NULL, -- 'number', 'text', 'date', 'boolean', etc.
  
  -- Transformation
  transformation_rule JSONB, -- How to transform the data
  unit_conversion JSONB, -- Unit conversion rules
  
  -- Validation
  validation_rules JSONB,
  is_required BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Data Conflicts
CREATE TABLE IF NOT EXISTS health_data_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES health_app_integrations(id) ON DELETE CASCADE,
  
  -- Conflict details
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('duplicate', 'mismatch', 'timestamp', 'value')),
  data_type TEXT NOT NULL,
  
  -- Conflicting data
  local_data JSONB NOT NULL,
  external_data JSONB NOT NULL,
  
  -- Resolution
  resolution_strategy TEXT CHECK (resolution_strategy IN ('keep_local', 'keep_external', 'merge', 'manual', 'newest', 'oldest')),
  resolved_data JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Synced Health Data
CREATE TABLE IF NOT EXISTS synced_health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES health_app_integrations(id) ON DELETE CASCADE,
  
  -- Data details
  data_type TEXT NOT NULL,
  external_id TEXT, -- ID from external app
  external_timestamp TIMESTAMPTZ,
  
  -- Data values
  data_values JSONB NOT NULL,
  
  -- Sync metadata
  sync_source TEXT NOT NULL, -- Which app it came from
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_merged BOOLEAN DEFAULT false, -- Whether merged with local data
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_app_integrations_user_id ON health_app_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_health_app_integrations_type ON health_app_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_health_data_sync_history_integration_id ON health_data_sync_history(integration_id);
CREATE INDEX IF NOT EXISTS idx_health_data_sync_history_user_id ON health_data_sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_health_data_mapping_integration_id ON health_data_mapping(integration_id);
CREATE INDEX IF NOT EXISTS idx_health_data_conflicts_user_id ON health_data_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_health_data_conflicts_resolved ON health_data_conflicts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_synced_health_data_user_id ON synced_health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_health_data_integration_id ON synced_health_data(integration_id);

-- RLS Policies
ALTER TABLE health_app_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_health_data ENABLE ROW LEVEL SECURITY;

-- Health App Integrations: Users can view their own
CREATE POLICY "Users can manage own health app integrations"
  ON health_app_integrations FOR ALL
  USING (auth.uid() = user_id);

-- Health Data Sync History: Users can view their own
CREATE POLICY "Users can view own sync history"
  ON health_data_sync_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create sync history"
  ON health_data_sync_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Health Data Mapping: Users can view mappings for their integrations
CREATE POLICY "Users can view data mappings"
  ON health_data_mapping FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM health_app_integrations hai
      WHERE hai.id = health_data_mapping.integration_id
      AND hai.user_id = auth.uid()
    )
  );

-- Health Data Conflicts: Users can view their own
CREATE POLICY "Users can manage own data conflicts"
  ON health_data_conflicts FOR ALL
  USING (auth.uid() = user_id);

-- Synced Health Data: Users can view their own
CREATE POLICY "Users can view own synced data"
  ON synced_health_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create synced data"
  ON synced_health_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

