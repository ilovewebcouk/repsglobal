CREATE SEQUENCE IF NOT EXISTS public.reps_qualification_number_seq START 1;

ALTER TABLE public.provider_regulated_permissions
  ADD COLUMN IF NOT EXISTS reps_qualification_number text UNIQUE;

CREATE OR REPLACE FUNCTION public.assign_reps_qualification_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved'
     AND (OLD.status IS DISTINCT FROM 'approved')
     AND NEW.reps_qualification_number IS NULL THEN
    NEW.reps_qualification_number :=
      'REPS-QUAL-' || lpad(nextval('public.reps_qualification_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reg_perm_assign_number ON public.provider_regulated_permissions;
CREATE TRIGGER trg_reg_perm_assign_number
  BEFORE UPDATE ON public.provider_regulated_permissions
  FOR EACH ROW EXECUTE FUNCTION public.assign_reps_qualification_number();

UPDATE public.provider_regulated_permissions
SET reps_qualification_number =
  'REPS-QUAL-' || lpad(nextval('public.reps_qualification_number_seq')::text, 6, '0')
WHERE status = 'approved' AND reps_qualification_number IS NULL;