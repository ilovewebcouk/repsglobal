-- Simplify course evidence: only syllabus required, allow optional labeled extras
ALTER TABLE public.reps_course_evidence ADD COLUMN IF NOT EXISTS file_label text;

CREATE OR REPLACE FUNCTION public.reps_course_evidence_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.file_kind NOT IN (
    'specification','sample_materials','assessment','tutor_cv',
    'insurance','awarding_body_cert','other'
  ) THEN
    RAISE EXCEPTION 'Invalid file_kind: %', NEW.file_kind;
  END IF;
  RETURN NEW;
END;
$function$;