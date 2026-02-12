-- Migration: Media storage buckets + RLS policies (idempotent)
-- Purpose:
-- - Ensure storage buckets required by app features exist with safe defaults.
-- - Normalize owner-only RLS policies on storage.objects for user-scoped buckets.
--
-- Notes:
-- - Buckets are created via storage.buckets table (Supabase Storage service reads from this).
-- - Buckets are private (public=false) unless explicitly intended to be public.
-- - Access to private objects should be via authenticated Storage API and/or signed URLs.
--
-- Buckets covered:
-- - user-uploads   (private)  import/export files, CSV/JSON/XLSX/ZIP
-- - recordings     (private)  multi-cam recordings + edited output (chunk uploads)
-- - screenshots    (private)  preview images / thumbnails (PNG/JPEG/WEBP)
--
-- IMPORTANT:
-- - We intentionally do NOT add ANY storage.objects policies for nsfw-content here.
--   That bucket is accessed exclusively via signed URLs minted by edge functions.

-- Ensure required buckets exist (insert/update)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'user-uploads',
    'user-uploads',
    false,
    104857600, -- 100MB (imports can be large)
    ARRAY[
      'application/json',
      'text/csv',
      'text/plain',
      'application/pdf',
      'application/zip',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
  ),
  (
    'recordings',
    'recordings',
    false,
    5368709120, -- 5GB
    ARRAY[
      -- Final media types
      'video/webm',
      'video/mp4',
      'video/quicktime',
      -- Chunk uploads use octet-stream (chunks are merged server-side)
      'application/octet-stream'
    ]
  ),
  (
    'screenshots',
    'screenshots',
    false,
    52428800, -- 50MB
    ARRAY[
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'application/octet-stream'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ====================
-- Normalize policies
-- ====================
-- On hosted Supabase, storage.objects may be owned by a system role rather than the
-- migrator role. In that case, skip policy DDL instead of failing the whole migration.
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
    -- Ensure RLS is enabled on storage.objects (safe if already enabled)
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    -- Drop legacy user-uploads policies created earlier (names are stable in existing migrations).
    DROP POLICY IF EXISTS "Users can upload own files to user-uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view own files in user-uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own files in user-uploads" ON storage.objects;

    -- Drop any previous policies for these buckets if rerun manually.
    DROP POLICY IF EXISTS "Users can manage own files in user-uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Users can manage own recordings" ON storage.objects;
    DROP POLICY IF EXISTS "Users can manage own screenshots" ON storage.objects;

    -- user-uploads: authenticated users can manage their own user-scoped objects
    CREATE POLICY "Users can manage own files in user-uploads"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
      bucket_id = 'user-uploads'
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'user-uploads'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

    -- recordings: authenticated users can manage their own user-scoped objects
    CREATE POLICY "Users can manage own recordings"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
      bucket_id = 'recordings'
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'recordings'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

    -- screenshots: authenticated users can manage their own user-scoped objects
    CREATE POLICY "Users can manage own screenshots"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
      bucket_id = 'screenshots'
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'screenshots'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  ELSE
    RAISE NOTICE 'Skipping storage.objects policy DDL: current user % does not own storage.objects', current_user;
  END IF;
END $$;

