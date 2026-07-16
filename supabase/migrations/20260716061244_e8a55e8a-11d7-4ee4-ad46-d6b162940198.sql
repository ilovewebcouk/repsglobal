-- Replace get_users_last_sign_in so it works when invoked via the service-role
-- admin client. Previously it gated on `has_role(auth.uid(), 'admin')`, but
-- auth.uid() is NULL under the service role, so the check silently failed and
-- every row rendered as "Never". We now restrict EXECUTE to service_role.
CREATE OR REPLACE FUNCTION public.get_users_last_sign_in(_ids uuid[])
RETURNS TABLE(id uuid, last_sign_in_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.last_sign_in_at
  FROM auth.users u
  WHERE u.id = ANY(_ids);
$$;

REVOKE ALL ON FUNCTION public.get_users_last_sign_in(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_users_last_sign_in(uuid[]) FROM anon;
REVOKE ALL ON FUNCTION public.get_users_last_sign_in(uuid[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_last_sign_in(uuid[]) TO service_role;