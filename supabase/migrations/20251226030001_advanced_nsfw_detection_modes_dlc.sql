-- Advanced NSFW Detection Modes DLC ($14.99/month)
-- Multi-model ensemble detection with confidence scoring

-- Create detection models table
CREATE TABLE IF NOT EXISTS public.nsfw_detection_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  provider TEXT NOT NULL,
  model_type TEXT NOT NULL CHECK (model_type IN ('classification', 'object_detection', 'semantic_segmentation')),
  accuracy_score DECIMAL(5,4),
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create detection results table for multi-model comparison
CREATE TABLE IF NOT EXISTS public.nsfw_detection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL,
  model_id UUID REFERENCES public.nsfw_detection_models(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_confidence DECIMAL(5,4) NOT NULL,
  predictions JSONB NOT NULL, -- Detailed category breakdowns
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ensemble results table
CREATE TABLE IF NOT EXISTS public.nsfw_ensemble_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  combined_confidence DECIMAL(5,4) NOT NULL,
  model_results JSONB NOT NULL, -- Array of individual model results
  final_classification TEXT NOT NULL,
  confidence_intervals JSONB, -- Statistical confidence ranges
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user detection preferences
CREATE TABLE IF NOT EXISTS public.user_detection_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enabled_models UUID[], -- Array of model IDs
  ensemble_mode BOOLEAN DEFAULT TRUE,
  confidence_threshold DECIMAL(5,4) DEFAULT 0.5,
  show_detailed_breakdown BOOLEAN DEFAULT TRUE,
  enable_comparison_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nsfw_detection_results_scan_id ON public.nsfw_detection_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_detection_results_user_id ON public.nsfw_detection_results(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_ensemble_results_user_id ON public.nsfw_ensemble_results(user_id);

-- Enable RLS
ALTER TABLE public.nsfw_detection_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_detection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_ensemble_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_detection_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active models" ON public.nsfw_detection_models
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own detection results" ON public.nsfw_detection_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ensemble results" ON public.nsfw_ensemble_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their detection preferences" ON public.user_detection_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Seed data: Detection models (NSFW-only)
INSERT INTO public.nsfw_detection_models (name, version, provider, model_type, accuracy_score, config)
SELECT *
FROM (VALUES
  ('NSFW-JS', '2.4.2', 'InfernoJS', 'classification', 0.9250, '{"categories": ["drawing", "neutral", "sexy", "porn", "hentai"]}'::jsonb),
  ('NudeNet', '2.1.0', 'NudeNet', 'object_detection', 0.9450, '{"categories": ["safe", "explicit"]}'::jsonb),
  ('DeepAI', '1.0.0', 'DeepAI', 'classification', 0.9100, '{"categories": ["safe", "questionable", "explicit"]}'::jsonb),
  ('Custom-Ensemble', '1.0.0', 'MorphoScan', 'classification', 0.9600, '{"models": ["nsfw-js", "nudenet"], "voting_strategy": "weighted_average"}'::jsonb)
) AS t(name, version, provider, model_type, accuracy_score, config)
WHERE public.is_nsfw_enabled()
ON CONFLICT (name) DO UPDATE SET
  version = EXCLUDED.version,
  provider = EXCLUDED.provider,
  model_type = EXCLUDED.model_type,
  accuracy_score = EXCLUDED.accuracy_score,
  config = EXCLUDED.config,
  updated_at = now();

COMMENT ON TABLE public.nsfw_detection_models IS 'Advanced NSFW DLC: Detection model configurations';
COMMENT ON TABLE public.nsfw_detection_results IS 'Advanced NSFW DLC: Individual model detection results';
COMMENT ON TABLE public.nsfw_ensemble_results IS 'Advanced NSFW DLC: Combined ensemble detection results';
