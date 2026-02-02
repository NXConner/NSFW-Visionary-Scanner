-- Migration: NSFW Consent Policies + Audit Events
-- Adds explicit consent checkpoints for adult content modules.

CREATE TABLE IF NOT EXISTS public.nsfw_consent_policies (
  policy_key TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT NOT NULL,
  required_for_features TEXT[] NOT NULL DEFAULT '{}'::text[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nsfw_consent_policies_is_active
  ON public.nsfw_consent_policies(is_active);

CREATE TABLE IF NOT EXISTS public.nsfw_consent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_key TEXT NOT NULL REFERENCES public.nsfw_consent_policies(policy_key) ON DELETE CASCADE,
  policy_version TEXT NOT NULL,
  consent_method TEXT NOT NULL DEFAULT 'in_app',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'nsfw_consent_events_user_policy_version_key'
  ) THEN
    ALTER TABLE public.nsfw_consent_events
      ADD CONSTRAINT nsfw_consent_events_user_policy_version_key
      UNIQUE (user_id, policy_key, policy_version);
  END IF;
END $$;

-- NSFW Video Bookmarks (user favorites)
CREATE TABLE IF NOT EXISTS public.nsfw_video_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.nsfw_video_content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_nsfw_video_bookmarks_user_id ON public.nsfw_video_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_bookmarks_video_id ON public.nsfw_video_bookmarks(video_id);

ALTER TABLE public.nsfw_video_bookmarks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'nsfw_video_bookmarks'
      AND policyname = 'Users manage own nsfw video bookmarks'
  ) THEN
    CREATE POLICY "Users manage own nsfw video bookmarks"
      ON public.nsfw_video_bookmarks
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nsfw_consent_events_user_id
  ON public.nsfw_consent_events(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_consent_events_policy_key
  ON public.nsfw_consent_events(policy_key);

ALTER TABLE public.nsfw_consent_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_consent_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'nsfw_consent_policies'
      AND policyname = 'Anyone can view active nsfw consent policies'
  ) THEN
    CREATE POLICY "Anyone can view active nsfw consent policies"
      ON public.nsfw_consent_policies
      FOR SELECT
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'nsfw_consent_policies'
      AND policyname = 'Service role can manage nsfw consent policies'
  ) THEN
    CREATE POLICY "Service role can manage nsfw consent policies"
      ON public.nsfw_consent_policies
      FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'nsfw_consent_events'
      AND policyname = 'Users can view own nsfw consent events'
  ) THEN
    CREATE POLICY "Users can view own nsfw consent events"
      ON public.nsfw_consent_events
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'nsfw_consent_events'
      AND policyname = 'Users can create own nsfw consent events'
  ) THEN
    CREATE POLICY "Users can create own nsfw consent events"
      ON public.nsfw_consent_events
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'nsfw_consent_events'
      AND policyname = 'Users can update own nsfw consent events'
  ) THEN
    CREATE POLICY "Users can update own nsfw consent events"
      ON public.nsfw_consent_events
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Seed baseline policies (idempotent).
INSERT INTO public.nsfw_consent_policies (policy_key, version, title, summary, body, required_for_features, is_active)
SELECT *
FROM (VALUES
  (
    'nsfw_general',
    '2026-02-01',
    'Adult Content Consent',
    'Confirms you are 18+ and consent to view adult material.',
    'You acknowledge that this section contains adult content intended for consenting adults only. You confirm you are at least 18 years old, consent to viewing adult material, and agree to stop if you feel uncomfortable.',
    ARRAY['nsfw'],
    true
  ),
  (
    'nsfw_video_library',
    '2026-02-01',
    'Video Library Consent',
    'Consent required for explicit educational video content.',
    'You understand the NSFW video library may include explicit demonstrations for educational purposes. You agree to view responsibly, respect your personal boundaries, and stop if any content feels unsafe or unwanted.',
    ARRAY['video_library'],
    true
  ),
  (
    'nsfw_community_forum',
    '2026-02-01',
    'Community Consent',
    'Consent to participate in adult community discussions.',
    'You agree to participate respectfully, obtain consent before sharing sensitive details, and follow community guidelines. No harassment, coercion, or non-consensual content is permitted.',
    ARRAY['private_forum'],
    true
  ),
  (
    'nsfw_advanced_features',
    '2026-02-01',
    'Advanced Features Consent',
    'Consent for advanced adult features (recording, AI, partner tools).',
    'You acknowledge that advanced features may include partner communication, recording tools, and AI chat. You agree to obtain explicit consent from all participants before recording or sharing content and to follow applicable laws.',
    ARRAY['multi_camera'],
    true
  ),
  (
    'nsfw_topics_library',
    '2026-02-01',
    'Topics Library Consent',
    'Consent for advanced adult education topics.',
    'You agree that topics may discuss explicit subject matter for educational purposes. You will use this content responsibly and stop if you feel uncomfortable.',
    ARRAY['topics_library'],
    true
  )
) AS p(policy_key, version, title, summary, body, required_for_features, is_active)
WHERE public.is_nsfw_enabled()
ON CONFLICT (policy_key) DO UPDATE SET
  version = EXCLUDED.version,
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  body = EXCLUDED.body,
  required_for_features = EXCLUDED.required_for_features,
  is_active = EXCLUDED.is_active,
  updated_at = now();
