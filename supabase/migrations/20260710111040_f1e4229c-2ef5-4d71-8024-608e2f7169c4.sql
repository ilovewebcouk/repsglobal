-- Add spec_modules to reps_courses (structured module list from providers)
ALTER TABLE public.reps_courses
  ADD COLUMN IF NOT EXISTS spec_modules jsonb;

-- Table for accreditation evidence files attached to a reps_courses row
CREATE TABLE IF NOT EXISTS public.reps_course_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.reps_courses(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL,
  file_kind text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes integer,
  mime_type text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reps_course_evidence_course_idx ON public.reps_course_evidence (course_id);
CREATE INDEX IF NOT EXISTS reps_course_evidence_provider_idx ON public.reps_course_evidence (provider_id);

-- Trigger enforces allowed file_kind values (not a CHECK, keeps flexibility)
CREATE OR REPLACE FUNCTION public.reps_course_evidence_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.file_kind NOT IN ('specification','sample_materials','assessment','tutor_cv','other') THEN
    RAISE EXCEPTION 'Invalid file_kind: %', NEW.file_kind;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reps_course_evidence_validate_trg ON public.reps_course_evidence;
CREATE TRIGGER reps_course_evidence_validate_trg
  BEFORE INSERT OR UPDATE ON public.reps_course_evidence
  FOR EACH ROW EXECUTE FUNCTION public.reps_course_evidence_validate();

GRANT SELECT, INSERT, DELETE ON public.reps_course_evidence TO authenticated;
GRANT ALL ON public.reps_course_evidence TO service_role;

ALTER TABLE public.reps_course_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own evidence"
  ON public.reps_course_evidence
  FOR ALL
  TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Admins read evidence"
  ON public.reps_course_evidence
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies on course-accreditations bucket: providers can manage own,
-- admins can read all. Files are scoped by prefix "<user_id>/..." on the object path.
CREATE POLICY "Providers upload own course accreditation files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-accreditations'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Providers read own course accreditation files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'course-accreditations'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Providers delete own course accreditation files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-accreditations'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );