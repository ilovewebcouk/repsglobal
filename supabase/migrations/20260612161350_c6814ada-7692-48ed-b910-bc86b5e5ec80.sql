
-- 1. New columns on verification_submissions
ALTER TABLE public.verification_submissions
  ADD COLUMN IF NOT EXISTS qualification_number text,
  ADD COLUMN IF NOT EXISTS learner_number text,
  ADD COLUMN IF NOT EXISTS centre_number text,
  ADD COLUMN IF NOT EXISTS issue_date date,
  ADD COLUMN IF NOT EXISTS regulator_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS regulator_record jsonb,
  ADD COLUMN IF NOT EXISTS trust_signals jsonb,
  ADD COLUMN IF NOT EXISTS tamper_signals jsonb;

CREATE INDEX IF NOT EXISTS verification_submissions_qual_no_idx
  ON public.verification_submissions (qualification_number)
  WHERE qualification_number IS NOT NULL;

-- 2. Ofqual register cache
CREATE TABLE IF NOT EXISTS public.ofqual_cache (
  qualification_number text PRIMARY KEY,
  record jsonb,
  found boolean NOT NULL DEFAULT false,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ofqual_cache TO authenticated;
GRANT ALL ON public.ofqual_cache TO service_role;

ALTER TABLE public.ofqual_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read Ofqual cache"
  ON public.ofqual_cache
  FOR SELECT
  TO authenticated
  USING (true);
