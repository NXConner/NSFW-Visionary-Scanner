-- Habit Tracker System
-- Daily habit tracking, streaks, reminders, analytics, and integration with PE routines

-- Habit definitions
CREATE TABLE IF NOT EXISTS habit_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system/template habits
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('pe_routine', 'health', 'wellness', 'lifestyle', 'custom')),
  
  -- Tracking details
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),
  target_value INTEGER DEFAULT 1, -- e.g., 1 time per day, 3 times per week
  unit TEXT, -- e.g., 'times', 'minutes', 'sets', 'reps'
  
  -- Reminders
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_times TIME[], -- Array of reminder times
  reminder_days INTEGER[], -- Days of week (0=Sunday, 6=Saturday)
  
  -- Integration
  linked_routine_id UUID, -- Link to PE routine if applicable
  linked_feature TEXT, -- Link to app feature (e.g., 'scanner', 'diary')
  
  -- Organization
  color TEXT,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false, -- System templates vs user-created
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User habits (instances of habit definitions)
CREATE TABLE IF NOT EXISTS user_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_definition_id UUID NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
  
  -- Personalization
  custom_name TEXT, -- Override definition name
  custom_target_value INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  
  -- Statistics
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, habit_definition_id)
);

-- Habit entries (daily/weekly completions)
CREATE TABLE IF NOT EXISTS habit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_habit_id UUID NOT NULL REFERENCES user_habits(id) ON DELETE CASCADE,
  
  entry_date DATE NOT NULL,
  completed_value INTEGER DEFAULT 1, -- Actual value completed
  target_value INTEGER, -- Target for this entry
  
  -- Metadata
  notes TEXT,
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'difficult', 'skipped')),
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
  
  -- Time tracking
  duration_minutes INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_habit_id, entry_date)
);

-- Habit streaks
CREATE TABLE IF NOT EXISTS habit_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_habit_id UUID NOT NULL REFERENCES user_habits(id) ON DELETE CASCADE,
  
  streak_start_date DATE NOT NULL,
  streak_end_date DATE,
  streak_length INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit templates (system-provided)
CREATE TABLE IF NOT EXISTS habit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  frequency TEXT,
  target_value INTEGER DEFAULT 1,
  unit TEXT,
  
  icon TEXT,
  color TEXT,
  
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit analytics (aggregated data)
CREATE TABLE IF NOT EXISTS habit_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_habit_id UUID NOT NULL REFERENCES user_habits(id) ON DELETE CASCADE,
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT CHECK (period_type IN ('week', 'month', 'year')),
  
  total_entries INTEGER DEFAULT 0,
  completed_entries INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  average_value DECIMAL(10,2) DEFAULT 0,
  
  longest_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_habit_definitions_user ON habit_definitions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habit_definitions_template ON habit_definitions(is_template, is_active);
CREATE INDEX IF NOT EXISTS idx_user_habits_user ON user_habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user_habit ON habit_entries(user_habit_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_entries_date ON habit_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_habit_streaks_user_habit ON habit_streaks(user_habit_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habit_analytics_user_habit ON habit_analytics(user_habit_id, period_start DESC);

-- RLS Policies
ALTER TABLE habit_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_analytics ENABLE ROW LEVEL SECURITY;

-- Habit definitions policies
CREATE POLICY "Users can view their own habits and templates"
  ON habit_definitions FOR SELECT
  USING (user_id = auth.uid() OR is_template = true OR user_id IS NULL);

CREATE POLICY "Users can create their own habits"
  ON habit_definitions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own habits"
  ON habit_definitions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON habit_definitions FOR DELETE
  USING (auth.uid() = user_id);

-- User habits policies
CREATE POLICY "Users can manage their own user habits"
  ON user_habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Habit entries policies
CREATE POLICY "Users can manage their own habit entries"
  ON habit_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_habits
      WHERE id = habit_entries.user_habit_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_habits
      WHERE id = habit_entries.user_habit_id AND user_id = auth.uid()
    )
  );

-- Habit streaks policies
CREATE POLICY "Users can view their own streaks"
  ON habit_streaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_habits
      WHERE id = habit_streaks.user_habit_id AND user_id = auth.uid()
    )
  );

-- Habit templates policies (public read)
CREATE POLICY "Anyone can view habit templates"
  ON habit_templates FOR SELECT
  USING (true);

-- Habit analytics policies
CREATE POLICY "Users can view their own analytics"
  ON habit_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_habits
      WHERE id = habit_analytics.user_habit_id AND user_id = auth.uid()
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_user_habit_id UUID;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  v_user_habit_id := NEW.user_habit_id;
  
  -- Calculate current streak
  SELECT COUNT(*)::INTEGER INTO v_current_streak
  FROM habit_entries
  WHERE user_habit_id = v_user_habit_id
    AND entry_date >= CURRENT_DATE - INTERVAL '30 days'
    AND entry_date <= CURRENT_DATE
  ORDER BY entry_date DESC;
  
  -- Get longest streak
  SELECT MAX(streak_length) INTO v_longest_streak
  FROM habit_streaks
  WHERE user_habit_id = v_user_habit_id;
  
  -- Update user habit stats
  UPDATE user_habits
  SET 
    current_streak = v_current_streak,
    longest_streak = GREATEST(COALESCE(longest_streak, 0), COALESCE(v_longest_streak, 0)),
    total_completions = total_completions + 1,
    updated_at = NOW()
  WHERE id = v_user_habit_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_habit_streak
  AFTER INSERT ON habit_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_streak();

CREATE OR REPLACE FUNCTION calculate_habit_completion_rate(user_habit_id UUID, days_back INTEGER DEFAULT 30)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_days INTEGER;
  completed_days INTEGER;
BEGIN
  total_days := days_back;
  
  SELECT COUNT(*)::INTEGER INTO completed_days
  FROM habit_entries
  WHERE habit_entries.user_habit_id = calculate_habit_completion_rate.user_habit_id
    AND entry_date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;
  
  IF total_days = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (completed_days::DECIMAL / total_days::DECIMAL) * 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


