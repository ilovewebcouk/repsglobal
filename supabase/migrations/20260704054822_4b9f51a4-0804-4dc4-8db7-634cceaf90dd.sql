-- website-hero
CREATE POLICY "website_hero_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'website-hero');
CREATE POLICY "website_hero_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'website-hero' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "website_hero_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'website-hero' AND (storage.foldername(name))[1] = (auth.uid())::text)
  WITH CHECK (bucket_id = 'website-hero' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "website_hero_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'website-hero' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "website_hero_service_all" ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'website-hero') WITH CHECK (bucket_id = 'website-hero');

-- website-services
CREATE POLICY "website_services_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'website-services');
CREATE POLICY "website_services_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'website-services' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "website_services_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'website-services' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'website-services' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "website_services_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'website-services' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- website-results
CREATE POLICY "website_results_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'website-results');
CREATE POLICY "website_results_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'website-results' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "website_results_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'website-results' AND (storage.foldername(name))[1] = (auth.uid())::text)
  WITH CHECK (bucket_id = 'website-results' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "website_results_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'website-results' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "website_results_service_all" ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'website-results') WITH CHECK (bucket_id = 'website-results');