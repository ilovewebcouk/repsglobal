
CREATE OR REPLACE FUNCTION public.count_confirmed_professionals(_only_published boolean DEFAULT false, _verification text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT count(*)::int
  FROM public.professionals p
  JOIN auth.users u ON u.id = p.id AND u.email_confirmed_at IS NOT NULL
  WHERE COALESCE(p.is_demo, false) = false
    AND (_only_published IS FALSE OR p.is_published = true)
    AND (_verification IS NULL OR p.verification::text = _verification)
$function$;

CREATE OR REPLACE FUNCTION public.count_confirmed_pro_signups(_since timestamp with time zone, _until timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT count(*)::int
  FROM public.professionals p
  JOIN auth.users u ON u.id = p.id AND u.email_confirmed_at IS NOT NULL
  WHERE COALESCE(p.is_demo, false) = false
    AND COALESCE(p.member_since, p.created_at) >= _since
    AND (_until IS NULL OR COALESCE(p.member_since, p.created_at) < _until)
$function$;

CREATE OR REPLACE FUNCTION public.get_confirmed_professional_ids(_ids uuid[])
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT u.id FROM auth.users u
  JOIN public.professionals p ON p.id = u.id
  WHERE u.id = ANY(_ids)
    AND u.email_confirmed_at IS NOT NULL
    AND COALESCE(p.is_demo, false) = false
$function$;
