
-- Ofqual-number-first regulated qualifications
-- Adds ofqual_number as the primary key of a submission; keeps qualification_id
-- nullable for historic rows.

ALTER TABLE public.provider_regulated_permissions
  ADD COLUMN IF NOT EXISTS ofqual_number text,
  ADD COLUMN IF NOT EXISTS ofqual_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS ofqual_found boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_cross_check jsonb;

-- Historic FK column is no longer required for new submissions.
ALTER TABLE public.provider_regulated_permissions
  ALTER COLUMN qualification_id DROP NOT NULL;

-- Replace the old uniqueness key with one keyed on ofqual_number.
DROP INDEX IF EXISTS public.uq_provider_qual_active;
CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_ofqual_active
  ON public.provider_regulated_permissions (provider_id, ofqual_number)
  WHERE status <> 'rejected' AND ofqual_number IS NOT NULL;

-- Helpful index for admin filtering by "not on register".
CREATE INDEX IF NOT EXISTS idx_prp_ofqual_found ON public.provider_regulated_permissions (ofqual_found);
