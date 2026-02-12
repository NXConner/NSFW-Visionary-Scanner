-- Migration: NSFW + App-Store-Restricted Content Bundle
-- Purpose:
-- - Keep NSFW / explicit / store-restricted content definitions in one Supabase migration.
-- - Provide runtime guard helpers for content policy and distribution channel.
-- - Create a single registry for restricted modules consumed by app and edge functions.
-- - Enforce private NSFW bucket defaults (signed-URL access model).
--
-- Notes:
-- - This migration is idempotent and safe to re-run.
-- - Session settings used by helpers:
--     app.content_policy        = 'sfw' | 'nsfw'
--     app.distribution_channel  = 'store' | 'direct'
--
-- ============================================================================
-- 1) Runtime guard helper functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_content_policy()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('app.content_policy', true), ''), 'sfw');
$$;

CREATE OR REPLACE FUNCTION public.current_distribution_channel()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('app.distribution_channel', true), ''), 'store');
$$;

-- Keep this helper present for backwards compatibility with existing migrations/seeds.
CREATE OR REPLACE FUNCTION public.is_nsfw_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_content_policy() = 'nsfw';
$$;

CREATE OR REPLACE FUNCTION public.is_store_distribution()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_distribution_channel() = 'store';
$$;

CREATE OR REPLACE FUNCTION public.is_restricted_content_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_nsfw_enabled() AND NOT public.is_store_distribution();
$$;

-- ============================================================================
-- 2) Registry of NSFW / app-store-restricted modules
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.restricted_content_registry (
  feature_key text PRIMARY KEY,
  classification text NOT NULL
    CHECK (classification IN ('nsfw', 'explicit', 'adult-community', 'app-store-restricted')),
  title text NOT NULL,
  description text NOT NULL,
  storage_bucket text,
  related_tables text[] NOT NULL DEFAULT '{}'::text[],
  required_consent_policies text[] NOT NULL DEFAULT '{}'::text[],
  requires_age_verification boolean NOT NULL DEFAULT true,
  requires_direct_distribution boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restricted_content_registry_classification
  ON public.restricted_content_registry(classification);
CREATE INDEX IF NOT EXISTS idx_restricted_content_registry_is_active
  ON public.restricted_content_registry(is_active);

ALTER TABLE public.restricted_content_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restricted content visible only when enabled" ON public.restricted_content_registry;
CREATE POLICY "Restricted content visible only when enabled"
  ON public.restricted_content_registry
  FOR SELECT
  USING (is_active = true AND public.is_restricted_content_enabled());

DROP POLICY IF EXISTS "Service role can manage restricted content registry" ON public.restricted_content_registry;
CREATE POLICY "Service role can manage restricted content registry"
  ON public.restricted_content_registry
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE OR REPLACE FUNCTION public.set_restricted_content_registry_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restricted_content_registry_updated_at ON public.restricted_content_registry;
CREATE TRIGGER trg_restricted_content_registry_updated_at
  BEFORE UPDATE ON public.restricted_content_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.set_restricted_content_registry_updated_at();

INSERT INTO public.restricted_content_registry (
  feature_key,
  classification,
  title,
  description,
  storage_bucket,
  related_tables,
  required_consent_policies,
  requires_age_verification,
  requires_direct_distribution,
  is_active
)
VALUES
  (
    'nsfw_video_library',
    'nsfw',
    'NSFW Video Library',
    'Explicit educational media library and playback state.',
    'nsfw-content',
    ARRAY[
      'nsfw_video_content',
      'nsfw_video_progress',
      'nsfw_video_downloads',
      'nsfw_video_reviews',
      'nsfw_video_watch_history',
      'nsfw_video_bookmarks'
    ],
    ARRAY['nsfw_general', 'nsfw_video_library'],
    true,
    true,
    true
  ),
  (
    'nsfw_topic_library',
    'nsfw',
    'NSFW Topic Library',
    'Adult educational topics and topic-pack library content.',
    NULL,
    ARRAY['nsfw_topics', 'nsfw_topic_library_items'],
    ARRAY['nsfw_general', 'nsfw_topics_library'],
    true,
    true,
    true
  ),
  (
    'nsfw_detection_modes',
    'explicit',
    'Advanced NSFW Detection Modes',
    'Opt-in advanced explicit-content model outputs and ensemble analytics.',
    NULL,
    ARRAY['nsfw_detection_models', 'nsfw_detection_results', 'nsfw_ensemble_results'],
    ARRAY['nsfw_general', 'nsfw_advanced_features'],
    true,
    true,
    true
  ),
  (
    'nsfw_dlc_entitlements',
    'app-store-restricted',
    'NSFW DLC Entitlements',
    'NSFW entitlement, age verification, and direct-channel restricted package access.',
    'nsfw-content',
    ARRAY['dlc_packages', 'dlc_licenses', 'dlc_age_verifications', 'premium_add_ons'],
    ARRAY['nsfw_general'],
    true,
    true,
    true
  ),
  (
    'nsfw_community_features',
    'adult-community',
    'NSFW Community Features',
    'Adult community/forum capabilities intended only for direct NSFW distributions.',
    NULL,
    ARRAY['forum_posts', 'forum_comments', 'community_groups'],
    ARRAY['nsfw_general', 'nsfw_community_forum'],
    true,
    true,
    true
  ),
  (
    'adult_ai_chat',
    'explicit',
    'Adult AI Chat Features',
    'Adult conversational modules and prompt pipelines that are app-store-restricted.',
    NULL,
    ARRAY['seductive_ai_chat_logs'],
    ARRAY['nsfw_general', 'nsfw_advanced_features'],
    true,
    true,
    true
  )
ON CONFLICT (feature_key) DO UPDATE
SET
  classification = EXCLUDED.classification,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  storage_bucket = EXCLUDED.storage_bucket,
  related_tables = EXCLUDED.related_tables,
  required_consent_policies = EXCLUDED.required_consent_policies,
  requires_age_verification = EXCLUDED.requires_age_verification,
  requires_direct_distribution = EXCLUDED.requires_direct_distribution,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ============================================================================
-- 3) Restricted-content audit events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.restricted_content_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  feature_key text NOT NULL REFERENCES public.restricted_content_registry(feature_key) ON DELETE CASCADE,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  allowed boolean NOT NULL DEFAULT false,
  reason text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_restricted_content_audit_events_user_id
  ON public.restricted_content_audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_restricted_content_audit_events_feature_key
  ON public.restricted_content_audit_events(feature_key);
