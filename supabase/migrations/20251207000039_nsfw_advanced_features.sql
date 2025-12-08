-- Migration: NSFW Advanced Features
-- Creates tables for pornmd.com integration, multi-camera recording, partner sync video, intimate date planning, and seductive AI chat

-- PornMD Integration
CREATE TABLE IF NOT EXISTS pornmd_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Integration status
  is_enabled BOOLEAN DEFAULT false,
  is_partner BOOLEAN DEFAULT false,
  partner_tier TEXT CHECK (partner_tier IN ('sponsor', 'premium', 'standard')),
  
  -- API credentials (encrypted)
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  
  -- Preferences
  content_preferences JSONB, -- Categories, tags, etc.
  sync_enabled BOOLEAN DEFAULT false,
  
  -- Usage
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
  
  -- Session details
  session_name TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('solo', 'partner_sync', 'multi_camera')),
  
  -- Recording status
  recording_status TEXT DEFAULT 'draft' CHECK (recording_status IN ('draft', 'recording', 'paused', 'completed', 'editing', 'published')),
  
  -- Settings
  camera_count INTEGER DEFAULT 1,
  sync_enabled BOOLEAN DEFAULT false,
  quality TEXT DEFAULT '1080p' CHECK (quality IN ('720p', '1080p', '4k')),
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Privacy
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
  
  -- Camera details
  camera_index INTEGER NOT NULL,
  camera_name TEXT,
  device_id TEXT,
  device_type TEXT CHECK (device_type IN ('webcam', 'phone', 'tablet', 'external', 'partner_device')),
  
  -- Stream status
  is_active BOOLEAN DEFAULT false,
  is_recording BOOLEAN DEFAULT false,
  
  -- Video file
  video_url TEXT,
  video_storage_path TEXT,
  video_duration_seconds INTEGER,
  video_size_bytes BIGINT,
  
  -- Metadata
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
  
  -- Recording details
  recording_name TEXT NOT NULL,
  recording_type TEXT DEFAULT 'multi_camera' CHECK (recording_type IN ('single', 'multi_camera', 'partner_sync')),
  
  -- Video file
  video_url TEXT,
  video_storage_path TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  
  -- Quality
  resolution_width INTEGER,
  resolution_height INTEGER,
  fps INTEGER,
  codec TEXT,
  
  -- Editing
  is_edited BOOLEAN DEFAULT false,
  edit_version INTEGER DEFAULT 1,
  original_recording_id UUID REFERENCES video_recordings(id),
  
  -- Privacy
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
  
  -- Edit details
  edit_name TEXT,
  edit_type TEXT NOT NULL CHECK (edit_type IN ('cut', 'merge', 'transition', 'mask', 'track', 'camera_switch', 'filter', 'effect', 'audio', 'other')),
  
  -- Edit data
  edit_config JSONB NOT NULL, -- Start time, end time, effects, transitions, etc.
  camera_switches JSONB, -- Camera switching points and transitions
  masking_data JSONB, -- Masking and tracking data
  transitions JSONB, -- Transition effects between cameras
  
  -- Result
  edited_video_url TEXT,
  edited_video_storage_path TEXT,
  preview_url TEXT,
  
  -- Status
  edit_status TEXT DEFAULT 'pending' CHECK (edit_status IN ('pending', 'processing', 'completed', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Screenshots
CREATE TABLE IF NOT EXISTS video_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES video_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Screenshot details
  screenshot_name TEXT,
  timestamp_seconds DECIMAL(10, 3) NOT NULL, -- Exact timestamp in video
  
  -- Image file
  image_url TEXT,
  image_storage_path TEXT,
  thumbnail_url TEXT,
  
  -- Editing
  is_edited BOOLEAN DEFAULT false,
  edit_data JSONB, -- Crop, filters, adjustments, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intimate Date Proposals
CREATE TABLE IF NOT EXISTS intimate_date_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Proposal details
  proposal_title TEXT NOT NULL,
  proposal_type TEXT DEFAULT 'custom' CHECK (proposal_type IN ('template', 'custom', 'quick')),
  template_id UUID, -- If using a template
  
  -- Date & Time
  proposed_date DATE NOT NULL,
  proposed_time TIME NOT NULL,
  duration_minutes INTEGER,
  
  -- Location
  location_name TEXT,
  location_address TEXT,
  location_type TEXT CHECK (location_type IN ('home', 'hotel', 'outdoor', 'other')),
  is_location_private BOOLEAN DEFAULT true,
  
  -- Activities
  activities JSONB NOT NULL, -- Array of activities/positions
  specialty_intimacy TEXT[],
  special_requests TEXT,
  
  -- Media
  voice_message_url TEXT,
  voice_message_duration_seconds INTEGER,
  images_urls TEXT[],
  gifs_urls TEXT[],
  videos_urls TEXT[],
  links TEXT[],
  
  -- Message
  text_message TEXT,
  adult_emojis TEXT[], -- Emoji codes
  
  -- Status
  proposal_status TEXT DEFAULT 'pending' CHECK (proposal_status IN ('pending', 'reviewed', 'accepted', 'declined', 'modified', 'resubmitted')),
  
  -- Partner response
  partner_response TEXT,
  partner_modified_date DATE,
  partner_modified_time TIME,
  partner_suggestions TEXT,
  partner_media_urls TEXT[],
  
  -- Timestamps
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
  
  -- Template details
  template_name TEXT NOT NULL,
  template_category TEXT CHECK (template_category IN ('romantic', 'passionate', 'adventurous', 'kinky', 'quick', 'custom')),
  is_public BOOLEAN DEFAULT false,
  
  -- Template content
  default_activities JSONB NOT NULL,
  default_positions TEXT[],
  default_duration_minutes INTEGER,
  default_location_type TEXT,
  
  -- Template message
  default_message TEXT,
  default_voice_script TEXT,
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seductive AI Chat Sessions
CREATE TABLE IF NOT EXISTS seductive_ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Session details
  session_name TEXT,
  session_type TEXT DEFAULT 'solo' CHECK (session_type IN ('solo', 'partner', 'group')),
  
  -- AI settings
  ai_personality TEXT DEFAULT 'seductive' CHECK (ai_personality IN ('seductive', 'flirty', 'dirty', 'nasty', 'romantic', 'kinky', 'custom')),
  ai_intensity TEXT DEFAULT 'medium' CHECK (ai_intensity IN ('light', 'medium', 'strong', 'extreme')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seductive AI Messages
CREATE TABLE IF NOT EXISTS seductive_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES seductive_ai_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message details
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'ai', 'system')),
  message_content TEXT NOT NULL,
  
  -- Media
  images_urls TEXT[],
  gifs_urls TEXT[],
  videos_urls TEXT[],
  voice_message_url TEXT,
  adult_emojis TEXT[],
  
  -- AI metadata
  ai_confidence DECIMAL(5, 2), -- 0-100
  ai_sentiment TEXT,
  ai_suggestions TEXT[],
  
  -- Context
  context_data JSONB, -- Previous messages context for AI
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sex Positions Library
CREATE TABLE IF NOT EXISTS sex_positions_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Position details
  position_name TEXT NOT NULL UNIQUE,
  position_category TEXT CHECK (position_category IN ('basic', 'advanced', 'kinky', 'romantic', 'adventurous', 'acrobatic')),
  difficulty_level TEXT DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
  
  -- Description
  description TEXT,
  instructions TEXT[],
  tips TEXT[],
  
  -- Media
  image_url TEXT,
  video_url TEXT,
  gif_url TEXT,
  
  -- Metadata
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
  
  -- User notes
  personal_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  tried BOOLEAN DEFAULT false,
  favorite BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, position_id)
);

