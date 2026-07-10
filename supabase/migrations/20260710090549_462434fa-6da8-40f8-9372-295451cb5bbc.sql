
ALTER TABLE public.reps_courses
  DROP COLUMN IF EXISTS syllabus_doc_path,
  DROP COLUMN IF EXISTS assessment_criteria_doc_path,
  DROP COLUMN IF EXISTS tutor_cv_doc_path;

ALTER TABLE public.reps_courses
  ADD COLUMN IF NOT EXISTS proposed_who_for text,
  ADD COLUMN IF NOT EXISTS proposed_what_covered text,
  ADD COLUMN IF NOT EXISTS proposed_learner_outcomes text,
  ADD COLUMN IF NOT EXISTS proposed_delivery_mode text,
  ADD COLUMN IF NOT EXISTS proposed_total_hours numeric(6,2),
  ADD COLUMN IF NOT EXISTS proposed_how_assessed text,
  ADD COLUMN IF NOT EXISTS proposed_prerequisites text,
  ADD COLUMN IF NOT EXISTS proposed_tutor_credentials text,
  ADD COLUMN IF NOT EXISTS proposed_extra_notes text,
  ADD COLUMN IF NOT EXISTS ai_expand_usage jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Widen delivery mode: add online_live / online_self_paced options.
ALTER TABLE public.reps_courses
  DROP CONSTRAINT IF EXISTS reps_courses_spec_delivery_mode_check;
ALTER TABLE public.reps_courses
  ADD CONSTRAINT reps_courses_spec_delivery_mode_check
  CHECK (spec_delivery_mode IS NULL OR spec_delivery_mode IN ('in_person','online_live','online_self_paced','online','blended'));

ALTER TABLE public.reps_courses
  ADD CONSTRAINT reps_courses_proposed_delivery_mode_check
  CHECK (proposed_delivery_mode IS NULL OR proposed_delivery_mode IN ('in_person','online_live','online_self_paced','blended'));
