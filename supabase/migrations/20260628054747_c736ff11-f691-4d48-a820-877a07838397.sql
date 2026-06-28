-- ============================================================
-- Production Operations: ops_alerts + evaluator + cron
-- ============================================================

-- 1. ops_alerts table -----------------------------------------
CREATE TABLE IF NOT EXISTS public.ops_alerts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL,
  severity    text NOT NULL DEFAULT 'warn' CHECK (severity IN ('info','warn','crit')),
  opened_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  context     jsonb NOT NULL DEFAULT '{}'::jsonb,
  ack_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ack_at      timestamptz
);

GRANT SELECT, UPDATE ON public.ops_alerts TO authenticated;
GRANT ALL ON public.ops_alerts TO service_role;

ALTER TABLE public.ops_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view ops alerts"   ON public.ops_alerts;
DROP POLICY IF EXISTS "Admins update ops alerts" ON public.ops_alerts;

CREATE POLICY "Admins view ops alerts" ON public.ops_alerts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update ops alerts" ON public.ops_alerts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE UNIQUE INDEX IF NOT EXISTS ops_alerts_open_kind_idx
  ON public.ops_alerts (kind)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS ops_alerts_opened_idx
  ON public.ops_alerts (opened_at DESC);

-- 2. Evaluator -------------------------------------------------
CREATE OR REPLACE FUNCTION public.ops_alerts_evaluate()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  snap                  jsonb;
  v_failed_today        int;
  v_avg_failed_7d       numeric;
  v_refunds_today       int;
  v_opened              int := 0;
