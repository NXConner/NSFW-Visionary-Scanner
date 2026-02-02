-- Create scans table (core measurement storage)
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  length NUMERIC,
  girth NUMERIC,
  overall_health TEXT,
  confidence_level NUMERIC,
  urgency TEXT,
  analysis_result JSONB
);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own scans" ON public.scans;
CREATE POLICY "Users can manage own scans" ON public.scans FOR ALL USING (auth.uid() = user_id);

-- Create ai_scan_analysis table
CREATE TABLE IF NOT EXISTS public.ai_scan_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id),
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL DEFAULT 'health_detection',
  detected_conditions JSONB DEFAULT '[]',
  risk_factors JSONB DEFAULT '[]',
  health_alerts JSONB DEFAULT '[]',
  suggested_measurements JSONB,
  measurement_confidence NUMERIC,
  measurement_reasoning TEXT,
  overall_quality_score NUMERIC,
  quality_breakdown JSONB,
  quality_recommendations TEXT[],
  anomalies_detected JSONB DEFAULT '[]',
  anomaly_confidence NUMERIC,
  previous_scan_id UUID,
  comparison_results JSONB,
  trend_direction TEXT,
  trend_data JSONB,
  visualization_url TEXT,
  ai_model_version TEXT,
  ai_model_confidence NUMERIC,
  processing_time_ms INTEGER,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_scan_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ai_scan_analysis" ON public.ai_scan_analysis;
CREATE POLICY "Users can manage own ai_scan_analysis" ON public.ai_scan_analysis FOR ALL USING (auth.uid() = user_id);

-- Create quality_assessment_history table
CREATE TABLE IF NOT EXISTS public.quality_assessment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id),
  user_id UUID NOT NULL,
  overall_score NUMERIC NOT NULL,
  lighting_score NUMERIC,
  focus_score NUMERIC,
  angle_score NUMERIC,
  distance_score NUMERIC,
  stability_score NUMERIC,
  contrast_score NUMERIC,
  recommendations TEXT[],
  critical_issues TEXT[],
  compared_to_average BOOLEAN DEFAULT false,
  average_score NUMERIC,
  percentile_rank NUMERIC,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.quality_assessment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own quality_assessment_history" ON public.quality_assessment_history;
CREATE POLICY "Users can manage own quality_assessment_history" ON public.quality_assessment_history FOR ALL USING (auth.uid() = user_id);

-- Create anomaly_detection_log table
CREATE TABLE IF NOT EXISTS public.anomaly_detection_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id),
  user_id UUID NOT NULL,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  confidence NUMERIC NOT NULL,
  description TEXT NOT NULL,
  location JSONB,
  affected_measurements TEXT[],
  compared_to_previous BOOLEAN DEFAULT false,
  previous_scan_id UUID,
  deviation_amount NUMERIC,
  recommendation TEXT,
  requires_attention BOOLEAN DEFAULT false,
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.anomaly_detection_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own anomaly_detection_log" ON public.anomaly_detection_log;
CREATE POLICY "Users can manage own anomaly_detection_log" ON public.anomaly_detection_log FOR ALL USING (auth.uid() = user_id);

-- Create measurement_suggestions table
CREATE TABLE IF NOT EXISTS public.measurement_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id),
  user_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL,
  current_value NUMERIC,
  suggested_value NUMERIC NOT NULL,
  improvement_expected NUMERIC NOT NULL,
  reasoning TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  is_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.measurement_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own measurement_suggestions" ON public.measurement_suggestions;
CREATE POLICY "Users can manage own measurement_suggestions" ON public.measurement_suggestions FOR ALL USING (auth.uid() = user_id);

-- Create real_time_scan_feedback table
CREATE TABLE IF NOT EXISTS public.real_time_scan_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  feedback_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.real_time_scan_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own real_time_scan_feedback" ON public.real_time_scan_feedback;
CREATE POLICY "Users can manage own real_time_scan_feedback" ON public.real_time_scan_feedback FOR ALL USING (auth.uid() = user_id);

-- Create health_trend_visualizations table
CREATE TABLE IF NOT EXISTS public.health_trend_visualizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  visualization_type TEXT NOT NULL,
  trend_data JSONB NOT NULL DEFAULT '{}',
  time_period_days INTEGER,
  data_points JSONB,
  chart_image_url TEXT,
  chart_config JSONB,
  insights TEXT[],
  predictions JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.health_trend_visualizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own health_trend_visualizations" ON public.health_trend_visualizations;
CREATE POLICY "Users can manage own health_trend_visualizations" ON public.health_trend_visualizations FOR ALL USING (auth.uid() = user_id);

-- Create learning_paths table
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  path_name TEXT NOT NULL,
  path_type TEXT NOT NULL DEFAULT 'custom',
  course_ids UUID[] DEFAULT '{}',
  current_course_index INTEGER DEFAULT 0,
  progress_percentage NUMERIC DEFAULT 0,
  estimated_completion_date DATE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own learning_paths" ON public.learning_paths;
CREATE POLICY "Users can manage own learning_paths" ON public.learning_paths FOR ALL USING (auth.uid() = user_id);

-- Create learning_recommendations table
CREATE TABLE IF NOT EXISTS public.learning_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.learning_courses(id),
  priority INTEGER DEFAULT 0,
  confidence_score NUMERIC,
  recommendation_reason TEXT,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.learning_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own learning_recommendations" ON public.learning_recommendations;
CREATE POLICY "Users can manage own learning_recommendations" ON public.learning_recommendations FOR ALL USING (auth.uid() = user_id);

-- Create marketplace_categories table
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  parent_id UUID REFERENCES public.marketplace_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure marketplace_categories has is_active when table pre-exists
ALTER TABLE public.marketplace_categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active marketplace_categories" ON public.marketplace_categories;
CREATE POLICY "Anyone can view active marketplace_categories" ON public.marketplace_categories FOR SELECT USING (is_active = true);

-- Create marketplace_items table
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.marketplace_categories(id),
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  item_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  average_rating NUMERIC,
  rating_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure marketplace_items has status when table pre-exists
ALTER TABLE public.marketplace_items
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

ALTER TABLE public.marketplace_items
  ADD COLUMN IF NOT EXISTS seller_id UUID;

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published marketplace_items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Sellers can manage own marketplace_items" ON public.marketplace_items;
CREATE POLICY "Anyone can view published marketplace_items" ON public.marketplace_items FOR SELECT USING (status = 'published');
CREATE POLICY "Sellers can manage own marketplace_items" ON public.marketplace_items FOR ALL USING (auth.uid() = seller_id);

-- Create provider_reports table
CREATE TABLE IF NOT EXISTS public.provider_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  report_title TEXT NOT NULL,
  report_content JSONB DEFAULT '{}',
  findings TEXT[],
  recommendations TEXT[],
  status TEXT DEFAULT 'draft',
  is_shared_with_patient BOOLEAN DEFAULT false,
  shared_at TIMESTAMP WITH TIME ZONE,
  file_url TEXT,
  file_format TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.provider_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can manage own reports" ON public.provider_reports;
DROP POLICY IF EXISTS "Patients can view shared reports" ON public.provider_reports;
CREATE POLICY "Providers can manage own reports" ON public.provider_reports FOR ALL USING (auth.uid() = provider_id);
CREATE POLICY "Patients can view shared reports" ON public.provider_reports FOR SELECT USING (auth.uid() = patient_id AND is_shared_with_patient = true);