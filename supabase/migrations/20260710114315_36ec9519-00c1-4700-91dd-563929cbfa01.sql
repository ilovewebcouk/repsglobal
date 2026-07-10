ALTER TABLE public.reps_courses
  ADD COLUMN IF NOT EXISTS endorsement_statement_url text,
  ADD COLUMN IF NOT EXISTS endorsement_statement_agreed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS endorsement_statement_last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS endorsement_statement_found boolean,
  ADD COLUMN IF NOT EXISTS endorsement_statement_check_error text,
  ADD COLUMN IF NOT EXISTS admin_reviewer_aide jsonb,
  ADD COLUMN IF NOT EXISTS admin_reviewer_aide_generated_at timestamptz;

COMMENT ON COLUMN public.reps_courses.endorsement_statement_url IS 'Provider-declared URL on their website that carries the REPS endorsement statement. Verified by admin.';
COMMENT ON COLUMN public.reps_courses.endorsement_statement_agreed IS 'Provider has agreed to display the REPS endorsement statement on their course page.';
COMMENT ON COLUMN public.reps_courses.endorsement_statement_found IS 'Result of the automated fetch check for the endorsement statement on the declared URL. NULL = not yet checked.';
COMMENT ON COLUMN public.reps_courses.admin_reviewer_aide IS 'Internal-only AI reviewer aide (level suggestion, module-vs-spec consistency, Bloom''s check, red flags). Not exposed to providers.';