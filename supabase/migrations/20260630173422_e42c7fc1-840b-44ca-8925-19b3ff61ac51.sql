
-- =========================================================
-- Admin Activity v1 — capture tables, retention, indexes
-- =========================================================

-- ---------- auth_events: drop city, ensure device/browser/os ----------
ALTER TABLE public.auth_events DROP COLUMN IF EXISTS city;
-- device/browser/os already present; nothing to add.

-- ---------- user_sessions: drop city; allow logged-in-only rows ----------
ALTER TABLE public.user_sessions DROP COLUMN IF EXISTS city;
ALTER TABLE public.user_sessions ALTER COLUMN anon_id DROP NOT NULL;

-- ---------- member_session_events: new table ----------
CREATE TABLE IF NOT EXISTS public.member_session_events (
  id           uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id   uuid,
  path         text NOT NULL,
  referrer     text,
  ip_hash      text,
  user_agent   text,
  country_code text,
  device       text,
  browser      text,
  os           text,
  duration_ms  integer,
  created_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.member_session_events TO authenticated;
GRANT ALL    ON public.member_session_events TO service_role;
ALTER TABLE public.member_session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read member_session_events"
  ON public.member_session_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS member_session_events_created_idx
  ON public.member_session_events (created_at DESC);
CREATE INDEX IF NOT EXISTS member_session_events_user_created_idx
  ON public.member_session_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS member_session_events_path_idx
  ON public.member_session_events (path);
CREATE INDEX IF NOT EXISTS member_session_events_session_idx
  ON public.member_session_events (session_id);

-- ---------- metrics_monthly_activity: rollup ----------
CREATE TABLE IF NOT EXISTS public.metrics_monthly_activity (
  month                 date NOT NULL PRIMARY KEY,
  signed_in_users       integer NOT NULL DEFAULT 0,
  sign_ins              integer NOT NULL DEFAULT 0,
  member_page_views     integer NOT NULL DEFAULT 0,
  unique_members_seen   integer NOT NULL DEFAULT 0,
  enquiries             integer NOT NULL DEFAULT 0,
  reviews               integer NOT NULL DEFAULT 0,
  support_messages      integer NOT NULL DEFAULT 0,
  payments              integer NOT NULL DEFAULT 0,
  disputes              integer NOT NULL DEFAULT 0,
  countries             jsonb,
  devices               jsonb,
  computed_at           timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.metrics_monthly_activity TO authenticated;
GRANT ALL    ON public.metrics_monthly_activity TO service_role;
ALTER TABLE public.metrics_monthly_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read metrics_monthly_activity"
  ON public.metrics_monthly_activity
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- Source-table indexes for activity feed performance ----------
CREATE INDEX IF NOT EXISTS payment_events_created_idx
  ON public.payment_events (created_at DESC);
CREATE INDEX IF NOT EXISTS support_messages_created_idx
  ON public.support_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_created_idx
  ON public.reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS verification_decisions_created_idx
  ON public.verification_decisions (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS email_send_log_created_idx
  ON public.email_send_log (created_at DESC);
CREATE INDEX IF NOT EXISTS churn_lifecycle_entered_idx
  ON public.churn_lifecycle (entered_at DESC);
CREATE INDEX IF NOT EXISTS disputes_opened_idx
  ON public.disputes (opened_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_created_idx
  ON public.enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS lead_activity_created_idx
  ON public.lead_activity (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_impersonation_sessions_created_idx
  ON public.admin_impersonation_sessions (created_at DESC);

-- ---------- page_view_events deprecation ----------
COMMENT ON TABLE public.page_view_events IS
  'DEPRECATED 2026-06-30. No application writers. See docs/admin-v2/page-view-events-deprecation-decision.md. Do not add new writers; anonymous capture is gated by the v1.1 public-analytics plan.';

-- ---------- Retention purge function ----------
CREATE OR REPLACE FUNCTION public.purge_activity_detail()
RETURNS TABLE(
  deleted_session_events bigint,
  deleted_user_sessions bigint,
  deleted_auth_events bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_sess bigint := 0;
  v_us   bigint := 0;
  v_auth bigint := 0;
BEGIN
  -- 1. Roll member_session_events older than 90d into monthly aggregates
  INSERT INTO public.metrics_monthly_activity AS m (month, member_page_views, unique_members_seen, countries, devices, computed_at)
  SELECT
    date_trunc('month', e.created_at)::date AS month,
    COUNT(*)::int AS member_page_views,
    COUNT(DISTINCT e.user_id)::int AS unique_members_seen,
    jsonb_object_agg(coalesce(e.country_code,'??'), c) FILTER (WHERE c IS NOT NULL) AS countries,
    jsonb_object_agg(coalesce(e.device,'unknown'),  d) FILTER (WHERE d IS NOT NULL) AS devices,
    now()
  FROM public.member_session_events e
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS c FROM public.member_session_events e2
    WHERE date_trunc('month', e2.created_at) = date_trunc('month', e.created_at)
      AND e2.country_code = e.country_code
  ) cc ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS d FROM public.member_session_events e3
    WHERE date_trunc('month', e3.created_at) = date_trunc('month', e.created_at)
      AND e3.device = e.device
  ) dd ON TRUE
  WHERE e.created_at < now() - interval '90 days'
  GROUP BY 1
  ON CONFLICT (month) DO UPDATE SET
    member_page_views   = EXCLUDED.member_page_views,
    unique_members_seen = EXCLUDED.unique_members_seen,
    countries           = EXCLUDED.countries,
    devices             = EXCLUDED.devices,
    computed_at         = now();

  WITH d AS (
    DELETE FROM public.member_session_events
     WHERE created_at < now() - interval '90 days'
     RETURNING 1
  ) SELECT count(*) INTO v_sess FROM d;

  -- 2. user_sessions: delete rows ended >90d ago
  WITH d AS (
    DELETE FROM public.user_sessions
     WHERE ended_at IS NOT NULL AND ended_at < now() - interval '90 days'
     RETURNING 1
  ) SELECT count(*) INTO v_us FROM d;

  -- 3. auth_events: 12 months
  WITH d AS (
    DELETE FROM public.auth_events
     WHERE created_at < now() - interval '12 months'
     RETURNING 1
  ) SELECT count(*) INTO v_auth FROM d;

  -- NEVER touches payment_events, disputes, admin_audit_log.

  RETURN QUERY SELECT v_sess, v_us, v_auth;
END;
$fn$;

REVOKE ALL ON FUNCTION public.purge_activity_detail() FROM public;
GRANT EXECUTE ON FUNCTION public.purge_activity_detail() TO service_role;

-- ---------- pg_cron schedule ----------
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purge-activity-detail-nightly')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-activity-detail-nightly');
    PERFORM cron.schedule(
      'purge-activity-detail-nightly',
      '40 3 * * *',
      $$ SELECT public.purge_activity_detail(); $$
    );
  END IF;
END
$cron$;
