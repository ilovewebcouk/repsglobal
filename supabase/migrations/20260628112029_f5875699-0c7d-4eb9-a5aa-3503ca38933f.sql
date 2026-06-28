
CREATE OR REPLACE FUNCTION public.get_relaunch_audience()
RETURNS TABLE(email text, source text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH admins AS (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ),
  demos AS (
    SELECT id FROM public.professionals WHERE is_demo = true
  ),
  suppressed AS (
    SELECT lower(email) AS email FROM public.suppressed_emails
  ),
  confirmed_users AS (
    SELECT lower(u.email) AS email, 'auth_user'::text AS source
    FROM auth.users u
    WHERE u.email IS NOT NULL
      AND u.email_confirmed_at IS NOT NULL
      AND u.id NOT IN (SELECT user_id FROM admins)
      AND u.id NOT IN (SELECT id FROM demos)
  ),
  bd_only AS (
    SELECT lower(b.email) AS email, 'bd_seed'::text AS source
    FROM public.bd_member_seed b
    WHERE b.email IS NOT NULL
      AND b.email <> ''
      AND lower(b.email) NOT IN (
        SELECT lower(email) FROM auth.users WHERE email IS NOT NULL
      )
  ),
  combined AS (
    SELECT * FROM confirmed_users
    UNION
    SELECT * FROM bd_only
  )
  SELECT c.email, c.source
  FROM combined c
  WHERE c.email NOT IN (SELECT email FROM suppressed)
  ORDER BY c.email;
$$;

REVOKE ALL ON FUNCTION public.get_relaunch_audience() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_relaunch_audience() TO service_role;