CREATE INDEX IF NOT EXISTS idx_restricted_content_audit_events_attempted_at
  ON public.restricted_content_audit_events(attempted_at DESC);

ALTER TABLE public.restricted_content_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own restricted audit events" ON public.restricted_content_audit_events;
CREATE POLICY "Users can insert own restricted audit events"
  ON public.restricted_content_audit_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view own restricted audit events" ON public.restricted_content_audit_events;
CREATE POLICY "Users can view own restricted audit events"
  ON public.restricted_content_audit_events
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage restricted audit events" ON public.restricted_content_audit_events;
CREATE POLICY "Service role can manage restricted audit events"
  ON public.restricted_content_audit_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 4) NSFW storage bucket hardening (private-only, signed URL model)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nsfw-content',
  'nsfw-content',
  false,
  5368709120,
  ARRAY[
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 5) Runtime view for clients/edge functions to check policy state quickly
-- ============================================================================

CREATE OR REPLACE VIEW public.restricted_content_runtime_guard AS
SELECT
  public.current_content_policy() AS content_policy,
  public.current_distribution_channel() AS distribution_channel,
  public.is_nsfw_enabled() AS nsfw_enabled,
  public.is_store_distribution() AS store_distribution,
  public.is_restricted_content_enabled() AS restricted_content_enabled;

GRANT SELECT ON public.restricted_content_runtime_guard TO authenticated;
GRANT SELECT ON public.restricted_content_runtime_guard TO anon;

