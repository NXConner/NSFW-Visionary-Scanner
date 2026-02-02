-- ============================================================================
-- PART 3: NSFW Video Content, Forum, Wellness Analytics & Supporting Tables
-- ============================================================================

-- NSFW Video Library
CREATE TABLE IF NOT EXISTS public.nsfw_video_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technique', 'tutorial', 'expert_interview', 'educational', 'demonstration', 'advanced', 'beginner')),
  video_url_sd TEXT,
  video_url_hd TEXT,
  video_url_4k TEXT,
  video_duration_seconds INTEGER,
  thumbnail_url TEXT,
  preview_gif_url TEXT,
  tags TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  content_rating TEXT CHECK (content_rating IN ('educational', 'demonstrative', 'explicit')),
  expert_id UUID REFERENCES auth.users(id),
  expert_name TEXT,
  expert_credentials TEXT,
  step_by_step_guide JSONB,
  key_points TEXT[],
  warnings TEXT[],
  prerequisites TEXT[],
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  requires_dlc BOOLEAN DEFAULT false,
  dlc_pack_id UUID,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Playlists
CREATE TABLE IF NOT EXISTS public.nsfw_video_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  playlist_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  video_ids UUID[] NOT NULL,
  video_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_curated BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  auto_play_next BOOLEAN DEFAULT true,
  shuffle_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Progress Tracking
CREATE TABLE IF NOT EXISTS public.nsfw_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_position_seconds INTEGER DEFAULT 0,
  watched_duration_seconds INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  playback_speed DECIMAL(3, 2) DEFAULT 1.0,
  quality_preference TEXT DEFAULT 'auto' CHECK (quality_preference IN ('sd', 'hd', '4k', 'auto')),
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_position_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Video Downloads
CREATE TABLE IF NOT EXISTS public.nsfw_video_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quality TEXT NOT NULL CHECK (quality IN ('sd', 'hd', '4k')),
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  download_status TEXT DEFAULT 'pending' CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed', 'paused')),
  downloaded_bytes INTEGER DEFAULT 0,
  download_progress DECIMAL(5, 2) DEFAULT 0,
  downloaded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Reviews
CREATE TABLE IF NOT EXISTS public.nsfw_video_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Video Watch History
CREATE TABLE IF NOT EXISTS public.nsfw_video_watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  watch_duration_seconds INTEGER,
  completion_percentage DECIMAL(5, 2),
  watch_source TEXT,
  referrer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Forum Categories
CREATE TABLE IF NOT EXISTS public.nsfw_forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  thread_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Forum Threads
CREATE TABLE IF NOT EXISTS public.nsfw_forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.nsfw_forum_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  thread_title TEXT NOT NULL,
  thread_content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Forum Posts
CREATE TABLE IF NOT EXISTS public.nsfw_forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.nsfw_forum_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  post_content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  parent_post_id UUID REFERENCES public.nsfw_forum_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sexual Function Tracking
CREATE TABLE IF NOT EXISTS public.nsfw_sexual_function_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  entry_time TIME,
  erectile_function_score INTEGER CHECK (erectile_function_score >= 1 AND erectile_function_score <= 10),
  erection_quality TEXT CHECK (erection_quality IN ('none', 'partial', 'full', 'rigid')),
  erection_duration_minutes INTEGER,
  erection_stability INTEGER CHECK (erection_stability >= 1 AND erection_stability <= 10),
  stamina_minutes INTEGER,
  control_level INTEGER CHECK (control_level >= 1 AND control_level <= 10),
  recovery_time_minutes INTEGER,
  activity_type TEXT CHECK (activity_type IN ('solo', 'partner', 'both')),
  partner_present BOOLEAN,
  environment TEXT,
  factors_affecting JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Libido Tracking
