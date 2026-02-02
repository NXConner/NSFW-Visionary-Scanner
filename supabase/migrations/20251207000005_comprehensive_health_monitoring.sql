-- Migration: Comprehensive Health Monitoring System
-- Creates tables for prostate, testicular, sexual health, and overall wellness tracking

-- Prostate Health Tracking
CREATE TABLE IF NOT EXISTS prostate_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  psa_level DECIMAL(5,2), -- PSA level if provided
  symptoms TEXT[], -- Array of symptoms
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  urination_frequency INTEGER, -- Times per day
  urination_difficulty TEXT CHECK (urination_difficulty IN ('none', 'mild', 'moderate', 'severe')),
  blood_in_urine BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Testicular Health Tracking
CREATE TABLE IF NOT EXISTS testicular_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  self_exam_performed BOOLEAN DEFAULT false,
  abnormalities_found BOOLEAN DEFAULT false,
  abnormality_description TEXT,
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  swelling BOOLEAN DEFAULT false,
  lumps_detected BOOLEAN DEFAULT false,
  size_changes TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Sexual Health Metrics
CREATE TABLE IF NOT EXISTS sexual_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  erectile_function_score INTEGER CHECK (erectile_function_score >= 0 AND erectile_function_score <= 10),
  libido_level INTEGER CHECK (libido_level >= 0 AND libido_level <= 10),
  satisfaction_level INTEGER CHECK (satisfaction_level >= 0 AND satisfaction_level <= 10),
  frequency_per_week INTEGER,
  orgasm_quality INTEGER CHECK (orgasm_quality >= 0 AND orgasm_quality <= 10),
  premature_ejaculation BOOLEAN DEFAULT false,
  delayed_ejaculation BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Hormone Level Tracking (User-Provided)
CREATE TABLE IF NOT EXISTS hormone_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  testosterone_total DECIMAL(6,2), -- ng/dL
  testosterone_free DECIMAL(5,2), -- pg/mL
  lh DECIMAL(5,2), -- Luteinizing Hormone
  fsh DECIMAL(5,2), -- Follicle-Stimulating Hormone
  prolactin DECIMAL(5,2),
  shbg DECIMAL(5,2), -- Sex Hormone Binding Globulin
  notes TEXT,
  lab_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Urinary Health Tracking
CREATE TABLE IF NOT EXISTS urinary_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  frequency_per_day INTEGER,
  urgency_level INTEGER CHECK (urgency_level >= 0 AND urgency_level <= 10),
  nocturia_count INTEGER, -- Times waking up at night
  incontinence BOOLEAN DEFAULT false,
  incontinence_type TEXT CHECK (incontinence_type IN ('stress', 'urge', 'overflow', 'functional', 'mixed')),
  stream_strength INTEGER CHECK (stream_strength >= 0 AND stream_strength <= 10),
  incomplete_emptying BOOLEAN DEFAULT false,
  pain_on_urination BOOLEAN DEFAULT false,
  blood_in_urine BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Overall Sexual Wellness Score
CREATE TABLE IF NOT EXISTS sexual_wellness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  physical_score INTEGER CHECK (physical_score >= 0 AND physical_score <= 100),
  emotional_score INTEGER CHECK (emotional_score >= 0 AND emotional_score <= 100),
  relationship_score INTEGER CHECK (relationship_score >= 0 AND relationship_score <= 100),
  factors JSONB, -- Contributing factors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Health Risk Factors
CREATE TABLE IF NOT EXISTS health_risk_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_type TEXT NOT NULL CHECK (risk_type IN ('prostate', 'testicular', 'sexual', 'urinary', 'general')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  risk_factors TEXT[], -- Array of identified risk factors
  recommendations TEXT[],
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Alerts
CREATE TABLE IF NOT EXISTS health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('warning', 'caution', 'info', 'reminder')),
  category TEXT NOT NULL CHECK (category IN ('prostate', 'testicular', 'sexual', 'urinary', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_required BOOLEAN DEFAULT false,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prostate_health_user_date ON prostate_health(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_testicular_health_user_date ON testicular_health(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_sexual_health_user_date ON sexual_health_metrics(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_hormone_levels_user_date ON hormone_levels(user_id, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_urinary_health_user_date ON urinary_health(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_scores_user_date ON sexual_wellness_scores(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_factors_user_type ON health_risk_factors(user_id, risk_type);
CREATE INDEX IF NOT EXISTS idx_health_alerts_user_read ON health_alerts(user_id, is_read);

-- Enable RLS
ALTER TABLE prostate_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE testicular_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE sexual_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hormone_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE urinary_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE sexual_wellness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies - All tables follow same pattern
CREATE POLICY "Users can view own prostate health" ON prostate_health
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own prostate health" ON prostate_health
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own testicular health" ON testicular_health
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own testicular health" ON testicular_health
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sexual health" ON sexual_health_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sexual health" ON sexual_health_metrics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own hormone levels" ON hormone_levels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own hormone levels" ON hormone_levels
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own urinary health" ON urinary_health
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own urinary health" ON urinary_health
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own wellness scores" ON sexual_wellness_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wellness scores" ON sexual_wellness_scores
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own risk factors" ON health_risk_factors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own health alerts" ON health_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own health alerts" ON health_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can create health alerts" ON health_alerts
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_health_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_prostate_health_updated_at
  BEFORE UPDATE ON prostate_health
  FOR EACH ROW
  EXECUTE FUNCTION update_health_updated_at();

CREATE TRIGGER trigger_testicular_health_updated_at
  BEFORE UPDATE ON testicular_health
  FOR EACH ROW
  EXECUTE FUNCTION update_health_updated_at();

CREATE TRIGGER trigger_sexual_health_updated_at
  BEFORE UPDATE ON sexual_health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_health_updated_at();

CREATE TRIGGER trigger_hormone_levels_updated_at
  BEFORE UPDATE ON hormone_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_health_updated_at();

CREATE TRIGGER trigger_urinary_health_updated_at
  BEFORE UPDATE ON urinary_health
  FOR EACH ROW
  EXECUTE FUNCTION update_health_updated_at();

