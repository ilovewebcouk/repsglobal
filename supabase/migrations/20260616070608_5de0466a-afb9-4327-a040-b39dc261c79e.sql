
CREATE OR REPLACE FUNCTION public.tg_subscription_grant_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_policy record;
  v_signup_meta jsonb;
BEGIN
  IF NEW.status NOT IN ('active', 'trialing') THEN
    RETURN NEW;
  END IF;

  IF NEW.tier = 'free' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_policy FROM public.credit_tier_policy(NEW.tier);

  INSERT INTO public.credit_wallets (user_id, monthly_refill, refill_ceiling)
  VALUES (NEW.user_id, v_policy.monthly_refill, v_policy.ceiling)
  ON CONFLICT (user_id) DO UPDATE
    SET monthly_refill = EXCLUDED.monthly_refill,
        refill_ceiling = EXCLUDED.refill_ceiling;

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
$function$;
