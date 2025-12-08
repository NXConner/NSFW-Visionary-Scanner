-- Migration: Prostate & Testicular Health Education Content
-- Creates tables for educational content, assessments, and guides

-- Educational Content Library
CREATE TABLE IF NOT EXISTS health_education_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'guide', 'assessment', 'tutorial', 'faq')),
  category TEXT NOT NULL CHECK (category IN ('prostate', 'testicular', 'sexual', 'urinary', 'general', 'prevention')),
  content TEXT NOT NULL,
  summary TEXT,
  video_url TEXT,
  image_url TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  reading_time_minutes INTEGER,
  tags TEXT[],
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Assessments
CREATE TABLE IF NOT EXISTS health_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prostate', 'testicular', 'sexual', 'urinary', 'general')),
  description TEXT,
  questions JSONB NOT NULL, -- Array of assessment questions
  scoring_logic JSONB, -- How to calculate scores
  risk_levels JSONB, -- Risk level thresholds
  recommendations JSONB, -- Recommendations by score/risk level
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Assessment Results
CREATE TABLE IF NOT EXISTS user_assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES health_assessments(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  recommendations TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Self-Examination Guides
CREATE TABLE IF NOT EXISTS self_examination_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('testicular', 'prostate', 'general')),
  step_by_step_instructions TEXT[] NOT NULL,
  video_url TEXT,
  image_urls TEXT[],
  frequency_recommendation TEXT, -- e.g., "Monthly", "Every 3 months"
  warning_signs TEXT[],
  when_to_see_doctor TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Screening Reminders
CREATE TABLE IF NOT EXISTS screening_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('psa_test', 'testicular_exam', 'general_checkup', 'specialist_visit')),
  frequency_months INTEGER,
  last_reminder_date DATE,
  next_reminder_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Symptom Checker Database
CREATE TABLE IF NOT EXISTS symptom_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prostate', 'testicular', 'sexual', 'urinary', 'general')),
  possible_conditions TEXT[],
  severity_levels TEXT[],
  when_to_see_doctor TEXT,
  self_care_tips TEXT[],
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk Factor Calculator Data
CREATE TABLE IF NOT EXISTS risk_factor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_type TEXT NOT NULL CHECK (risk_type IN ('prostate_cancer', 'testicular_cancer', 'sexual_dysfunction', 'urinary_issues')),
  factor_name TEXT NOT NULL,
  factor_weight DECIMAL(3,2), -- Weight in risk calculation
  description TEXT,
  mitigation_strategies TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_education_content_category ON health_education_content(category);
CREATE INDEX IF NOT EXISTS idx_education_content_type ON health_education_content(content_type);
CREATE INDEX IF NOT EXISTS idx_education_content_featured ON health_education_content(is_featured);
CREATE INDEX IF NOT EXISTS idx_assessments_category ON health_assessments(category);
CREATE INDEX IF NOT EXISTS idx_user_assessment_results_user ON user_assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessment_results_assessment ON user_assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_self_exam_guides_type ON self_examination_guides(exam_type);
CREATE INDEX IF NOT EXISTS idx_screening_reminders_user ON screening_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_screening_reminders_next_date ON screening_reminders(next_reminder_date);
CREATE INDEX IF NOT EXISTS idx_symptom_patterns_category ON symptom_patterns(category);
CREATE INDEX IF NOT EXISTS idx_risk_factor_data_type ON risk_factor_data(risk_type);

-- Enable RLS
ALTER TABLE health_education_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_examination_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_factor_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active education content" ON health_education_content
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view active assessments" ON health_assessments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own assessment results" ON user_assessment_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assessment results" ON user_assessment_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active self-exam guides" ON self_examination_guides
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own screening reminders" ON screening_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own screening reminders" ON screening_reminders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view symptom patterns" ON symptom_patterns
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view risk factor data" ON risk_factor_data
  FOR SELECT USING (true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_education_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_education_content_updated_at
  BEFORE UPDATE ON health_education_content
  FOR EACH ROW
  EXECUTE FUNCTION update_education_updated_at();

CREATE TRIGGER trigger_assessments_updated_at
  BEFORE UPDATE ON health_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_education_updated_at();

CREATE TRIGGER trigger_self_exam_guides_updated_at
  BEFORE UPDATE ON self_examination_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_education_updated_at();

CREATE TRIGGER trigger_screening_reminders_updated_at
  BEFORE UPDATE ON screening_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_education_updated_at();

