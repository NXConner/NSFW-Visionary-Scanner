-- Migration: Enhanced Export & Import System
-- Creates tables for enhanced export (Excel, PDF, CSV, cloud integrations) and import (CSV, Excel, bulk data) systems

-- Export Jobs
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Export details
  export_type TEXT NOT NULL CHECK (export_type IN ('excel', 'pdf', 'csv', 'json', 'hl7_fhir', 'google_sheets', 'onedrive', 'dropbox', 'email')),
  export_name TEXT NOT NULL,
  
  -- Export configuration
  export_config JSONB NOT NULL, -- What data to export, date ranges, etc.
  data_sources TEXT[] NOT NULL,
  
  -- Status
  export_status TEXT DEFAULT 'pending' CHECK (export_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- File details
  file_url TEXT,
  file_format TEXT,
  file_size_bytes INTEGER,
  file_name TEXT,
  
  -- Cloud integration
  cloud_service TEXT, -- 'google_sheets', 'onedrive', 'dropbox'
  cloud_file_id TEXT, -- ID of file in cloud service
  cloud_file_url TEXT,
  
  -- Email export
  email_recipients TEXT[],
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export Templates
CREATE TABLE IF NOT EXISTS export_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for system templates
  
  template_name TEXT NOT NULL,
  template_description TEXT,
  export_type TEXT NOT NULL,
  
  -- Template configuration
  template_config JSONB NOT NULL, -- Layout, fields, formatting, etc.
  is_system_template BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import Jobs
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Import details
  import_type TEXT NOT NULL CHECK (import_type IN ('csv', 'excel', 'json', 'other_app', 'bulk')),
  import_name TEXT NOT NULL,
  source_app TEXT, -- If importing from another app
  
  -- File details
  file_url TEXT,
  file_name TEXT,
  file_size_bytes INTEGER,
  file_format TEXT,
  
  -- Import configuration
  import_config JSONB NOT NULL, -- Mapping, validation rules, etc.
  data_mapping JSONB, -- How to map imported data
  
  -- Status
  import_status TEXT DEFAULT 'pending' CHECK (import_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- Results
  records_total INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  
  -- Validation
  validation_errors JSONB,
  import_errors JSONB,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import History
CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Imported record
  record_type TEXT NOT NULL, -- Type of data imported
  record_id UUID, -- ID of created/updated record
  external_id TEXT, -- ID from source system
  
  -- Status
  import_status TEXT CHECK (import_status IN ('success', 'failed', 'skipped', 'duplicate')),
  error_message TEXT,
  
  -- Data
  imported_data JSONB,
  
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cloud Service Connections
CREATE TABLE IF NOT EXISTS cloud_service_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Service details
  service_type TEXT NOT NULL CHECK (service_type IN ('google_drive', 'google_sheets', 'onedrive', 'dropbox', 'other')),
  service_name TEXT NOT NULL,
  
  -- OAuth credentials (encrypted)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  
  -- Connection status
  is_connected BOOLEAN DEFAULT false,
  connection_status TEXT DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  
  -- Permissions
  permissions_granted TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, service_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_export_jobs_user_id ON export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(export_status);
CREATE INDEX IF NOT EXISTS idx_export_templates_user_id ON export_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_id ON import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(import_status);
CREATE INDEX IF NOT EXISTS idx_import_history_import_job_id ON import_history(import_job_id);
CREATE INDEX IF NOT EXISTS idx_import_history_user_id ON import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_service_connections_user_id ON cloud_service_connections(user_id);

-- RLS Policies
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_service_connections ENABLE ROW LEVEL SECURITY;

-- Export Jobs: Users can view their own
CREATE POLICY "Users can manage own export jobs"
  ON export_jobs FOR ALL
  USING (auth.uid() = user_id);

-- Export Templates: Users can view public and own
CREATE POLICY "Users can view public and own templates"
  ON export_templates FOR SELECT
  USING (is_public = true OR auth.uid() = user_id OR is_system_template = true);

CREATE POLICY "Users can create own templates"
  ON export_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Import Jobs: Users can view their own
CREATE POLICY "Users can manage own import jobs"
  ON import_jobs FOR ALL
  USING (auth.uid() = user_id);

-- Import History: Users can view their own
CREATE POLICY "Users can view own import history"
  ON import_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create import history"
  ON import_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cloud Service Connections: Users can view their own
CREATE POLICY "Users can manage own cloud connections"
  ON cloud_service_connections FOR ALL
  USING (auth.uid() = user_id);

