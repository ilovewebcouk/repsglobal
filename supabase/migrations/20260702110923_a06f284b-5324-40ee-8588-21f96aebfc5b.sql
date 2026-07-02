DROP INDEX IF EXISTS public.svio_dedupe_idx;
CREATE UNIQUE INDEX svio_dedupe_idx
  ON public.security_visitor_ip_observations (session_id, ip_hash, user_agent_hash);