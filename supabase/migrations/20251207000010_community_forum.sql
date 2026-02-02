-- Community Forum System
-- Discussion boards, threads, posts, replies, moderation, and user engagement

-- Forum categories
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  is_nsfw BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  requires_premium BOOLEAN DEFAULT false,
  post_count INTEGER DEFAULT 0,
  thread_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum threads
CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_expert_qa BOOLEAN DEFAULT false,
  is_success_story BOOLEAN DEFAULT false,
  
  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  moderation_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  
  -- Last activity
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum posts (replies to threads)
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE, -- For nested replies
  
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_expert_answer BOOLEAN DEFAULT false,
  
  -- Engagement
  like_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  moderation_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure forum_posts has expected columns/constraints when table pre-exists
ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS thread_id UUID;

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS parent_post_id UUID;

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS is_expert_answer BOOLEAN DEFAULT false;

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS moderated_by UUID;

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'forum_posts_thread_id_fkey'
  ) THEN
    ALTER TABLE forum_posts
      ADD CONSTRAINT forum_posts_thread_id_fkey
      FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'forum_posts_parent_post_id_fkey'
  ) THEN
    ALTER TABLE forum_posts
      ADD CONSTRAINT forum_posts_parent_post_id_fkey
      FOREIGN KEY (parent_post_id) REFERENCES forum_posts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- User interactions (likes, helpful marks)
CREATE TABLE IF NOT EXISTS forum_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content_type TEXT NOT NULL CHECK (content_type IN ('thread', 'post')),
  content_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'helpful', 'bookmark')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, content_type, content_id, interaction_type)
);

-- User reputation/points
CREATE TABLE IF NOT EXISTS forum_user_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  reputation_points INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  thread_count INTEGER DEFAULT 0,
  helpful_marks_received INTEGER DEFAULT 0,
  expert_answers_count INTEGER DEFAULT 0,
  
  -- Badges/achievements
  badges TEXT[],
  level INTEGER DEFAULT 1,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation actions log
CREATE TABLE IF NOT EXISTS forum_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  
  action_type TEXT NOT NULL CHECK (action_type IN ('approve', 'reject', 'delete', 'lock', 'unlock', 'pin', 'unpin', 'warn', 'ban')),
  content_type TEXT NOT NULL CHECK (content_type IN ('thread', 'post', 'user')),
  content_id UUID NOT NULL,
  
  reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Q&A sessions
CREATE TABLE IF NOT EXISTS forum_expert_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES auth.users(id),
  category_id UUID REFERENCES forum_categories(id),
  
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  actual_start_at TIMESTAMPTZ,
  actual_end_at TIMESTAMPTZ,
  
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  
  question_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support groups (peer support)
CREATE TABLE IF NOT EXISTS forum_support_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('health_condition', 'treatment', 'recovery', 'general_support')),
  
  is_private BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support group members
CREATE TABLE IF NOT EXISTS forum_support_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES forum_support_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(group_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_user ON forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_pinned ON forum_threads(is_pinned DESC, last_reply_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_approved ON forum_threads(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_parent ON forum_posts(parent_post_id);
CREATE INDEX IF NOT EXISTS idx_forum_interactions_user ON forum_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_interactions_content ON forum_interactions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_forum_moderation_log_moderator ON forum_moderation_log(moderator_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_expert_sessions_status ON forum_expert_sessions(status, scheduled_start_at);
CREATE INDEX IF NOT EXISTS idx_forum_support_groups_category ON forum_support_groups(category);
CREATE INDEX IF NOT EXISTS idx_forum_support_group_members_user ON forum_support_group_members(user_id);

-- RLS Policies
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_expert_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_support_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_support_group_members ENABLE ROW LEVEL SECURITY;

-- Forum categories policies (public read, admin write)
CREATE POLICY "Anyone can view forum categories"
  ON forum_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage forum categories"
  ON forum_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Forum threads policies
CREATE POLICY "Anyone can view approved threads"
  ON forum_threads FOR SELECT
  USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create threads"
  ON forum_threads FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own threads"
  ON forum_threads FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own threads"
  ON forum_threads FOR DELETE
  USING (user_id = auth.uid());

-- Forum posts policies
CREATE POLICY "Anyone can view approved posts"
  ON forum_posts FOR SELECT
  USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create posts"
  ON forum_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own posts"
  ON forum_posts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts"
  ON forum_posts FOR DELETE
  USING (user_id = auth.uid());

-- Forum interactions policies
CREATE POLICY "Users can manage their own interactions"
  ON forum_interactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User reputation policies
CREATE POLICY "Users can view all reputation"
  ON forum_user_reputation FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own reputation"
  ON forum_user_reputation FOR SELECT
  USING (auth.uid() = user_id);

-- Expert sessions policies
CREATE POLICY "Anyone can view expert sessions"
  ON forum_expert_sessions FOR SELECT
  USING (true);

-- Support groups policies
CREATE POLICY "Anyone can view public support groups"
  ON forum_support_groups FOR SELECT
  USING (is_private = false OR EXISTS (
    SELECT 1 FROM forum_support_group_members
    WHERE group_id = forum_support_groups.id AND user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create support groups"
  ON forum_support_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Support group members policies
CREATE POLICY "Users can view group members"
  ON forum_support_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forum_support_groups
      WHERE id = group_id AND (is_private = false OR EXISTS (
        SELECT 1 FROM forum_support_group_members
        WHERE group_id = forum_support_group_members.group_id AND user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can join support groups"
  ON forum_support_group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_threads
    SET 
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at,
      last_reply_by = NEW.user_id
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_threads
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thread_reply_count
  AFTER INSERT OR DELETE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_reply_count();

CREATE OR REPLACE FUNCTION update_category_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_categories
    SET 
      thread_count = thread_count + 1,
      last_activity_at = NEW.created_at
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_categories
    SET thread_count = GREATEST(thread_count - 1, 0)
    WHERE id = OLD.category_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_category_stats
  AFTER INSERT OR DELETE ON forum_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_category_stats();

CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.interaction_type = 'helpful' THEN
    -- Update reputation for helpful marks
    IF NEW.content_type = 'post' THEN
      UPDATE forum_user_reputation
      SET helpful_marks_received = helpful_marks_received + 1,
          reputation_points = reputation_points + 5
      WHERE user_id = (
        SELECT user_id FROM forum_posts WHERE id = NEW.content_id
      );
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_reputation
  AFTER INSERT ON forum_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_reputation();

