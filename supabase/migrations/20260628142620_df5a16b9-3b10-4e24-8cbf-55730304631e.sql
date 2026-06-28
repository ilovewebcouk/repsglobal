-- Phase 2 schema for BD → Stripe subscription rail-swap
-- 1) Magic-link tokens for setup-card / reactivate cohorts
CREATE TABLE IF NOT EXISTS public.billing_setup_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bd_member_id bigint REFERENCES public.bd_member_seed(bd_member_id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email extensions.citext NOT NULL,
  kind text NOT NULL CHECK (kind IN ('setup','reactivate')),
  token text UNIQUE NOT NULL,
  target_renewal_at timestamptz,
  consumed_at timestamptz,
  consumed_stripe_subscription_id text,
  reminders_sent jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_setup_tokens_email_idx ON public.billing_setup_tokens (email);
CREATE INDEX IF NOT EXISTS billing_setup_tokens_target_idx ON public.billing_setup_tokens (target_renewal_at) WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS billing_setup_tokens_bd_idx ON public.billing_setup_tokens (bd_member_id) WHERE bd_member_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.billing_setup_tokens TO authenticated;
GRANT ALL ON public.billing_setup_tokens TO service_role;
ALTER TABLE public.billing_setup_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage billing_setup_tokens"
  ON public.billing_setup_tokens
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_billing_setup_tokens()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS billing_setup_tokens_touch ON public.billing_setup_tokens;
CREATE TRIGGER billing_setup_tokens_touch BEFORE UPDATE ON public.billing_setup_tokens
FOR EACH ROW EXECUTE FUNCTION public.touch_billing_setup_tokens();

-- 2) Status tracking on legacy_stripe_link for the rail swap
ALTER TABLE public.legacy_stripe_link
  ADD COLUMN IF NOT EXISTS migration_kind text,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_subscription_id text;

-- 3) Index supporting the cron's "exclude converted rows" guard (Phase 4 safety)
CREATE INDEX IF NOT EXISTS legacy_stripe_link_open_due_idx
  ON public.legacy_stripe_link (next_due_at)
  WHERE is_lifetime = false AND converted_at IS NULL AND stripe_subscription_id IS NULL;