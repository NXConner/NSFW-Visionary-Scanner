-- Migration: NSFW DLC private storage bucket (idempotent)
-- Purpose:
-- - Create a private Supabase Storage bucket used for NSFW DLC assets (images/videos).
-- - No direct client RLS policies are granted on purpose; access is via signed URLs only.
-- - Admin uploads use signed upload URLs issued by edge functions.

-- Create/ensure bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nsfw-content',
  'nsfw-content',
  false,
  10737418240, -- 10GB (adjust in dashboard if needed)
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/json',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- NOTE:
-- We intentionally do NOT add storage.objects policies for this bucket.
-- With RLS enabled on storage.objects, this means:
-- - Regular authenticated users cannot list/read/write objects directly.
-- - The service role (edge functions) can read/write and can mint signed URLs.
-- - Clients access assets only via signed URLs (see functions: get-dlc-signed-url / get-dlc-signed-upload-url).