-- Indexes
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

-- RLS Policies
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

-- PornMD Integration: Users can manage their own
CREATE POLICY "Users can manage own pornmd integration"
  ON pornmd_integration FOR ALL
  USING (auth.uid() = user_id);

-- Multi-Camera Sessions: Users can manage their own and view partner sessions
CREATE POLICY "Users can manage own multi-camera sessions"
  ON multi_camera_sessions FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Camera Streams: Users can manage their own
CREATE POLICY "Users can manage own camera streams"
  ON camera_streams FOR ALL
  USING (auth.uid() = user_id);

-- Video Recordings: Users can manage their own and view partner recordings
CREATE POLICY "Users can manage own video recordings"
  ON video_recordings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view partner recordings"
  ON video_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_recordings vr
      JOIN multi_camera_sessions mcs ON vr.session_id = mcs.id
      WHERE vr.id = video_recordings.id
      AND (mcs.user_id = auth.uid() OR mcs.partner_id = auth.uid())
      AND mcs.share_with_partner = true
    )
  );

-- Video Edits: Users can manage their own
CREATE POLICY "Users can manage own video edits"
  ON video_edits FOR ALL
  USING (auth.uid() = user_id);

-- Video Screenshots: Users can manage their own
CREATE POLICY "Users can manage own video screenshots"
  ON video_screenshots FOR ALL
  USING (auth.uid() = user_id);

-- Intimate Date Proposals: Users can manage their own and view partner proposals
CREATE POLICY "Users can manage own intimate date proposals"
  ON intimate_date_proposals FOR ALL
  USING (auth.uid() = creator_id OR auth.uid() = partner_id);

-- Intimate Date Templates: Users can view public templates and manage their own
CREATE POLICY "Users can view public templates"
  ON intimate_date_templates FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own templates"
  ON intimate_date_templates FOR ALL
  USING (auth.uid() = user_id);

-- Seductive AI Sessions: Users can manage their own
CREATE POLICY "Users can manage own seductive AI sessions"
  ON seductive_ai_sessions FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Seductive AI Messages: Users can view their session messages
CREATE POLICY "Users can view own seductive AI messages"
  ON seductive_ai_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM seductive_ai_sessions sas
      WHERE sas.id = seductive_ai_messages.session_id
      AND (sas.user_id = auth.uid() OR sas.partner_id = auth.uid())
    )
  );

CREATE POLICY "Users can create seductive AI messages"
  ON seductive_ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sex Positions Library: All authenticated users can view
CREATE POLICY "Authenticated users can view sex positions library"
  ON sex_positions_library FOR SELECT
  USING (auth.role() = 'authenticated');

-- User Saved Positions: Users can manage their own
CREATE POLICY "Users can manage own saved positions"
  ON user_saved_positions FOR ALL
  USING (auth.uid() = user_id);

