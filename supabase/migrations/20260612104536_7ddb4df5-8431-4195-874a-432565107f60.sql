-- Add structured profession to professionals
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS primary_profession TEXT,
  ADD COLUMN IF NOT EXISTS secondary_professions TEXT[] NOT NULL DEFAULT '{}';

-- Allowed profession slugs (mirrors src/lib/professions.ts canonical list)
CREATE OR REPLACE FUNCTION public.validate_professional_professions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  allowed TEXT[] := ARRAY[
    'personal-trainer',
    'nutritionist',
    'strength-coach',
    'online-coach',
    'pilates-instructor',
    'yoga-teacher'
  ];
  s TEXT;
BEGIN
  -- primary must be in allowed list (when set)
  IF NEW.primary_profession IS NOT NULL AND NOT (NEW.primary_profession = ANY(allowed)) THEN
    RAISE EXCEPTION 'invalid primary_profession: %', NEW.primary_profession;
  END IF;

  -- normalize null array
  IF NEW.secondary_professions IS NULL THEN
    NEW.secondary_professions := '{}';
  END IF;

  -- max 2 secondaries
  IF array_length(NEW.secondary_professions, 1) > 2 THEN
    RAISE EXCEPTION 'secondary_professions: max 2';
  END IF;

  -- each secondary must be allowed, not equal to primary, no duplicates
  IF NEW.secondary_professions IS NOT NULL THEN
    FOREACH s IN ARRAY NEW.secondary_professions LOOP
      IF NOT (s = ANY(allowed)) THEN
        RAISE EXCEPTION 'invalid secondary profession: %', s;
      END IF;
      IF NEW.primary_profession IS NOT NULL AND s = NEW.primary_profession THEN
        RAISE EXCEPTION 'secondary profession cannot equal primary';
      END IF;
    END LOOP;
    -- duplicate check
    IF (SELECT COUNT(DISTINCT x) FROM unnest(NEW.secondary_professions) AS x)
         <> COALESCE(array_length(NEW.secondary_professions, 1), 0) THEN
      RAISE EXCEPTION 'secondary_professions must be unique';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_professional_professions ON public.professionals;
CREATE TRIGGER trg_validate_professional_professions
BEFORE INSERT OR UPDATE OF primary_profession, secondary_professions
ON public.professionals
FOR EACH ROW
EXECUTE FUNCTION public.validate_professional_professions();