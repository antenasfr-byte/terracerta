-- TerraCerta — Create private Storage bucket for plant/soil photos
-- The bucket is private: access is controlled via RLS policies below.

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder: userId/...
DROP POLICY IF EXISTS "photos_upload_own" ON storage.objects;
CREATE POLICY "photos_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read their own photos
DROP POLICY IF EXISTS "photos_read_own" ON storage.objects;
CREATE POLICY "photos_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own photos
DROP POLICY IF EXISTS "photos_delete_own" ON storage.objects;
CREATE POLICY "photos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to create signed URLs for their own photos
DROP POLICY IF EXISTS "photos_signed_urls" ON storage.objects;
CREATE POLICY "photos_signed_urls" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
