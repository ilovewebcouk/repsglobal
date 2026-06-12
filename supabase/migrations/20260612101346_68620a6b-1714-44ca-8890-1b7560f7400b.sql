-- Mark trading_name as deprecated on the trainer profile surface
COMMENT ON COLUMN public.professionals.trading_name IS 'DEPRECATED — Studio/Org model will replace this; do not read on public trainer-profile surfaces. Use profiles.full_name for trainer identity.';

-- 1. CREATE TABLE
CREATE TABLE public.professional_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  label text,
  type text NOT NULL DEFAULT 'primary' CHECK (type IN ('primary','gym','outdoor','service_area','online')),
  postcode text,
  postcode_outward text,
  town text,
  region text,
  country_code text NOT NULL DEFAULT 'GB',
  latitude double precision,
  longitude double precision,
  service_radius_miles integer,
  is_primary boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One primary location per professional
CREATE UNIQUE INDEX professional_locations_one_primary
  ON public.professional_locations (professional_id)
  WHERE is_primary;

CREATE INDEX professional_locations_pro_idx
  ON public.professional_locations (professional_id);

CREATE INDEX professional_locations_geo_idx
  ON public.professional_locations (latitude, longitude)
  WHERE is_public AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- 2. GRANT (no anon; public reads go through a server fn using service_role)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_locations TO authenticated;
GRANT ALL ON public.professional_locations TO service_role;

-- 3. ENABLE RLS
ALTER TABLE public.professional_locations ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES — professional owns their rows
CREATE POLICY "Pros view own locations"
  ON public.professional_locations
  FOR SELECT
  TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Pros insert own locations"
  ON public.professional_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Pros update own locations"
  ON public.professional_locations
  FOR UPDATE
  TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Pros delete own locations"
  ON public.professional_locations
  FOR DELETE
  TO authenticated
  USING (professional_id = auth.uid());

-- Admins can manage all rows
CREATE POLICY "Admins manage all locations"
  ON public.professional_locations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER professional_locations_set_updated_at
  BEFORE UPDATE ON public.professional_locations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();