-- Track endorsement terms acceptance on each endorsement request
ALTER TABLE public.provider_regulated_permissions
  ADD COLUMN IF NOT EXISTS endorsement_terms_version text,
  ADD COLUMN IF NOT EXISTS endorsement_terms_accepted_at timestamptz;

ALTER TABLE public.reps_courses
  ADD COLUMN IF NOT EXISTS endorsement_terms_version text,
  ADD COLUMN IF NOT EXISTS endorsement_terms_accepted_at timestamptz;