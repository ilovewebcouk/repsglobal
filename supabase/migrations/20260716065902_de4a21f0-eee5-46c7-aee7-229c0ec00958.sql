-- TEMP: relax public visibility gate so admin's manual "Live" toggle in
-- /admin/members (Training Providers) is enough to surface a provider on the
-- public directory. Restore the identity/domain checks when verification flow ships.
CREATE OR REPLACE FUNCTION public.list_publicly_visible_pro_ids()
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id
  FROM public.professionals p
  WHERE p.is_published = true
    AND p.is_demo = false
    AND EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.user_id = p.id
        AND s.status IN ('active', 'trialing', 'past_due')
        AND s.tier IN ('verified', 'pro', 'studio', 'training_provider')
    )
$function$;

CREATE OR REPLACE FUNCTION public.is_pro_publicly_visible(_pro_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
          AND s.tier IN ('verified', 'pro', 'studio', 'training_provider')
      )
  )
$function$;