-- ip_geo_cache: /24 subnet → geo lookup, 30d TTL, avoids exhausting ipapi.co free quota
CREATE TABLE public.ip_geo_cache (
  subnet TEXT PRIMARY KEY,
  country_code TEXT,
  region TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT,
  source TEXT NOT NULL DEFAULT 'ipapi',
  looked_up_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ip_geo_cache TO authenticated;
GRANT ALL ON public.ip_geo_cache TO service_role;

ALTER TABLE public.ip_geo_cache ENABLE ROW LEVEL SECURITY;

-- Admin-only visibility; writes happen via service role (server-only)
CREATE POLICY "admins read ip_geo_cache"
ON public.ip_geo_cache FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX ip_geo_cache_looked_up_at_idx ON public.ip_geo_cache(looked_up_at);