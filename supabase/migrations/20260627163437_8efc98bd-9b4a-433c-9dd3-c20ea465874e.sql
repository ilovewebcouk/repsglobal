
CREATE OR REPLACE FUNCTION public.count_orphan_subscriptions()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::bigint
  FROM public.subscriptions s
  LEFT JOIN auth.users u ON u.id = s.user_id
  WHERE u.id IS NULL;
$$;
REVOKE ALL ON FUNCTION public.count_orphan_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_orphan_subscriptions() TO service_role;

CREATE OR REPLACE FUNCTION public.sweep_orphan_subscriptions()
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE removed bigint;
BEGIN
  WITH del AS (
    DELETE FROM public.subscriptions s
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.user_id)
    RETURNING 1
  )
  SELECT count(*) INTO removed FROM del;
  RETURN removed;
END $$;
REVOKE ALL ON FUNCTION public.sweep_orphan_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sweep_orphan_subscriptions() TO service_role;

CREATE OR REPLACE FUNCTION public.platform_health_snapshot()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pgmq, cron AS $$
  SELECT jsonb_build_object(
    'cron_failures_24h', (SELECT count(*) FROM cron.job_run_details WHERE status='failed' AND start_time > now() - interval '24 hours'),
    'cron_jobs', (
      SELECT jsonb_agg(jsonb_build_object(
        'jobname', j.jobname,
        'schedule', j.schedule,
        'active', j.active,
        'last_status', (SELECT status FROM cron.job_run_details d WHERE d.jobid = j.jobid ORDER BY start_time DESC LIMIT 1),
        'last_run', (SELECT start_time FROM cron.job_run_details d WHERE d.jobid = j.jobid ORDER BY start_time DESC LIMIT 1)
      ) ORDER BY j.jobname)
      FROM cron.job j
    ),
    'queue_transactional', (SELECT count(*) FROM pgmq.q_transactional_emails),
    'queue_auth', (SELECT count(*) FROM pgmq.q_auth_emails),
    'dlq_emails_7d', (SELECT count(*) FROM public.email_send_log WHERE status='dlq' AND created_at > now() - interval '7 days'),
    'suppressions_7d', (SELECT count(*) FROM public.suppressed_emails WHERE created_at > now() - interval '7 days'),
    'orphan_subscriptions', public.count_orphan_subscriptions(),
    'stuck_payment_events', (SELECT count(*) FROM public.payment_events WHERE processed_at IS NULL AND created_at < now() - interval '1 hour'),
    'failed_payments_active', (SELECT count(*) FROM public.subscriptions WHERE status IN ('past_due','unpaid','incomplete'))
  );
$$;
REVOKE ALL ON FUNCTION public.platform_health_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_health_snapshot() TO service_role;
