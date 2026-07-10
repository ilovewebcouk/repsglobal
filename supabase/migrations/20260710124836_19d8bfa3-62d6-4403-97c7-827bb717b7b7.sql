ALTER TABLE public.certificate_registrations
  DROP CONSTRAINT IF EXISTS certificate_registrations_course_id_fkey;

ALTER TABLE public.certificate_registrations
  ADD COLUMN IF NOT EXISTS course_kind text NOT NULL DEFAULT 'regulated';

ALTER TABLE public.certificate_registrations
  ADD CONSTRAINT certificate_registrations_course_kind_chk
  CHECK (course_kind IN ('regulated','reps_course'));