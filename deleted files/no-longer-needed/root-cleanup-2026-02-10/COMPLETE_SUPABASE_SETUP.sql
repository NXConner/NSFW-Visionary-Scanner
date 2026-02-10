-- ============================================================================
-- COMPLETE SUPABASE SETUP SCRIPT
-- NSFW Visionary Scanner - All-in-One Database Setup
-- ============================================================================
-- 
-- This script includes:
-- 1. Core database tables and RLS policies
-- 2. NSFW Advanced Features (PornMD, Multi-Camera, Intimate Dates, AI Chat, Positions)
-- 3. Expert Content & Consultations System
-- 4. NSFW Video Content System
-- 5. NSFW Community Forum
-- 6. NSFW Sexual Wellness Analytics
-- 7. Storage Bucket Policies
--
-- Instructions:
-- 1. Copy this entire script
-- 2. Open Supabase Dashboard > SQL Editor
-- 3. Paste and run this script
-- 4. Verify all tables and policies are created
--
-- ============================================================================

-- ============================================================================
-- PART 1: CORE TABLES
-- ============================================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scan_history table
CREATE TABLE IF NOT EXISTS public.scan_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL DEFAULT '3d',
  length DECIMAL(5,2),
  circumference DECIMAL(5,2),
  curvature_angle DECIMAL(5,2),
  curvature_direction TEXT,
  image_path TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health_diary table
CREATE TABLE IF NOT EXISTS public.health_diary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  length DECIMAL(5,2),
  circumference DECIMAL(5,2),
  curvature_angle DECIMAL(5,2),
  curvature_direction TEXT,
  symptoms TEXT[],
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_diary ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Scan history policies
CREATE POLICY "Users can view own scans" ON public.scan_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON public.scan_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans" ON public.scan_history
  FOR DELETE USING (auth.uid() = user_id);

-- Health diary policies
CREATE POLICY "Users can view own diary" ON public.health_diary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert diary entries" ON public.health_diary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diary entries" ON public.health_diary
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diary entries" ON public.health_diary
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for timestamp updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_diary_updated_at ON public.health_diary;
CREATE TRIGGER update_health_diary_updated_at
  BEFORE UPDATE ON public.health_diary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 2: NSFW ADVANCED FEATURES
-- ============================================================================

-- PornMD Integration
CREATE TABLE IF NOT EXISTS pornmd_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  is_partner BOOLEAN DEFAULT false,
  partner_tier TEXT CHECK (partner_tier IN ('sponsor', 'premium', 'standard')),
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  content_preferences JSONB,
  sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Multi-Camera Recording Sessions
