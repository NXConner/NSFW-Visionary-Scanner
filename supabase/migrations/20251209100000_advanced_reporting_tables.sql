-- Advanced Reporting System Tables
-- Custom reports, templates, health risk scoring

-- Custom Reports
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  report_name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('progress', 'health', 'comparison', 'comprehensive', 'custom')),
  
  -- Configuration
  report_config JSONB NOT NULL DEFAULT '{}',
  selected_metrics TEXT[] NOT NULL DEFAULT '{}',
  date_range JSONB NOT NULL DEFAULT '{}',
  theme TEXT DEFAULT 'professional' CHECK (theme IN ('light', 'dark', 'professional', 'minimal')),
  color_scheme JSONB DEFAULT '{}',
  chart_types JSONB DEFAULT '{}',
  
  -- Sharing
  is_shared BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  shared_with_users UUID[],
  shared_with_doctors UUID[],
  
  -- Scheduling
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
  schedule_day INTEGER,
  schedule_time TIME,
  next_scheduled_at TIMESTAMPTZ,
  last_generated_at TIMESTAMPTZ,
  
  -- Stats
  generation_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Flags
  is_favorite BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  
  template_config JSONB NOT NULL DEFAULT '{}',
  default_metrics TEXT[] NOT NULL DEFAULT '{}',
  default_date_range JSONB DEFAULT '{}',
  default_theme TEXT DEFAULT 'professional',
  default_color_scheme JSONB DEFAULT '{}',
  
  is_premium BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure report_templates has theme columns when table pre-exists
ALTER TABLE report_templates
  ADD COLUMN IF NOT EXISTS default_theme TEXT DEFAULT 'professional';

ALTER TABLE report_templates
  ADD COLUMN IF NOT EXISTS default_color_scheme JSONB DEFAULT '{}';

-- Health Risk Scores
CREATE TABLE IF NOT EXISTS health_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  risk_category TEXT NOT NULL,
  overall_risk_score INTEGER NOT NULL CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'elevated', 'high')),
  
  risk_factors JSONB NOT NULL DEFAULT '[]',
  recommendations TEXT[] NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_reports_user ON custom_reports(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_reports_share_token ON custom_reports(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_custom_reports_scheduled ON custom_reports(is_scheduled, next_scheduled_at) WHERE is_scheduled = true;
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category, is_premium);
CREATE INDEX IF NOT EXISTS idx_health_risk_scores_user ON health_risk_scores(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_risk_scores ENABLE ROW LEVEL SECURITY;

-- Custom reports policies
CREATE POLICY "Users can manage their own reports"
  ON custom_reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view shared reports"
  ON custom_reports FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_shared = true OR
    auth.uid() = ANY(shared_with_users)
  );

-- Report templates policies (public read)
CREATE POLICY "Anyone can view report templates"
  ON report_templates FOR SELECT
  USING (true);

-- Health risk scores policies
CREATE POLICY "Users can manage their own health risk scores"
  ON health_risk_scores FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default report templates
INSERT INTO report_templates (id, template_name, description, category, template_config, default_metrics, default_theme, is_premium)
VALUES 
  (
    gen_random_uuid(),
    'Weekly Progress Report',
    'Summarize your weekly progress with key metrics and charts',
    'trend',
    '{"include_charts": true, "include_tables": true, "include_summary": true, "include_recommendations": true, "page_size": "a4", "orientation": "portrait"}',
    ARRAY['length', 'girth', 'routine_completion'],
    'professional',
    false
  ),
  (
    gen_random_uuid(),
    'Monthly Health Assessment',
    'Comprehensive monthly health and progress assessment',
    'health_summary',
    '{"include_charts": true, "include_tables": true, "include_summary": true, "include_recommendations": true, "page_size": "a4", "orientation": "landscape"}',
    ARRAY['length', 'girth', 'eq_score', 'hardness', 'routine_completion'],
    'professional',
    true
  ),
  (
    gen_random_uuid(),
    'Doctor-Ready Report',
    'Professional medical report format suitable for healthcare providers',
    'medical',
    '{"include_charts": true, "include_tables": true, "include_summary": true, "include_recommendations": false, "page_size": "letter", "orientation": "portrait"}',
    ARRAY['length', 'girth', 'erect_length', 'erect_girth', 'eq_score'],
    'minimal',
    true
  )
ON CONFLICT DO NOTHING;

