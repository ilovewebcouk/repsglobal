ALTER TABLE public.cpd_courses
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS withdrawn_reason text NULL;