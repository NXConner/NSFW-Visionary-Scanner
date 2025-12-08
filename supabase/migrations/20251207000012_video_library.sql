-- Video Library System
-- Educational videos, tutorials, expert content, playlists, and progress tracking

-- Video library
CREATE TABLE IF NOT EXISTS video_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('education', 'exercise', 'technique', 'expert_interview', 'webinar', 'tutorial', 'nsfw_instructional')),
  
  -- Video metadata
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  
  -- Content details
  instructor_name TEXT,
  instructor_credentials TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[],
  
  -- Organization
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_nsfw BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video playlists
CREATE TABLE IF NOT EXISTS video_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  video_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist videos (many-to-many)
CREATE TABLE IF NOT EXISTS playlist_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES video_playlists(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES video_library(id) ON DELETE CASCADE,
  
  order_index INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(playlist_id, video_id)
);

-- User video progress
CREATE TABLE IF NOT EXISTS video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES video_library(id) ON DELETE CASCADE,
  
  progress_seconds INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  watch_count INTEGER DEFAULT 1,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, video_id)
);

-- Video bookmarks
CREATE TABLE IF NOT EXISTS video_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES video_library(id) ON DELETE CASCADE,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, video_id)
);

-- Video downloads (for offline viewing)
CREATE TABLE IF NOT EXISTS video_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES video_library(id) ON DELETE CASCADE,
  
  download_status TEXT DEFAULT 'pending' CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed')),
  download_progress DECIMAL(5,2) DEFAULT 0,
  local_file_path TEXT,
  file_size_bytes BIGINT,
  
  downloaded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- For temporary downloads
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, video_id)
);

-- Video ratings
CREATE TABLE IF NOT EXISTS video_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES video_library(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, video_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_library_category ON video_library(category, is_featured);
CREATE INDEX IF NOT EXISTS idx_video_library_premium ON video_library(is_premium);
CREATE INDEX IF NOT EXISTS idx_video_library_nsfw ON video_library(is_nsfw);
CREATE INDEX IF NOT EXISTS idx_video_playlists_user ON video_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist ON playlist_videos(playlist_id, order_index);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_video ON playlist_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_user ON video_progress(user_id, last_watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_progress_video ON video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_video_bookmarks_user ON video_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_video_downloads_user ON video_downloads(user_id, download_status);
CREATE INDEX IF NOT EXISTS idx_video_ratings_video ON video_ratings(video_id);

-- RLS Policies
ALTER TABLE video_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_ratings ENABLE ROW LEVEL SECURITY;

-- Video library policies (public read, admin write)
CREATE POLICY "Anyone can view videos"
  ON video_library FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage videos"
  ON video_library FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Video playlists policies
CREATE POLICY "Users can view public playlists or their own"
  ON video_playlists FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own playlists"
  ON video_playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
  ON video_playlists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
  ON video_playlists FOR DELETE
  USING (auth.uid() = user_id);

-- Playlist videos policies
CREATE POLICY "Users can view playlist videos"
  ON playlist_videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_playlists
      WHERE id = playlist_videos.playlist_id
        AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage videos in their own playlists"
  ON playlist_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM video_playlists
      WHERE id = playlist_videos.playlist_id AND user_id = auth.uid()
    )
  );

-- Video progress policies
CREATE POLICY "Users can manage their own video progress"
  ON video_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Video bookmarks policies
CREATE POLICY "Users can manage their own bookmarks"
  ON video_bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Video downloads policies
CREATE POLICY "Users can manage their own downloads"
  ON video_downloads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Video ratings policies
CREATE POLICY "Users can manage their own ratings"
  ON video_ratings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_video_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE video_library
  SET view_count = view_count + 1
  WHERE id = NEW.video_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_view_count
  AFTER INSERT ON video_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_video_view_count();

CREATE OR REPLACE FUNCTION update_playlist_video_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE video_playlists
    SET video_count = video_count + 1
    WHERE id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE video_playlists
    SET video_count = GREATEST(video_count - 1, 0)
    WHERE id = OLD.playlist_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_playlist_video_count
  AFTER INSERT OR DELETE ON playlist_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_video_count();

CREATE OR REPLACE FUNCTION update_video_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  total_ratings INTEGER;
BEGIN
  SELECT AVG(rating)::DECIMAL(3,2), COUNT(*)::INTEGER
  INTO avg_rating, total_ratings
  FROM video_ratings
  WHERE video_id = NEW.video_id;
  
  UPDATE video_library
  SET 
    rating_average = COALESCE(avg_rating, 0),
    rating_count = total_ratings
  WHERE id = NEW.video_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_rating
  AFTER INSERT OR UPDATE OR DELETE ON video_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_video_rating();


