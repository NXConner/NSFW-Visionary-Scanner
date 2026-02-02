-- Progress Sharing & Challenges System
-- Anonymous progress sharing, challenges, leaderboards, and community engagement

-- Progress shares (anonymous sharing)
CREATE TABLE IF NOT EXISTS progress_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  share_type TEXT NOT NULL CHECK (share_type IN ('scan', 'wellness', 'routine', 'achievement', 'milestone', 'general')),
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'chart', 'metric')),
  
  title TEXT,
  description TEXT,
  content_data JSONB, -- Flexible data storage
  
  -- Anonymization
  is_anonymous BOOLEAN DEFAULT true,
  display_name TEXT, -- Optional display name if not anonymous
  
  -- Engagement
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('30_day', '60_day', '90_day', 'custom', 'community', 'premium')),
  duration_days INTEGER NOT NULL,
  
  -- Goals and metrics
  goal_description TEXT,
  target_metrics JSONB, -- Flexible goal structure
  success_criteria JSONB,
  
  -- Timing
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false,
  
  -- Engagement
  participant_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  -- Rewards
  reward_description TEXT,
  badge_id UUID, -- Reference to achievement badge
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'paused')),
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  current_metrics JSONB,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(challenge_id, user_id)
);

-- Ensure challenge_participants has expected columns when table pre-exists
ALTER TABLE challenge_participants
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE challenge_participants
  ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) DEFAULT 0;

ALTER TABLE challenge_participants
  ADD COLUMN IF NOT EXISTS current_metrics JSONB;

ALTER TABLE challenge_participants
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE challenge_participants
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE challenge_participants
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Challenge check-ins (daily/weekly progress)
CREATE TABLE IF NOT EXISTS challenge_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES challenge_participants(id) ON DELETE CASCADE,
  
  checkin_date DATE NOT NULL,
  metrics JSONB,
  notes TEXT,
  photo_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(participant_id, checkin_date)
);

-- Leaderboards (opt-in, anonymous)
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('challenge', 'overall', 'monthly', 'all_time', 'category')),
  
  metric_type TEXT NOT NULL CHECK (metric_type IN ('wellness_score', 'streak', 'achievements', 'challenge_completion', 'reputation', 'custom')),
  period_start DATE,
  period_end DATE,
  
  is_active BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT true,
  requires_opt_in BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure leaderboards has expected columns when table pre-exists
ALTER TABLE leaderboards
  ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE leaderboards
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE leaderboards
  ADD COLUMN IF NOT EXISTS metric_type TEXT;

ALTER TABLE leaderboards
  ADD COLUMN IF NOT EXISTS period_start DATE;

ALTER TABLE leaderboards
  ADD COLUMN IF NOT EXISTS period_end DATE;

ALTER TABLE leaderboards
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE leaderboards
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT true;

ALTER TABLE leaderboards
  ADD COLUMN IF NOT EXISTS requires_opt_in BOOLEAN DEFAULT true;

ALTER TABLE leaderboards
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE leaderboards
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Leaderboard entries
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rank INTEGER,
  score DECIMAL(10,2),
  display_name TEXT, -- For anonymous leaderboards
  is_anonymous BOOLEAN DEFAULT true,
  
  metrics JSONB,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(leaderboard_id, user_id)
);

