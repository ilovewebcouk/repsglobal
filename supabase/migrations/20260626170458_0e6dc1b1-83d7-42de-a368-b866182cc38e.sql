
CREATE OR REPLACE FUNCTION public.is_pro_fully_verified(_pro_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = _pro_id
        AND p.identity_status = 'approved'
    )
    AND EXISTS (
      SELECT 1 FROM public.verification_submissions vs
      WHERE vs.professional_id = _pro_id
        AND vs.status = 'approved'
    )
    AND EXISTS (
      SELECT 1 FROM public.insurance_policies ip
      WHERE ip.professional_id = _pro_id
        AND ip.status = 'active'
        AND ip.expiry_date >= CURRENT_DATE
    );
$function$;

CREATE OR REPLACE FUNCTION public.list_fully_verified_pro_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id
  FROM public.professionals p
  WHERE p.identity_status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.verification_submissions vs
      WHERE vs.professional_id = p.id
        AND vs.status = 'approved'
    )
    AND EXISTS (
      SELECT 1 FROM public.insurance_policies ip
      WHERE ip.professional_id = p.id
        AND ip.status = 'active'
        AND ip.expiry_date >= CURRENT_DATE
    );
$function$;

-- Backfill: recompute verification for everyone now that the gate is honest.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.professionals LOOP
    PERFORM public.recompute_pro_verification(r.id);
  END LOOP;
END $$;
