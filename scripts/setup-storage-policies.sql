-- Supabase Storage RLS Policies
-- Run this in Supabase SQL Editor after creating buckets

-- ==================== user-uploads Bucket ====================

-- Allow authenticated users to upload
CREATE POLICY "Users can upload to user-uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-uploads');

-- Allow users to read their own files
CREATE POLICY "Users can read own files from user-uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files in user-uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files from user-uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== videos Bucket ====================

-- Public read access
CREATE POLICY "Public can read videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Users can update their own videos
CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== images Bucket ====================

-- Public read access
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Users can manage their own images
CREATE POLICY "Users can manage own images"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== audio Bucket ====================

-- Public read access
CREATE POLICY "Public can read audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio');

-- Users can manage their own audio
CREATE POLICY "Users can manage own audio"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== screenshots Bucket ====================

-- Public read access
CREATE POLICY "Public can read screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'screenshots');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'screenshots');

-- Users can manage their own screenshots
CREATE POLICY "Users can manage own screenshots"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== recordings Bucket ====================

-- Private bucket - only owner can access
CREATE POLICY "Users can read own recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can upload their own recordings
CREATE POLICY "Users can upload own recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can manage their own recordings
CREATE POLICY "Users can manage own recordings"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== expert-content Bucket ====================

-- Public read access
CREATE POLICY "Public can read expert content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'expert-content');

-- Only experts can upload
CREATE POLICY "Experts can upload content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'expert-content' AND
  EXISTS (
    SELECT 1 FROM expert_profiles
    WHERE expert_profiles.user_id = auth.uid()
    AND expert_profiles.is_verified = true
  )
);

-- ==================== nsfw-content Bucket ====================

-- Public read access
CREATE POLICY "Public can read NSFW content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'nsfw-content');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload NSFW content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'nsfw-content');

-- Users can manage their own NSFW content
CREATE POLICY "Users can manage own NSFW content"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'nsfw-content' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

