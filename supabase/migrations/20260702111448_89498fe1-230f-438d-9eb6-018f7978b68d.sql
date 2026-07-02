-- Diagnostics table for the PostHog proxy observation writer.
-- Admin-only. Bounded rolling log; keeps last ~500 attempts so we can debug from psql
-- without needing Cloudflare Worker log access.
CREATE TABLE public.proxy_ingest_diagnostics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  proxy_path text,
  method text,
  parser text,
  event_count int,
  first_event text,
  has_session boolean,
  has_distinct boolean,
  has_path boolean,
  has_referrer boolean,
  has_raw_ip boolean,
  is_admin boolean,
  attempted boolean,
  result text,
  error_code text,
  error_message text,
  error_details text,
  error_hint text,
  geo_source text,
  geo_confidence text,
  geo_has_city boolean
);

GRANT SELECT ON public.proxy_ingest_diagnostics TO authenticated;
GRANT ALL ON public.proxy_ingest_diagnostics TO service_role;

ALTER TABLE public.proxy_ingest_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view proxy diagnostics"
  ON public.proxy_ingest_diagnostics FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX proxy_ingest_diag_created_idx ON public.proxy_ingest_diagnostics (created_at DESC);

-- Trim on insert: keep only 500 most recent rows.
CREATE OR REPLACE FUNCTION public.trim_proxy_ingest_diagnostics()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.proxy_ingest_diagnostics
  WHERE id IN (
    SELECT id FROM public.proxy_ingest_diagnostics
    ORDER BY created_at DESC
    OFFSET 500
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trim_proxy_ingest_diag
AFTER INSERT ON public.proxy_ingest_diagnostics
FOR EACH STATEMENT EXECUTE FUNCTION public.trim_proxy_ingest_diagnostics();