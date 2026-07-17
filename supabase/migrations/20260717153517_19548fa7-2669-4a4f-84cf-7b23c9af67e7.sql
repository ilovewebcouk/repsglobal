
-- 1. Trigger: prevent cross-provider course_id reassignment on reps_course_evidence
CREATE OR REPLACE FUNCTION public.reps_course_evidence_guard_course_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_provider uuid;
BEGIN
  IF NEW.course_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only re-check when course_id actually changes or on INSERT
  IF TG_OP = 'UPDATE' AND NEW.course_id IS NOT DISTINCT FROM OLD.course_id THEN
    RETURN NEW;
  END IF;

  SELECT provider_id INTO target_provider
  FROM public.reps_courses
  WHERE id = NEW.course_id;

  IF target_provider IS NULL THEN
    RAISE EXCEPTION 'Referenced course does not exist';
  END IF;

  IF target_provider <> NEW.provider_id THEN
    RAISE EXCEPTION 'Evidence course_id must belong to the same provider';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reps_course_evidence_guard_course_id_trg ON public.reps_course_evidence;
CREATE TRIGGER reps_course_evidence_guard_course_id_trg
BEFORE INSERT OR UPDATE OF course_id ON public.reps_course_evidence
FOR EACH ROW
EXECUTE FUNCTION public.reps_course_evidence_guard_course_id();

-- 2. Drop dead table with broken RLS policy referencing removed public.courses
DROP TABLE IF EXISTS public.course_accreditation_files CASCADE;
