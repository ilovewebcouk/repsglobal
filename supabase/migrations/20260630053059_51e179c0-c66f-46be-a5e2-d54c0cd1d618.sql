
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url text;

-- Public read of shop-front-services bucket
CREATE POLICY "shop_front_services_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-front-services');

-- Trainers can upload/update/delete only files inside their own user-id folder
CREATE POLICY "shop_front_services_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'shop-front-services'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "shop_front_services_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'shop-front-services'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'shop-front-services'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "shop_front_services_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'shop-front-services'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
