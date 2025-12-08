-- Migration: Advanced Scanner Features
-- Creates tables for multi-angle 3D reconstruction, time-lapse comparison, measurement templates, and batch scanning

-- Multi-Angle Scan Sessions (for 3D reconstruction)
CREATE TABLE IF NOT EXISTS multi_angle_scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  session_name TEXT,
  scan_type TEXT DEFAULT '3d_reconstruction' CHECK (scan_type IN ('3d_reconstruction', 'time_lapse', 'batch_scan')),
  
  -- 3D Reconstruction settings
  target_angles INTEGER DEFAULT 8, -- Number of angles to capture
  angles_captured INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT false,
  
  -- Processing
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  
  -- Results
  reconstructed_3d_model_url TEXT, -- URL to 3D model file
  model_format TEXT CHECK (model_format IN ('obj', 'stl', 'ply', 'gltf')),
  point_cloud_url TEXT,
  texture_map_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-Angle Scan Images (individual angle captures)
CREATE TABLE IF NOT EXISTS multi_angle_scan_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES multi_angle_scan_sessions(id) ON DELETE CASCADE,
  
  angle_index INTEGER NOT NULL, -- 0-7 for 8 angles, etc.
  angle_degrees INTEGER, -- Actual angle in degrees (0, 45, 90, 135, etc.)
  
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Camera metadata
  camera_position JSONB, -- {x, y, z} relative position
  camera_rotation JSONB, -- {pitch, yaw, roll}
  focal_length DECIMAL(10, 2),
  
  -- Quality metrics
  lighting_quality DECIMAL(3, 2), -- 0.00 to 1.00
  sharpness_score DECIMAL(3, 2),
  contrast_score DECIMAL(3, 2),
  
  -- Measurements from this angle
  measurements JSONB, -- {length, circumference, etc.}
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time-Lapse Comparisons
CREATE TABLE IF NOT EXISTS time_lapse_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  comparison_name TEXT,
  start_scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  end_scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  
  -- Comparison metrics
  length_change DECIMAL(10, 2), -- cm
  circumference_change DECIMAL(10, 2), -- cm
  curvature_change DECIMAL(10, 2), -- degrees
  time_period_days INTEGER,
  
  -- Visualization
  comparison_image_url TEXT, -- Side-by-side or overlay image
  overlay_image_url TEXT, -- Transparent overlay comparison
  slider_image_url TEXT, -- Before/after slider image
  animated_gif_url TEXT, -- Animated transition
  
  -- Growth metrics
  growth_rate_per_month DECIMAL(10, 2),
  growth_percentage DECIMAL(5, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Measurement Templates (saved measurement configurations)
CREATE TABLE IF NOT EXISTS measurement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  template_name TEXT NOT NULL,
  description TEXT,
  
  -- Template configuration
  measurement_points JSONB NOT NULL, -- Array of measurement point definitions
  reference_object_size DECIMAL(10, 2), -- Size of reference object in cm
  calibration_data JSONB,
  
  -- Settings
  auto_capture_enabled BOOLEAN DEFAULT false,
  quality_threshold DECIMAL(3, 2) DEFAULT 0.7,
  angle_requirements JSONB, -- Required angles for this template
  
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false, -- Can be shared with other users
  
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch Scan Sessions (multiple scans in one session)
CREATE TABLE IF NOT EXISTS batch_scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  session_name TEXT,
  batch_type TEXT CHECK (batch_type IN ('daily', 'weekly', 'custom', 'routine')),
  
  target_count INTEGER, -- Number of scans to capture
  scans_captured INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT false,
  
  -- Scheduling
  scheduled_start_time TIMESTAMPTZ,
  scheduled_end_time TIMESTAMPTZ,
  interval_minutes INTEGER, -- Time between scans
  
  -- Results
  average_measurements JSONB, -- Average across all scans
  measurement_variance JSONB, -- Variance in measurements
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch Scan Entries (individual scans in a batch)
CREATE TABLE IF NOT EXISTS batch_scan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_session_id UUID NOT NULL REFERENCES batch_scan_sessions(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  
  entry_index INTEGER NOT NULL, -- Order in batch
  captured_at TIMESTAMPTZ NOT NULL,
  
  -- Quick measurements (may differ from full scan)
  quick_length DECIMAL(10, 2),
  quick_circumference DECIMAL(10, 2),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cloud Processing Jobs (for heavy processing tasks)
CREATE TABLE IF NOT EXISTS cloud_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  job_type TEXT NOT NULL CHECK (job_type IN ('3d_reconstruction', 'ml_analysis', 'batch_processing', 'export_3d_model')),
  related_session_id UUID, -- References multi_angle_scan_sessions or batch_scan_sessions
  
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5, -- 1-10, higher = more priority
  
  -- Input data
  input_data JSONB NOT NULL, -- Job-specific input parameters
  
  -- Results
  result_data JSONB,
  result_urls JSONB, -- Array of result file URLs
  error_message TEXT,
  
  -- Processing metadata
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_duration_seconds INTEGER,
  processing_cost DECIMAL(10, 4), -- Cost in credits or currency
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3D Model Exports
CREATE TABLE IF NOT EXISTS exported_3d_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES multi_angle_scan_sessions(id) ON DELETE SET NULL,
  
  export_format TEXT NOT NULL CHECK (export_format IN ('obj', 'stl', 'ply', 'gltf', 'fbx')),
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  
  -- Export settings
  include_texture BOOLEAN DEFAULT true,
  include_measurements BOOLEAN DEFAULT true,
  quality_level TEXT DEFAULT 'high' CHECK (quality_level IN ('low', 'medium', 'high', 'ultra')),
  
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_multi_angle_sessions_user_id ON multi_angle_scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_angle_sessions_status ON multi_angle_scan_sessions(processing_status);
CREATE INDEX IF NOT EXISTS idx_multi_angle_images_session_id ON multi_angle_scan_images(session_id);
CREATE INDEX IF NOT EXISTS idx_time_lapse_user_id ON time_lapse_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_measurement_templates_user_id ON measurement_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_scan_sessions_user_id ON batch_scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_processing_jobs_user_id ON cloud_processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_processing_jobs_status ON cloud_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_exported_3d_models_user_id ON exported_3d_models(user_id);

-- RLS Policies
ALTER TABLE multi_angle_scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_angle_scan_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_lapse_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_scan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exported_3d_models ENABLE ROW LEVEL SECURITY;

-- Multi-Angle Sessions: Users can view their own
CREATE POLICY "Users can view own multi-angle sessions"
  ON multi_angle_scan_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own multi-angle sessions"
  ON multi_angle_scan_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own multi-angle sessions"
  ON multi_angle_scan_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Multi-Angle Images: Users can view images in their sessions
CREATE POLICY "Users can view images in own sessions"
  ON multi_angle_scan_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multi_angle_scan_sessions mas 
      WHERE mas.id = multi_angle_scan_images.session_id 
      AND mas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create images in own sessions"
  ON multi_angle_scan_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM multi_angle_scan_sessions mas 
      WHERE mas.id = multi_angle_scan_images.session_id 
      AND mas.user_id = auth.uid()
    )
  );

