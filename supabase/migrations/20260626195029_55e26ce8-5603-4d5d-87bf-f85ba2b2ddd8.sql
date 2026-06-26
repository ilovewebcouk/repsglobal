
CREATE TABLE public.profile_view_events (
  id BIGSERIAL PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  viewer_user_id UUID NULL,
  viewer_ip_hash TEXT NULL,
  source TEXT NULL,
  referrer_host TEXT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX profile_view_events_pro_created_idx
  ON public.profile_view_events (professional_id, created_at DESC);

GRANT INSERT ON public.profile_view_events TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.profile_view_events_id_seq TO anon, authenticated;
GRANT SELECT ON public.profile_view_events TO authenticated;
GRANT ALL ON public.profile_view_events TO service_role;

ALTER TABLE public.profile_view_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a profile view"
  ON public.profile_view_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Pro can read own profile view events"
  ON public.profile_view_events
  FOR SELECT
  TO authenticated
  USING (
    professional_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TABLE public.search_appearance_events (
  id BIGSERIAL PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  query TEXT NULL,
  location_slug TEXT NULL,
  profession_slug TEXT NULL,
  position INTEGER NULL,
  page INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX search_appearance_events_pro_created_idx
  ON public.search_appearance_events (professional_id, created_at DESC);

GRANT INSERT ON public.search_appearance_events TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.search_appearance_events_id_seq TO anon, authenticated;
GRANT SELECT ON public.search_appearance_events TO authenticated;
GRANT ALL ON public.search_appearance_events TO service_role;

ALTER TABLE public.search_appearance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a search appearance"
  ON public.search_appearance_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Pro can read own search appearance events"
  ON public.search_appearance_events
  FOR SELECT
  TO authenticated
  USING (
    professional_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );
