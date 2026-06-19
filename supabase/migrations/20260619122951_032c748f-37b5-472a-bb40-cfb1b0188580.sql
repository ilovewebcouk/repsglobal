ALTER TABLE public.bd_member_seed
  ADD COLUMN IF NOT EXISTS migration_canonical_stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS migration_cohort_override text,
  ADD COLUMN IF NOT EXISTS migration_review_resolved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS migration_cohort_reason text;

ALTER TABLE public.bd_member_seed
  DROP CONSTRAINT IF EXISTS bd_member_seed_migration_cohort_override_check;

ALTER TABLE public.bd_member_seed
  ADD CONSTRAINT bd_member_seed_migration_cohort_override_check
  CHECK (
    migration_cohort_override IS NULL
    OR migration_cohort_override IN (
      'honour_window',
      'future_due',
      'anomaly_launch_charge',
      'manual_review',
      'blocked'
    )
  );

COMMENT ON COLUMN public.bd_member_seed.migration_canonical_stripe_customer_id IS
  'When the BD email matches multiple Stripe customers, this pins the canonical one for migration reconciliation.';
COMMENT ON COLUMN public.bd_member_seed.migration_cohort_override IS
  'Admin-approved override for the computed migration cohort. When set, the dry-run logic uses this value verbatim.';
COMMENT ON COLUMN public.bd_member_seed.migration_review_resolved IS
  'True when Scott has explicitly resolved a manual_review / blocked row.';
COMMENT ON COLUMN public.bd_member_seed.migration_cohort_reason IS
  'Audit text shown alongside the row in the migration dry-run CSV.';