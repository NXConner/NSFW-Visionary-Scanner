-- ============================================================================
-- User Position Media Overrides (NSFW Positions)
-- Allows users to replace a position's default media with their own uploads.
-- Idempotent + RLS-protected.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_position_media_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_key TEXT NOT NULL,
  media_kind TEXT NOT NULL CHECK (media_kind IN ('image', 'gif', 'video')),

  -- Supabase Storage reference (optional but recommended)
  bucket TEXT,
  storage_path TEXT,
  public_url TEXT,
  mime_type TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, position_key, media_kind)
);

CREATE INDEX IF NOT EXISTS idx_user_position_media_overrides_user_position
  ON public.user_position_media_overrides(user_id, position_key);

ALTER TABLE public.user_position_media_overrides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_position_media_overrides'
      AND policyname = 'Users manage own position media overrides'
  ) THEN
    CREATE POLICY "Users manage own position media overrides"
      ON public.user_position_media_overrides
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

