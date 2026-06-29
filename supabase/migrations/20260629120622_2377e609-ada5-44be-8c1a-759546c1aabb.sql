
CREATE OR REPLACE FUNCTION public.list_publicly_visible_pro_ids()
RETURNS TABLE (id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.professionals p
  WHERE p.is_published = true
    AND p.is_demo = false
    AND EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.user_id = p.id
        AND s.status IN ('active', 'trialing', 'past_due')
        AND s.tier IN ('verified', 'pro', 'studio')
    )
$$;

CREATE OR REPLACE FUNCTION public.is_pro_publicly_visible(_pro_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = _pro_id
      AND p.is_published = true
      AND p.is_demo = false
      AND EXISTS (
        SELECT 1
        FROM public.subscriptions s
        WHERE s.user_id = p.id
          AND s.status IN ('active', 'trialing', 'past_due')
          AND s.tier IN ('verified', 'pro', 'studio')
      )
  )
$$;

GRANT EXECUTE ON FUNCTION public.list_publicly_visible_pro_ids() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_pro_publicly_visible(uuid) TO anon, authenticated, service_role;
