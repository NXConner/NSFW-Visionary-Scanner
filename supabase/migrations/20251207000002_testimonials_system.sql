-- Migration: Testimonials System
-- Creates tables for user testimonials, reviews, and trust badges

-- Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
  display_name TEXT, -- Anonymous display name
  is_anonymous BOOLEAN DEFAULT true,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('general', 'health', 'progress', 'support', 'premium')),
  is_verified BOOLEAN DEFAULT false, -- Verified user
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false, -- Moderation
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Testimonial Helpful Votes
CREATE TABLE IF NOT EXISTS testimonial_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(testimonial_id, user_id)
);

-- Success Stories Table
CREATE TABLE IF NOT EXISTS success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  before_data JSONB, -- Before metrics/data
  after_data JSONB, -- After metrics/data
  time_period TEXT, -- e.g., "3 months", "6 months"
  category TEXT CHECK (category IN ('growth', 'health', 'routine', 'overall')),
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Before/After Photos (Opt-in, Anonymous)
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  before_image_url TEXT,
  after_image_url TEXT,
  time_period TEXT,
  category TEXT CHECK (category IN ('growth', 'health', 'routine')),
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trust Badges Configuration
CREATE TABLE IF NOT EXISTS trust_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_name TEXT UNIQUE NOT NULL,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('security', 'compliance', 'certification', 'award')),
  icon_url TEXT,
  description TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_is_approved ON testimonials(is_approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_category ON testimonials(category);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating);
CREATE INDEX IF NOT EXISTS idx_testimonial_votes_testimonial ON testimonial_votes(testimonial_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_is_approved ON success_stories(is_approved);
CREATE INDEX IF NOT EXISTS idx_success_stories_is_featured ON success_stories(is_featured);
CREATE INDEX IF NOT EXISTS idx_progress_photos_is_approved ON progress_photos(is_approved);
CREATE INDEX IF NOT EXISTS idx_trust_badges_is_active ON trust_badges(is_active);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for testimonials
CREATE POLICY "Anyone can view approved testimonials" ON testimonials
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create own testimonials" ON testimonials
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own testimonials" ON testimonials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can moderate testimonials" ON testimonials
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for testimonial_votes
CREATE POLICY "Users can vote on testimonials" ON testimonial_votes
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for success_stories
CREATE POLICY "Anyone can view approved success stories" ON success_stories
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create own success stories" ON success_stories
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can moderate success stories" ON success_stories
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for progress_photos
CREATE POLICY "Anyone can view approved progress photos" ON progress_photos
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create own progress photos" ON progress_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can moderate progress photos" ON progress_photos
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for trust_badges (public read)
CREATE POLICY "Anyone can view active trust badges" ON trust_badges
  FOR SELECT USING (is_active = true);

-- Function to update helpful count
CREATE OR REPLACE FUNCTION update_testimonial_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE testimonials
    SET helpful_count = helpful_count + CASE WHEN NEW.is_helpful THEN 1 ELSE -1 END
    WHERE id = NEW.testimonial_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE testimonials
    SET helpful_count = helpful_count + CASE 
      WHEN NEW.is_helpful AND NOT OLD.is_helpful THEN 2
      WHEN NOT NEW.is_helpful AND OLD.is_helpful THEN -2
      ELSE 0
    END
    WHERE id = NEW.testimonial_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE testimonials
    SET helpful_count = helpful_count - CASE WHEN OLD.is_helpful THEN 1 ELSE -1 END
    WHERE id = OLD.testimonial_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for helpful count
CREATE TRIGGER trigger_update_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON testimonial_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonial_helpful_count();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_testimonial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonial_updated_at();

CREATE TRIGGER trigger_success_stories_updated_at
  BEFORE UPDATE ON success_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonial_updated_at();

