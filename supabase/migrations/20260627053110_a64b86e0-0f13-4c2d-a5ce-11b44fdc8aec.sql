
-- BD v7 launch: tracking columns + snapshot table.
-- Idempotent: safe to re-run.

ALTER TABLE public.bd_member_seed
  ADD COLUMN IF NOT EXISTS migration_status text,
  ADD COLUMN IF NOT EXISTS migration_idempotency_key text,
  ADD COLUMN IF NOT EXISTS migration_stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS migration_stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS migration_stripe_schedule_id text,
  ADD COLUMN IF NOT EXISTS migration_stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS migration_charged_pence integer,
  ADD COLUMN IF NOT EXISTS migration_error text,
  ADD COLUMN IF NOT EXISTS migration_ran_at timestamptz;

-- Allowed terminal statuses (free-text, lightweight check):
--   honoured | launched_verified | future_due_scheduled | failed | snapshot
ALTER TABLE public.bd_member_seed
  DROP CONSTRAINT IF EXISTS bd_member_seed_migration_status_chk;
ALTER TABLE public.bd_member_seed
  ADD CONSTRAINT bd_member_seed_migration_status_chk
  CHECK (migration_status IS NULL OR migration_status IN (
    'honoured','launched_verified','future_due_scheduled','failed'
  ));

CREATE UNIQUE INDEX IF NOT EXISTS bd_member_seed_migration_idem_uniq
  ON public.bd_member_seed (migration_idempotency_key)
  WHERE migration_idempotency_key IS NOT NULL;

-- Pre-launch snapshot table (full copy of bd_member_seed before runner fires).
CREATE TABLE IF NOT EXISTS public.bd_member_seed_pre_v7_snapshot (
  snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  bd_member_id integer,
  email text,
  payload jsonb NOT NULL
);

GRANT SELECT ON public.bd_member_seed_pre_v7_snapshot TO authenticated;
GRANT ALL    ON public.bd_member_seed_pre_v7_snapshot TO service_role;

ALTER TABLE public.bd_member_seed_pre_v7_snapshot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read snapshot" ON public.bd_member_seed_pre_v7_snapshot;
CREATE POLICY "Admins read snapshot"
  ON public.bd_member_seed_pre_v7_snapshot
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Per-row run log so the reconciliation report has a durable source of truth.
CREATE TABLE IF NOT EXISTS public.bd_migration_v7_run_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  ran_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  bd_member_id integer,
  email text,
  cohort text NOT NULL,
  outcome text NOT NULL,             -- success | failed | skipped_already_run
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_schedule_id text,
  stripe_invoice_id text,
  charged_pence integer,
  idempotency_key text,
  error_message text
);

GRANT SELECT ON public.bd_migration_v7_run_log TO authenticated;
GRANT ALL    ON public.bd_migration_v7_run_log TO service_role;

ALTER TABLE public.bd_migration_v7_run_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read run log" ON public.bd_migration_v7_run_log;
CREATE POLICY "Admins read run log"
  ON public.bd_migration_v7_run_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS bd_migration_v7_run_log_ran_at_idx
  ON public.bd_migration_v7_run_log (ran_at DESC);
