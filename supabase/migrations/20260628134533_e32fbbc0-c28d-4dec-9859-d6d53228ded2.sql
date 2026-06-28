
-- 1. disputes table -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_dispute_id text NOT NULL UNIQUE,
  stripe_charge_id text,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  stripe_customer_id text,
  user_id uuid,
  amount_pence integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'gbp',
  reason text,
  status text,
  lifecycle_stage text NOT NULL DEFAULT 'opened'
    CHECK (lifecycle_stage IN ('opened','funds_withdrawn','funds_reinstated','won','lost')),
  evidence_due_by timestamptz,
  funds_withdrawn_pence integer NOT NULL DEFAULT 0,
  funds_reinstated_pence integer NOT NULL DEFAULT 0,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_disputes_user ON public.disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_stage ON public.disputes(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_disputes_subscription ON public.disputes(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_disputes_charge ON public.disputes(stripe_charge_id);

GRANT SELECT ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read disputes" ON public.disputes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.disputes_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_disputes_updated_at ON public.disputes;
CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.disputes_set_updated_at();

-- 2. subscriptions.payment_standing ------------------------------------------
-- Separate from `status` so verification evidence (ID, qualification, insurance)
-- is never collateral damage from a payment dispute.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_standing text NOT NULL DEFAULT 'ok'
    CHECK (payment_standing IN ('ok','payment_disputed','chargeback_lost','chargeback_won'));

CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_standing
  ON public.subscriptions(payment_standing)
  WHERE payment_standing <> 'ok';

-- 3. helpers ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_in_payment_dispute(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.disputes
    WHERE user_id = _user_id
      AND lifecycle_stage IN ('opened','funds_withdrawn','funds_reinstated')
  )
  OR EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND payment_standing IN ('payment_disputed','chargeback_lost')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_active_paid_membership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND environment = 'live'
      AND status IN ('active','trialing')
      AND tier IN ('verified','pro','studio')
      AND payment_standing = 'ok'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_in_payment_dispute(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_active_paid_membership(uuid) TO authenticated, service_role;
