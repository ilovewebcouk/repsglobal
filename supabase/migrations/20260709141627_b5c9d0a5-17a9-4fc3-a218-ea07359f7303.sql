-- Add 'withdrawn' status for provider-initiated soft removal of approved qualifications.
ALTER TABLE public.provider_regulated_permissions
  DROP CONSTRAINT IF EXISTS provider_regulated_permissions_status_check;

ALTER TABLE public.provider_regulated_permissions
  ADD CONSTRAINT provider_regulated_permissions_status_check
  CHECK (status = ANY (ARRAY['submitted'::text, 'approved'::text, 'rejected'::text, 'changes_requested'::text, 'withdrawn'::text]));

ALTER TABLE public.provider_regulated_permissions
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawn_reason text;

-- Extend unique-active index to also exclude 'withdrawn' so a provider can re-submit
-- the same Ofqual number after withdrawing.
DROP INDEX IF EXISTS public.uq_provider_ofqual_active;
CREATE UNIQUE INDEX uq_provider_ofqual_active
  ON public.provider_regulated_permissions (provider_id, ofqual_number)
  WHERE status <> 'rejected'::text
    AND status <> 'withdrawn'::text
    AND ofqual_number IS NOT NULL;

-- Widen DELETE: providers may hard-delete their own submitted/changes_requested/rejected rows.
DROP POLICY IF EXISTS "Providers delete own submitted regulated permissions" ON public.provider_regulated_permissions;
CREATE POLICY "Providers delete own non-approved regulated permissions"
  ON public.provider_regulated_permissions
  FOR DELETE
  TO authenticated
  USING (
    provider_id = auth.uid()
    AND status IN ('submitted', 'changes_requested', 'rejected')
  );

-- Allow owners to move approved -> withdrawn (in addition to existing submitted/changes_requested update policy).
CREATE POLICY "Providers withdraw own approved regulated permissions"
  ON public.provider_regulated_permissions
  FOR UPDATE
  TO authenticated
  USING (provider_id = auth.uid() AND status = 'approved')
  WITH CHECK (provider_id = auth.uid() AND status = 'withdrawn');