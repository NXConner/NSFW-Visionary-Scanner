-- Migration: Wallpapers storage bucket + owner-only RLS policies (idempotent)
-- Purpose:
-- - Allow authenticated users to upload/download their own custom wallpapers.
-- - Keep bucket private (public=false); access is controlled by storage.objects RLS policies.
--
-- Path convention enforced by policies:
-- - object.name must be prefixed with `<auth.uid()>/...`

-- Ensure bucket exists (insert/update)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'wallpapers',
    'wallpapers',
    false,
    52428800, -- 50MB (matches client validation for video wallpapers)
    ARRAY[
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/octet-stream'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Normalize RLS policies (skip if current role does not own storage.objects)
DO $$
DECLARE
  owns_storage_objects BOOLEAN := false;
BEGIN
  SELECT (pg_catalog.pg_get_userbyid(c.relowner) = current_user)
  INTO owns_storage_objects
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'storage'
    AND c.relname = 'objects'
    AND c.relkind = 'r'
  LIMIT 1;

  IF COALESCE(owns_storage_objects, false) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can manage own wallpapers" ON storage.objects;

    CREATE POLICY "Users can manage own wallpapers"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
      bucket_id = 'wallpapers'
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'wallpapers'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  ELSE
    RAISE NOTICE 'Skipping storage.objects policy DDL for wallpapers: current user % does not own storage.objects', current_user;
  END IF;
END $$;