-- Time-Lapse Comparisons: Users can view their own
CREATE POLICY "Users can manage own time-lapse comparisons"
  ON time_lapse_comparisons FOR ALL
  USING (auth.uid() = user_id);

-- Measurement Templates: Users can view their own and shared templates
CREATE POLICY "Users can view own and shared templates"
  ON measurement_templates FOR SELECT
  USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can manage own templates"
  ON measurement_templates FOR ALL
  USING (auth.uid() = user_id);

-- Batch Scan Sessions: Users can manage their own
CREATE POLICY "Users can manage own batch sessions"
  ON batch_scan_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Batch Scan Entries: Users can view entries in their sessions
CREATE POLICY "Users can view entries in own batch sessions"
  ON batch_scan_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM batch_scan_sessions bss 
      WHERE bss.id = batch_scan_entries.batch_session_id 
      AND bss.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create entries in own batch sessions"
  ON batch_scan_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batch_scan_sessions bss 
      WHERE bss.id = batch_scan_entries.batch_session_id 
      AND bss.user_id = auth.uid()
    )
  );

-- Cloud Processing Jobs: Users can view their own
CREATE POLICY "Users can manage own processing jobs"
  ON cloud_processing_jobs FOR ALL
  USING (auth.uid() = user_id);

-- Exported 3D Models: Users can view their own
CREATE POLICY "Users can manage own 3D model exports"
  ON exported_3d_models FOR ALL
  USING (auth.uid() = user_id);

