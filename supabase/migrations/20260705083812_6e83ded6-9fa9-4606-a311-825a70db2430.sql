CREATE POLICY "Public can view campaign media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-media');

CREATE POLICY "Admins can upload campaign media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'campaign-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update campaign media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'campaign-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete campaign media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'campaign-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages campaign media"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'campaign-media') WITH CHECK (bucket_id = 'campaign-media');