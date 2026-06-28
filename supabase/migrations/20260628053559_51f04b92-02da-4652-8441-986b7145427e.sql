
-- Part 1: tighten permissive RLS policies
DROP POLICY IF EXISTS "Service role writes churn lifecycle" ON public.churn_lifecycle;
DROP POLICY IF EXISTS "Service role writes renewal tokens" ON public.renewal_tokens;

DROP POLICY IF EXISTS "Anyone can submit an enquiry" ON public.enquiries;
CREATE POLICY "Anyone can submit an enquiry"
  ON public.enquiries FOR INSERT TO anon, authenticated
  WITH CHECK (
    professional_id IS NOT NULL
    AND char_length(message) BETWEEN 1 AND 10000
    AND char_length(sender_email) BETWEEN 3 AND 320
  );

DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.help_article_feedback;
CREATE POLICY "Anyone can submit feedback"
  ON public.help_article_feedback FOR INSERT TO anon, authenticated
  WITH CHECK (
    article_slug IS NOT NULL
    AND char_length(article_slug) BETWEEN 1 AND 200
    AND vote IN (-1, 1)
  );

DROP POLICY IF EXISTS "anyone can join waitlist" ON public.launch_waitlist;
CREATE POLICY "anyone can join waitlist"
  ON public.launch_waitlist FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) BETWEEN 3 AND 320
    AND position('@' in email) > 1
  );

DROP POLICY IF EXISTS "Anyone can record a profile view" ON public.profile_view_events;
CREATE POLICY "Anyone can record a profile view"
  ON public.profile_view_events FOR INSERT TO anon, authenticated
  WITH CHECK (professional_id IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can record a search appearance" ON public.search_appearance_events;
CREATE POLICY "Anyone can record a search appearance"
  ON public.search_appearance_events FOR INSERT TO anon, authenticated
  WITH CHECK (professional_id IS NOT NULL);

-- Part 2: revoke anon EXECUTE on every SECURITY DEFINER fn in public
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
  END LOOP;
END $$;

-- Re-grant EXECUTE to anon only for genuinely public token-based RPCs.
GRANT EXECUTE ON FUNCTION public.accept_client_invite(text)                                  TO anon;
GRANT EXECUTE ON FUNCTION public.consume_renewal_token(text)                                 TO anon;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text)                                   TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_verify_record(text)                              TO anon;
GRANT EXECUTE ON FUNCTION public.get_review_request_by_token(text)                           TO anon;
GRANT EXECUTE ON FUNCTION public.submit_review_by_token(text, smallint, text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_review_request_opened(text)                            TO anon;
GRANT EXECUTE ON FUNCTION public.peek_renewal_token(text)                                    TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role)                                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_tier(uuid, subscription_tier[])                  TO authenticated;

-- Part 3: precise stuck-pending-emails metric
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
        'last_run',    (SELECT start_time FROM cron.job_run_details d WHERE d.jobid = j.jobid ORDER BY start_time DESC LIMIT 1)
      ) ORDER BY j.jobname)
      FROM cron.job j
    ),
    'queue_transactional', (SELECT count(*) FROM pgmq.q_transactional_emails),
    'queue_auth',          (SELECT count(*) FROM pgmq.q_auth_emails),
    'dlq_emails_7d',       (SELECT count(*) FROM public.email_send_log WHERE status='dlq' AND created_at > now() - interval '7 days'),
    'dlq_webhook_events_7d', (SELECT count(*) FROM public.payment_events WHERE dead_lettered_at IS NOT NULL AND dead_lettered_at > now() - interval '7 days'),
    'suppressions_7d',     (SELECT count(*) FROM public.suppressed_emails WHERE created_at > now() - interval '7 days'),
    'orphan_subscriptions', public.count_orphan_subscriptions(),
    'stuck_payment_events', (SELECT count(*) FROM public.payment_events WHERE processed_at IS NULL AND created_at < now() - interval '1 hour'),
    'failed_payments_active', (SELECT count(*) FROM public.subscriptions WHERE status IN ('past_due','unpaid','incomplete')),
    'stuck_pending_emails', (
      SELECT count(*) FROM public.email_send_log p
      WHERE p.status = 'pending'
        AND p.created_at < now() - interval '15 minutes'
        AND p.message_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.email_send_log f
          WHERE f.message_id = p.message_id
            AND f.status IN ('sent','delivered','failed','dlq','suppressed','bounced','complained')
        )
    )
  );
$$;
REVOKE ALL ON FUNCTION public.platform_health_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_health_snapshot() TO service_role;
