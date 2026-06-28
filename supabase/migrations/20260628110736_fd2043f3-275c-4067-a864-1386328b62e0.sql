
-- DST-safe payment cron reschedule
-- Target Europe/London local times:
--   legacy-stripe-renewal-daily   -> 00:15 London
--   churn-lifecycle-daily         -> 00:30 London
-- pg_cron runs in UTC. We schedule both UTC slots that could map to the
-- target London local time (BST and GMT) and guard inside the SQL so only
-- the correct one fires. A daily idempotency table prevents the autumn DST
-- fall-back from double-firing (London 00:15 happens twice that night).

CREATE TABLE IF NOT EXISTS public.cron_daily_runs (
  job_name text NOT NULL,
  london_date date NOT NULL,
  ran_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_name, london_date)
);

GRANT SELECT ON public.cron_daily_runs TO authenticated;
GRANT ALL ON public.cron_daily_runs TO service_role;
ALTER TABLE public.cron_daily_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read cron_daily_runs" ON public.cron_daily_runs;
CREATE POLICY "admins read cron_daily_runs" ON public.cron_daily_runs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Helper: did this job already run on the current London calendar date?
CREATE OR REPLACE FUNCTION public.cron_should_run_at_london(
  _job_name text,
  _hour int,
  _minute int
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  london_now timestamp;
  london_date_v date;
  inserted boolean := false;
BEGIN
  london_now := (now() AT TIME ZONE 'Europe/London');
  -- must match target London hour, and minute within the 5-min slot
  IF EXTRACT(HOUR FROM london_now)::int <> _hour THEN RETURN false; END IF;
  IF EXTRACT(MINUTE FROM london_now)::int NOT BETWEEN _minute AND _minute + 4 THEN RETURN false; END IF;

  london_date_v := london_now::date;
  -- atomic claim — if a row already exists for today, do nothing
  INSERT INTO public.cron_daily_runs (job_name, london_date)
  VALUES (_job_name, london_date_v)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;

-- Reschedule legacy stripe renewal: every 5 min inside the candidate UTC window,
-- guard fires it once when London local = 00:15.
SELECT cron.unschedule('legacy-stripe-renewal-daily');
SELECT cron.schedule(
  'legacy-stripe-renewal-daily',
  '*/5 23,0 * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://repsglobal.lovable.app/api/public/hooks/legacy-renewal',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bHJ2d3JpcGducHlqbHJ2dGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDY2OTUsImV4cCI6MjA5NTgyMjY5NX0.Mqdr3lPV8NUDUu_l2AQY4_87VVBkBreUCQ8NsgJOa8o"}'::jsonb,
    body := '{"environment": "live", "limit": 100}'::jsonb
  ) AS request_id
  WHERE public.cron_should_run_at_london('legacy-stripe-renewal-daily', 0, 15);
  $cmd$
);

-- Reschedule churn lifecycle: London local = 00:30
SELECT cron.unschedule('churn-lifecycle-daily');
SELECT cron.schedule(
  'churn-lifecycle-daily',
  '*/5 23,0 * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://repsglobal.lovable.app/api/public/hooks/lifecycle-cron',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bHJ2d3JpcGducHlqbHJ2dGd3Iiwicm9sZSI6ImRkb24iLCJpYXQiOjE3ODAyNDY2OTUsImV4cCI6MjA5NTgyMjY5NX0.Mqdr3lPV8NUDUu_l2AQY4_87VVBkBreUCQ8NsgJOa8o"}'::jsonb,
    body := '{"environment": "live"}'::jsonb
  ) AS request_id
  WHERE public.cron_should_run_at_london('churn-lifecycle-daily', 0, 30);
  $cmd$
);

-- Site-time RPC: returns the current server UTC, London local with TZ abbrev,
-- and the next scheduled payment-run timestamp.
CREATE OR REPLACE FUNCTION public.get_site_time_info()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  utc_now timestamptz := now();
  london_now timestamp := (utc_now AT TIME ZONE 'Europe/London');
  tz_abbrev text;
  next_renewal timestamptz;
  next_lifecycle timestamptz;
  last_renewal timestamptz;
  last_lifecycle timestamptz;
BEGIN
  -- abbrev: BST or GMT
  SELECT to_char(utc_now AT TIME ZONE 'Europe/London', 'TZ') INTO tz_abbrev;
  IF tz_abbrev IS NULL OR tz_abbrev = '' THEN
    -- fallback: derive from offset
    tz_abbrev := CASE WHEN EXTRACT(TIMEZONE_HOUR FROM utc_now AT TIME ZONE 'Europe/London') = 1 THEN 'BST' ELSE 'GMT' END;
  END IF;

  -- next scheduled runs (next London 00:15 / 00:30)
  next_renewal := (date_trunc('day', london_now) + interval '15 minutes'
    + CASE WHEN london_now > date_trunc('day', london_now) + interval '15 minutes' THEN interval '1 day' ELSE interval '0' END
  ) AT TIME ZONE 'Europe/London';
  next_lifecycle := (date_trunc('day', london_now) + interval '30 minutes'
    + CASE WHEN london_now > date_trunc('day', london_now) + interval '30 minutes' THEN interval '1 day' ELSE interval '0' END
  ) AT TIME ZONE 'Europe/London';

  SELECT MAX(ran_at) INTO last_renewal FROM public.cron_daily_runs WHERE job_name = 'legacy-stripe-renewal-daily';
  SELECT MAX(ran_at) INTO last_lifecycle FROM public.cron_daily_runs WHERE job_name = 'churn-lifecycle-daily';

  RETURN jsonb_build_object(
    'utc_now', utc_now,
    'london_now', london_now,
    'tz_abbrev', tz_abbrev,
    'next_renewal_run', next_renewal,
    'next_lifecycle_run', next_lifecycle,
    'last_renewal_run', last_renewal,
    'last_lifecycle_run', last_lifecycle
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_site_time_info() TO authenticated;
