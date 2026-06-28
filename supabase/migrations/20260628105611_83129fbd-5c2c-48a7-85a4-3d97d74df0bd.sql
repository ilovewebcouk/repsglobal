CREATE OR REPLACE FUNCTION public.get_renewal_cron_runs(_limit integer DEFAULT 14)
RETURNS TABLE (
  jobname text,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, cron
AS $$
  SELECT j.jobname::text, d.status::text, d.return_message::text, d.start_time, d.end_time
  FROM cron.job j
  JOIN cron.job_run_details d ON d.jobid = j.jobid
  WHERE has_role(auth.uid(), 'admin'::app_role)
    AND j.jobname IN ('legacy-stripe-renewal-daily','churn-lifecycle-daily')
  ORDER BY d.start_time DESC
  LIMIT GREATEST(_limit, 1);
$$;

REVOKE ALL ON FUNCTION public.get_renewal_cron_runs(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.get_renewal_cron_runs(integer) TO authenticated;