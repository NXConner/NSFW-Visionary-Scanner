-- Supabase Storage RLS Policies (legacy/manual helper)
-- Prefer applying via migrations:
-- - supabase/migrations/*_media_storage_buckets_and_policies.sql
-- - supabase/migrations/*_nsfw_content_storage_bucket.sql
--
-- This script is safe to re-run:
-- - Drops legacy/unsafe policies
-- - Creates owner-only policies for user-scoped private buckets
--
-- IMPORTANT:
-- - Intentionally grants NO direct policies on nsfw-content.
--   Access is ONLY via signed URLs minted by edge functions.

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ================
-- user-uploads
-- ================
DROP POLICY IF EXISTS "Users can upload to user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files from user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files from user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own files to user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files in user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own files in user-uploads" ON storage.objects;

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

-- ================
-- recordings (private)
-- ================
DROP POLICY IF EXISTS "Users can read own recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own recordings" ON storage.objects;

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

-- ================
-- screenshots (private)
-- ================
DROP POLICY IF EXISTS "Public can read screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own screenshots" ON storage.objects;

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

-- ================
-- nsfw-content
-- ================
-- Intentionally no policies. If any exist, investigate and remove them.