BEGIN
  -- Reuse the live platform health snapshot
  SELECT public.platform_health_snapshot() INTO snap;

  -- ---- cron.failed --------------------------------------------------------
  IF COALESCE((snap->>'cron_failures_24h')::int, 0) > 0 THEN
    INSERT INTO ops_alerts (kind, severity, context)
    VALUES ('cron.failed','crit', jsonb_build_object('failures_24h', snap->'cron_failures_24h'))
    ON CONFLICT (kind) WHERE resolved_at IS NULL DO NOTHING;
    v_opened := v_opened + 1;
  ELSE
    UPDATE ops_alerts SET resolved_at = now()
     WHERE kind = 'cron.failed' AND resolved_at IS NULL;
  END IF;

  -- ---- webhook.dlq --------------------------------------------------------
  IF COALESCE((snap->>'dlq_webhook_events_7d')::int, 0) > 0 THEN
    INSERT INTO ops_alerts (kind, severity, context)
    VALUES ('webhook.dlq', 'crit',
            jsonb_build_object('dlq_7d', snap->'dlq_webhook_events_7d'))
    ON CONFLICT (kind) WHERE resolved_at IS NULL DO NOTHING;
    v_opened := v_opened + 1;
  ELSE
    UPDATE ops_alerts SET resolved_at = now()
     WHERE kind = 'webhook.dlq' AND resolved_at IS NULL;
  END IF;

  -- ---- email.queue_backing_up --------------------------------------------
  IF COALESCE((snap->>'queue_transactional')::int, 0)
   + COALESCE((snap->>'queue_auth')::int, 0) > 100 THEN
    INSERT INTO ops_alerts (kind, severity, context)
    VALUES ('email.queue_backing_up', 'warn',
            jsonb_build_object(
              'queue_transactional', snap->'queue_transactional',
              'queue_auth',          snap->'queue_auth'))
    ON CONFLICT (kind) WHERE resolved_at IS NULL DO NOTHING;
    v_opened := v_opened + 1;
  ELSE
    UPDATE ops_alerts SET resolved_at = now()
     WHERE kind = 'email.queue_backing_up' AND resolved_at IS NULL;
  END IF;

  -- ---- email.dlq ----------------------------------------------------------
  IF COALESCE((snap->>'dlq_emails_7d')::int, 0) > 0 THEN
    INSERT INTO ops_alerts (kind, severity, context)
    VALUES ('email.dlq', 'crit',
            jsonb_build_object('dlq_7d', snap->'dlq_emails_7d'))
    ON CONFLICT (kind) WHERE resolved_at IS NULL DO NOTHING;
    v_opened := v_opened + 1;
  ELSE
    UPDATE ops_alerts SET resolved_at = now()
     WHERE kind = 'email.dlq' AND resolved_at IS NULL;
  END IF;

  -- ---- payments.failed_active --------------------------------------------
  IF COALESCE((snap->>'failed_payments_active')::int, 0) >= 3 THEN
    INSERT INTO ops_alerts (kind, severity, context)
    VALUES ('payments.failed_active', 'warn',
            jsonb_build_object('count', snap->'failed_payments_active'))
    ON CONFLICT (kind) WHERE resolved_at IS NULL DO NOTHING;
    v_opened := v_opened + 1;
  ELSE
    UPDATE ops_alerts SET resolved_at = now()
     WHERE kind = 'payments.failed_active' AND resolved_at IS NULL;
  END IF;

  -- ---- payments.failure_spike (today > 3x rolling 7d avg) ---------------
  SELECT count(*) INTO v_failed_today
    FROM payment_events
   WHERE event_type = 'invoice.payment_failed'
     AND created_at >= date_trunc('day', now());

  SELECT count(*)::numeric / 7.0 INTO v_avg_failed_7d
    FROM payment_events
   WHERE event_type = 'invoice.payment_failed'
     AND created_at >= now() - interval '7 days'
     AND created_at <  date_trunc('day', now());

  IF v_failed_today >= 3 AND v_avg_failed_7d > 0 AND v_failed_today > v_avg_failed_7d * 3 THEN
    INSERT INTO ops_alerts (kind, severity, context)
    VALUES ('payments.failure_spike','warn',
            jsonb_build_object('today', v_failed_today, 'avg_7d', v_avg_failed_7d))
    ON CONFLICT (kind) WHERE resolved_at IS NULL DO NOTHING;
    v_opened := v_opened + 1;
  ELSE
    UPDATE ops_alerts SET resolved_at = now()
     WHERE kind = 'payments.failure_spike' AND resolved_at IS NULL;
  END IF;

  -- ---- payments.refund_spike (today > 3) ---------------------------------
  SELECT count(*) INTO v_refunds_today
    FROM payment_events
   WHERE event_type = 'charge.refunded'
     AND created_at >= date_trunc('day', now());

  IF v_refunds_today > 3 THEN
    INSERT INTO ops_alerts (kind, severity, context)
    VALUES ('payments.refund_spike','warn',
            jsonb_build_object('today', v_refunds_today))
    ON CONFLICT (kind) WHERE resolved_at IS NULL DO NOTHING;
    v_opened := v_opened + 1;
  ELSE
    UPDATE ops_alerts SET resolved_at = now()
     WHERE kind = 'payments.refund_spike' AND resolved_at IS NULL;
  END IF;

  -- ---- payments.stuck_processing -----------------------------------------
  IF COALESCE((snap->>'stuck_payment_events')::int, 0) > 0 THEN
    INSERT INTO ops_alerts (kind, severity, context)
    VALUES ('webhook.stuck_processing','crit',
            jsonb_build_object('count', snap->'stuck_payment_events'))
    ON CONFLICT (kind) WHERE resolved_at IS NULL DO NOTHING;
    v_opened := v_opened + 1;
  ELSE
    UPDATE ops_alerts SET resolved_at = now()
     WHERE kind = 'webhook.stuck_processing' AND resolved_at IS NULL;
  END IF;

  RETURN v_opened;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.ops_alerts_evaluate() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.ops_alerts_evaluate() TO service_role;

-- 3. Schedule via pg_cron every 5 minutes --------------------
DO $cron$
DECLARE
  v_existing int;
BEGIN
  SELECT jobid INTO v_existing FROM cron.job WHERE jobname = 'ops-alerts-evaluate';
  IF v_existing IS NULL THEN
    PERFORM cron.schedule(
      'ops-alerts-evaluate',
      '*/5 * * * *',
      $job$SELECT public.ops_alerts_evaluate();$job$
    );
  END IF;
END;
$cron$;

-- 4. Convenience: open-alert count for the admin banner ------
CREATE OR REPLACE FUNCTION public.ops_alerts_open_count()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.ops_alerts WHERE resolved_at IS NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.ops_alerts_open_count() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.ops_alerts_open_count() TO authenticated, service_role;
