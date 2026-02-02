-- Migration: Expert Content & Consultations System
-- Creates tables for expert profiles, content, Q&A, live consultations, workshops, bookings, and ratings

-- Expert Profiles
CREATE TABLE IF NOT EXISTS expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Expert details
  expert_name TEXT NOT NULL,
  expert_title TEXT NOT NULL, -- e.g., "Certified Sex Therapist", "Intimacy Coach"
  bio TEXT,
  specialties TEXT[] NOT NULL, -- Array of specialties
  credentials TEXT[], -- Certifications, degrees, etc.
  years_experience INTEGER,
  
  -- Media
  profile_image_url TEXT,
  cover_image_url TEXT,
  video_intro_url TEXT,
  
  -- Contact & Availability
  email TEXT,
  website_url TEXT,
  social_media_links JSONB, -- LinkedIn, Twitter, etc.
  timezone TEXT DEFAULT 'UTC',
  availability_schedule JSONB, -- Weekly schedule
  
  -- Pricing
  consultation_rate_per_hour DECIMAL(10, 2) NOT NULL,
  workshop_rate_per_person DECIMAL(10, 2),
  group_workshop_rate DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  verification_date DATE,
  
  -- Statistics
  total_consultations INTEGER DEFAULT 0,
  total_workshops INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Expert Articles
CREATE TABLE IF NOT EXISTS expert_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  
  -- Article details
  article_title TEXT NOT NULL,
  article_slug TEXT NOT NULL UNIQUE,
  article_content TEXT NOT NULL,
  excerpt TEXT,
  
  -- Categories
  category TEXT NOT NULL,
  tags TEXT[],
  
  -- Media
  featured_image_url TEXT,
  video_url TEXT,
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Videos
CREATE TABLE IF NOT EXISTS expert_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  
  -- Video details
  video_title TEXT NOT NULL,
  video_description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  
  -- Categories
  category TEXT NOT NULL,
  tags TEXT[],
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_free_preview BOOLEAN DEFAULT false,
  preview_duration_seconds INTEGER, -- Free preview length
  
  -- Pricing
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Q&A
CREATE TABLE IF NOT EXISTS expert_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Question
  question_text TEXT NOT NULL,
  question_category TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Answer
  answer_text TEXT,
  answered_at TIMESTAMPTZ,
  
  -- Status
  is_answered BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  
  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultation Bookings
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Booking details
  booking_type TEXT NOT NULL CHECK (booking_type IN ('individual', 'couple', 'group')),
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('live_video', 'live_audio', 'chat', 'email')),
  
  -- Schedule
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  timezone TEXT,
  
  -- Status
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Details
  topic TEXT,
  concerns TEXT,
  goals TEXT,
  preferred_approach TEXT,
  
  -- Payment
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_intent_id TEXT,
  
  -- Session
  session_url TEXT, -- Video/audio call link
  session_recording_url TEXT, -- If recorded
  session_notes TEXT, -- Expert notes
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_scheduled_at TIMESTAMPTZ,
  
  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop Bookings
CREATE TABLE IF NOT EXISTS workshop_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL, -- References workshop (would be in separate table)
  
  -- Booking details
  workshop_title TEXT NOT NULL,
  workshop_type TEXT NOT NULL CHECK (workshop_type IN ('live', 'recorded', 'hybrid')),
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  
  -- Schedule
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  timezone TEXT,
  
  -- Status
  booking_status TEXT DEFAULT 'open' CHECK (booking_status IN ('open', 'full', 'in_progress', 'completed', 'cancelled')),
  
  -- Pricing
  price_per_person DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Session
  session_url TEXT,
  session_recording_url TEXT,
  materials_url TEXT, -- Workshop materials download
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop Participants
CREATE TABLE IF NOT EXISTS workshop_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_booking_id UUID NOT NULL REFERENCES workshop_bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment
  amount_paid DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_intent_id TEXT,
  
  -- Attendance
  attended BOOLEAN DEFAULT false,
  attendance_notes TEXT,
  
  -- Feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(workshop_booking_id, user_id)
);