-- Progress share interactions (likes, comments)
CREATE TABLE IF NOT EXISTS progress_share_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_id UUID NOT NULL REFERENCES progress_shares(id) ON DELETE CASCADE,
  
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'comment', 'share')),
  comment_text TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, share_id, interaction_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_progress_shares_user ON progress_shares(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_shares_type ON progress_shares(share_type, is_approved);
CREATE INDEX IF NOT EXISTS idx_progress_shares_featured ON progress_shares(is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active, start_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id, status);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id, status);
CREATE INDEX IF NOT EXISTS idx_challenge_checkins_participant ON challenge_checkins(participant_id, checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_leaderboard ON leaderboard_entries(leaderboard_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_share_interactions_share ON progress_share_interactions(share_id);

-- RLS Policies
ALTER TABLE progress_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_share_interactions ENABLE ROW LEVEL SECURITY;

-- Ensure policies are idempotent if rerun
DROP POLICY IF EXISTS "Anyone can view approved progress shares" ON progress_shares;
DROP POLICY IF EXISTS "Users can create their own progress shares" ON progress_shares;
DROP POLICY IF EXISTS "Users can update their own progress shares" ON progress_shares;
DROP POLICY IF EXISTS "Users can delete their own progress shares" ON progress_shares;
DROP POLICY IF EXISTS "Anyone can view active challenges" ON challenges;
DROP POLICY IF EXISTS "Users can view challenge participants" ON challenge_participants;
DROP POLICY IF EXISTS "Users can manage their own challenge participation" ON challenge_participants;
DROP POLICY IF EXISTS "Users can view check-ins for challenges they participate in" ON challenge_checkins;
DROP POLICY IF EXISTS "Users can create check-ins for their own participation" ON challenge_checkins;
DROP POLICY IF EXISTS "Anyone can view leaderboards" ON leaderboards;
DROP POLICY IF EXISTS "Anyone can view leaderboard entries" ON leaderboard_entries;
DROP POLICY IF EXISTS "Users can manage their own interactions" ON progress_share_interactions;

-- Progress shares policies
CREATE POLICY "Anyone can view approved progress shares"
  ON progress_shares FOR SELECT
  USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own progress shares"
  ON progress_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress shares"
  ON progress_shares FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress shares"
  ON progress_shares FOR DELETE
  USING (auth.uid() = user_id);

-- Challenges policies
CREATE POLICY "Anyone can view active challenges"
  ON challenges FOR SELECT
  USING (true);

-- Challenge participants policies
CREATE POLICY "Users can view challenge participants"
  ON challenge_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own challenge participation"
  ON challenge_participants FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Challenge check-ins policies
CREATE POLICY "Users can view check-ins for challenges they participate in"
  ON challenge_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE id = challenge_checkins.participant_id
        AND (user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM challenge_participants cp2
          WHERE cp2.challenge_id = challenge_participants.challenge_id
            AND cp2.user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create check-ins for their own participation"
  ON challenge_checkins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE id = challenge_checkins.participant_id AND user_id = auth.uid()
    )
  );

-- Leaderboards policies
CREATE POLICY "Anyone can view leaderboards"
  ON leaderboards FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view leaderboard entries"
  ON leaderboard_entries FOR SELECT
  USING (true);

-- Progress share interactions policies
CREATE POLICY "Users can manage their own interactions"
  ON progress_share_interactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_challenge_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE challenges
    SET participant_count = participant_count + 1
    WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE challenges
    SET participant_count = GREATEST(participant_count - 1, 0)
    WHERE id = OLD.challenge_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_challenge_participant_count
  AFTER INSERT OR DELETE ON challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_participant_count();

CREATE OR REPLACE FUNCTION update_progress_share_interaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.interaction_type = 'like' THEN
      UPDATE progress_shares
      SET like_count = like_count + 1
      WHERE id = NEW.share_id;
    ELSIF NEW.interaction_type = 'comment' THEN
      UPDATE progress_shares
      SET comment_count = comment_count + 1
      WHERE id = NEW.share_id;
    ELSIF NEW.interaction_type = 'share' THEN
      UPDATE progress_shares
      SET share_count = share_count + 1
      WHERE id = NEW.share_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.interaction_type = 'like' THEN
      UPDATE progress_shares
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE id = OLD.share_id;
    ELSIF OLD.interaction_type = 'comment' THEN
      UPDATE progress_shares
      SET comment_count = GREATEST(comment_count - 1, 0)
      WHERE id = OLD.share_id;
    ELSIF OLD.interaction_type = 'share' THEN
      UPDATE progress_shares
      SET share_count = GREATEST(share_count - 1, 0)
      WHERE id = OLD.share_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_progress_share_interaction_count
  AFTER INSERT OR DELETE ON progress_share_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_progress_share_interaction_count();


