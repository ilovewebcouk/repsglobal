DROP TRIGGER IF EXISTS trg_seed_shop_front ON public.professionals;
DROP TRIGGER IF EXISTS tg_seed_shop_front_on_identity_approved ON public.professionals;
DROP FUNCTION IF EXISTS public.tg_seed_shop_front_on_identity_approved() CASCADE;

UPDATE public.professionals p
SET identity_status = 'approved',
    identity_verified_at = COALESCE(p.identity_verified_at, d.reviewed_at, now()),
    identity_verified_name = COALESCE(p.identity_verified_name, d.name_on_doc)
FROM public.identity_documents d
WHERE d.professional_id = p.id
  AND d.vendor = 'stripe'
  AND d.status = 'approved'
  AND (p.identity_status IS DISTINCT FROM 'approved');