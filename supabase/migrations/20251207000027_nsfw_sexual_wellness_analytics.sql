-- Migration: NSFW Sexual Wellness Analytics
-- Creates tables for enhanced sexual function tracking, libido monitoring, satisfaction tracking, frequency tracking, and wellness scoring

-- Enhanced Sexual Function Tracking
CREATE TABLE IF NOT EXISTS nsfw_sexual_function_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  entry_date DATE NOT NULL,
  entry_time TIME,
  
  -- Function metrics
  erectile_function_score INTEGER CHECK (erectile_function_score >= 1 AND erectile_function_score <= 10),
  erection_quality TEXT CHECK (erection_quality IN ('none', 'partial', 'full', 'rigid')),
  erection_duration_minutes INTEGER,
  erection_stability INTEGER CHECK (erection_stability >= 1 AND erection_stability <= 10),
  
  -- Performance metrics
  stamina_minutes INTEGER,
  control_level INTEGER CHECK (control_level >= 1 AND control_level <= 10),
  recovery_time_minutes INTEGER,
  
  -- Context
  activity_type TEXT CHECK (activity_type IN ('solo', 'partner', 'both')),
  partner_present BOOLEAN,
  environment TEXT, -- 'home', 'other', etc.
  
  -- Factors affecting
  factors_affecting JSONB, -- {stress: boolean, fatigue: boolean, alcohol: boolean, etc.}
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, entry_date)
);

-- Libido Monitoring
CREATE TABLE IF NOT EXISTS nsfw_libido_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  entry_date DATE NOT NULL,
  
  -- Libido metrics
  libido_level INTEGER NOT NULL CHECK (libido_level >= 1 AND libido_level <= 10),
  libido_direction TEXT CHECK (libido_direction IN ('increasing', 'stable', 'decreasing')),
  
  -- Factors
  contributing_factors JSONB, -- {exercise: boolean, sleep: boolean, stress: boolean, etc.}
  inhibiting_factors JSONB,
  
  -- Desires
  desire_frequency TEXT CHECK (desire_frequency IN ('multiple_daily', 'daily', 'few_times_week', 'weekly', 'less_often')),
  desire_intensity INTEGER CHECK (desire_intensity >= 1 AND desire_intensity <= 10),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Satisfaction Tracking
CREATE TABLE IF NOT EXISTS nsfw_satisfaction_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  entry_date DATE NOT NULL,
  
  -- Satisfaction metrics
  overall_satisfaction INTEGER NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
  physical_satisfaction INTEGER CHECK (physical_satisfaction >= 1 AND physical_satisfaction <= 10),
  emotional_satisfaction INTEGER CHECK (emotional_satisfaction >= 1 AND emotional_satisfaction <= 10),
  
  -- Partner satisfaction (if applicable)
  partner_satisfaction INTEGER CHECK (partner_satisfaction >= 1 AND partner_satisfaction <= 10),
  mutual_satisfaction INTEGER CHECK (mutual_satisfaction >= 1 AND mutual_satisfaction <= 10),
  
  -- Factors
  satisfaction_factors JSONB, -- What contributed to satisfaction
  dissatisfaction_factors JSONB, -- What detracted from satisfaction
  
  -- Context
  activity_type TEXT,
  partner_present BOOLEAN,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Frequency Tracking
CREATE TABLE IF NOT EXISTS nsfw_frequency_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  tracking_period_start DATE NOT NULL,
  tracking_period_end DATE NOT NULL,
  period_type TEXT DEFAULT 'weekly' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Frequency metrics
  solo_activity_count INTEGER DEFAULT 0,
  partner_activity_count INTEGER DEFAULT 0,
  total_activity_count INTEGER DEFAULT 0,
  
  -- Average frequency
  average_per_week DECIMAL(5, 2),
  average_per_month DECIMAL(5, 2),
  
  -- Trends
  frequency_trend TEXT CHECK (frequency_trend IN ('increasing', 'stable', 'decreasing', 'fluctuating')),
  trend_strength DECIMAL(3, 2), -- 0.00 to 1.00
  
  -- Goals
  target_frequency_per_week DECIMAL(5, 2),
  goal_achieved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sexual Wellness Score
CREATE TABLE IF NOT EXISTS nsfw_wellness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  calculation_date DATE NOT NULL,
  calculation_period_days INTEGER DEFAULT 30,
  
  -- Overall score
  overall_wellness_score DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00
  
  -- Component scores
  function_score DECIMAL(5, 2),
  libido_score DECIMAL(5, 2),
  satisfaction_score DECIMAL(5, 2),
  frequency_score DECIMAL(5, 2),
  relationship_score DECIMAL(5, 2), -- If applicable
  
  -- Trends
  score_trend TEXT CHECK (score_trend IN ('improving', 'stable', 'declining', 'fluctuating')),
  score_change DECIMAL(5, 2), -- Change from previous period
  
  -- Insights
  insights TEXT[],
  recommendations TEXT[],
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sexual Wellness Correlations
CREATE TABLE IF NOT EXISTS nsfw_wellness_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  correlation_type TEXT NOT NULL CHECK (correlation_type IN ('function_libido', 'satisfaction_frequency', 'exercise_function', 'sleep_libido', 'stress_function', 'custom')),
  
  -- Correlation data
  metric_a TEXT NOT NULL,
  metric_b TEXT NOT NULL,
  correlation_coefficient DECIMAL(5, 4), -- -1.0000 to 1.0000
  correlation_strength TEXT CHECK (correlation_strength IN ('strong_positive', 'moderate_positive', 'weak_positive', 'none', 'weak_negative', 'moderate_negative', 'strong_negative')),
  
  -- Significance
  is_statistically_significant BOOLEAN DEFAULT false,
  p_value DECIMAL(10, 8),
  
  -- Insights
  interpretation TEXT,
  recommendations TEXT[],
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Wellness Dashboards
CREATE TABLE IF NOT EXISTS nsfw_wellness_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  dashboard_name TEXT NOT NULL,
  description TEXT,
  
  -- Dashboard configuration
  dashboard_config JSONB NOT NULL, -- Layout, widgets, metrics
  selected_metrics TEXT[] NOT NULL,
  date_range JSONB,
  
  -- Visual customization
  theme TEXT DEFAULT 'default',
  chart_types JSONB,
  
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nsfw_sexual_function_user_date ON nsfw_sexual_function_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_libido_user_date ON nsfw_libido_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_satisfaction_user_date ON nsfw_satisfaction_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_frequency_user_id ON nsfw_frequency_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_wellness_scores_user_id ON nsfw_wellness_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_wellness_correlations_user_id ON nsfw_wellness_correlations(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_wellness_dashboards_user_id ON nsfw_wellness_dashboards(user_id);

-- RLS Policies
ALTER TABLE nsfw_sexual_function_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_libido_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_satisfaction_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_frequency_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_wellness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_wellness_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_wellness_dashboards ENABLE ROW LEVEL SECURITY;

-- All NSFW wellness tables: Users can view their own
CREATE POLICY "Users can manage own sexual function tracking"
  ON nsfw_sexual_function_tracking FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own libido tracking"
  ON nsfw_libido_tracking FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own satisfaction tracking"
  ON nsfw_satisfaction_tracking FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own frequency tracking"
  ON nsfw_frequency_tracking FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wellness scores"
  ON nsfw_wellness_scores FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wellness correlations"
  ON nsfw_wellness_correlations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wellness dashboards"
  ON nsfw_wellness_dashboards FOR ALL
  USING (auth.uid() = user_id);