CREATE TABLE IF NOT EXISTS multi_camera_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_name TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('solo', 'partner_sync', 'multi_camera')),
  recording_status TEXT DEFAULT 'draft' CHECK (recording_status IN ('draft', 'recording', 'paused', 'completed', 'editing', 'published')),
  camera_count INTEGER DEFAULT 1,
  sync_enabled BOOLEAN DEFAULT false,
  quality TEXT DEFAULT '1080p' CHECK (quality IN ('720p', '1080p', '4k')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  is_private BOOLEAN DEFAULT true,
  share_with_partner BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Camera Streams
CREATE TABLE IF NOT EXISTS camera_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES multi_camera_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camera_index INTEGER NOT NULL,
  camera_name TEXT,
  device_id TEXT,
  device_type TEXT CHECK (device_type IN ('webcam', 'phone', 'tablet', 'external', 'partner_device')),
  is_active BOOLEAN DEFAULT false,
  is_recording BOOLEAN DEFAULT false,
  video_url TEXT,
  video_storage_path TEXT,
  video_duration_seconds INTEGER,
  video_size_bytes BIGINT,
  resolution_width INTEGER,
  resolution_height INTEGER,
  fps INTEGER,
  codec TEXT,
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Recordings
CREATE TABLE IF NOT EXISTS video_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES multi_camera_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recording_name TEXT NOT NULL,
  recording_type TEXT DEFAULT 'multi_camera' CHECK (recording_type IN ('single', 'multi_camera', 'partner_sync')),
  video_url TEXT,
  video_storage_path TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  resolution_width INTEGER,
  resolution_height INTEGER,
  fps INTEGER,
  codec TEXT,
  is_edited BOOLEAN DEFAULT false,
  edit_version INTEGER DEFAULT 1,
  original_recording_id UUID REFERENCES video_recordings(id),
  is_private BOOLEAN DEFAULT true,
  share_with_partner BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Edits
CREATE TABLE IF NOT EXISTS video_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES video_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edit_name TEXT,
  edit_type TEXT NOT NULL CHECK (edit_type IN ('cut', 'merge', 'transition', 'mask', 'track', 'camera_switch', 'filter', 'effect', 'audio', 'other')),
  edit_config JSONB NOT NULL,
  camera_switches JSONB,
  masking_data JSONB,
  transitions JSONB,
  edited_video_url TEXT,
  edited_video_storage_path TEXT,
  preview_url TEXT,
  edit_status TEXT DEFAULT 'pending' CHECK (edit_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Screenshots
CREATE TABLE IF NOT EXISTS video_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES video_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  screenshot_name TEXT,
  timestamp_seconds DECIMAL(10, 3) NOT NULL,
  image_url TEXT,
  image_storage_path TEXT,
  thumbnail_url TEXT,
  is_edited BOOLEAN DEFAULT false,
  edit_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intimate Date Proposals
CREATE TABLE IF NOT EXISTS intimate_date_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_title TEXT NOT NULL,
  proposal_type TEXT DEFAULT 'custom' CHECK (proposal_type IN ('template', 'custom', 'quick')),
  template_id UUID,
  proposed_date DATE NOT NULL,
  proposed_time TIME NOT NULL,
  duration_minutes INTEGER,
  location_name TEXT,
  location_address TEXT,
  location_type TEXT CHECK (location_type IN ('home', 'hotel', 'outdoor', 'other')),
  is_location_private BOOLEAN DEFAULT true,
  activities JSONB NOT NULL,
  specialty_intimacy TEXT[],
  special_requests TEXT,
  voice_message_url TEXT,
  voice_message_duration_seconds INTEGER,
  images_urls TEXT[],
  gifs_urls TEXT[],
  videos_urls TEXT[],
  links TEXT[],
  text_message TEXT,
  adult_emojis TEXT[],
  proposal_status TEXT DEFAULT 'pending' CHECK (proposal_status IN ('pending', 'reviewed', 'accepted', 'declined', 'modified', 'resubmitted')),
  partner_response TEXT,
  partner_modified_date DATE,
  partner_modified_time TIME,
  partner_suggestions TEXT,
  partner_media_urls TEXT[],
  reviewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intimate Date Templates
CREATE TABLE IF NOT EXISTS intimate_date_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  template_category TEXT CHECK (template_category IN ('romantic', 'passionate', 'adventurous', 'kinky', 'quick', 'custom')),
  is_public BOOLEAN DEFAULT false,
  default_activities JSONB NOT NULL,
  default_positions TEXT[],
  default_duration_minutes INTEGER,
  default_location_type TEXT,
  default_message TEXT,
  default_voice_script TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seductive AI Chat Sessions
CREATE TABLE IF NOT EXISTS seductive_ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_name TEXT,
  session_type TEXT DEFAULT 'solo' CHECK (session_type IN ('solo', 'partner', 'group')),
  ai_personality TEXT DEFAULT 'seductive' CHECK (ai_personality IN ('seductive', 'flirty', 'dirty', 'nasty', 'romantic', 'kinky', 'custom')),
  ai_intensity TEXT DEFAULT 'medium' CHECK (ai_intensity IN ('light', 'medium', 'strong', 'extreme')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seductive AI Messages
CREATE TABLE IF NOT EXISTS seductive_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES seductive_ai_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'ai', 'system')),
  message_content TEXT NOT NULL,
  images_urls TEXT[],
  gifs_urls TEXT[],
  videos_urls TEXT[],
  voice_message_url TEXT,
  adult_emojis TEXT[],
  ai_confidence DECIMAL(5, 2),
  ai_sentiment TEXT,
  ai_suggestions TEXT[],
  context_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sex Positions Library
CREATE TABLE IF NOT EXISTS sex_positions_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_name TEXT NOT NULL UNIQUE,
  position_category TEXT CHECK (position_category IN ('basic', 'advanced', 'kinky', 'romantic', 'adventurous', 'acrobatic')),
  difficulty_level TEXT DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
  description TEXT,
  instructions TEXT[],
  tips TEXT[],
  image_url TEXT,
  video_url TEXT,
  gif_url TEXT,
  popularity_score INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Saved Positions
CREATE TABLE IF NOT EXISTS user_saved_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES sex_positions_library(id) ON DELETE CASCADE,
  personal_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  tried BOOLEAN DEFAULT false,
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, position_id)
);