-- Expert Ratings & Reviews
CREATE TABLE IF NOT EXISTS expert_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES consultation_bookings(id) ON DELETE SET NULL,
  workshop_id UUID REFERENCES workshop_bookings(id) ON DELETE SET NULL,
  
  -- Rating
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  
  -- Review
  review_title TEXT,
  review_text TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  
  -- Moderation
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(expert_id, user_id, consultation_id, workshop_id)
);

-- Follow-up Sessions
CREATE TABLE IF NOT EXISTS follow_up_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_consultation_id UUID NOT NULL REFERENCES consultation_bookings(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session details
  session_type TEXT NOT NULL CHECK (session_type IN ('follow_up', 'check_in', 'progress_review')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  
  -- Status
  session_status TEXT DEFAULT 'scheduled' CHECK (session_status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  
  -- Notes
  progress_notes TEXT,
  recommendations TEXT,
  
  -- Payment (may be discounted or free)
  amount DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending',
  
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expert_profiles_user_id ON expert_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_profiles_active ON expert_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_expert_articles_expert_id ON expert_articles(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_articles_published ON expert_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_expert_videos_expert_id ON expert_videos(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_qa_expert_id ON expert_qa(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_qa_answered ON expert_qa(is_answered);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_expert_id ON consultation_bookings(expert_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_user_id ON consultation_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_status ON consultation_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_expert_id ON workshop_bookings(expert_id);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_workshop_id ON workshop_participants(workshop_booking_id);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_user_id ON workshop_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_ratings_expert_id ON expert_ratings(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_ratings_user_id ON expert_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_sessions_consultation_id ON follow_up_sessions(original_consultation_id);

-- RLS Policies
ALTER TABLE expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_sessions ENABLE ROW LEVEL SECURITY;

-- Expert Profiles: Public can view, experts can manage their own
CREATE POLICY "Public can view active expert profiles"
  ON expert_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Experts can manage own profile"
  ON expert_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Expert Articles: Public can view published articles
CREATE POLICY "Public can view published articles"
  ON expert_articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Experts can manage own articles"
  ON expert_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM expert_profiles ep
      WHERE ep.id = expert_articles.expert_id
      AND ep.user_id = auth.uid()
    )
  );

-- Expert Videos: Public can view published videos
CREATE POLICY "Public can view published videos"
  ON expert_videos FOR SELECT
  USING (is_published = true);

CREATE POLICY "Experts can manage own videos"
  ON expert_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM expert_profiles ep
      WHERE ep.id = expert_videos.expert_id
      AND ep.user_id = auth.uid()
    )
  );

-- Expert Q&A: Public can view answered Q&A
CREATE POLICY "Public can view answered Q&A"
  ON expert_qa FOR SELECT
  USING (is_answered = true AND is_public = true);

CREATE POLICY "Users can create Q&A"
  ON expert_qa FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Experts can answer Q&A"
  ON expert_qa FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM expert_profiles ep
      WHERE ep.id = expert_qa.expert_id
      AND ep.user_id = auth.uid()
    )
  );

-- Consultation Bookings: Users can manage their own bookings
CREATE POLICY "Users can manage own consultation bookings"
  ON consultation_bookings FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = expert_id);

-- Workshop Bookings: Public can view open workshops
CREATE POLICY "Public can view open workshops"
  ON workshop_bookings FOR SELECT
  USING (booking_status = 'open');

-- Workshop Participants: Users can manage their own participation
CREATE POLICY "Users can manage own workshop participation"
  ON workshop_participants FOR ALL
  USING (auth.uid() = user_id);

-- Expert Ratings: Public can view public ratings
CREATE POLICY "Public can view public ratings"
  ON expert_ratings FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create ratings"
  ON expert_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Follow-up Sessions: Users can manage their own
CREATE POLICY "Users can manage own follow-up sessions"
  ON follow_up_sessions FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = expert_id);

