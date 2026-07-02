
-- =========================================================
-- ip_geolocation_cache
-- =========================================================
CREATE TABLE IF NOT EXISTS public.ip_geolocation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL UNIQUE,
  ip_prefix_hash TEXT,
  provider TEXT NOT NULL DEFAULT 'ipapi',
  country_code TEXT,
  country_name TEXT,
  region TEXT,
  city TEXT,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT,
  asn TEXT,
  org TEXT,
  lookup_status TEXT NOT NULL DEFAULT 'ok', -- ok | failed | private | rate_limited
  raw_response_jsonb JSONB,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ip_geolocation_cache_prefix_idx ON public.ip_geolocation_cache (ip_prefix_hash);
CREATE INDEX IF NOT EXISTS ip_geolocation_cache_expires_idx ON public.ip_geolocation_cache (expires_at);

GRANT SELECT ON public.ip_geolocation_cache TO authenticated;
GRANT ALL ON public.ip_geolocation_cache TO service_role;

ALTER TABLE public.ip_geolocation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_ip_geo_cache" ON public.ip_geolocation_cache
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- security_visitor_ip_observations
-- =========================================================
CREATE TABLE IF NOT EXISTS public.security_visitor_ip_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  anonymous_id TEXT,
  posthog_distinct_id TEXT,
  user_id UUID,
  professional_id UUID,
  event_context TEXT,               -- 'page_view' | 'auth' | 'member_event' | 'enquiry' ...
  path TEXT,
  referrer TEXT,
  raw_ip TEXT,                      -- admin-only via RLS
  ip_hash TEXT,
  ip_prefix_hash TEXT,
  user_agent TEXT,
  user_agent_hash TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT,
  asn TEXT,
  org TEXT,
  location_source TEXT,             -- cloudflare-headers | ipapi | country-only | none
  location_confidence TEXT,         -- city | region | country | unknown
  flagged BOOLEAN NOT NULL DEFAULT false,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS svio_dedupe_idx
  ON public.security_visitor_ip_observations (session_id, ip_hash, user_agent_hash)
  WHERE session_id IS NOT NULL AND ip_hash IS NOT NULL AND user_agent_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS svio_user_idx ON public.security_visitor_ip_observations (user_id);
CREATE INDEX IF NOT EXISTS svio_last_seen_idx ON public.security_visitor_ip_observations (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS svio_expires_idx ON public.security_visitor_ip_observations (expires_at) WHERE flagged = false;
CREATE INDEX IF NOT EXISTS svio_ip_hash_idx ON public.security_visitor_ip_observations (ip_hash);

GRANT SELECT ON public.security_visitor_ip_observations TO authenticated;
GRANT ALL ON public.security_visitor_ip_observations TO service_role;

ALTER TABLE public.security_visitor_ip_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_visitor_ip_observations" ON public.security_visitor_ip_observations
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- updated_at triggers
-- =========================================================
CREATE TRIGGER trg_ip_geo_cache_updated_at
  BEFORE UPDATE ON public.ip_geolocation_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_svio_updated_at
  BEFORE UPDATE ON public.security_visitor_ip_observations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Retention cleanup
-- =========================================================
CREATE OR REPLACE FUNCTION public.prune_visitor_ip_observations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Public anon default 30d, member/auth 90d — enforced via expires_at column on write.
  DELETE FROM public.security_visitor_ip_observations
   WHERE flagged = false
     AND expires_at < now();

  DELETE FROM public.ip_geolocation_cache
   WHERE expires_at < now() - interval '7 days';
END;
$$;

-- pg_cron nightly cleanup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('prune-visitor-ip-observations')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'prune-visitor-ip-observations');
    PERFORM cron.schedule(
      'prune-visitor-ip-observations',
      '17 3 * * *',
      $cron$ SELECT public.prune_visitor_ip_observations(); $cron$
    );
  END IF;
END $$;
