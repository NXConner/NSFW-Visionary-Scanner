-- Sexual Wellness Tracking System
-- Tracks sexual function, libido, satisfaction, frequency, and relationship health

-- Sexual wellness entries
CREATE TABLE IF NOT EXISTS sexual_wellness_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  
  -- Sexual function metrics
  erectile_function_score INTEGER CHECK (erectile_function_score >= 0 AND erectile_function_score <= 10),
  ejaculation_quality_score INTEGER CHECK (ejaculation_quality_score >= 0 AND ejaculation_quality_score <= 10),
  orgasm_intensity_score INTEGER CHECK (orgasm_intensity_score >= 0 AND orgasm_intensity_score <= 10),
  stamina_duration_minutes INTEGER,
  
  -- Libido and desire
  libido_level INTEGER CHECK (libido_level >= 0 AND libido_level <= 10),
  desire_frequency TEXT CHECK (desire_frequency IN ('daily', 'few_times_week', 'weekly', 'few_times_month', 'monthly', 'rarely')),
  morning_erections BOOLEAN,
  
  -- Satisfaction and experience
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 0 AND overall_satisfaction <= 10),
  partner_satisfaction INTEGER CHECK (partner_satisfaction >= 0 AND partner_satisfaction <= 10),
  sexual_confidence INTEGER CHECK (sexual_confidence >= 0 AND sexual_confidence <= 10),
  
  -- Frequency tracking
  sexual_activity_count INTEGER DEFAULT 0,
  masturbation_count INTEGER DEFAULT 0,
  activity_type TEXT CHECK (activity_type IN ('intercourse', 'masturbation', 'oral', 'other', 'none')),
  
  -- Relationship health (optional, privacy-controlled)
  relationship_satisfaction INTEGER CHECK (relationship_satisfaction >= 0 AND relationship_satisfaction <= 10),
  communication_quality INTEGER CHECK (communication_quality >= 0 AND communication_quality <= 10),
  intimacy_level INTEGER CHECK (intimacy_level >= 0 AND intimacy_level <= 10),
  
  -- Contextual factors
  stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 0 AND sleep_quality <= 10),
  exercise_level TEXT CHECK (exercise_level IN ('none', 'light', 'moderate', 'intense')),
  alcohol_consumption TEXT CHECK (alcohol_consumption IN ('none', 'light', 'moderate', 'heavy')),
  
  -- Wellness score (calculated)
  wellness_score DECIMAL(5,2) CHECK (wellness_score >= 0 AND wellness_score <= 100),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, entry_date)
);

-- Sexual wellness goals
CREATE TABLE IF NOT EXISTS sexual_wellness_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  goal_type TEXT NOT NULL CHECK (goal_type IN ('erectile_function', 'libido', 'satisfaction', 'frequency', 'stamina', 'confidence', 'communication', 'intimacy')),
  target_value INTEGER,
  target_date DATE,
  current_value INTEGER,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sexual wellness patterns (AI-generated insights)
CREATE TABLE IF NOT EXISTS sexual_wellness_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('correlation', 'trend', 'anomaly', 'improvement', 'decline')),
  pattern_description TEXT NOT NULL,
  affected_metrics TEXT[],
  correlation_factors TEXT[],
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner mode (optional, privacy-controlled)
CREATE TABLE IF NOT EXISTS partner_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_email TEXT, -- For non-user partners
  
  connection_code TEXT UNIQUE NOT NULL,
  connection_status TEXT NOT NULL DEFAULT 'pending' CHECK (connection_status IN ('pending', 'active', 'paused', 'disconnected')),
  
  -- Privacy settings
  share_wellness_data BOOLEAN DEFAULT false,
  share_goals BOOLEAN DEFAULT false,
  share_insights BOOLEAN DEFAULT false,
  
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sexual_wellness_entries_user_date ON sexual_wellness_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_sexual_wellness_entries_user_id ON sexual_wellness_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_sexual_wellness_goals_user_id ON sexual_wellness_goals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sexual_wellness_patterns_user_id ON sexual_wellness_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_connections_user_id ON partner_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_connections_code ON partner_connections(connection_code);

-- RLS Policies
ALTER TABLE sexual_wellness_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sexual_wellness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sexual_wellness_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_connections ENABLE ROW LEVEL SECURITY;

