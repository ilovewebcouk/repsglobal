-- Storage policies for verification-docs bucket
-- Convention: files saved as {professional_id}/{filename}

CREATE POLICY "Pros manage own verification docs"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins read all verification docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND public.has_role(auth.uid(), 'admin')
  );