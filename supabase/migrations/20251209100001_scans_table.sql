-- Scans table for storing scan history and AI analysis results
-- Required by useAIScanAnalysis hook and other components

-- Create scans table if it doesn't exist
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scan type and metadata
  scan_type TEXT NOT NULL DEFAULT 'measurement',
  scan_source TEXT CHECK (scan_source IN ('camera', 'upload', 'manual')),
  
  -- Measurements
  length DECIMAL(5, 2),
  girth DECIMAL(5, 2),
  erect_length DECIMAL(5, 2),
  erect_girth DECIMAL(5, 2),
  
  -- AI Analysis results
  analysis_result JSONB,
  overall_health TEXT CHECK (overall_health IN ('good', 'fair', 'needs_attention', 'concerning')),
  confidence_level INTEGER CHECK (confidence_level >= 0 AND confidence_level <= 100),
  urgency TEXT CHECK (urgency IN ('routine', 'soon', 'urgent')),
  
  -- Curvature assessment
  curvature_detected BOOLEAN DEFAULT false,
  curvature_angle DECIMAL(5, 2),
  curvature_direction TEXT,
  curvature_severity TEXT CHECK (curvature_severity IN ('none', 'mild', 'moderate', 'severe')),
  
  -- Skin health
  skin_health_status TEXT,
  skin_observations TEXT[],
  
  -- Conditions detected
  conditions JSONB DEFAULT '[]',
  recommendations TEXT[] DEFAULT '{}',
  
  -- Image reference (not storing actual image for privacy)
  has_image BOOLEAN DEFAULT false,
  image_hash TEXT, -- For duplicate detection
  
  -- Calibration data
  calibration_factor DECIMAL(5, 4),
  reference_object TEXT,
  
  -- Notes and tags
  notes TEXT,
  tags TEXT[],
  
  -- Timestamps
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scans_user ON scans(user_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_type ON scans(user_id, scan_type);
CREATE INDEX IF NOT EXISTS idx_scans_health ON scans(user_id, overall_health);
CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);

-- RLS Policies
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scans"
  ON scans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_scans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_scans_updated_at ON scans;
CREATE TRIGGER trigger_scans_updated_at
  BEFORE UPDATE ON scans
  FOR EACH ROW
  EXECUTE FUNCTION update_scans_updated_at();

-- Function to get scan statistics
CREATE OR REPLACE FUNCTION get_scan_statistics(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_scans INTEGER,
  avg_length DECIMAL,
  avg_girth DECIMAL,
  length_change DECIMAL,
  girth_change DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_scans AS (
    SELECT *
    FROM scans
    WHERE user_id = p_user_id
      AND scanned_at >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY scanned_at DESC
  ),
  first_scan AS (
    SELECT length, girth
    FROM recent_scans
    ORDER BY scanned_at ASC
    LIMIT 1
  ),
  last_scan AS (
    SELECT length, girth
    FROM recent_scans
    ORDER BY scanned_at DESC
    LIMIT 1
  )
  SELECT
    (SELECT COUNT(*)::INTEGER FROM recent_scans),
    (SELECT AVG(length) FROM recent_scans WHERE length IS NOT NULL),
    (SELECT AVG(girth) FROM recent_scans WHERE girth IS NOT NULL),
    COALESCE((SELECT length FROM last_scan) - (SELECT length FROM first_scan), 0),
    COALESCE((SELECT girth FROM last_scan) - (SELECT girth FROM first_scan), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