-- Indexes for NSFW Advanced Features
CREATE INDEX IF NOT EXISTS idx_pornmd_integration_user_id ON pornmd_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_camera_sessions_user_id ON multi_camera_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_camera_sessions_partner_id ON multi_camera_sessions(partner_id);
CREATE INDEX IF NOT EXISTS idx_camera_streams_session_id ON camera_streams(session_id);
CREATE INDEX IF NOT EXISTS idx_camera_streams_user_id ON camera_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_session_id ON video_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_user_id ON video_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_video_edits_recording_id ON video_edits(recording_id);
CREATE INDEX IF NOT EXISTS idx_video_screenshots_recording_id ON video_screenshots(recording_id);
CREATE INDEX IF NOT EXISTS idx_intimate_date_proposals_creator_id ON intimate_date_proposals(creator_id);
CREATE INDEX IF NOT EXISTS idx_intimate_date_proposals_partner_id ON intimate_date_proposals(partner_id);
CREATE INDEX IF NOT EXISTS idx_intimate_date_proposals_status ON intimate_date_proposals(proposal_status);
CREATE INDEX IF NOT EXISTS idx_seductive_ai_sessions_user_id ON seductive_ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_seductive_ai_messages_session_id ON seductive_ai_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_positions_user_id ON user_saved_positions(user_id);

-- RLS for NSFW Advanced Features
ALTER TABLE pornmd_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_camera_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimate_date_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimate_date_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE seductive_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seductive_ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sex_positions_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_positions ENABLE ROW LEVEL SECURITY;

-- NSFW Advanced Features Policies
CREATE POLICY "Users can manage own pornmd integration" ON pornmd_integration FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own multi-camera sessions" ON multi_camera_sessions FOR ALL USING (auth.uid() = user_id OR auth.uid() = partner_id);
CREATE POLICY "Users can manage own camera streams" ON camera_streams FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video recordings" ON video_recordings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view partner recordings" ON video_recordings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM video_recordings vr
    JOIN multi_camera_sessions mcs ON vr.session_id = mcs.id
    WHERE vr.id = video_recordings.id
    AND (mcs.user_id = auth.uid() OR mcs.partner_id = auth.uid())
    AND mcs.share_with_partner = true
  )
);
CREATE POLICY "Users can manage own video edits" ON video_edits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video screenshots" ON video_screenshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own intimate date proposals" ON intimate_date_proposals FOR ALL USING (auth.uid() = creator_id OR auth.uid() = partner_id);
CREATE POLICY "Users can view public templates" ON intimate_date_templates FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own templates" ON intimate_date_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own seductive AI sessions" ON seductive_ai_sessions FOR ALL USING (auth.uid() = user_id OR auth.uid() = partner_id);
CREATE POLICY "Users can view own seductive AI messages" ON seductive_ai_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM seductive_ai_sessions sas
    WHERE sas.id = seductive_ai_messages.session_id
    AND (sas.user_id = auth.uid() OR sas.partner_id = auth.uid())
  )
);
CREATE POLICY "Users can create seductive AI messages" ON seductive_ai_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view sex positions library" ON sex_positions_library FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage own saved positions" ON user_saved_positions FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- PART 3: EXPERT CONTENT & CONSULTATIONS
-- ============================================================================

-- Expert Profiles
CREATE TABLE IF NOT EXISTS expert_profiles (
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

-- Expert Articles
CREATE TABLE IF NOT EXISTS expert_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS expert_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS expert_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS expert_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS expert_group_workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS workshop_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES expert_group_workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workshop_id, user_id)
);

