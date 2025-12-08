-- Migration: Achievement System
-- Creates tables for achievements, badges, streaks, and milestones

-- Achievement Definitions Table
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('consistency', 'progress', 'health', 'community', 'premium', 'special')),
  icon_name TEXT,
  badge_color TEXT DEFAULT '#3b82f6',
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('streak', 'count', 'milestone', 'custom')),
  requirement_value INTEGER,
  requirement_data JSONB, -- For custom requirements
  points INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  progress_data JSONB, -- Store additional progress data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Streak Tracking Table
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL CHECK (streak_type IN ('scan', 'routine', 'diary', 'education', 'community')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

-- Milestone Tracking Table
CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('scan_count', 'routine_count', 'diary_count', 'days_active', 'measurement_growth', 'custom')),
  milestone_value INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  milestone_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard Table (Opt-in, Anonymous)
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('achievements', 'streaks', 'progress', 'community')),
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  is_anonymous BOOLEAN DEFAULT true,
  display_name TEXT, -- Anonymous identifier
  period TEXT NOT NULL DEFAULT 'all_time' CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, leaderboard_type, period, period_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_category ON achievement_definitions(category);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_code ON achievement_definitions(code);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_is_active ON achievement_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_is_unlocked ON user_achievements(is_unlocked);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON user_streaks(streak_type);
CREATE INDEX IF NOT EXISTS idx_user_streaks_is_active ON user_streaks(is_active);
CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id ON user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_type ON user_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_leaderboards_type_period ON leaderboards(leaderboard_type, period);
CREATE INDEX IF NOT EXISTS idx_leaderboards_score ON leaderboards(score DESC);

-- Enable RLS
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievement_definitions (public read)
CREATE POLICY "Anyone can view active achievement definitions" ON achievement_definitions
  FOR SELECT USING (is_active = true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage achievements" ON user_achievements
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for user_streaks
CREATE POLICY "Users can view own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage streaks" ON user_streaks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for user_milestones
CREATE POLICY "Users can view own milestones" ON user_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage milestones" ON user_milestones
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for leaderboards (public read for opt-in users)
CREATE POLICY "Anyone can view leaderboards" ON leaderboards
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own leaderboard entries" ON leaderboards
  FOR ALL USING (auth.uid() = user_id);

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievement_progress(
  p_user_id UUID,
  p_achievement_code TEXT,
  p_progress_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_achievement achievement_definitions%ROWTYPE;
  v_user_achievement user_achievements%ROWTYPE;
  v_new_progress INTEGER;
  v_unlocked BOOLEAN := false;
BEGIN
  -- Get achievement definition
  SELECT * INTO v_achievement
  FROM achievement_definitions
  WHERE code = p_achievement_code AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get or create user achievement
  SELECT * INTO v_user_achievement
  FROM user_achievements
  WHERE user_id = p_user_id AND achievement_id = v_achievement.id;
  
  IF NOT FOUND THEN
    INSERT INTO user_achievements (user_id, achievement_id, progress)
    VALUES (p_user_id, v_achievement.id, p_progress_increment)
    RETURNING * INTO v_user_achievement;
  ELSE
    v_new_progress := v_user_achievement.progress + p_progress_increment;
    
    UPDATE user_achievements
    SET progress = v_new_progress,
        updated_at = NOW()
    WHERE id = v_user_achievement.id
    RETURNING * INTO v_user_achievement;
  END IF;
  
  -- Check if achievement should be unlocked
  IF NOT v_user_achievement.is_unlocked THEN
    CASE v_achievement.requirement_type
      WHEN 'streak' THEN
        IF v_user_achievement.progress >= COALESCE(v_achievement.requirement_value, 0) THEN
          v_unlocked := true;
        END IF;
      WHEN 'count' THEN
        IF v_user_achievement.progress >= COALESCE(v_achievement.requirement_value, 0) THEN
          v_unlocked := true;
        END IF;
      WHEN 'milestone' THEN
        IF v_user_achievement.progress >= COALESCE(v_achievement.requirement_value, 0) THEN
          v_unlocked := true;
        END IF;
      ELSE
        -- Custom requirement logic would go here
        v_unlocked := false;
    END CASE;
    
    IF v_unlocked THEN
      UPDATE user_achievements
      SET is_unlocked = true,
          unlocked_at = NOW(),
          updated_at = NOW()
      WHERE id = v_user_achievement.id;
    END IF;
  END IF;
  
  RETURN v_unlocked;
END;
$$ LANGUAGE plpgsql;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_streak(
  p_user_id UUID,
  p_streak_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_streak user_streaks%ROWTYPE;
  v_new_streak INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get or create streak
  SELECT * INTO v_streak
  FROM user_streaks
  WHERE user_id = p_user_id AND streak_type = p_streak_type;
  
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_start_date)
    VALUES (p_user_id, p_streak_type, 1, 1, v_today, v_today)
    RETURNING * INTO v_streak;
    RETURN 1;
  END IF;
  
  -- Check if streak is broken (last activity was not yesterday)
  IF v_streak.last_activity_date IS NULL OR v_streak.last_activity_date < v_today - INTERVAL '1 day' THEN
    -- Reset streak if broken
    IF v_streak.last_activity_date < v_today - INTERVAL '1 day' THEN
      UPDATE user_streaks
      SET current_streak = 1,
          streak_start_date = v_today,
          last_activity_date = v_today,
          updated_at = NOW()
      WHERE id = v_streak.id;
      RETURN 1;
    END IF;
  END IF;
  
  -- Increment streak if continuing
  IF v_streak.last_activity_date = v_today - INTERVAL '1 day' OR v_streak.last_activity_date = v_today THEN
    IF v_streak.last_activity_date < v_today THEN
      v_new_streak := v_streak.current_streak + 1;
      
      UPDATE user_streaks
      SET current_streak = v_new_streak,
          longest_streak = GREATEST(longest_streak, v_new_streak),
          last_activity_date = v_today,
          updated_at = NOW()
      WHERE id = v_streak.id;
      
      RETURN v_new_streak;
    END IF;
  END IF;
  
  RETURN v_streak.current_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_achievement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_achievement_definitions_updated_at
  BEFORE UPDATE ON achievement_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_achievement_updated_at();

CREATE TRIGGER trigger_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_achievement_updated_at();

CREATE TRIGGER trigger_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_achievement_updated_at();

CREATE TRIGGER trigger_leaderboards_updated_at
  BEFORE UPDATE ON leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION update_achievement_updated_at();

