-- RLS + Storage audit queries (run in Supabase SQL editor)
-- Goal: quickly validate production/staging after applying migrations.

-- ====================
-- 1) Storage bucket config sanity
-- ====================
SELECT
  id,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('nsfw-content', 'user-uploads', 'recordings', 'screenshots')
ORDER BY id;

-- Expectation:
-- - nsfw-content: public=false
-- - user-uploads: public=false
-- - recordings: public=false
-- - screenshots: public=false

-- ====================
-- 2) Ensure nsfw-content has no direct storage.objects policies
-- ====================
SELECT
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual ILIKE '%nsfw-content%'
    OR with_check ILIKE '%nsfw-content%'
    OR qual ILIKE '%bucket_id%nsfw-content%'
    OR with_check ILIKE '%bucket_id%nsfw-content%'
  )
ORDER BY policyname;

-- Expectation: 0 rows.

-- ====================
-- 3) Inspect storage.objects policies for user-scoped buckets
-- ====================
SELECT
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual ILIKE '%bucket_id = ''user-uploads''%'
    OR with_check ILIKE '%bucket_id = ''user-uploads''%'
    OR qual ILIKE '%bucket_id = ''recordings''%'
    OR with_check ILIKE '%bucket_id = ''recordings''%'
    OR qual ILIKE '%bucket_id = ''screenshots''%'
    OR with_check ILIKE '%bucket_id = ''screenshots''%'
  )
ORDER BY policyname, cmd;

-- Expectation:
-- - Policies should be TO authenticated
-- - Qual + with_check should scope by bucket_id + foldername(name)[1] = auth.uid()

-- ====================
-- 4) RLS inventory (public schema tables missing RLS)
-- ====================
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname NOT LIKE 'pg_%'
  AND c.relrowsecurity = false
ORDER BY c.relname;

-- Expectation:
-- - Ideally: 0 rows.
-- - If any rows exist, confirm tables are intentionally public-read or otherwise safe.

