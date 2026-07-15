
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
      AND (
        p.account_type <> 'training_provider'
        OR (
          p.identity_status = 'approved'
          AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p.id AND pr.full_name IS NOT NULL AND length(btrim(pr.full_name)) > 0)
          AND EXISTS (SELECT 1 FROM public.provider_domain_verifications d WHERE d.professional_id = p.id AND d.status = 'approved')
        )
      )
  )
$function$;

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
    AND (
      p.account_type <> 'training_provider'
      OR (
        p.identity_status = 'approved'
        AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p.id AND pr.full_name IS NOT NULL AND length(btrim(pr.full_name)) > 0)
        AND EXISTS (SELECT 1 FROM public.provider_domain_verifications d WHERE d.professional_id = p.id AND d.status = 'approved')
      )
    )
$function$;
