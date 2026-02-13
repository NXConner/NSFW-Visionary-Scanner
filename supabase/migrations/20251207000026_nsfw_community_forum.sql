-- Migration: NSFW Community Forum
-- Creates tables for NSFW discussion forums, anonymous posting, Q&A, success stories, support groups, and expert moderation

-- NSFW Forum Categories
CREATE TABLE IF NOT EXISTS nsfw_forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  
  -- Settings
  allows_anonymous BOOLEAN DEFAULT true,
  requires_moderation BOOLEAN DEFAULT true,
  is_expert_moderated BOOLEAN DEFAULT false,
  
  -- Statistics
  thread_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Forum Threads
CREATE TABLE IF NOT EXISTS nsfw_forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES nsfw_forum_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Posting options
  is_anonymous BOOLEAN DEFAULT false,
  is_qa_thread BOOLEAN DEFAULT false, -- Q&A thread
  is_success_story BOOLEAN DEFAULT false,
  is_support_group BOOLEAN DEFAULT false,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  moderation_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  -- Last activity
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Forum Posts (replies)
CREATE TABLE IF NOT EXISTS nsfw_forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES nsfw_forum_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
  
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_expert_answer BOOLEAN DEFAULT false, -- Marked as expert answer
  
  -- Engagement
  like_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  moderation_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Support Groups
CREATE TABLE IF NOT EXISTS nsfw_support_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  group_name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('health_condition', 'treatment', 'recovery', 'general_support', 'anonymous')),
  
  -- Settings
  is_private BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Statistics
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Group Members
CREATE TABLE IF NOT EXISTS nsfw_support_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES nsfw_support_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
  is_anonymous BOOLEAN DEFAULT false,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  
  UNIQUE(group_id, user_id)
);

-- NSFW Community Challenges
CREATE TABLE IF NOT EXISTS nsfw_community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  challenge_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  
  -- Challenge details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER,
  
  -- Participation
  participant_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  
  -- Leaderboard
  has_leaderboard BOOLEAN DEFAULT true,
  is_anonymous_leaderboard BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge Participants
CREATE TABLE IF NOT EXISTS nsfw_challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES nsfw_community_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Participation
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Progress
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  
  -- Leaderboard
  leaderboard_position INTEGER,
  is_anonymous BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Content Sharing (moderated)
CREATE TABLE IF NOT EXISTS nsfw_content_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
  
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', 'text', 'link')),
  content_url TEXT,
  content_text TEXT,
  
  -- Sharing context
  shared_in_thread_id UUID REFERENCES nsfw_forum_threads(id) ON DELETE CASCADE,
  shared_in_group_id UUID REFERENCES nsfw_support_groups(id) ON DELETE CASCADE,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Moderators
CREATE TABLE IF NOT EXISTS nsfw_expert_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  expert_name TEXT NOT NULL,
  credentials TEXT,
  bio TEXT,
  specialization TEXT[],
  
  -- Moderation stats
  moderation_count INTEGER DEFAULT 0,
  approval_count INTEGER DEFAULT 0,
  rejection_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_threads_category_id ON nsfw_forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_threads_user_id ON nsfw_forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_threads_approved ON nsfw_forum_threads(is_approved);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_posts_thread_id ON nsfw_forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_support_groups_user_id ON nsfw_support_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_support_group_members_group_id ON nsfw_support_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_challenge_participants_challenge_id ON nsfw_challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_challenge_participants_user_id ON nsfw_challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_content_sharing_moderation ON nsfw_content_sharing(moderation_status);

-- RLS Policies
ALTER TABLE nsfw_forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_support_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_support_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_content_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_expert_moderators ENABLE ROW LEVEL SECURITY;

-- NSFW Forum Categories: All authenticated users can view
CREATE POLICY "Authenticated users can view forum categories"
  ON nsfw_forum_categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- NSFW Forum Threads: Users can view approved threads
CREATE POLICY "Users can view approved threads"
  ON nsfw_forum_threads FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      is_approved = true OR 
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role::text IN ('admin', 'moderator')
      )
    )
  );

CREATE POLICY "Users can create threads"
  ON nsfw_forum_threads FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR 
      (is_anonymous = true AND user_id IS NULL)
    )
  );

CREATE POLICY "Users can update own threads"
  ON nsfw_forum_threads FOR UPDATE
  USING (auth.uid() = user_id);

-- NSFW Forum Posts: Users can view approved posts
CREATE POLICY "Users can view approved posts"
  ON nsfw_forum_posts FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      is_approved = true OR 
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role::text IN ('admin', 'moderator')
      )
    )
  );

CREATE POLICY "Users can create posts"
  ON nsfw_forum_posts FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR 
      (is_anonymous = true AND user_id IS NULL)
    )
  );

-- NSFW Support Groups: Members can view their groups
CREATE POLICY "Members can view their support groups"
  ON nsfw_support_groups FOR SELECT
  USING (
    is_private = false OR 
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM nsfw_support_group_members sgm 
      WHERE sgm.group_id = nsfw_support_groups.id 
      AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create support groups"
  ON nsfw_support_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Support Group Members: Members can view members of their groups
CREATE POLICY "Members can view group members"
  ON nsfw_support_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nsfw_support_group_members sgm 
      WHERE sgm.group_id = nsfw_support_group_members.group_id 
      AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join support groups"
  ON nsfw_support_group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM nsfw_support_groups sg 
        WHERE sg.id = nsfw_support_group_members.group_id 
        AND sg.is_private = false
      )
    )
  );

-- NSFW Community Challenges: All authenticated users can view active challenges
CREATE POLICY "Authenticated users can view active challenges"
  ON nsfw_community_challenges FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Challenge Participants: Users can view their own participation
CREATE POLICY "Users can manage own challenge participation"
  ON nsfw_challenge_participants FOR ALL
  USING (auth.uid() = user_id);

-- NSFW Content Sharing: Users can view approved content
CREATE POLICY "Users can view approved shared content"
  ON nsfw_content_sharing FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      moderation_status = 'approved' OR 
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role::text IN ('admin', 'moderator')
      )
    )
  );

CREATE POLICY "Users can create shared content"
  ON nsfw_content_sharing FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR 
      user_id IS NULL
    )
  );

-- Expert Moderators: All authenticated users can view
CREATE POLICY "Authenticated users can view expert moderators"
  ON nsfw_expert_moderators FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