-- Sexual wellness entries policies
CREATE POLICY "Users can view their own sexual wellness entries"
  ON sexual_wellness_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sexual wellness entries"
  ON sexual_wellness_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sexual wellness entries"
  ON sexual_wellness_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sexual wellness entries"
  ON sexual_wellness_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Sexual wellness goals policies
CREATE POLICY "Users can view their own sexual wellness goals"
  ON sexual_wellness_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sexual wellness goals"
  ON sexual_wellness_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sexual wellness goals"
  ON sexual_wellness_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sexual wellness goals"
  ON sexual_wellness_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Sexual wellness patterns policies
CREATE POLICY "Users can view their own sexual wellness patterns"
  ON sexual_wellness_patterns FOR SELECT
  USING (auth.uid() = user_id);

-- Partner connections policies
CREATE POLICY "Users can view their own partner connections"
  ON partner_connections FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = partner_user_id);

CREATE POLICY "Users can insert their own partner connections"
  ON partner_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner connections"
  ON partner_connections FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = partner_user_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = partner_user_id);

CREATE POLICY "Users can delete their own partner connections"
  ON partner_connections FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = partner_user_id);

-- Function to calculate wellness score
CREATE OR REPLACE FUNCTION calculate_sexual_wellness_score(
  p_erectile_function INTEGER,
  p_libido INTEGER,
  p_satisfaction INTEGER,
  p_confidence INTEGER,
  p_frequency_count INTEGER
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_score DECIMAL(5,2);
BEGIN
  -- Weighted calculation: function (30%), libido (20%), satisfaction (25%), confidence (15%), frequency (10%)
  v_score := (
    COALESCE(p_erectile_function, 5) * 0.30 +
    COALESCE(p_libido, 5) * 0.20 +
    COALESCE(p_satisfaction, 5) * 0.25 +
    COALESCE(p_confidence, 5) * 0.15 +
    LEAST(COALESCE(p_frequency_count, 0) * 0.5, 10) * 0.10
  ) * 10;
  
  RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate wellness score
CREATE OR REPLACE FUNCTION update_sexual_wellness_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.wellness_score := calculate_sexual_wellness_score(
    NEW.erectile_function_score,
    NEW.libido_level,
    NEW.overall_satisfaction,
    NEW.sexual_confidence,
    NEW.sexual_activity_count
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sexual_wellness_score
  BEFORE INSERT OR UPDATE ON sexual_wellness_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_sexual_wellness_score();

-- Function to update goal progress
CREATE OR REPLACE FUNCTION update_sexual_wellness_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_goal sexual_wellness_goals%ROWTYPE;
  v_current_value INTEGER;
BEGIN
  -- Update goals based on latest entry
  FOR v_goal IN 
    SELECT * FROM sexual_wellness_goals 
    WHERE user_id = NEW.user_id AND is_active = true
  LOOP
    CASE v_goal.goal_type
      WHEN 'erectile_function' THEN
        v_current_value := NEW.erectile_function_score;
      WHEN 'libido' THEN
        v_current_value := NEW.libido_level;
      WHEN 'satisfaction' THEN
        v_current_value := NEW.overall_satisfaction;
      WHEN 'frequency' THEN
        v_current_value := NEW.sexual_activity_count;
      WHEN 'stamina' THEN
        v_current_value := NEW.stamina_duration_minutes;
      WHEN 'confidence' THEN
        v_current_value := NEW.sexual_confidence;
      ELSE
        v_current_value := NULL;
    END CASE;
    
    IF v_current_value IS NOT NULL AND v_goal.target_value IS NOT NULL THEN
      UPDATE sexual_wellness_goals
      SET 
        current_value = v_current_value,
        progress_percentage = LEAST((v_current_value::DECIMAL / NULLIF(v_goal.target_value, 0)) * 100, 100),
        updated_at = NOW()
      WHERE id = v_goal.id;
      
      -- Mark as completed if target reached
      IF v_current_value >= v_goal.target_value THEN
        UPDATE sexual_wellness_goals
        SET 
          is_active = false,
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = v_goal.id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sexual_wellness_goals
  AFTER INSERT OR UPDATE ON sexual_wellness_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_sexual_wellness_goal_progress();

