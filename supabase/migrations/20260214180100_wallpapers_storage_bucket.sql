-- Migration: wallpapers storage bucket (private) + per-user RLS policies
-- Purpose:
-- - Enable cross-device custom wallpaper uploads (private bucket).
-- - Enforce per-user isolation via path prefix: <auth.uid()>/<filename>.
-- Idempotent: safe to re-run.

DO $$
BEGIN
  -- storage schema exists in Supabase projects; if missing, skip.
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'Skipping wallpapers bucket migration: storage schema not present';
    RETURN;
  END IF;

  -- Create (or ensure) private bucket
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'wallpapers') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('wallpapers', 'wallpapers', false);
  ELSE
    UPDATE storage.buckets SET public = false WHERE id = 'wallpapers';
  END IF;
END $$;

-- RLS policies on storage.objects (bucket-scoped).
-- NOTE: Supabase Storage uses RLS on storage.objects. These policies restrict
-- reads/writes to the caller's own folder prefix: <uid>/...

DROP POLICY IF EXISTS "Users can read own wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own wallpapers" ON storage.objects;

CREATE POLICY "Users can read own wallpapers"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'wallpapers'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own wallpapers"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'wallpapers'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own wallpapers"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'wallpapers'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'wallpapers'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own wallpapers"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'wallpapers'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

