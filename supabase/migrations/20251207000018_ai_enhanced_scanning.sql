-- Migration: AI-Enhanced Scanning
-- Creates tables for real-time health condition detection, automatic measurement suggestions, quality assessment, and anomaly detection

-- AI Scan Analysis Results
CREATE TABLE IF NOT EXISTS ai_scan_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Analysis type
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('health_detection', 'measurement_suggestion', 'quality_assessment', 'anomaly_detection', 'comparison', 'trend_visualization')),
  
  -- Health condition detection
  detected_conditions JSONB, -- Array of {condition: string, confidence: decimal, severity: string, recommendation: string}
  risk_factors JSONB, -- Array of identified risk factors
  health_alerts JSONB, -- Array of alerts/warnings
  
  -- Measurement suggestions
  suggested_measurements JSONB, -- {length: decimal, circumference: decimal, etc.}
  measurement_confidence DECIMAL(3, 2), -- 0.00 to 1.00
  measurement_reasoning TEXT,
  
  -- Quality assessment
  overall_quality_score DECIMAL(3, 2), -- 0.00 to 1.00
  quality_breakdown JSONB, -- {lighting: decimal, focus: decimal, angle: decimal, etc.}
  quality_recommendations TEXT[],
  
  -- Anomaly detection
  anomalies_detected JSONB, -- Array of {type: string, location: string, severity: string, description: string}
  anomaly_confidence DECIMAL(3, 2),
  
  -- Comparison to previous scans
  previous_scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  comparison_results JSONB, -- {length_change: decimal, circumference_change: decimal, etc.}
  trend_direction TEXT CHECK (trend_direction IN ('improving', 'stable', 'declining', 'fluctuating')),
  
  -- Health trend visualization data
  trend_data JSONB, -- Data for visualization
  visualization_url TEXT, -- URL to generated visualization image
  
  -- AI model metadata
  ai_model_version TEXT,
  ai_model_confidence DECIMAL(3, 2),
  processing_time_ms INTEGER,
  
  -- Analysis metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-Time Scan Feedback (during active scanning)
CREATE TABLE IF NOT EXISTS real_time_scan_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  session_id TEXT, -- Temporary session identifier
  frame_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Real-time analysis
  frame_analysis JSONB, -- Quick analysis of current frame
  quality_score DECIMAL(3, 2),
  suggestions JSONB, -- Array of real-time suggestions
  warnings JSONB, -- Array of warnings (poor lighting, wrong angle, etc.)
  
  -- Detection results
  detected_objects JSONB, -- Detected objects in frame
  detected_conditions JSONB, -- Quick health condition checks
  
  -- Measurement preview
  preview_measurements JSONB, -- Estimated measurements from frame
  measurement_confidence DECIMAL(3, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatic Measurement Suggestions (ML-based)
CREATE TABLE IF NOT EXISTS measurement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('angle_adjustment', 'distance_adjustment', 'lighting_improvement', 'focus_improvement', 'position_correction')),
  
  current_value DECIMAL(10, 2),
  suggested_value DECIMAL(10, 2),
  improvement_expected DECIMAL(3, 2), -- Expected improvement in accuracy (0.00 to 1.00)
  
  reasoning TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  is_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Assessment History
