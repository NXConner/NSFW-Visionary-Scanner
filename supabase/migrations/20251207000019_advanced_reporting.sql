-- Migration: Advanced Reporting System
-- Creates tables for custom report builder, scheduled reports, report sharing, and advanced export formats

-- Custom Reports
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  report_name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('health_summary', 'detailed_analysis', 'comparison', 'trend', 'risk_assessment', 'custom')),
  
  -- Report configuration (drag-and-drop builder data)
  report_config JSONB NOT NULL, -- Layout, sections, widgets configuration
  selected_metrics TEXT[] NOT NULL, -- Which metrics to include
  date_range JSONB, -- {start_date, end_date, period_type}
  
  -- Visual customization
  theme TEXT DEFAULT 'default' CHECK (theme IN ('default', 'dark', 'light', 'medical', 'minimal')),
  color_scheme JSONB, -- Custom colors
  chart_types JSONB, -- Which chart types to use for each metric
  
  -- Sharing
  is_shared BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE, -- Token for sharing
  shared_with_users UUID[], -- Array of user IDs
  shared_with_doctors UUID[], -- Array of doctor/provider IDs
  
  -- Scheduling
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  schedule_day INTEGER, -- Day of week/month
  schedule_time TIME, -- Time of day
  next_scheduled_at TIMESTAMPTZ,
  last_generated_at TIMESTAMPTZ,
  
  -- Usage
  generation_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  is_favorite BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false, -- Can be used as template
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Reports (instances of custom reports)
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Generation metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generation_method TEXT DEFAULT 'manual' CHECK (generation_method IN ('manual', 'scheduled', 'triggered')),
  generation_trigger TEXT, -- What triggered this generation
  
  -- Report data
  report_data JSONB NOT NULL, -- Actual report data
  report_summary JSONB, -- Summary/executive summary
  
  -- Export formats
  pdf_url TEXT,
  excel_url TEXT,
  csv_url TEXT,
  json_url TEXT,
  hl7_fhir_url TEXT, -- HL7 FHIR format
  xml_url TEXT, -- CDA XML format
  
  -- File metadata
  file_sizes JSONB, -- {pdf: bytes, excel: bytes, etc.}
  
  -- Sharing
  is_shared BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  shared_with_users UUID[],
  shared_with_doctors UUID[],
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('generating', 'completed', 'failed', 'expired')),
  error_message TEXT,
  
  expires_at TIMESTAMPTZ, -- When report data expires (for privacy)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Templates (pre-built report configurations)
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('health_summary', 'detailed', 'comparison', 'trend', 'risk', 'medical', 'fitness')),
  
  -- Template configuration
  template_config JSONB NOT NULL, -- Same structure as custom_reports.report_config
  default_metrics TEXT[],
  default_date_range JSONB,
  
  -- Preview
  preview_image_url TEXT,
  preview_description TEXT,
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Sharing Access Log
CREATE TABLE IF NOT EXISTS report_sharing_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES generated_reports(id) ON DELETE CASCADE,
  
  accessed_by_type TEXT NOT NULL CHECK (accessed_by_type IN ('user', 'doctor', 'anonymous')),
  accessed_by_id UUID, -- User ID or doctor ID
  access_token TEXT, -- Token used for access
  
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  duration_seconds INTEGER, -- How long they viewed the report
  pages_viewed INTEGER,
  exported BOOLEAN DEFAULT false,
  export_format TEXT
);

