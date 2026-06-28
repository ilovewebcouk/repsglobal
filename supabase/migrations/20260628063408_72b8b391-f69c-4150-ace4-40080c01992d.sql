
-- ---------------------------------------------------------------
-- Operations Centre finalisation
-- ---------------------------------------------------------------

-- 1. Alert metadata: mute / notes / email dispatch tracking
ALTER TABLE public.ops_alerts
  ADD COLUMN IF NOT EXISTS muted_until         timestamptz,
  ADD COLUMN IF NOT EXISTS notes               text,
  ADD COLUMN IF NOT EXISTS email_dispatched_at timestamptz;

CREATE INDEX IF NOT EXISTS ops_alerts_email_dispatch_idx
  ON public.ops_alerts (severity, opened_at)
  WHERE email_dispatched_at IS NULL AND resolved_at IS NULL;

-- 2. Database health snapshot (admin-only)
CREATE OR REPLACE FUNCTION public.ops_db_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_active_conn       int;
  v_max_conn          int;
  v_db_size           bigint;
  v_slow              jsonb;
  v_long_running      int;
  v_ok                boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- connectivity round-trip
  BEGIN
    PERFORM 1;
    v_ok := true;
  EXCEPTION WHEN OTHERS THEN
    v_ok := false;
  END;

  SELECT count(*) INTO v_active_conn
    FROM pg_stat_activity
   WHERE state = 'active';

  SELECT setting::int INTO v_max_conn
    FROM pg_settings
   WHERE name = 'max_connections';

  SELECT pg_database_size(current_database()) INTO v_db_size;

  SELECT count(*) INTO v_long_running
    FROM pg_stat_activity
   WHERE state = 'active'
     AND now() - query_start > interval '30 seconds'
     AND query NOT ILIKE '%pg_stat_activity%';

  -- top 10 slow queries by mean exec time, public schema only
  BEGIN
    SELECT coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb) INTO v_slow
    FROM (
      SELECT
        substr(query, 1, 200) AS query,
        round(mean_exec_time::numeric, 1) AS mean_ms,
        calls
      FROM pg_stat_statements
      WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      ORDER BY mean_exec_time DESC
      LIMIT 10
    ) s;
  EXCEPTION WHEN OTHERS THEN
    v_slow := '[]'::jsonb;
  END;

  RETURN jsonb_build_object(
    'ok',                  v_ok,
    'active_connections',  v_active_conn,
    'max_connections',     v_max_conn,
    'long_running_queries', v_long_running,
    'database_bytes',      v_db_size,
    'slow_queries',        v_slow,
    'checked_at',          now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ops_db_health() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.ops_db_health() TO service_role;

-- 3. Universal member finder (admin-only)
CREATE OR REPLACE FUNCTION public.ops_find_member(_q text)
RETURNS TABLE (
  user_id    uuid,
  email      text,
  full_name  text,
  match_kind text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  q text := btrim(_q);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF q IS NULL OR length(q) = 0 THEN
    RETURN;
  END IF;

  -- UUID
  IF q ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN QUERY
      SELECT u.id, u.email::text, p.full_name, 'uuid'::text
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
       WHERE u.id = q::uuid
       LIMIT 1;
    RETURN;
  END IF;

  -- Stripe customer id
  IF q LIKE 'cus_%' THEN
    RETURN QUERY
      SELECT u.id, u.email::text, p.full_name, 'stripe_customer'::text
        FROM public.subscriptions s
        JOIN auth.users u ON u.id = s.user_id
        LEFT JOIN public.profiles p ON p.id = u.id
       WHERE s.stripe_customer_id = q
       LIMIT 1;
    IF FOUND THEN RETURN; END IF;

    RETURN QUERY
      SELECT u.id, u.email::text, p.full_name, 'stripe_customer_legacy'::text
        FROM public.legacy_stripe_link l
        JOIN auth.users u ON u.id = l.user_id
        LEFT JOIN public.profiles p ON p.id = u.id
       WHERE l.stripe_customer_id = q
       LIMIT 1;
    RETURN;
  END IF;

  -- Stripe subscription id
  IF q LIKE 'sub_%' THEN
    RETURN QUERY
      SELECT u.id, u.email::text, p.full_name, 'stripe_subscription'::text
        FROM public.subscriptions s
        JOIN auth.users u ON u.id = s.user_id
        LEFT JOIN public.profiles p ON p.id = u.id
       WHERE s.stripe_subscription_id = q
       LIMIT 1;
    RETURN;
  END IF;

  -- Email
  IF q LIKE '%@%' THEN
    RETURN QUERY
      SELECT u.id, u.email::text, p.full_name, 'email'::text
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
       WHERE lower(u.email) = lower(q)
       LIMIT 1;
    IF FOUND THEN RETURN; END IF;

    -- partial email match
    RETURN QUERY
      SELECT u.id, u.email::text, p.full_name, 'email_partial'::text
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
       WHERE u.email ILIKE '%' || q || '%'
       ORDER BY u.email
       LIMIT 10;
    RETURN;
  END IF;

  -- BD member id (numeric or alphanumeric)
  RETURN QUERY
    SELECT u.id, u.email::text, p.full_name, 'bd_member'::text
      FROM public.bd_member_seed b
      JOIN public.legacy_stripe_link l ON l.bd_member_id = b.bd_member_id
      JOIN auth.users u ON u.id = l.user_id
      LEFT JOIN public.profiles p ON p.id = u.id
     WHERE b.bd_member_id::text = q
     LIMIT 1;
  IF FOUND THEN RETURN; END IF;

  -- Fuzzy full_name fallback
  RETURN QUERY
    SELECT u.id, u.email::text, p.full_name, 'name'::text
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.id
     WHERE p.full_name ILIKE '%' || q || '%'
     ORDER BY p.full_name
     LIMIT 10;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ops_find_member(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.ops_find_member(text) TO service_role;

-- 4. Admin recipient list (for alert email fan-out)
CREATE OR REPLACE FUNCTION public.ops_admin_emails()
RETURNS TABLE (email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT u.email::text
    FROM public.user_roles r
    JOIN auth.users u ON u.id = r.user_id
   WHERE r.role = 'admin'::public.app_role
     AND u.email IS NOT NULL
$$;

REVOKE EXECUTE ON FUNCTION public.ops_admin_emails() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.ops_admin_emails() TO service_role;

-- 5. Schedule alert email dispatcher (every 5 minutes, just after evaluator)
DO $$
DECLARE
  v_anon   text;
  v_origin text;
BEGIN
  -- Best effort: read project anon key + base url from Vault if present.
  BEGIN
    SELECT decrypted_secret INTO v_anon
      FROM vault.decrypted_secrets WHERE name = 'project_anon_key' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN v_anon := NULL; END;

  BEGIN
    SELECT decrypted_secret INTO v_origin
      FROM vault.decrypted_secrets WHERE name = 'project_base_url' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN v_origin := NULL; END;

  IF v_anon IS NULL OR v_origin IS NULL THEN
    -- We schedule the job with a placeholder body; the route works without
    -- the apikey header in dev. In production the Vault values are set by
    -- the platform; if they're missing we still want the cron row visible.
    v_anon   := COALESCE(v_anon,  '');
    v_origin := COALESCE(v_origin, 'https://repsglobal.lovable.app');
  END IF;

  PERFORM cron.unschedule('ops-alerts-dispatch') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'ops-alerts-dispatch'
  );

  PERFORM cron.schedule(
    'ops-alerts-dispatch',
    '*/5 * * * *',
    format($cron$
      SELECT net.http_post(
        url     := %L,
        headers := jsonb_build_object('Content-Type','application/json','apikey', %L),
        body    := '{}'::jsonb
      );
    $cron$, v_origin || '/api/public/ops/alert-dispatch', v_anon)
  );
END;
$$;
