CREATE OR REPLACE FUNCTION public.get_confirmed_professional_ids(_ids uuid[])
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id FROM auth.users u
  WHERE u.id = ANY(_ids) AND u.email_confirmed_at IS NOT NULL
$$;

REVOKE EXECUTE ON FUNCTION public.get_confirmed_professional_ids(uuid[]) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_confirmed_professional_ids(uuid[]) TO service_role;

CREATE OR REPLACE FUNCTION public.count_confirmed_professionals(_only_published boolean DEFAULT false, _verification text DEFAULT NULL)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT count(*)::int
  FROM public.professionals p
  JOIN auth.users u ON u.id = p.id AND u.email_confirmed_at IS NOT NULL
  WHERE (_only_published IS FALSE OR p.is_published = true)
    AND (_verification IS NULL OR p.verification::text = _verification)
$$;

REVOKE EXECUTE ON FUNCTION public.count_confirmed_professionals(boolean, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_confirmed_professionals(boolean, text) TO service_role;

CREATE OR REPLACE FUNCTION public.count_confirmed_pro_signups(_since timestamptz, _until timestamptz DEFAULT NULL)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT count(*)::int
  FROM public.professionals p
  JOIN auth.users u ON u.id = p.id AND u.email_confirmed_at IS NOT NULL
  WHERE COALESCE(p.member_since, p.created_at) >= _since
    AND (_until IS NULL OR COALESCE(p.member_since, p.created_at) < _until)
$$;

REVOKE EXECUTE ON FUNCTION public.count_confirmed_pro_signups(timestamptz, timestamptz) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_confirmed_pro_signups(timestamptz, timestamptz) TO service_role;