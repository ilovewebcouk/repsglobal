ALTER TABLE public.provider_regulated_permissions
  ADD COLUMN IF NOT EXISTS submission_group_id uuid;
CREATE INDEX IF NOT EXISTS idx_prp_submission_group
  ON public.provider_regulated_permissions (submission_group_id);