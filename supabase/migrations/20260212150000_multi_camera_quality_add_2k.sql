-- Add "2k" as an allowed quality for multi-camera sessions.
-- This is a forward-only, idempotent migration.

DO $$
BEGIN
  IF to_regclass('public.multi_camera_sessions') IS NULL THEN
    RAISE NOTICE 'public.multi_camera_sessions does not exist; skipping';
    RETURN;
  END IF;

  -- The original table used an inline CHECK which defaults to this conventional name.
  ALTER TABLE public.multi_camera_sessions
    DROP CONSTRAINT IF EXISTS multi_camera_sessions_quality_check;

  ALTER TABLE public.multi_camera_sessions
    ADD CONSTRAINT multi_camera_sessions_quality_check
    CHECK (quality IN ('720p', '1080p', '2k', '4k')) NOT VALID;

  -- Validate in the same migration (safe because prior constraint prevented invalid values).
  ALTER TABLE public.multi_camera_sessions
    VALIDATE CONSTRAINT multi_camera_sessions_quality_check;
END $$;

