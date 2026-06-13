
CREATE OR REPLACE FUNCTION public.tg_seed_shop_front_on_identity_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.identity_status = 'approved'
     AND (OLD.identity_status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.shop_fronts (professional_id, layout_variant, is_published)
    VALUES (NEW.id, 'lite', false)
    ON CONFLICT (professional_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_shop_front ON public.professionals;
CREATE TRIGGER trg_seed_shop_front
  AFTER INSERT OR UPDATE OF identity_status ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_seed_shop_front_on_identity_approved();

-- Back-fill: every currently-approved pro without a shop_front row.
INSERT INTO public.shop_fronts (professional_id, layout_variant, is_published)
SELECT p.id, 'lite', false
FROM public.professionals p
LEFT JOIN public.shop_fronts s ON s.professional_id = p.id
WHERE p.identity_status = 'approved' AND s.professional_id IS NULL;
