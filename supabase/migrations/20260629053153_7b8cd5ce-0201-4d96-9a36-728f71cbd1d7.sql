CREATE OR REPLACE FUNCTION public.ops_find_member(_q text)
RETURNS TABLE (
  user_id    uuid,
  email      text,
  full_name  text,
  match_kind text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  q text := btrim(_q);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF q IS NULL OR length(q) = 0 THEN
    RETURN;
  END IF;

  IF q ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN QUERY
      SELECT u.id, u.email::text, p.full_name, 'uuid'::text
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
       WHERE u.id = q::uuid
       LIMIT 1;
    RETURN;
  END IF;

  IF q LIKE 'cus_%' THEN
    RETURN QUERY
      SELECT u.id, u.email::text, p.full_name, 'stripe_customer'::text
        FROM public.subscriptions s
        JOIN auth.users u ON u.id = s.user_id
        LEFT JOIN public.profiles p ON p.id = u.id
       WHERE s.stripe_customer_id = q
       LIMIT 1;
    IF FOUND THEN RETURN; END IF;

    RETURN QUERY
      SELECT u.id, u.email::text, p.full_name, 'stripe_customer_legacy'::text
        FROM public.legacy_stripe_link l
        JOIN auth.users u ON lower(u.email) = lower(l.email)
        LEFT JOIN public.profiles p ON p.id = u.id
       WHERE l.stripe_customer_id = q
       LIMIT 1;
    RETURN;
  END IF;

  IF q LIKE 'sub_%' THEN
    RETURN QUERY
      SELECT u.id, u.email::text, p.full_name, 'stripe_subscription'::text
        FROM public.subscriptions s
        JOIN auth.users u ON u.id = s.user_id
        LEFT JOIN public.profiles p ON p.id = u.id
       WHERE s.stripe_subscription_id = q
       LIMIT 1;
    RETURN;
  END IF;

  IF q LIKE '%@%' THEN
    RETURN QUERY
      SELECT u.id, u.email::text, p.full_name, 'email'::text
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
       WHERE lower(u.email) = lower(q)
       LIMIT 1;
    IF FOUND THEN RETURN; END IF;

    RETURN QUERY
      SELECT u.id, u.email::text, p.full_name, 'email_partial'::text
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
       WHERE u.email ILIKE '%' || q || '%'
       ORDER BY u.email
       LIMIT 10;
    RETURN;
  END IF;

  RETURN QUERY
    SELECT u.id, u.email::text, p.full_name, 'bd_member'::text
      FROM public.bd_member_seed b
      JOIN public.legacy_stripe_link l ON l.bd_member_id = b.bd_member_id
      JOIN auth.users u ON lower(u.email) = lower(l.email)
      LEFT JOIN public.profiles p ON p.id = u.id
     WHERE b.bd_member_id::text = q
     LIMIT 1;
  IF FOUND THEN RETURN; END IF;

  RETURN QUERY
    SELECT u.id, u.email::text, p.full_name, 'name'::text
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.id
     WHERE p.full_name ILIKE '%' || q || '%'
     ORDER BY p.full_name
     LIMIT 10;
END;
$$;