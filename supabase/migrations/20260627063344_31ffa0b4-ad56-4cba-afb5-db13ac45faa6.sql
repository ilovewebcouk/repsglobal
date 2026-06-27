
CREATE OR REPLACE FUNCTION public.count_confirmed_signups(_from timestamptz, _to timestamptz)
RETURNS TABLE(day date, signups integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (date_trunc('day', u.email_confirmed_at AT TIME ZONE 'Europe/London'))::date AS day,
    count(*)::int AS signups
  FROM auth.users u
  WHERE u.email_confirmed_at IS NOT NULL
    AND u.email_confirmed_at >= _from
    AND u.email_confirmed_at < _to
    AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  GROUP BY 1
  ORDER BY 1;
$$;

REVOKE ALL ON FUNCTION public.count_confirmed_signups(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_confirmed_signups(timestamptz, timestamptz) TO authenticated;
