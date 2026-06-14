
-- Idempotency: one topup row per stripe session
CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_topup_session_unique
  ON public.credit_transactions ((metadata->>'stripe_session_id'))
  WHERE action = 'topup';

CREATE OR REPLACE FUNCTION public.grant_credit_topup(
  _user_id uuid,
  _credits integer,
  _stripe_session_id text,
  _pack text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing integer;
  v_new_balance integer;
BEGIN
  IF _credits <= 0 THEN
    RAISE EXCEPTION 'credits must be positive';
  END IF;
  IF _stripe_session_id IS NULL OR length(_stripe_session_id) = 0 THEN
    RAISE EXCEPTION 'stripe_session_id required';
  END IF;

  -- Idempotency check
  SELECT balance_after INTO v_existing
  FROM public.credit_transactions
  WHERE action = 'topup'
    AND metadata->>'stripe_session_id' = _stripe_session_id
  LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.credit_wallets (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.credit_wallets
  SET balance = balance + _credits
  WHERE user_id = _user_id
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.credit_transactions (user_id, delta, action, balance_after, metadata)
  VALUES (
    _user_id,
    _credits,
    'topup',
    v_new_balance,
    jsonb_build_object('stripe_session_id', _stripe_session_id, 'pack', _pack)
  );

  RETURN v_new_balance;
END;
$$;
