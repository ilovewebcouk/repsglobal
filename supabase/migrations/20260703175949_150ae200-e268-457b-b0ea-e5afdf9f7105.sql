-- Add client role + duration fields to transformations so the public
-- proof card can show "Marketing Director · 12 weeks" without duplicating
-- the headline.
ALTER TABLE public.shop_front_transformations
  ADD COLUMN IF NOT EXISTS client_role text,
  ADD COLUMN IF NOT EXISTS duration_label text;

-- Storage policies for the shop-front-results bucket (bucket itself was
-- created via the storage_create_bucket tool). Mirrors the shop-front-hero
-- policy set: public read, owner-scoped write/update/delete by folder.
CREATE POLICY "Public can view shop-front results images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-front-results');

CREATE POLICY "Owners can upload their result images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'shop-front-results'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can update their result images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'shop-front-results'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can delete their result images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'shop-front-results'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Service role full access to shop-front results"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'shop-front-results')
  WITH CHECK (bucket_id = 'shop-front-results');