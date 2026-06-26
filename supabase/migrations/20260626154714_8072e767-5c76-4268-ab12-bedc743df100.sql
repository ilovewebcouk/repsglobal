CREATE OR REPLACE FUNCTION public.recompute_pro_verification(_pro_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _fully boolean;
  _current public.verification_status;
BEGIN
  IF _pro_id IS NULL THEN RETURN; END IF;

  SELECT public.is_pro_fully_verified(_pro_id) INTO _fully;
  SELECT verification INTO _current FROM public.professionals WHERE id = _pro_id;

  IF _fully THEN
    IF _current IS DISTINCT FROM 'verified'::public.verification_status THEN
      UPDATE public.professionals
         SET verification = 'verified'::public.verification_status
       WHERE id = _pro_id;
    END IF;
  ELSE
    -- Preserve explicit 'rejected' / 'suspended' states; collapse anything else to 'pending'.
    IF _current = 'verified'::public.verification_status OR _current IS NULL THEN
      UPDATE public.professionals
         SET verification = 'pending'::public.verification_status
       WHERE id = _pro_id;
    END IF;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.recompute_pro_verification(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_recompute_pro_verif_from_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_pro_verification(COALESCE(NEW.professional_id, OLD.professional_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recompute_pro_verif_from_insurance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_pro_verification(COALESCE(NEW.professional_id, OLD.professional_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recompute_pro_verif_from_self()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.identity_status IS DISTINCT FROM OLD.identity_status THEN
    PERFORM public.recompute_pro_verification(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recompute_verif_on_submission ON public.verification_submissions;
CREATE TRIGGER recompute_verif_on_submission
AFTER INSERT OR UPDATE OF status OR DELETE ON public.verification_submissions
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_pro_verif_from_submission();

DROP TRIGGER IF EXISTS recompute_verif_on_insurance ON public.insurance_policies;
CREATE TRIGGER recompute_verif_on_insurance
AFTER INSERT OR UPDATE OF status, expiry_date OR DELETE ON public.insurance_policies
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_pro_verif_from_insurance();

DROP TRIGGER IF EXISTS recompute_verif_on_self ON public.professionals;
CREATE TRIGGER recompute_verif_on_self
AFTER UPDATE OF identity_status ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_pro_verif_from_self();

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.professionals LOOP
    PERFORM public.recompute_pro_verification(r.id);
  END LOOP;
END $$;