
CREATE POLICY "Public can view shop-front hero images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-front-hero');

CREATE POLICY "Owners can upload their hero images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'shop-front-hero'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can update their hero images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'shop-front-hero'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can delete their hero images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'shop-front-hero'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Service role full access to shop-front hero"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'shop-front-hero')
  WITH CHECK (bucket_id = 'shop-front-hero');