-- Indexes for Expert System
CREATE INDEX IF NOT EXISTS idx_expert_profiles_user_id ON expert_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_profiles_verified ON expert_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_expert_profiles_available ON expert_profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_expert_articles_expert_id ON expert_articles(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_articles_published ON expert_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_expert_videos_expert_id ON expert_videos(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_questions_expert_id ON expert_questions(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_questions_user_id ON expert_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_expert_id ON expert_consultations(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_user_id ON expert_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_scheduled ON expert_consultations(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_workshop_id ON workshop_participants(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_user_id ON workshop_participants(user_id);

-- RLS for Expert System
ALTER TABLE expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_group_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_participants ENABLE ROW LEVEL SECURITY;

-- Expert System Policies
CREATE POLICY "Anyone can view expert profiles" ON expert_profiles FOR SELECT USING (is_verified = true AND is_available = true);
CREATE POLICY "Experts can manage own profile" ON expert_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view published articles" ON expert_articles FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "Experts can manage own articles" ON expert_articles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM expert_profiles
    WHERE expert_profiles.id = expert_articles.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Anyone can view published videos" ON expert_videos FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "Experts can manage own videos" ON expert_videos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM expert_profiles
    WHERE expert_profiles.id = expert_videos.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view own questions" ON expert_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Experts can view questions for them" ON expert_questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM expert_profiles
    WHERE expert_profiles.id = expert_questions.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create questions" ON expert_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Experts can answer questions" ON expert_questions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM expert_profiles
    WHERE expert_profiles.id = expert_questions.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view own consultations" ON expert_consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Experts can view their consultations" ON expert_consultations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM expert_profiles
    WHERE expert_profiles.id = expert_consultations.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can book consultations" ON expert_consultations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users and experts can update consultations" ON expert_consultations FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM expert_profiles
    WHERE expert_profiles.id = expert_consultations.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Anyone can view workshops" ON expert_group_workshops FOR SELECT USING (true);
CREATE POLICY "Experts can manage own workshops" ON expert_group_workshops FOR ALL USING (
  EXISTS (
    SELECT 1 FROM expert_profiles
    WHERE expert_profiles.id = expert_group_workshops.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view own workshop participation" ON workshop_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join workshops" ON workshop_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PART 4: NSFW VIDEO CONTENT SYSTEM
-- ============================================================================

-- NSFW Video Library
CREATE TABLE IF NOT EXISTS nsfw_video_content (
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
CREATE TABLE IF NOT EXISTS nsfw_video_playlists (
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
CREATE TABLE IF NOT EXISTS nsfw_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS nsfw_video_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS nsfw_video_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS nsfw_video_watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  watch_duration_seconds INTEGER,
  completion_percentage DECIMAL(5, 2),
  watch_source TEXT,
  referrer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Video Content
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_category ON nsfw_video_content(category);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_premium ON nsfw_video_content(is_premium);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_featured ON nsfw_video_content(is_featured);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_playlists_user_id ON nsfw_video_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_playlists_public ON nsfw_video_playlists(is_public);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_progress_user_id ON nsfw_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_progress_video_id ON nsfw_video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_downloads_user_id ON nsfw_video_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_downloads_status ON nsfw_video_downloads(download_status);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_watch_history_user_id ON nsfw_video_watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_watch_history_watched_at ON nsfw_video_watch_history(watched_at);

-- RLS for Video Content
ALTER TABLE nsfw_video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_watch_history ENABLE ROW LEVEL SECURITY;

-- Video Content Policies
CREATE POLICY "Authenticated users can view approved videos" ON nsfw_video_content FOR SELECT USING (auth.role() = 'authenticated' AND is_approved = true AND is_active = true);
CREATE POLICY "Users can view public and own playlists" ON nsfw_video_playlists FOR SELECT USING (is_public = true OR auth.uid() = user_id OR is_curated = true);
CREATE POLICY "Users can manage own playlists" ON nsfw_video_playlists FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage own video progress" ON nsfw_video_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video downloads" ON nsfw_video_downloads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view all reviews" ON nsfw_video_reviews FOR SELECT USING (auth.role() = 'authenticated' AND (is_approved = true OR auth.uid() = user_id));
CREATE POLICY "Users can create own reviews" ON nsfw_video_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON nsfw_video_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own watch history" ON nsfw_video_watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create watch history" ON nsfw_video_watch_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PART 5: NSFW COMMUNITY FORUM
-- ============================================================================

-- NSFW Forum Categories
CREATE TABLE IF NOT EXISTS nsfw_forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  allows_anonymous BOOLEAN DEFAULT true,
  requires_moderation BOOLEAN DEFAULT true,
  is_expert_moderated BOOLEAN DEFAULT false,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_qa_thread BOOLEAN DEFAULT false,
  is_success_story BOOLEAN DEFAULT false,
  is_support_group BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  moderation_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Forum Posts
CREATE TABLE IF NOT EXISTS nsfw_forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES nsfw_forum_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_expert_answer BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT true,
  moderation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Community Forum
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_threads_category_id ON nsfw_forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_threads_user_id ON nsfw_forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_threads_approved ON nsfw_forum_threads(is_approved);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_posts_thread_id ON nsfw_forum_posts(thread_id);

-- RLS for Community Forum
ALTER TABLE nsfw_forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_forum_posts ENABLE ROW LEVEL SECURITY;

-- Community Forum Policies
CREATE POLICY "Authenticated users can view forum categories" ON nsfw_forum_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view approved threads" ON nsfw_forum_threads FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    is_approved = true OR 
    auth.uid() = user_id
  )
);
CREATE POLICY "Users can create threads" ON nsfw_forum_threads FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id OR 
    (is_anonymous = true AND user_id IS NULL)
  )
);
CREATE POLICY "Users can update own threads" ON nsfw_forum_threads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view approved posts" ON nsfw_forum_posts FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    is_approved = true OR 
    auth.uid() = user_id
  )
);
CREATE POLICY "Users can create posts" ON nsfw_forum_posts FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id OR 
    (is_anonymous = true AND user_id IS NULL)
  )
);

-- ============================================================================
-- PART 6: NSFW SEXUAL WELLNESS ANALYTICS
-- ============================================================================

-- Enhanced Sexual Function Tracking
CREATE TABLE IF NOT EXISTS nsfw_sexual_function_tracking (
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

-- Libido Monitoring
CREATE TABLE IF NOT EXISTS nsfw_libido_tracking (
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
CREATE TABLE IF NOT EXISTS nsfw_satisfaction_tracking (
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
CREATE TABLE IF NOT EXISTS nsfw_frequency_tracking (
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

-- Sexual Wellness Score
CREATE TABLE IF NOT EXISTS nsfw_wellness_scores (
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

-- Indexes for Analytics
CREATE INDEX IF NOT EXISTS idx_nsfw_sexual_function_user_date ON nsfw_sexual_function_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_libido_user_date ON nsfw_libido_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_satisfaction_user_date ON nsfw_satisfaction_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_frequency_user_id ON nsfw_frequency_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_wellness_scores_user_id ON nsfw_wellness_scores(user_id);

-- RLS for Analytics
ALTER TABLE nsfw_sexual_function_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_libido_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_satisfaction_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_frequency_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_wellness_scores ENABLE ROW LEVEL SECURITY;

-- Analytics Policies
CREATE POLICY "Users can manage own sexual function tracking" ON nsfw_sexual_function_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own libido tracking" ON nsfw_libido_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own satisfaction tracking" ON nsfw_satisfaction_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own frequency tracking" ON nsfw_frequency_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own wellness scores" ON nsfw_wellness_scores FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- PART 7: STORAGE BUCKET POLICIES
-- ============================================================================
-- NOTE: Storage buckets must be created manually in Supabase Dashboard
-- Go to Storage > Create Bucket for each of these:
-- - user-uploads
-- - videos
-- - images
-- - audio
-- - screenshots
-- - recordings
-- - expert-content
-- - nsfw-content

-- ==================== user-uploads Bucket ====================
CREATE POLICY IF NOT EXISTS "Users can upload to user-uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY IF NOT EXISTS "Users can read own files from user-uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can update own files in user-uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can delete own files from user-uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== videos Bucket ====================
CREATE POLICY IF NOT EXISTS "Public can read videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

CREATE POLICY IF NOT EXISTS "Users can update own videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== images Bucket ====================
CREATE POLICY IF NOT EXISTS "Public can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY IF NOT EXISTS "Users can manage own images"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== audio Bucket ====================
CREATE POLICY IF NOT EXISTS "Public can read audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio');

CREATE POLICY IF NOT EXISTS "Users can manage own audio"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== screenshots Bucket ====================
CREATE POLICY IF NOT EXISTS "Public can read screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'screenshots');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'screenshots');

CREATE POLICY IF NOT EXISTS "Users can manage own screenshots"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== recordings Bucket ====================
CREATE POLICY IF NOT EXISTS "Users can read own recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can upload own recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can manage own recordings"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== expert-content Bucket ====================
CREATE POLICY IF NOT EXISTS "Public can read expert content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'expert-content');

CREATE POLICY IF NOT EXISTS "Experts can upload content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'expert-content' AND
  EXISTS (
    SELECT 1 FROM expert_profiles
    WHERE expert_profiles.user_id = auth.uid()
    AND expert_profiles.is_verified = true
  )
);

-- ==================== nsfw-content Bucket ====================
CREATE POLICY IF NOT EXISTS "Public can read NSFW content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'nsfw-content');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload NSFW content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'nsfw-content');

CREATE POLICY IF NOT EXISTS "Users can manage own NSFW content"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'nsfw-content' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- 
-- Next Steps:
-- 1. Create storage buckets in Supabase Dashboard > Storage
-- 2. Deploy Edge Functions (see deploy-all.ps1 script)
-- 3. Configure environment variables in .env file
-- 4. Seed initial data (positions library, etc.)
--
-- ============================================================================

