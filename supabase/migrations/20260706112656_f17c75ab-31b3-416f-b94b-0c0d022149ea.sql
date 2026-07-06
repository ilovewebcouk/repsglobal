
CREATE POLICY "Admins can manage course accreditation files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'course-accreditations' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'course-accreditations' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view review evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'provider-review-evidence' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view organisation assets"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'organisation-assets');

CREATE POLICY "Admins can manage organisation assets"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'organisation-assets' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'organisation-assets' AND public.has_role(auth.uid(), 'admin'));
