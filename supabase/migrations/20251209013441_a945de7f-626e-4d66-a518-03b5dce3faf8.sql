-- ============================================================================
-- PART 2: Expert Content & Consultations System
-- ============================================================================

-- Expert Profiles
CREATE TABLE IF NOT EXISTS public.expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  credentials TEXT[] DEFAULT '{}',
  years_experience INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  consultation_rate_per_hour NUMERIC(10,2) DEFAULT 0.0,
  group_workshop_rate_per_person NUMERIC(10,2) DEFAULT 0.0,
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  availability_schedule JSONB DEFAULT '{}',
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure expert_profiles has is_available when table pre-exists
ALTER TABLE public.expert_profiles
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Expert Articles
CREATE TABLE IF NOT EXISTS public.expert_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Videos
CREATE TABLE IF NOT EXISTS public.expert_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Questions & Answers
CREATE TABLE IF NOT EXISTS public.expert_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'archived')),
  answer TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Consultations
CREATE TABLE IF NOT EXISTS public.expert_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('individual', 'group')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_amount NUMERIC(10,2) DEFAULT 0.0,
  meeting_url TEXT,
  recording_url TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Group Workshops
CREATE TABLE IF NOT EXISTS public.expert_group_workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_participants INTEGER DEFAULT 10,
  current_participants INTEGER DEFAULT 0,
  price_per_person NUMERIC(10,2) NOT NULL,
  meeting_url TEXT,
  recording_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop Participants
CREATE TABLE IF NOT EXISTS public.workshop_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.expert_group_workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workshop_id, user_id)
);

-- Ensure workshop_participants has workshop_id when table pre-exists
ALTER TABLE public.workshop_participants
  ADD COLUMN IF NOT EXISTS workshop_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workshop_participants_workshop_id_fkey'
  ) THEN
    ALTER TABLE public.workshop_participants
      ADD CONSTRAINT workshop_participants_workshop_id_fkey
      FOREIGN KEY (workshop_id) REFERENCES public.expert_group_workshops(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for Expert System
CREATE INDEX IF NOT EXISTS idx_expert_profiles_user_id ON public.expert_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_profiles_verified ON public.expert_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_expert_profiles_available ON public.expert_profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_expert_articles_expert_id ON public.expert_articles(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_articles_published ON public.expert_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_expert_videos_expert_id ON public.expert_videos(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_questions_expert_id ON public.expert_questions(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_questions_user_id ON public.expert_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_expert_id ON public.expert_consultations(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_user_id ON public.expert_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_scheduled ON public.expert_consultations(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_workshop_id ON public.workshop_participants(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_user_id ON public.workshop_participants(user_id);

-- RLS for Expert System
ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_group_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_participants ENABLE ROW LEVEL SECURITY;

-- Expert System Policies
DROP POLICY IF EXISTS "Anyone can view verified expert profiles" ON public.expert_profiles;
DROP POLICY IF EXISTS "Experts can manage own profile" ON public.expert_profiles;
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.expert_articles;
DROP POLICY IF EXISTS "Experts can manage own articles" ON public.expert_articles;
DROP POLICY IF EXISTS "Anyone can view published videos" ON public.expert_videos;
DROP POLICY IF EXISTS "Experts can manage own videos" ON public.expert_videos;
DROP POLICY IF EXISTS "Users can view own questions" ON public.expert_questions;
DROP POLICY IF EXISTS "Experts can view questions for them" ON public.expert_questions;
DROP POLICY IF EXISTS "Users can create questions" ON public.expert_questions;
DROP POLICY IF EXISTS "Experts can answer questions" ON public.expert_questions;
DROP POLICY IF EXISTS "Users can view own consultations" ON public.expert_consultations;
DROP POLICY IF EXISTS "Experts can view their consultations" ON public.expert_consultations;
DROP POLICY IF EXISTS "Users can book consultations" ON public.expert_consultations;
DROP POLICY IF EXISTS "Users and experts can update consultations" ON public.expert_consultations;
DROP POLICY IF EXISTS "Anyone can view workshops" ON public.expert_group_workshops;
DROP POLICY IF EXISTS "Experts can manage own workshops" ON public.expert_group_workshops;
DROP POLICY IF EXISTS "Users can view own workshop participation" ON public.workshop_participants;
DROP POLICY IF EXISTS "Users can join workshops" ON public.workshop_participants;

CREATE POLICY "Anyone can view verified expert profiles" ON public.expert_profiles FOR SELECT USING (is_verified = true AND is_available = true);
CREATE POLICY "Experts can manage own profile" ON public.expert_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view published articles" ON public.expert_articles FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "Experts can manage own articles" ON public.expert_articles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_articles.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Anyone can view published videos" ON public.expert_videos FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "Experts can manage own videos" ON public.expert_videos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_videos.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view own questions" ON public.expert_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Experts can view questions for them" ON public.expert_questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_questions.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create questions" ON public.expert_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Experts can answer questions" ON public.expert_questions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_questions.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view own consultations" ON public.expert_consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Experts can view their consultations" ON public.expert_consultations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_consultations.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can book consultations" ON public.expert_consultations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users and experts can update consultations" ON public.expert_consultations FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_consultations.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Anyone can view workshops" ON public.expert_group_workshops FOR SELECT USING (true);
CREATE POLICY "Experts can manage own workshops" ON public.expert_group_workshops FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_group_workshops.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view own workshop participation" ON public.workshop_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join workshops" ON public.workshop_participants FOR INSERT WITH CHECK (auth.uid() = user_id);