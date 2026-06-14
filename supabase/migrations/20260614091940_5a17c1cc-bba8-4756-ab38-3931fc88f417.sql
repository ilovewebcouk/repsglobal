
-- Add environment column to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox';

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_environment_check
  CHECK (environment IN ('sandbox', 'live'));

-- Backfill: assume any pre-existing row is from the live env (best guess; sandbox
-- subs would have been recreated anyway). Override with 'live' for safety so
-- existing customers don't lose access on first deploy.
UPDATE public.subscriptions SET environment = 'live' WHERE environment = 'sandbox';

-- Replace per-user uniqueness with per-user-per-environment
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_environment_key UNIQUE (user_id, environment);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_env
  ON public.subscriptions (user_id, environment);
