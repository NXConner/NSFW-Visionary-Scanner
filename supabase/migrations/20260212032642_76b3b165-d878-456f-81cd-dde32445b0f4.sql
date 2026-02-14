
-- ============================================================================
-- BATCH 1: Core missing tables (Sessions, Education, Video, Scanner, Health)
-- ============================================================================

-- Active Sessions
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_name text,
  user_agent text,
  ip_address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now(),
  revoked_at timestamptz
);
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.active_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Video Library
CREATE TABLE IF NOT EXISTS public.video_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'education',
  video_url text NOT NULL,
  thumbnail_url text,
  duration_seconds int,
  file_size_bytes bigint,
  instructor_name text,
  instructor_credentials text,
  difficulty_level text,
  tags text[],
  is_featured boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  is_nsfw boolean DEFAULT false,
  order_index int DEFAULT 0,
  view_count int DEFAULT 0,
  like_count int DEFAULT 0,
  rating_average numeric DEFAULT 0,
  rating_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.video_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Video library public read" ON public.video_library FOR SELECT USING (true);

-- Video Playlists
CREATE TABLE IF NOT EXISTS public.video_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  playlist_name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.video_playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own playlists" ON public.video_playlists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Playlist Videos
CREATE TABLE IF NOT EXISTS public.playlist_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES public.video_playlists(id) ON DELETE CASCADE,
  video_id uuid,
  order_index int DEFAULT 0,
  added_at timestamptz DEFAULT now()
);
ALTER TABLE public.playlist_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own playlist videos" ON public.playlist_videos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.video_playlists WHERE id = playlist_id AND user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.video_playlists WHERE id = playlist_id AND user_id = auth.uid())
);

-- Video Bookmarks
CREATE TABLE IF NOT EXISTS public.video_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.video_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.video_bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Video Ratings
CREATE TABLE IF NOT EXISTS public.video_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL,
  rating int NOT NULL,
  review_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.video_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ratings" ON public.video_ratings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Video Progress
CREATE TABLE IF NOT EXISTS public.video_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL,
  progress_seconds int DEFAULT 0,
  progress_percentage numeric DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  watch_count int DEFAULT 0,
  last_watched_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON public.video_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Video Downloads
CREATE TABLE IF NOT EXISTS public.video_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL,
  download_status text DEFAULT 'pending',
  download_progress numeric DEFAULT 0,
  local_file_path text,
  file_size_bytes bigint,
  downloaded_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.video_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own downloads" ON public.video_downloads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Privacy Settings
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  profile_visibility text DEFAULT 'private',
  data_sharing_consent boolean DEFAULT false,
  analytics_opt_in boolean DEFAULT false,
  marketing_opt_in boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own privacy" ON public.user_privacy_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Position Media Overrides
CREATE TABLE IF NOT EXISTS public.user_position_media_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  position_id uuid NOT NULL,
  custom_image_url text,
  custom_video_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_position_media_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own overrides" ON public.user_position_media_overrides FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Education tables
CREATE TABLE IF NOT EXISTS public.sexual_health_education_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  content jsonb,
  difficulty_level text DEFAULT 'beginner',
  order_index int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.sexual_health_education_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read education modules" ON public.sexual_health_education_modules FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.education_interactive_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid,
  content_type text NOT NULL,
  content_data jsonb,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.education_interactive_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read interactive content" ON public.education_interactive_content FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.education_user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid,
  progress_percentage numeric DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.education_user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own edu progress" ON public.education_user_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.education_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question text NOT NULL,
  answer text,
  category text,
  is_answered boolean DEFAULT false,
  upvote_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- Schema-tolerant: older/prod environments may already have education_qa without
-- some of these columns. Ensure columns exist before creating RLS policies.
ALTER TABLE public.education_qa
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS question text,
  ADD COLUMN IF NOT EXISTS answer text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS is_answered boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS upvote_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.education_qa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own qa" ON public.education_qa;
DROP POLICY IF EXISTS "Public read answered qa" ON public.education_qa;
CREATE POLICY "Users manage own qa" ON public.education_qa FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read answered qa" ON public.education_qa FOR SELECT USING (is_answered = true);

CREATE TABLE IF NOT EXISTS public.education_qa_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  qa_id uuid,
  interaction_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- Schema-tolerant: ensure required columns exist for RLS policy creation.
ALTER TABLE public.education_qa_interactions
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS qa_id uuid,
  ADD COLUMN IF NOT EXISTS interaction_type text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.education_qa_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own qa interactions" ON public.education_qa_interactions;
