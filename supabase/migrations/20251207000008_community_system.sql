-- Migration: Community System
-- Creates tables for forums, discussions, posts, comments, and social features

-- Community Forums
CREATE TABLE IF NOT EXISTS community_forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('general', 'health', 'progress', 'support', 'nsfw', 'education')),
  icon_url TEXT,
  is_nsfw BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Posts
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES community_forums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Comments
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Likes
CREATE TABLE IF NOT EXISTS forum_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comment Likes
CREATE TABLE IF NOT EXISTS forum_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES forum_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- User Follows (Follow other users)
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Challenges
CREATE TABLE IF NOT EXISTS community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('streak', 'goal', 'milestone', 'community')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rules JSONB,
  rewards JSONB,
  participant_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge Participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES community_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_data JSONB,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forum_posts_forum ON forum_posts(forum_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_user ON forum_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent ON forum_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_read ON direct_messages(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);

-- Enable RLS
ALTER TABLE community_forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active forums" ON community_forums
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view forum posts" ON forum_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create own posts" ON forum_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments" ON forum_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create own comments" ON forum_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON forum_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can like posts" ON forum_post_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can like comments" ON forum_comment_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own follows" ON user_follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can manage own follows" ON user_follows
  FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Users can view own messages" ON direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own received messages" ON direct_messages
  FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Anyone can view active challenges" ON community_challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own challenge participation" ON challenge_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges" ON challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_forum_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_forums
    SET post_count = post_count + 1
    WHERE id = NEW.forum_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_forums
    SET post_count = GREATEST(post_count - 1, 0)
    WHERE id = OLD.forum_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_forum_post_counts
  AFTER INSERT OR DELETE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_post_counts();

CREATE TRIGGER trigger_update_post_comment_count
  AFTER INSERT OR DELETE ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

CREATE TRIGGER trigger_update_post_like_count
  AFTER INSERT OR DELETE ON forum_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_community_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_forums_updated_at
  BEFORE UPDATE ON community_forums
  FOR EACH ROW
  EXECUTE FUNCTION update_community_updated_at();

CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_community_updated_at();

CREATE TRIGGER trigger_comments_updated_at
  BEFORE UPDATE ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_community_updated_at();

