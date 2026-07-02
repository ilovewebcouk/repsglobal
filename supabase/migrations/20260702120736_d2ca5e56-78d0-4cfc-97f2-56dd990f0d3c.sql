-- ─────────────────────────────────────────────────────────────
-- 1. visitor_journeys
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.visitor_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  posthog_distinct_id TEXT,
  latest_observation_id UUID REFERENCES public.security_visitor_ip_observations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entry_path TEXT,
  entry_referrer TEXT,
  latest_path TEXT,
  latest_event TEXT,
  source TEXT,
  page_count INTEGER NOT NULL DEFAULT 0,
  event_count INTEGER NOT NULL DEFAULT 0,
  path_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  event_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS visitor_journeys_session_key
  ON public.visitor_journeys (session_id)
  WHERE session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS visitor_journeys_distinct_key
  ON public.visitor_journeys (posthog_distinct_id)
  WHERE session_id IS NULL AND posthog_distinct_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS visitor_journeys_last_seen_idx
  ON public.visitor_journeys (last_seen_at DESC);

CREATE INDEX IF NOT EXISTS visitor_journeys_user_idx
  ON public.visitor_journeys (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS visitor_journeys_distinct_idx
  ON public.visitor_journeys (posthog_distinct_id);

CREATE INDEX IF NOT EXISTS visitor_journeys_expires_idx
  ON public.visitor_journeys (expires_at);

GRANT SELECT ON public.visitor_journeys TO authenticated;
GRANT ALL ON public.visitor_journeys TO service_role;

ALTER TABLE public.visitor_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_visitor_journeys"
  ON public.visitor_journeys
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger reuses existing helper if present, else creates one.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'set_updated_at_timestamp'
  ) THEN
    CREATE FUNCTION public.set_updated_at_timestamp() RETURNS TRIGGER
    LANGUAGE plpgsql SET search_path = public AS $fn$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $fn$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS visitor_journeys_updated_at ON public.visitor_journeys;
CREATE TRIGGER visitor_journeys_updated_at
  BEFORE UPDATE ON public.visitor_journeys
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ─────────────────────────────────────────────────────────────
-- 2. proxy_ingest_diagnostics: journey_result column
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.proxy_ingest_diagnostics
  ADD COLUMN IF NOT EXISTS journey_result TEXT,
  ADD COLUMN IF NOT EXISTS journey_id UUID;

-- ─────────────────────────────────────────────────────────────
-- 3. link_visitor_to_user
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.link_visitor_to_user(
  _distinct_id TEXT,
  _user_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  obs_linked INT := 0;
  jrn_linked INT := 0;
BEGIN
  IF _distinct_id IS NULL OR _user_id IS NULL THEN
    RETURN jsonb_build_object('observations_linked', 0, 'journeys_linked', 0);
  END IF;

  UPDATE public.security_visitor_ip_observations
     SET user_id = _user_id,
         updated_at = now()
   WHERE user_id IS NULL
     AND posthog_distinct_id = _distinct_id
     AND last_seen_at > now() - INTERVAL '30 days';
  GET DIAGNOSTICS obs_linked = ROW_COUNT;

  UPDATE public.visitor_journeys
     SET user_id = _user_id,
         updated_at = now()
   WHERE user_id IS NULL
     AND posthog_distinct_id = _distinct_id
     AND last_seen_at > now() - INTERVAL '30 days';
  GET DIAGNOSTICS jrn_linked = ROW_COUNT;

  RETURN jsonb_build_object(
    'observations_linked', obs_linked,
    'journeys_linked', jrn_linked
  );
END;
$$;

REVOKE ALL ON FUNCTION public.link_visitor_to_user(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_visitor_to_user(TEXT, UUID) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- 4. purge_expired_ip_observations
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.purge_expired_ip_observations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  obs_deleted INT := 0;
  jrn_deleted INT := 0;
  diag_deleted INT := 0;
BEGIN
  DELETE FROM public.security_visitor_ip_observations
   WHERE expires_at < now();
  GET DIAGNOSTICS obs_deleted = ROW_COUNT;

  DELETE FROM public.visitor_journeys
   WHERE expires_at < now();
  GET DIAGNOSTICS jrn_deleted = ROW_COUNT;

  -- Also trim old diagnostics (>14d) so the debug log doesn't grow unbounded.
  DELETE FROM public.proxy_ingest_diagnostics
   WHERE created_at < now() - INTERVAL '14 days';
  GET DIAGNOSTICS diag_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'observations_deleted', obs_deleted,
    'journeys_deleted', jrn_deleted,
    'diagnostics_deleted', diag_deleted,
    'ran_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_ip_observations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_ip_observations() TO service_role;

-- ─────────────────────────────────────────────────────────────
-- 5. log_visitor_ip_reveal — admin audit trail for raw-IP views
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_visitor_ip_reveal(
  _observation_id UUID,
  _journey_id UUID,
  _reason TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID := auth.uid();
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor, 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  INSERT INTO public.admin_audit_log (
    actor_id, action, target_table, target_id, reason, after_state
  ) VALUES (
    actor,
    'visitor_ip_reveal',
    'security_visitor_ip_observations',
    _observation_id,
    _reason,
    jsonb_build_object('journey_id', _journey_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_visitor_ip_reveal(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_visitor_ip_reveal(UUID, UUID, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. pg_cron nightly purge
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-expired-ip-observations') THEN
    PERFORM cron.unschedule('purge-expired-ip-observations');
  END IF;
END $$;

SELECT cron.schedule(
  'purge-expired-ip-observations',
  '0 3 * * *',
  $$ SELECT public.purge_expired_ip_observations(); $$
);