CREATE TABLE IF NOT EXISTS quality_assessment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  overall_score DECIMAL(3, 2) NOT NULL,
  
  -- Detailed scores
  lighting_score DECIMAL(3, 2),
  focus_score DECIMAL(3, 2),
  angle_score DECIMAL(3, 2),
  distance_score DECIMAL(3, 2),
  stability_score DECIMAL(3, 2),
  contrast_score DECIMAL(3, 2),
  
  -- Recommendations
  recommendations TEXT[],
  critical_issues TEXT[], -- Issues that must be addressed
  
  -- Comparison
  compared_to_average BOOLEAN DEFAULT false,
  average_score DECIMAL(3, 2), -- Average score for user's scans
  percentile_rank INTEGER, -- Percentile rank (0-100)
  
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anomaly Detection Log
CREATE TABLE IF NOT EXISTS anomaly_detection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('measurement_outlier', 'shape_anomaly', 'color_anomaly', 'texture_anomaly', 'size_anomaly', 'position_anomaly')),
  
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence DECIMAL(3, 2) NOT NULL,
  
  description TEXT NOT NULL,
  location JSONB, -- {x: decimal, y: decimal, region: string}
  affected_measurements TEXT[], -- Which measurements are affected
  
  -- Comparison context
  compared_to_previous BOOLEAN DEFAULT false,
  previous_scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  deviation_amount DECIMAL(10, 2), -- How much it deviates
  
  -- Recommendations
  recommendation TEXT,
  requires_attention BOOLEAN DEFAULT false,
  
  -- Resolution
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Trend Visualizations (generated during scan)
CREATE TABLE IF NOT EXISTS health_trend_visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  visualization_type TEXT NOT NULL CHECK (visualization_type IN ('growth_trend', 'measurement_trend', 'health_score_trend', 'comparison_trend')),
  
  -- Data
  trend_data JSONB NOT NULL, -- Chart data
  time_period_days INTEGER,
  data_points JSONB, -- Array of data points
  
  -- Visualization
  chart_image_url TEXT, -- Generated chart image
  chart_config JSONB, -- Chart configuration (colors, labels, etc.)
  
  -- Insights
  insights TEXT[],
  predictions JSONB, -- Future trend predictions
  
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Model Performance Tracking
CREATE TABLE IF NOT EXISTS ai_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('health_detection', 'measurement', 'quality', 'anomaly')),
  
  -- Performance metrics
  accuracy DECIMAL(5, 4), -- 0.0000 to 1.0000
  precision DECIMAL(5, 4),
  recall DECIMAL(5, 4),
  f1_score DECIMAL(5, 4),
  
  -- Usage
  total_predictions INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  failed_predictions INTEGER DEFAULT 0,
  
  -- Feedback
  user_feedback_positive INTEGER DEFAULT 0,
  user_feedback_negative INTEGER DEFAULT 0,
  
  -- Timing
  average_processing_time_ms INTEGER,
  
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_scan_analysis_scan_id ON ai_scan_analysis(scan_id);
CREATE INDEX IF NOT EXISTS idx_ai_scan_analysis_user_id ON ai_scan_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_scan_analysis_type ON ai_scan_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_real_time_feedback_user_id ON real_time_scan_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_measurement_suggestions_scan_id ON measurement_suggestions(scan_id);
CREATE INDEX IF NOT EXISTS idx_quality_assessment_scan_id ON quality_assessment_history(scan_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_scan_id ON anomaly_detection_log(scan_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_severity ON anomaly_detection_log(severity);
CREATE INDEX IF NOT EXISTS idx_health_trend_viz_user_id ON health_trend_visualizations(user_id);

-- RLS Policies
ALTER TABLE ai_scan_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_scan_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_assessment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detection_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_trend_visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;

-- AI Scan Analysis: Users can view their own
CREATE POLICY "Users can view own AI analysis"
  ON ai_scan_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI analysis"
  ON ai_scan_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Real-Time Feedback: Users can view their own
CREATE POLICY "Users can manage own real-time feedback"
  ON real_time_scan_feedback FOR ALL
  USING (auth.uid() = user_id);

-- Measurement Suggestions: Users can view their own
CREATE POLICY "Users can manage own measurement suggestions"
  ON measurement_suggestions FOR ALL
  USING (auth.uid() = user_id);

-- Quality Assessment: Users can view their own
CREATE POLICY "Users can view own quality assessments"
  ON quality_assessment_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create quality assessments"
  ON quality_assessment_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anomaly Detection: Users can view their own
CREATE POLICY "Users can view own anomaly detections"
  ON anomaly_detection_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own anomaly detections"
  ON anomaly_detection_log FOR UPDATE
  USING (auth.uid() = user_id);

-- Health Trend Visualizations: Users can view their own
CREATE POLICY "Users can view own trend visualizations"
  ON health_trend_visualizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create trend visualizations"
  ON health_trend_visualizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AI Model Performance: Read-only for all authenticated users
CREATE POLICY "Authenticated users can view model performance"
  ON ai_model_performance FOR SELECT
  USING (auth.role() = 'authenticated');