CREATE TABLE IF NOT EXISTS public.nsfw_libido_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  libido_level INTEGER NOT NULL CHECK (libido_level >= 1 AND libido_level <= 10),
  libido_direction TEXT CHECK (libido_direction IN ('increasing', 'stable', 'decreasing')),
  contributing_factors JSONB,
  inhibiting_factors JSONB,
  desire_frequency TEXT CHECK (desire_frequency IN ('multiple_daily', 'daily', 'few_times_week', 'weekly', 'less_often')),
  desire_intensity INTEGER CHECK (desire_intensity >= 1 AND desire_intensity <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Satisfaction Tracking
CREATE TABLE IF NOT EXISTS public.nsfw_satisfaction_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  overall_satisfaction INTEGER NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
  physical_satisfaction INTEGER CHECK (physical_satisfaction >= 1 AND physical_satisfaction <= 10),
  emotional_satisfaction INTEGER CHECK (emotional_satisfaction >= 1 AND emotional_satisfaction <= 10),
  partner_satisfaction INTEGER CHECK (partner_satisfaction >= 1 AND partner_satisfaction <= 10),
  mutual_satisfaction INTEGER CHECK (mutual_satisfaction >= 1 AND mutual_satisfaction <= 10),
  satisfaction_factors JSONB,
  dissatisfaction_factors JSONB,
  activity_type TEXT,
  partner_present BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Frequency Tracking
CREATE TABLE IF NOT EXISTS public.nsfw_frequency_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tracking_period_start DATE NOT NULL,
  tracking_period_end DATE NOT NULL,
  period_type TEXT DEFAULT 'weekly' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  solo_activity_count INTEGER DEFAULT 0,
  partner_activity_count INTEGER DEFAULT 0,
  total_activity_count INTEGER DEFAULT 0,
  average_per_week DECIMAL(5, 2),
  average_per_month DECIMAL(5, 2),
  frequency_trend TEXT CHECK (frequency_trend IN ('increasing', 'stable', 'decreasing', 'fluctuating')),
  trend_strength DECIMAL(3, 2),
  target_frequency_per_week DECIMAL(5, 2),
  goal_achieved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wellness Scores
CREATE TABLE IF NOT EXISTS public.nsfw_wellness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calculation_date DATE NOT NULL,
  calculation_period_days INTEGER DEFAULT 30,
  overall_wellness_score DECIMAL(5, 2) NOT NULL,
  function_score DECIMAL(5, 2),
  libido_score DECIMAL(5, 2),
  satisfaction_score DECIMAL(5, 2),
  frequency_score DECIMAL(5, 2),
  relationship_score DECIMAL(5, 2),
  score_trend TEXT CHECK (score_trend IN ('improving', 'stable', 'declining', 'fluctuating')),
  score_change DECIMAL(5, 2),
  insights TEXT[],
  recommendations TEXT[],
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure testimonials has featured when table pre-exists
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Success Stories
CREATE TABLE IF NOT EXISTS public.success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  before_stats JSONB,
  after_stats JSONB,
  duration_weeks INTEGER,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure success_stories has featured when table pre-exists
ALTER TABLE public.success_stories
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

ALTER TABLE public.success_stories
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Trust Badges
CREATE TABLE IF NOT EXISTS public.trust_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_name TEXT NOT NULL UNIQUE,
  badge_type TEXT NOT NULL,
  icon_url TEXT,
  description TEXT,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonial Votes
CREATE TABLE IF NOT EXISTS public.testimonial_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(testimonial_id, user_id)
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_category ON public.nsfw_video_content(category);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_premium ON public.nsfw_video_content(is_premium);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_featured ON public.nsfw_video_content(is_featured);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_playlists_user_id ON public.nsfw_video_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_progress_user_id ON public.nsfw_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_downloads_user_id ON public.nsfw_video_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_watch_history_user_id ON public.nsfw_video_watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_threads_category ON public.nsfw_forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_posts_thread ON public.nsfw_forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_sexual_function_user_date ON public.nsfw_sexual_function_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_libido_user_date ON public.nsfw_libido_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_satisfaction_user_date ON public.nsfw_satisfaction_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_frequency_user_id ON public.nsfw_frequency_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_wellness_scores_user_id ON public.nsfw_wellness_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON public.testimonials(featured);
CREATE INDEX IF NOT EXISTS idx_success_stories_featured ON public.success_stories(featured);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);

