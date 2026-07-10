ALTER TABLE public.reps_courses
  ADD COLUMN IF NOT EXISTS proposed_level smallint
    CHECK (proposed_level IS NULL OR proposed_level BETWEEN 1 AND 7),
  ADD COLUMN IF NOT EXISTS proposed_credential_type text
    CHECK (proposed_credential_type IS NULL OR proposed_credential_type IN
      ('award','certificate','diploma','course','not_sure'));