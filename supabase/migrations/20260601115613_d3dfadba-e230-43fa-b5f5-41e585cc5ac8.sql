-- =========================================
-- Phase 1: Subscriptions, payment audit, BD migration staging, verification status
-- =========================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'verified', 'studio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_period AS ENUM ('monthly', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_state AS ENUM ('pending', 'verified', 'unverified', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bd_migration_status AS ENUM (
    'pending', 'account_created', 'subscription_created', 'failed', 'skipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================
-- subscriptions
-- =========================================
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  billing_period public.billing_period,
  status public.subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  is_founding BOOLEAN NOT NULL DEFAULT FALSE,
  migrated_from_bd BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage subscriptions"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================
-- payment_events (audit log)
-- =========================================
CREATE TABLE public.payment_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  user_id UUID,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_events_type ON public.payment_events(event_type);
CREATE INDEX idx_payment_events_customer ON public.payment_events(stripe_customer_id);
CREATE INDEX idx_payment_events_user ON public.payment_events(user_id);

GRANT ALL ON public.payment_events TO service_role;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view payment events"
  ON public.payment_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- bd_migration (staging)
-- =========================================
CREATE TABLE public.bd_migration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bd_member_id TEXT UNIQUE NOT NULL,
  email CITEXT NOT NULL,
  full_name TEXT,
  bd_plan TEXT,
  bd_price_pence INTEGER,
  bd_renewal_date DATE,
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  target_tier public.subscription_tier NOT NULL DEFAULT 'verified',
  target_billing_period public.billing_period,
  target_price_id TEXT,
  rep_user_id UUID,
  rep_subscription_id UUID REFERENCES public.subscriptions(id),
  status public.bd_migration_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bd_migration_status ON public.bd_migration(status);
CREATE INDEX idx_bd_migration_email ON public.bd_migration(email);

GRANT SELECT ON public.bd_migration TO authenticated;
GRANT ALL ON public.bd_migration TO service_role;

ALTER TABLE public.bd_migration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view bd_migration"
  ON public.bd_migration FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage bd_migration"
  ON public.bd_migration FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER bd_migration_set_updated_at
  BEFORE UPDATE ON public.bd_migration
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================
-- professionals: verification_status / grace / cert
-- =========================================
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS verification_status public.verification_state NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_grace_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cert_uploaded_at TIMESTAMPTZ;

-- Backfill: if the pre-existing `verification` column is 'verified', mirror to new column.
UPDATE public.professionals
SET verification_status = 'verified'
WHERE verification::text = 'verified' AND verification_status = 'pending';
