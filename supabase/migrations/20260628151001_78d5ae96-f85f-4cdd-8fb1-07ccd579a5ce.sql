CREATE OR REPLACE FUNCTION public.get_site_time_info()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  utc_now timestamptz := now();
  london_now timestamp := (utc_now AT TIME ZONE 'Europe/London');
  offset_hours int;
  tz_abbrev text;
  next_renewal timestamptz;
  next_lifecycle timestamptz;
  last_renewal timestamptz;
  last_lifecycle timestamptz;
BEGIN
  SELECT to_char(utc_now AT TIME ZONE 'Europe/London', 'TZ') INTO tz_abbrev;
  IF tz_abbrev IS NULL OR tz_abbrev = '' THEN
    offset_hours := EXTRACT(EPOCH FROM ((utc_now AT TIME ZONE 'Europe/London') - (utc_now AT TIME ZONE 'UTC'))) / 3600;
    tz_abbrev := CASE WHEN offset_hours = 1 THEN 'BST' ELSE 'GMT' END;
  END IF;

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
$function$;