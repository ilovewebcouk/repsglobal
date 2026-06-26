CREATE OR REPLACE FUNCTION public.is_pro_fully_verified(_pro_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = _pro_id
        AND p.verification = 'verified'
        AND p.identity_status = 'approved'
    )
    AND EXISTS (
      SELECT 1 FROM public.insurance_policies ip
      WHERE ip.professional_id = _pro_id
        AND ip.status = 'active'
        AND ip.expiry_date >= CURRENT_DATE
    );
$$;

CREATE OR REPLACE FUNCTION public.list_fully_verified_pro_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.professionals p
  WHERE p.verification = 'verified'
    AND p.identity_status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.insurance_policies ip
      WHERE ip.professional_id = p.id
        AND ip.status = 'active'
        AND ip.expiry_date >= CURRENT_DATE
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_pro_fully_verified(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_fully_verified_pro_ids() TO anon, authenticated;