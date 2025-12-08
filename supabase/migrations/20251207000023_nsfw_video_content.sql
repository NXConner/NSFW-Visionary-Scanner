-- Migration: NSFW Video Content System
-- Creates tables for NSFW educational videos, technique demonstrations, expert interviews, tutorials, and video management

-- NSFW Video Library
CREATE TABLE IF NOT EXISTS nsfw_video_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technique', 'tutorial', 'expert_interview', 'educational', 'demonstration', 'advanced', 'beginner')),
  
  -- Video files (different qualities)
  video_url_sd TEXT,
  video_url_hd TEXT,
  video_url_4k TEXT,
  video_duration_seconds INTEGER,
  
  -- Thumbnails
  thumbnail_url TEXT,
  preview_gif_url TEXT,
  
  -- Metadata
  tags TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  content_rating TEXT CHECK (content_rating IN ('educational', 'demonstrative', 'explicit')),
  
  -- Expert/creator
  expert_id UUID REFERENCES auth.users(id),
  expert_name TEXT,
  expert_credentials TEXT,
  
  -- Content details
  step_by_step_guide JSONB, -- Array of steps with timestamps
  key_points TEXT[],
  warnings TEXT[],
  prerequisites TEXT[],
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  
  -- Access
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  requires_dlc BOOLEAN DEFAULT false,
  dlc_pack_id UUID, -- References DLC pack if required
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Playlists
CREATE TABLE IF NOT EXISTS nsfw_video_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for curated/system playlists
  
  playlist_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  
  video_ids UUID[] NOT NULL, -- Array of video IDs
  video_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER,
  
  -- Settings
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_curated BOOLEAN DEFAULT false, -- System-curated playlist
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  
  -- Playback
  auto_play_next BOOLEAN DEFAULT true,
  shuffle_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Progress Tracking
CREATE TABLE IF NOT EXISTS nsfw_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progress
  current_position_seconds INTEGER DEFAULT 0,
  watched_duration_seconds INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  
  -- Playback settings
  playback_speed DECIMAL(3, 2) DEFAULT 1.0,
  quality_preference TEXT DEFAULT 'auto' CHECK (quality_preference IN ('sd', 'hd', '4k', 'auto')),
  
  -- Interaction
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_position_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(video_id, user_id)
);

-- Video Downloads (for offline viewing)
CREATE TABLE IF NOT EXISTS nsfw_video_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Download details
  quality TEXT NOT NULL CHECK (quality IN ('sd', 'hd', '4k')),
  file_path TEXT NOT NULL, -- Local file path
  file_size_bytes INTEGER,
  download_status TEXT DEFAULT 'pending' CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed', 'paused')),
  
  -- Progress
  downloaded_bytes INTEGER DEFAULT 0,
  download_progress DECIMAL(5, 2) DEFAULT 0,
  
  -- Metadata
  downloaded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- When download expires (for DRM)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Recommendations
CREATE TABLE IF NOT EXISTS nsfw_video_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
  recommendation_type TEXT CHECK (recommendation_type IN ('similar', 'next_in_series', 'trending', 'personalized', 'based_on_history')),
  
  -- AI metadata
  confidence_score DECIMAL(3, 2),
  reasoning TEXT,
  ai_model_version TEXT,
  
  -- User interaction
  was_viewed BOOLEAN DEFAULT false,
  was_watched BOOLEAN DEFAULT false,
  user_feedback TEXT,
  
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Reviews and Ratings
CREATE TABLE IF NOT EXISTS nsfw_video_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(video_id, user_id)
);

-- Video Watch History
CREATE TABLE IF NOT EXISTS nsfw_video_watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  watch_duration_seconds INTEGER,
  completion_percentage DECIMAL(5, 2),
  
  -- Context
  watch_source TEXT, -- 'search', 'recommendation', 'playlist', 'direct'
  referrer_id UUID, -- Playlist ID, recommendation ID, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_category ON nsfw_video_content(category);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_premium ON nsfw_video_content(is_premium);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_featured ON nsfw_video_content(is_featured);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_playlists_user_id ON nsfw_video_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_playlists_public ON nsfw_video_playlists(is_public);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_progress_user_id ON nsfw_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_progress_video_id ON nsfw_video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_downloads_user_id ON nsfw_video_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_downloads_status ON nsfw_video_downloads(download_status);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_recommendations_user_id ON nsfw_video_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_watch_history_user_id ON nsfw_video_watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_watch_history_watched_at ON nsfw_video_watch_history(watched_at);

-- RLS Policies
ALTER TABLE nsfw_video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_watch_history ENABLE ROW LEVEL SECURITY;

-- NSFW Video Content: All authenticated users can view approved content
CREATE POLICY "Authenticated users can view approved videos"
  ON nsfw_video_content FOR SELECT
  USING (auth.role() = 'authenticated' AND is_approved = true AND is_active = true);

-- Video Playlists: Users can view public and own
CREATE POLICY "Users can view public and own playlists"
  ON nsfw_video_playlists FOR SELECT
  USING (is_public = true OR auth.uid() = user_id OR is_curated = true);

CREATE POLICY "Users can manage own playlists"
  ON nsfw_video_playlists FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Video Progress: Users can view their own
CREATE POLICY "Users can manage own video progress"
  ON nsfw_video_progress FOR ALL
  USING (auth.uid() = user_id);

-- Video Downloads: Users can view their own
CREATE POLICY "Users can manage own video downloads"
  ON nsfw_video_downloads FOR ALL
  USING (auth.uid() = user_id);

-- Video Recommendations: Users can view their own
CREATE POLICY "Users can manage own video recommendations"
  ON nsfw_video_recommendations FOR ALL
  USING (auth.uid() = user_id);

-- Video Reviews: Users can view all, manage own
CREATE POLICY "Users can view all reviews"
  ON nsfw_video_reviews FOR SELECT
  USING (auth.role() = 'authenticated' AND (is_approved = true OR auth.uid() = user_id));

CREATE POLICY "Users can create own reviews"
  ON nsfw_video_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON nsfw_video_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Video Watch History: Users can view their own
CREATE POLICY "Users can view own watch history"
  ON nsfw_video_watch_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create watch history"
  ON nsfw_video_watch_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

