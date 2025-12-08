-- Migration: Enhanced Positions Gallery
-- Creates tables for position difficulty ratings, effectiveness tracking, reviews, playlists, recommendations, and analytics

-- Position Difficulty Ratings (user-submitted)
CREATE TABLE IF NOT EXISTS position_difficulty_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id TEXT NOT NULL, -- References position ID from positions data
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  difficulty_rating INTEGER NOT NULL CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
  physical_difficulty INTEGER CHECK (physical_difficulty >= 1 AND physical_difficulty <= 10),
  coordination_difficulty INTEGER CHECK (coordination_difficulty >= 1 AND coordination_difficulty <= 10),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(position_id, user_id)
);

-- Position Effectiveness Tracking
CREATE TABLE IF NOT EXISTS position_effectiveness_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  effectiveness_rating INTEGER NOT NULL CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
  pleasure_rating INTEGER CHECK (pleasure_rating >= 1 AND pleasure_rating <= 10),
  intensity_rating INTEGER CHECK (intensity_rating >= 1 AND intensity_rating <= 10),
  comfort_rating INTEGER CHECK (comfort_rating >= 1 AND comfort_rating <= 10),
  
  -- Context
  session_date DATE,
  partner_feedback TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position Reviews and Tips
CREATE TABLE IF NOT EXISTS position_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  tips TEXT[],
  pros TEXT[],
  cons TEXT[],
  
  -- Experience
  times_tried INTEGER DEFAULT 1,
  would_recommend BOOLEAN,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position Playlists (user-created)
CREATE TABLE IF NOT EXISTS position_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  playlist_name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  position_ids TEXT[] NOT NULL, -- Array of position IDs
  position_count INTEGER DEFAULT 0,
  
  view_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position Recommendations (AI-powered)
CREATE TABLE IF NOT EXISTS position_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  position_id TEXT NOT NULL,
  recommendation_type TEXT CHECK (recommendation_type IN ('similar', 'next_level', 'complementary', 'trending', 'personalized')),
  
  -- AI metadata
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  reasoning TEXT,
  ai_model_version TEXT,
  
  -- User interaction
  was_viewed BOOLEAN DEFAULT false,
  was_tried BOOLEAN DEFAULT false,
  user_feedback TEXT,
  
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position Viewing Analytics
CREATE TABLE IF NOT EXISTS position_viewing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  view_type TEXT CHECK (view_type IN ('gallery', 'detail', 'fullscreen', '3d', 'video')),
  view_duration_seconds INTEGER,
  interaction_count INTEGER DEFAULT 0, -- Clicks, zooms, etc.
  
  -- Viewing preferences
  viewing_angle TEXT, -- 'front', 'side', 'back', 'top', '360'
  zoom_level DECIMAL(3, 2),
  playback_speed DECIMAL(3, 2), -- For videos
  
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position Comparisons
CREATE TABLE IF NOT EXISTS position_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  position_ids TEXT[] NOT NULL, -- Array of 2+ position IDs to compare
  comparison_name TEXT,
  
  -- Comparison data
  comparison_results JSONB, -- {difficulty: {...}, effectiveness: {...}, etc.}
  insights TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position Variations
CREATE TABLE IF NOT EXISTS position_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_position_id TEXT NOT NULL,
  
  variation_name TEXT NOT NULL,
  description TEXT,
  difficulty_modifier INTEGER, -- -3 to +3 (easier to harder)
  
  -- Variation details
  modifications TEXT[], -- What's different
  benefits TEXT[],
  tips TEXT[],
  
  -- Media
  images TEXT[],
  videos TEXT[],
  
  created_by UUID REFERENCES auth.users(id),
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_position_difficulty_ratings_position_id ON position_difficulty_ratings(position_id);
CREATE INDEX IF NOT EXISTS idx_position_difficulty_ratings_user_id ON position_difficulty_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_position_effectiveness_position_id ON position_effectiveness_tracking(position_id);
CREATE INDEX IF NOT EXISTS idx_position_effectiveness_user_id ON position_effectiveness_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_position_reviews_position_id ON position_reviews(position_id);
CREATE INDEX IF NOT EXISTS idx_position_reviews_user_id ON position_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_position_playlists_user_id ON position_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_position_playlists_public ON position_playlists(is_public);
CREATE INDEX IF NOT EXISTS idx_position_recommendations_user_id ON position_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_position_viewing_analytics_position_id ON position_viewing_analytics(position_id);
CREATE INDEX IF NOT EXISTS idx_position_variations_base_id ON position_variations(base_position_id);

-- RLS Policies
ALTER TABLE position_difficulty_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_effectiveness_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_viewing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_variations ENABLE ROW LEVEL SECURITY;

-- Position Difficulty Ratings: Users can view all, manage own
CREATE POLICY "Users can view all difficulty ratings"
  ON position_difficulty_ratings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own difficulty ratings"
  ON position_difficulty_ratings FOR ALL
  USING (auth.uid() = user_id);

-- Position Effectiveness: Users can view all, manage own
CREATE POLICY "Users can view all effectiveness data"
  ON position_effectiveness_tracking FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own effectiveness data"
  ON position_effectiveness_tracking FOR ALL
  USING (auth.uid() = user_id);

-- Position Reviews: Users can view all, manage own
CREATE POLICY "Users can view all reviews"
  ON position_reviews FOR SELECT
  USING (auth.role() = 'authenticated' AND (is_approved = true OR auth.uid() = user_id));

CREATE POLICY "Users can create own reviews"
  ON position_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON position_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Position Playlists: Users can view public and own
CREATE POLICY "Users can view public and own playlists"
  ON position_playlists FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own playlists"
  ON position_playlists FOR ALL
  USING (auth.uid() = user_id);

-- Position Recommendations: Users can view their own
CREATE POLICY "Users can manage own recommendations"
  ON position_recommendations FOR ALL
  USING (auth.uid() = user_id);

-- Position Viewing Analytics: Users can view their own
CREATE POLICY "Users can view own viewing analytics"
  ON position_viewing_analytics FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can create viewing analytics"
  ON position_viewing_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Position Comparisons: Users can manage their own
CREATE POLICY "Users can manage own comparisons"
  ON position_comparisons FOR ALL
  USING (auth.uid() = user_id);

-- Position Variations: All authenticated users can view
CREATE POLICY "Authenticated users can view variations"
  ON position_variations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create variations"
  ON position_variations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

