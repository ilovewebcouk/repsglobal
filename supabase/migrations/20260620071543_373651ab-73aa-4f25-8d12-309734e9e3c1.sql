
CREATE TABLE public.professional_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  width integer,
  height integer,
  byte_size integer,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX professional_photos_pro_sort_idx
  ON public.professional_photos (professional_id, sort_order);

CREATE UNIQUE INDEX professional_photos_storage_path_uniq
  ON public.professional_photos (storage_path);

GRANT SELECT ON public.professional_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_photos TO authenticated;
GRANT ALL ON public.professional_photos TO service_role;

ALTER TABLE public.professional_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view professional photos"
  ON public.professional_photos FOR SELECT
  USING (true);

CREATE POLICY "Pros can insert their own photos"
  ON public.professional_photos FOR INSERT TO authenticated
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Pros can update their own photos"
  ON public.professional_photos FOR UPDATE TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Pros can delete their own photos"
  ON public.professional_photos FOR DELETE TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Admins can manage all photos"
  ON public.professional_photos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER professional_photos_set_updated_at
  BEFORE UPDATE ON public.professional_photos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Storage policies on pro-photos bucket
CREATE POLICY "Public read for pro-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pro-photos');

CREATE POLICY "Pros can upload to their own folder in pro-photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pro-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Pros can update their own pro-photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'pro-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Pros can delete their own pro-photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'pro-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
