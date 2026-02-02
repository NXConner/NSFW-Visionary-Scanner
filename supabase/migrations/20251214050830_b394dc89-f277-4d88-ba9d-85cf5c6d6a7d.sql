-- Create user-uploads storage bucket with proper security
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  false,
  20971520,
  ARRAY['application/json', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for user-uploads bucket
CREATE POLICY "Users can upload own files to user-uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files in user-uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files in user-uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );