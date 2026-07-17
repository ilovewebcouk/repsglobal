
-- 1. Provider-aware fully-verified check
CREATE OR REPLACE FUNCTION public.is_pro_fully_verified(_pro_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN (SELECT account_type FROM public.professionals WHERE id = _pro_id) = 'training_provider' THEN
      EXISTS (
        SELECT 1 FROM public.professionals p
        WHERE p.id = _pro_id AND p.identity_status = 'approved'
      )
      AND EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = _pro_id
          AND pr.full_name IS NOT NULL
          AND length(trim(pr.full_name)) > 0
      )
      AND EXISTS (
        SELECT 1 FROM public.provider_domain_verifications pdv
        WHERE pdv.professional_id = _pro_id AND pdv.status = 'approved'
      )
    ELSE
      EXISTS (
        SELECT 1 FROM public.professionals p
        WHERE p.id = _pro_id AND p.identity_status = 'approved'
      )
      AND EXISTS (
        SELECT 1 FROM public.verification_submissions vs
        WHERE vs.professional_id = _pro_id AND vs.status = 'approved'
      )
      AND EXISTS (
        SELECT 1 FROM public.insurance_policies ip
        WHERE ip.professional_id = _pro_id
          AND ip.status = 'active'
          AND ip.expiry_date >= CURRENT_DATE
      )
  END;
$function$;

-- 2. Triggers to auto-recompute when provider signals change

-- 2a. On professionals.identity_status change
CREATE OR REPLACE FUNCTION public.trg_recompute_verification_on_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.identity_status IS DISTINCT FROM OLD.identity_status THEN
    PERFORM public.recompute_pro_verification(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS professionals_identity_recompute ON public.professionals;
CREATE TRIGGER professionals_identity_recompute
AFTER UPDATE OF identity_status ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_verification_on_identity();

-- 2b. On provider_domain_verifications.status change
CREATE OR REPLACE FUNCTION public.trg_recompute_verification_on_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_pro_verification(OLD.professional_id);
    RETURN OLD;
  END IF;
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.recompute_pro_verification(NEW.professional_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provider_domain_verifications_recompute ON public.provider_domain_verifications;
CREATE TRIGGER provider_domain_verifications_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.provider_domain_verifications
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_verification_on_domain();

-- 2c. On profiles.full_name change (only relevant for training_provider rows,
--     but cheap to check for everyone since recompute_pro_verification is idempotent)
CREATE OR REPLACE FUNCTION public.trg_recompute_verification_on_full_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    IF EXISTS (SELECT 1 FROM public.professionals WHERE id = NEW.id) THEN
      PERFORM public.recompute_pro_verification(NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_full_name_recompute ON public.profiles;
CREATE TRIGGER profiles_full_name_recompute
AFTER UPDATE OF full_name ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_verification_on_full_name();

-- 3. Backfill every training provider so already-completed ones flip immediately
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.professionals WHERE account_type = 'training_provider' LOOP
    PERFORM public.recompute_pro_verification(r.id);
  END LOOP;
END $$;
