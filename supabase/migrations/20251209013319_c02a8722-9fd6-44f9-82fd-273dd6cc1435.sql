-- ============================================================================
-- NSFW ADVANCED FEATURES - Part 1: Core Feature Tables
-- ============================================================================

-- PornMD Integration
CREATE TABLE IF NOT EXISTS public.pornmd_integration (
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
CREATE TABLE IF NOT EXISTS public.multi_camera_sessions (
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
CREATE TABLE IF NOT EXISTS public.camera_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.multi_camera_sessions(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.video_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.multi_camera_sessions(id) ON DELETE CASCADE,
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
  original_recording_id UUID REFERENCES public.video_recordings(id),
  is_private BOOLEAN DEFAULT true,
  share_with_partner BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Edits
CREATE TABLE IF NOT EXISTS public.video_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES public.video_recordings(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.video_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES public.video_recordings(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.intimate_date_proposals (
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
CREATE TABLE IF NOT EXISTS public.intimate_date_templates (
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
CREATE TABLE IF NOT EXISTS public.seductive_ai_sessions (
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
CREATE TABLE IF NOT EXISTS public.seductive_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.seductive_ai_sessions(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.sex_positions_library (
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
CREATE TABLE IF NOT EXISTS public.user_saved_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.sex_positions_library(id) ON DELETE CASCADE,
  personal_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  tried BOOLEAN DEFAULT false,
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, position_id)
);

-- Indexes for NSFW Advanced Features
CREATE INDEX IF NOT EXISTS idx_pornmd_integration_user_id ON public.pornmd_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_camera_sessions_user_id ON public.multi_camera_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_camera_sessions_partner_id ON public.multi_camera_sessions(partner_id);
CREATE INDEX IF NOT EXISTS idx_camera_streams_session_id ON public.camera_streams(session_id);
CREATE INDEX IF NOT EXISTS idx_camera_streams_user_id ON public.camera_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_session_id ON public.video_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_user_id ON public.video_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_video_edits_recording_id ON public.video_edits(recording_id);
CREATE INDEX IF NOT EXISTS idx_video_screenshots_recording_id ON public.video_screenshots(recording_id);
CREATE INDEX IF NOT EXISTS idx_intimate_date_proposals_creator_id ON public.intimate_date_proposals(creator_id);
CREATE INDEX IF NOT EXISTS idx_intimate_date_proposals_partner_id ON public.intimate_date_proposals(partner_id);
CREATE INDEX IF NOT EXISTS idx_intimate_date_proposals_status ON public.intimate_date_proposals(proposal_status);
CREATE INDEX IF NOT EXISTS idx_seductive_ai_sessions_user_id ON public.seductive_ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_seductive_ai_messages_session_id ON public.seductive_ai_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_positions_user_id ON public.user_saved_positions(user_id);

-- Enable RLS
ALTER TABLE public.pornmd_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_camera_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seductive_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seductive_ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sex_positions_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for NSFW Advanced Features
DROP POLICY IF EXISTS "Users can manage own pornmd integration" ON public.pornmd_integration;
DROP POLICY IF EXISTS "Users can manage own multi-camera sessions" ON public.multi_camera_sessions;
DROP POLICY IF EXISTS "Users can manage own camera streams" ON public.camera_streams;
DROP POLICY IF EXISTS "Users can manage own video recordings" ON public.video_recordings;
DROP POLICY IF EXISTS "Users can manage own video edits" ON public.video_edits;
DROP POLICY IF EXISTS "Users can manage own video screenshots" ON public.video_screenshots;
DROP POLICY IF EXISTS "Users can manage own intimate date proposals" ON public.intimate_date_proposals;
DROP POLICY IF EXISTS "Users can view public templates" ON public.intimate_date_templates;
DROP POLICY IF EXISTS "Users can manage own templates" ON public.intimate_date_templates;
DROP POLICY IF EXISTS "Users can manage own seductive AI sessions" ON public.seductive_ai_sessions;
DROP POLICY IF EXISTS "Users can create seductive AI messages" ON public.seductive_ai_messages;
DROP POLICY IF EXISTS "Users can view own seductive AI messages" ON public.seductive_ai_messages;
DROP POLICY IF EXISTS "Authenticated users can view sex positions library" ON public.sex_positions_library;
DROP POLICY IF EXISTS "Users can manage own saved positions" ON public.user_saved_positions;

CREATE POLICY "Users can manage own pornmd integration" ON public.pornmd_integration FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own multi-camera sessions" ON public.multi_camera_sessions FOR ALL USING (auth.uid() = user_id OR auth.uid() = partner_id);
CREATE POLICY "Users can manage own camera streams" ON public.camera_streams FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video recordings" ON public.video_recordings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video edits" ON public.video_edits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video screenshots" ON public.video_screenshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own intimate date proposals" ON public.intimate_date_proposals FOR ALL USING (auth.uid() = creator_id OR auth.uid() = partner_id);
CREATE POLICY "Users can view public templates" ON public.intimate_date_templates FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own templates" ON public.intimate_date_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own seductive AI sessions" ON public.seductive_ai_sessions FOR ALL USING (auth.uid() = user_id OR auth.uid() = partner_id);
CREATE POLICY "Users can create seductive AI messages" ON public.seductive_ai_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own seductive AI messages" ON public.seductive_ai_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view sex positions library" ON public.sex_positions_library FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own saved positions" ON public.user_saved_positions FOR ALL USING (auth.uid() = user_id);