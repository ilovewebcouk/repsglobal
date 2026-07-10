
-- REPS course accreditation reports & AI level rationale
-- 1. New columns on reps_courses for AI rationale, deterministic flags,
--    decision snapshot (immutability) and the generated PDF report path.

ALTER TABLE public.reps_courses
  ADD COLUMN IF NOT EXISTS official_level_rationale text,
  ADD COLUMN IF NOT EXISTS official_level_confidence text,
  ADD COLUMN IF NOT EXISTS reviewer_notes text,
  ADD COLUMN IF NOT EXISTS ai_deterministic_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS decision_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS report_pdf_path text,
  ADD COLUMN IF NOT EXISTS report_generated_at timestamptz;

-- Confidence is a bounded enum-lite; validate via trigger to allow future values
-- without a schema migration.
CREATE OR REPLACE FUNCTION public.reps_courses_validate_confidence()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.official_level_confidence IS NOT NULL
     AND NEW.official_level_confidence NOT IN ('high','medium','low') THEN
    RAISE EXCEPTION 'official_level_confidence must be high | medium | low';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reps_courses_validate_confidence ON public.reps_courses;
CREATE TRIGGER reps_courses_validate_confidence
BEFORE INSERT OR UPDATE ON public.reps_courses
FOR EACH ROW EXECUTE FUNCTION public.reps_courses_validate_confidence();

-- 2. Storage RLS for the new private `course-reports` bucket. Bucket itself is
--    created via the storage tool (public=false). Path convention:
--    `{provider_id}/{course_id}/{issued_at}-report.pdf`.
--    Providers can read their own; admins can read any; service role writes.

CREATE POLICY "course-reports: providers read their own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-reports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "course-reports: admins read all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-reports'
  AND public.has_role(auth.uid(), 'admin')
);