-- Comparative Analytics (comparison reports)
CREATE TABLE IF NOT EXISTS comparative_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  comparison_type TEXT NOT NULL CHECK (comparison_type IN ('time_period', 'user_group', 'population', 'goal', 'baseline')),
  
  -- Comparison data
  baseline_data JSONB NOT NULL,
  comparison_data JSONB NOT NULL,
  differences JSONB, -- Calculated differences
  percentage_changes JSONB,
  
  -- Context
  comparison_period JSONB, -- {baseline_start, baseline_end, comparison_start, comparison_end}
  comparison_group TEXT, -- If comparing to group
  
  -- Insights
  insights TEXT[],
  significant_changes JSONB, -- Statistically significant changes
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictive Modeling Results
CREATE TABLE IF NOT EXISTS predictive_modeling_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  model_type TEXT NOT NULL CHECK (model_type IN ('growth_prediction', 'health_risk', 'outcome_simulation', 'trend_forecast')),
  
  -- Input data
  input_data JSONB NOT NULL,
  prediction_horizon_days INTEGER, -- How far into future
  
  -- Predictions
  predictions JSONB NOT NULL, -- {date: prediction_value}
  confidence_intervals JSONB, -- Upper and lower bounds
  confidence_level DECIMAL(3, 2), -- 0.00 to 1.00
  
  -- Model metadata
  model_version TEXT,
  model_accuracy DECIMAL(5, 4),
  
  -- Scenarios
  scenarios JSONB, -- What-if scenarios
  recommendations TEXT[],
  
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Risk Scoring
CREATE TABLE IF NOT EXISTS health_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  risk_category TEXT NOT NULL CHECK (risk_category IN ('erectile_dysfunction', 'peyronies', 'prostate', 'testicular', 'general_sexual_health', 'overall')),
  
  overall_risk_score DECIMAL(5, 2), -- 0.00 to 100.00
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  
  -- Detailed breakdown
  risk_factors JSONB NOT NULL, -- Array of {factor: string, contribution: decimal, severity: string}
  contributing_metrics JSONB, -- Which metrics contribute to risk
  
  -- Comparison
  compared_to_population BOOLEAN DEFAULT false,
  population_percentile INTEGER, -- Percentile compared to population (0-100)
  
  -- Recommendations
  recommendations TEXT[],
  urgency_level TEXT CHECK (urgency_level IN ('routine', 'soon', 'urgent', 'immediate')),
  
  -- Timeline
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- When this risk assessment expires
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_reports_user_id ON custom_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_scheduled ON custom_reports(is_scheduled, next_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_generated_reports_user_id ON generated_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_custom_id ON generated_reports(custom_report_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_shared ON generated_reports(is_shared, share_token);
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);
CREATE INDEX IF NOT EXISTS idx_comparative_analytics_user_id ON comparative_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_predictive_modeling_user_id ON predictive_modeling_results(user_id);
CREATE INDEX IF NOT EXISTS idx_health_risk_scores_user_id ON health_risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_health_risk_scores_category ON health_risk_scores(risk_category);

-- RLS Policies
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sharing_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparative_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_modeling_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_risk_scores ENABLE ROW LEVEL SECURITY;

-- Custom Reports: Users can view their own
CREATE POLICY "Users can manage own custom reports"
  ON custom_reports FOR ALL
  USING (auth.uid() = user_id);

-- Generated Reports: Users can view their own and shared reports
CREATE POLICY "Users can view own and shared reports"
  ON generated_reports FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = ANY(shared_with_users) OR
    EXISTS (
      SELECT 1 FROM custom_reports cr 
      WHERE cr.id = generated_reports.custom_report_id 
      AND cr.is_shared = true
      AND (auth.uid() = ANY(cr.shared_with_users) OR auth.uid() = ANY(cr.shared_with_doctors))
    )
  );

CREATE POLICY "Users can create own generated reports"
  ON generated_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Report Templates: All authenticated users can view
CREATE POLICY "Authenticated users can view report templates"
  ON report_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- Report Sharing Access Log: Users can view logs for their reports
CREATE POLICY "Users can view access logs for own reports"
  ON report_sharing_access_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM generated_reports gr 
      WHERE gr.id = report_sharing_access_log.report_id 
      AND gr.user_id = auth.uid()
    )
  );

-- Comparative Analytics: Users can view their own
CREATE POLICY "Users can manage own comparative analytics"
  ON comparative_analytics FOR ALL
  USING (auth.uid() = user_id);

-- Predictive Modeling: Users can view their own
CREATE POLICY "Users can manage own predictive modeling"
  ON predictive_modeling_results FOR ALL
  USING (auth.uid() = user_id);

-- Health Risk Scores: Users can view their own
CREATE POLICY "Users can view own health risk scores"
  ON health_risk_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create health risk scores"
  ON health_risk_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