-- Enable RLS on all tables
ALTER TABLE public.nsfw_video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_video_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_video_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_video_watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_sexual_function_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_libido_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_satisfaction_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_frequency_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_wellness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Authenticated users can view approved videos" ON public.nsfw_video_content;
DROP POLICY IF EXISTS "Users can manage own playlists" ON public.nsfw_video_playlists;
DROP POLICY IF EXISTS "Users can view public playlists" ON public.nsfw_video_playlists;
DROP POLICY IF EXISTS "Users can manage own video progress" ON public.nsfw_video_progress;
DROP POLICY IF EXISTS "Users can manage own video downloads" ON public.nsfw_video_downloads;
DROP POLICY IF EXISTS "Users can manage own video reviews" ON public.nsfw_video_reviews;
DROP POLICY IF EXISTS "Users can view approved reviews" ON public.nsfw_video_reviews;
DROP POLICY IF EXISTS "Users can manage own watch history" ON public.nsfw_video_watch_history;
DROP POLICY IF EXISTS "Authenticated users can view forum categories" ON public.nsfw_forum_categories;
DROP POLICY IF EXISTS "Users can view approved threads" ON public.nsfw_forum_threads;
DROP POLICY IF EXISTS "Users can create threads" ON public.nsfw_forum_threads;
DROP POLICY IF EXISTS "Users can update own threads" ON public.nsfw_forum_threads;
DROP POLICY IF EXISTS "Users can view approved posts" ON public.nsfw_forum_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.nsfw_forum_posts;
DROP POLICY IF EXISTS "Users can manage own sexual function tracking" ON public.nsfw_sexual_function_tracking;
DROP POLICY IF EXISTS "Users can manage own libido tracking" ON public.nsfw_libido_tracking;
DROP POLICY IF EXISTS "Users can manage own satisfaction tracking" ON public.nsfw_satisfaction_tracking;
DROP POLICY IF EXISTS "Users can manage own frequency tracking" ON public.nsfw_frequency_tracking;
DROP POLICY IF EXISTS "Users can manage own wellness scores" ON public.nsfw_wellness_scores;
DROP POLICY IF EXISTS "Users can view verified testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can manage own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can view verified success stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can manage own success stories" ON public.success_stories;
DROP POLICY IF EXISTS "Anyone can view active trust badges" ON public.trust_badges;
DROP POLICY IF EXISTS "Users can manage own votes" ON public.testimonial_votes;
DROP POLICY IF EXISTS "Users can manage own subscription" ON public.user_subscriptions;

CREATE POLICY "Authenticated users can view approved videos" ON public.nsfw_video_content FOR SELECT TO authenticated USING (is_approved = true AND is_active = true);
CREATE POLICY "Users can manage own playlists" ON public.nsfw_video_playlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public playlists" ON public.nsfw_video_playlists FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage own video progress" ON public.nsfw_video_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video downloads" ON public.nsfw_video_downloads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video reviews" ON public.nsfw_video_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view approved reviews" ON public.nsfw_video_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can manage own watch history" ON public.nsfw_video_watch_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view forum categories" ON public.nsfw_forum_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view approved threads" ON public.nsfw_forum_threads FOR SELECT TO authenticated USING (is_approved = true OR auth.uid() = user_id);
CREATE POLICY "Users can create threads" ON public.nsfw_forum_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR (is_anonymous = true AND user_id IS NULL));
CREATE POLICY "Users can update own threads" ON public.nsfw_forum_threads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view approved posts" ON public.nsfw_forum_posts FOR SELECT TO authenticated USING (is_approved = true OR auth.uid() = user_id);
CREATE POLICY "Users can create posts" ON public.nsfw_forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR (is_anonymous = true AND user_id IS NULL));
CREATE POLICY "Users can manage own sexual function tracking" ON public.nsfw_sexual_function_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own libido tracking" ON public.nsfw_libido_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own satisfaction tracking" ON public.nsfw_satisfaction_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own frequency tracking" ON public.nsfw_frequency_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own wellness scores" ON public.nsfw_wellness_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view verified testimonials" ON public.testimonials FOR SELECT USING (verified = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own testimonials" ON public.testimonials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view verified success stories" ON public.success_stories FOR SELECT USING (verified = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own success stories" ON public.success_stories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active trust badges" ON public.trust_badges FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage own votes" ON public.testimonial_votes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subscription" ON public.user_subscriptions FOR ALL USING (auth.uid() = user_id);