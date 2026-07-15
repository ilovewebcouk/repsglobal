
CREATE OR REPLACE FUNCTION public.get_users_last_sign_in(_ids uuid[])
RETURNS TABLE (id uuid, last_sign_in_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.last_sign_in_at
  FROM auth.users u
  WHERE u.id = ANY(_ids)
    AND public.has_role(auth.uid(), 'admin');
$$;

REVOKE ALL ON FUNCTION public.get_users_last_sign_in(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_users_last_sign_in(uuid[]) TO authenticated, service_role;
