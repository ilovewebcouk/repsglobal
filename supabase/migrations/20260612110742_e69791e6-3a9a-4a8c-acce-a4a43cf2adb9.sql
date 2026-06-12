
DROP TRIGGER IF EXISTS trg_validate_professional_professions ON public.professionals;
DROP TRIGGER IF EXISTS validate_professional_professions_trg ON public.professionals;

ALTER TABLE public.professionals DROP COLUMN IF EXISTS secondary_professions;

CREATE OR REPLACE FUNCTION public.validate_professional_professions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  allowed_prof TEXT[] := ARRAY[
    'personal-trainer','fitness-instructor','group-fitness-instructor',
    'strength-coach','nutritionist','pilates-instructor','yoga-teacher'
  ];
  allowed_spec TEXT[] := ARRAY[
    'fat-loss','muscle-gain','strength','hybrid-functional',
    'endurance-running','sports-performance','pre-post-natal',
    'over-50s','youth','rehab-injury','mobility','posture-back-pain',
    'weight-management','habit-lifestyle','nutrition-coaching','online-coaching'
  ];
  s TEXT;
BEGIN
  IF NEW.primary_profession IS NOT NULL AND NOT (NEW.primary_profession = ANY(allowed_prof)) THEN
    RAISE EXCEPTION 'invalid primary_profession: %', NEW.primary_profession;
  END IF;

  IF NEW.specialisms IS NULL THEN
    NEW.specialisms := '{}';
  END IF;

  IF array_length(NEW.specialisms, 1) > 3 THEN
    RAISE EXCEPTION 'specialisms: max 3';
  END IF;

  FOREACH s IN ARRAY COALESCE(NEW.specialisms, ARRAY[]::TEXT[]) LOOP
    IF NOT (s = ANY(allowed_spec)) THEN
      RAISE EXCEPTION 'invalid specialism: %', s;
    END IF;
  END LOOP;

  IF (SELECT COUNT(DISTINCT x) FROM unnest(NEW.specialisms) AS x)
       <> COALESCE(array_length(NEW.specialisms, 1), 0) THEN
    RAISE EXCEPTION 'specialisms must be unique';
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.professionals SET specialisms = '{}' WHERE array_length(specialisms, 1) > 0;

UPDATE public.professionals
SET primary_profession = NULL, is_published = false
WHERE primary_profession = 'online-coach';

CREATE TRIGGER trg_validate_professional_professions
BEFORE INSERT OR UPDATE ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.validate_professional_professions();
