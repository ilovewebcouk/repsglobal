CREATE INDEX IF NOT EXISTS idx_email_send_log_status_created
  ON public.email_send_log (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_send_log_message_status
  ON public.email_send_log (message_id, status)
  WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_events_unprocessed_created
  ON public.payment_events (created_at DESC)
  WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions (status);

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_created
  ON public.suppressed_emails (created_at DESC);

CREATE OR REPLACE FUNCTION public.platform_health_snapshot()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pgmq, cron
AS $function$
  WITH recent_cron_runs AS MATERIALIZED (
    SELECT r.runid, r.jobid, r.status, r.start_time
    FROM cron.job_run_details r
    ORDER BY r.runid DESC
    LIMIT 25000
  ), last_runids AS (
    SELECT jobid, max(runid) AS runid
    FROM recent_cron_runs
    GROUP BY jobid
  ), last_runs AS (
    SELECT r.jobid, r.status, r.start_time
    FROM recent_cron_runs r
    JOIN last_runids lr ON lr.jobid = r.jobid AND lr.runid = r.runid
  ), jobs AS (
    SELECT jsonb_agg(jsonb_build_object(
      'jobname', j.jobname,
      'schedule', j.schedule,
      'active', j.active,
      'last_status', lr.status,
      'last_run', lr.start_time
    ) ORDER BY j.jobname) AS arr
    FROM cron.job j
    LEFT JOIN last_runs lr ON lr.jobid = j.jobid
  ), pending_email_candidates AS (
    SELECT p.message_id
    FROM public.email_send_log p
    WHERE p.status = 'pending'
      AND p.created_at < now() - interval '15 minutes'
      AND p.message_id IS NOT NULL
    ORDER BY p.created_at DESC
    LIMIT 500
  )
  SELECT jsonb_build_object(
    'cron_failures_24h', (
      SELECT count(*)
      FROM recent_cron_runs
      WHERE status = 'failed'
        AND start_time > now() - interval '24 hours'
    ),
    'cron_jobs', COALESCE((SELECT arr FROM jobs), '[]'::jsonb),
    'queue_transactional', (SELECT count(*) FROM pgmq.q_transactional_emails),
    'queue_auth',          (SELECT count(*) FROM pgmq.q_auth_emails),
    'dlq_emails_7d',       (SELECT count(*) FROM public.email_send_log WHERE status = 'dlq' AND created_at > now() - interval '7 days'),
    'dlq_webhook_events_7d', (SELECT count(*) FROM public.payment_events WHERE dead_lettered_at IS NOT NULL AND dead_lettered_at > now() - interval '7 days'),
    'suppressions_7d',     (SELECT count(*) FROM public.suppressed_emails WHERE created_at > now() - interval '7 days'),
    'orphan_subscriptions', public.count_orphan_subscriptions(),
    'stuck_payment_events', (SELECT count(*) FROM public.payment_events WHERE processed_at IS NULL AND created_at < now() - interval '1 hour'),
    'failed_payments_active', (SELECT count(*) FROM public.subscriptions WHERE status IN ('past_due','unpaid','incomplete')),
    'stuck_pending_emails', (
      SELECT count(*)
      FROM pending_email_candidates p
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.email_send_log f
        WHERE f.message_id = p.message_id
          AND f.status IN ('sent','delivered','failed','dlq','suppressed','bounced','complained')
      )
    )
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.platform_health_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_health_snapshot() TO service_role;