CREATE POLICY "Users manage own qa interactions" ON public.education_qa_interactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.education_expert_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id uuid,
  title text NOT NULL,
  content text NOT NULL,
  content_type text DEFAULT 'article',
  category text,
  tags text[],
  is_featured boolean DEFAULT false,
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.education_expert_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read expert content" ON public.education_expert_content FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.education_research_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  source_url text,
  category text,
  published_date timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.education_research_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read research" ON public.education_research_updates FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.education_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id uuid NOT NULL,
  content_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.education_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own edu bookmarks" ON public.education_bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NSFW consent tables
CREATE TABLE IF NOT EXISTS public.nsfw_consent_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name text NOT NULL,
  policy_version text NOT NULL,
  policy_text text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.nsfw_consent_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read consent policies" ON public.nsfw_consent_policies FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.nsfw_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  policy_id uuid,
  consent_given boolean NOT NULL,
  consent_timestamp timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.nsfw_consent_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own consent" ON public.nsfw_consent_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NSFW Video Bookmarks
CREATE TABLE IF NOT EXISTS public.nsfw_video_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.nsfw_video_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own nsfw bookmarks" ON public.nsfw_video_bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NSFW Topics
CREATE TABLE IF NOT EXISTS public.nsfw_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_name text NOT NULL,
  description text,
  category text,
  is_active boolean DEFAULT true,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.nsfw_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read nsfw topics" ON public.nsfw_topics FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.nsfw_topic_library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES public.nsfw_topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  content_type text DEFAULT 'article',
  media_url text,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.nsfw_topic_library_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read topic items" ON public.nsfw_topic_library_items FOR SELECT USING (true);

-- NSFW Detection
CREATE TABLE IF NOT EXISTS public.nsfw_detection_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  model_version text,
  model_type text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.nsfw_detection_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read detection models" ON public.nsfw_detection_models FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.nsfw_detection_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  model_id uuid,
  image_url text,
  result_data jsonb,
  confidence numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.nsfw_detection_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own detection results" ON public.nsfw_detection_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.nsfw_ensemble_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scan_id uuid,
  ensemble_data jsonb,
  final_classification text,
  confidence numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.nsfw_ensemble_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ensemble results" ON public.nsfw_ensemble_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NSFW Community
CREATE TABLE IF NOT EXISTS public.nsfw_support_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  is_active boolean DEFAULT true,
  member_count int DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.nsfw_support_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read support groups" ON public.nsfw_support_groups FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.nsfw_support_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.nsfw_support_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now()
);
ALTER TABLE public.nsfw_support_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own group membership" ON public.nsfw_support_group_members FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.nsfw_community_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  challenge_type text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  participant_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.nsfw_community_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read challenges" ON public.nsfw_community_challenges FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.nsfw_challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.nsfw_community_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  progress numeric DEFAULT 0,
  joined_at timestamptz DEFAULT now()
);
ALTER TABLE public.nsfw_challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own challenge participation" ON public.nsfw_challenge_participants FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Advanced Scanner Features
CREATE TABLE IF NOT EXISTS public.multi_angle_scan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_name text,
  angle_count int DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.multi_angle_scan_sessions ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.multi_angle_scan_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own scan sessions" ON public.multi_angle_scan_sessions;
CREATE POLICY "Users manage own scan sessions" ON public.multi_angle_scan_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.multi_angle_scan_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.multi_angle_scan_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  angle_label text,
  image_url text,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.multi_angle_scan_images ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.multi_angle_scan_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own scan images" ON public.multi_angle_scan_images;
CREATE POLICY "Users manage own scan images" ON public.multi_angle_scan_images FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.cloud_processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_type text NOT NULL,
  status text DEFAULT 'pending',
  input_data jsonb,
  output_data jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cloud_processing_jobs ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.cloud_processing_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own processing jobs" ON public.cloud_processing_jobs;
CREATE POLICY "Users manage own processing jobs" ON public.cloud_processing_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.time_lapse_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  comparison_name text,
  scan_ids uuid[],
  comparison_data jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.time_lapse_comparisons ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.time_lapse_comparisons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own comparisons" ON public.time_lapse_comparisons;
CREATE POLICY "Users manage own comparisons" ON public.time_lapse_comparisons FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.measurement_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  description text,
  measurements jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.measurement_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read measurement templates" ON public.measurement_templates FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.batch_scan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  batch_name text,
  scan_count int DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.batch_scan_sessions ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.batch_scan_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own batch scans" ON public.batch_scan_sessions;
CREATE POLICY "Users manage own batch scans" ON public.batch_scan_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.exported_3d_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scan_id uuid,
  model_url text,
  model_format text,
  file_size_bytes bigint,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.exported_3d_models ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.exported_3d_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own 3d models" ON public.exported_3d_models;
CREATE POLICY "Users manage own 3d models" ON public.exported_3d_models FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
