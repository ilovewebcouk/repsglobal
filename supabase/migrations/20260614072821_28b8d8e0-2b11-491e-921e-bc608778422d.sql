
-- ============================================================================
-- AI Credits Wallet — Phase 2.0.2 Step 1
-- Per-pro credit balance backing every AI action (lead scoring, drafts,
-- bios, taglines, portraits, future SMS/voice). Monthly refill on tier
-- subscription anniversary; one-time top-ups via Stripe.
-- ============================================================================

-- 1. Wallet table (one row per user)
CREATE TABLE public.credit_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  monthly_refill integer NOT NULL DEFAULT 0,
  refill_ceiling integer NOT NULL DEFAULT 0,
  last_refilled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credit_wallets_balance_nonneg CHECK (balance >= 0)
);

GRANT SELECT ON public.credit_wallets TO authenticated;
GRANT ALL ON public.credit_wallets TO service_role;

ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own wallet" ON public.credit_wallets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_credit_wallets_updated_at
  BEFORE UPDATE ON public.credit_wallets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2. Append-only transaction log
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  action text NOT NULL,
  related_id uuid,
  balance_after integer NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_tx_user_created ON public.credit_transactions (user_id, created_at DESC);

GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own credit transactions" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. spend_credits: atomic check-and-debit. Returns true on success.
CREATE OR REPLACE FUNCTION public.spend_credits(
  _user_id uuid,
  _cost integer,
  _action text,
  _related_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  IF _cost <= 0 THEN
    RAISE EXCEPTION 'cost must be positive';
  END IF;

  -- Ensure wallet exists (lazy create with zero balance)
  INSERT INTO public.credit_wallets (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.credit_wallets
  SET balance = balance - _cost
  WHERE user_id = _user_id AND balance >= _cost
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.credit_transactions (user_id, delta, action, related_id, balance_after, metadata)
  VALUES (_user_id, -_cost, _action, _related_id, v_new_balance, COALESCE(_metadata, '{}'::jsonb));

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.spend_credits(uuid, integer, text, uuid, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, integer, text, uuid, jsonb) TO service_role;

-- 4. grant_credits: add to balance (top-ups, refills, sign-up grant)
CREATE OR REPLACE FUNCTION public.grant_credits(
  _user_id uuid,
  _amount integer,
  _action text,
  _related_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb,
  _respect_ceiling boolean DEFAULT false
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
  v_ceiling integer;
  v_grant integer := _amount;
BEGIN
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  INSERT INTO public.credit_wallets (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF _respect_ceiling THEN
    SELECT refill_ceiling INTO v_ceiling FROM public.credit_wallets WHERE user_id = _user_id;
    IF v_ceiling > 0 THEN
      UPDATE public.credit_wallets
      SET balance = LEAST(balance + _amount, v_ceiling)
      WHERE user_id = _user_id
      RETURNING balance INTO v_new_balance;
    ELSE
      UPDATE public.credit_wallets
      SET balance = balance + _amount
      WHERE user_id = _user_id
      RETURNING balance INTO v_new_balance;
    END IF;
  ELSE
    UPDATE public.credit_wallets
    SET balance = balance + _amount
    WHERE user_id = _user_id
    RETURNING balance INTO v_new_balance;
  END IF;

  INSERT INTO public.credit_transactions (user_id, delta, action, related_id, balance_after, metadata)
  VALUES (_user_id, v_grant, _action, _related_id, v_new_balance, COALESCE(_metadata, '{}'::jsonb));

  RETURN v_new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_credits(uuid, integer, text, uuid, jsonb, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, uuid, jsonb, boolean) TO service_role;

-- 5. Tier policy lookup (sign-up grant + monthly refill + ceiling)
CREATE OR REPLACE FUNCTION public.credit_tier_policy(_tier subscription_tier)
RETURNS TABLE(signup_grant integer, monthly_refill integer, ceiling integer)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    CASE _tier
      WHEN 'verified' THEN 150
      WHEN 'pro'      THEN 400
      WHEN 'studio'   THEN 1500
      ELSE 0
    END,
    CASE _tier
      WHEN 'verified' THEN 30
      WHEN 'pro'      THEN 200
      WHEN 'studio'   THEN 800
      ELSE 0
    END,
    CASE _tier
      WHEN 'verified' THEN 60   -- 2 months refill ceiling
      WHEN 'pro'      THEN 400
      WHEN 'studio'   THEN 1600
      ELSE 0
    END;
$$;

-- 6. Trigger on subscriptions: on first activation grant sign-up credits +
-- set monthly refill schedule. Re-running for the same tier is a no-op
-- (idempotency tracked via metadata.signup_grant_tier on the wallet).
CREATE OR REPLACE FUNCTION public.tg_subscription_grant_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_policy record;
  v_wallet record;
  v_signup_meta jsonb;
BEGIN
  -- Only act when subscription is in an active-ish state
  IF NEW.status NOT IN ('active', 'trialing') THEN
    RETURN NEW;
  END IF;

  IF NEW.tier = 'free' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_policy FROM public.credit_tier_policy(NEW.tier);

  -- Ensure wallet row exists
  INSERT INTO public.credit_wallets (user_id, monthly_refill, refill_ceiling)
  VALUES (NEW.user_id, v_policy.monthly_refill, v_policy.ceiling)
  ON CONFLICT (user_id) DO UPDATE
    SET monthly_refill = EXCLUDED.monthly_refill,
        refill_ceiling = EXCLUDED.refill_ceiling;

  -- Has this user already received the sign-up grant for this tier?
  SELECT id, balance, last_refilled_at INTO v_wallet
  FROM public.credit_wallets WHERE user_id = NEW.user_id;

  IF EXISTS (
    SELECT 1 FROM public.credit_transactions
    WHERE user_id = NEW.user_id
      AND action = 'signup_grant'
      AND metadata->>'tier' = NEW.tier::text
  ) THEN
    RETURN NEW;
  END IF;

  v_signup_meta := jsonb_build_object('tier', NEW.tier::text, 'subscription_id', NEW.id);

  PERFORM public.grant_credits(
    NEW.user_id,
    v_policy.signup_grant,
    'signup_grant',
    NEW.id,
    v_signup_meta,
    false
  );

  UPDATE public.credit_wallets
  SET last_refilled_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subscription_grant_credits
  AFTER INSERT OR UPDATE OF status, tier ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_subscription_grant_credits();

-- 7. Monthly refill RPC (called by pg_cron daily; tops up any wallet whose
-- subscription is active and whose last_refilled_at is > 1 month ago)
CREATE OR REPLACE FUNCTION public.run_monthly_credit_refills()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT ON (s.user_id)
      s.user_id, s.tier, s.id AS subscription_id, w.last_refilled_at, w.monthly_refill
    FROM public.subscriptions s
    JOIN public.credit_wallets w ON w.user_id = s.user_id
    WHERE s.status IN ('active', 'trialing')
      AND s.tier <> 'free'
      AND w.monthly_refill > 0
      AND (w.last_refilled_at IS NULL OR w.last_refilled_at < now() - interval '1 month')
    ORDER BY s.user_id, s.created_at DESC
  LOOP
    PERFORM public.grant_credits(
      r.user_id,
      r.monthly_refill,
      'monthly_refill',
      r.subscription_id,
      jsonb_build_object('tier', r.tier::text),
      true
    );
    UPDATE public.credit_wallets
    SET last_refilled_at = now()
    WHERE user_id = r.user_id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.run_monthly_credit_refills() FROM public;
GRANT EXECUTE ON FUNCTION public.run_monthly_credit_refills() TO service_role;
