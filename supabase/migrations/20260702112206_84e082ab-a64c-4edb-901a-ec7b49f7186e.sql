
-- Fix missing service_role grant (root cause: silent insert failure)
GRANT SELECT, INSERT ON public.proxy_ingest_diagnostics TO service_role;

-- Add the diagnostic fields required to explain the browser geo path.
ALTER TABLE public.proxy_ingest_diagnostics
  ADD COLUMN IF NOT EXISTS extracted_path text,
  ADD COLUMN IF NOT EXISTS raw_ip_source text,           -- label only, never the IP
  ADD COLUMN IF NOT EXISTS consent_write_eligible boolean,
  ADD COLUMN IF NOT EXISTS observation_id uuid,
  ADD COLUMN IF NOT EXISTS geo_provider_attempted text,
  ADD COLUMN IF NOT EXISTS geo_provider_result text,
  ADD COLUMN IF NOT EXISTS geo_cache_hit boolean,
  ADD COLUMN IF NOT EXISTS geo_has_region boolean,
  ADD COLUMN IF NOT EXISTS geo_has_lat_lng boolean;

-- Ensure anon/authenticated (non-admin) cannot read. Only admins may SELECT via the existing policy.
REVOKE SELECT ON public.proxy_ingest_diagnostics FROM anon;
GRANT SELECT ON public.proxy_ingest_diagnostics TO authenticated; -- policy still restricts to admins
