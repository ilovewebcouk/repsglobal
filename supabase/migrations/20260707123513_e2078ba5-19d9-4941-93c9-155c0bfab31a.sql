ALTER TABLE public.subscriptions DISABLE TRIGGER trg_subscription_grant_credits;
UPDATE public.subscriptions SET tier='training_provider' WHERE user_id='11111111-0000-4000-a000-000000000002';
ALTER TABLE public.subscriptions ENABLE TRIGGER trg_subscription_grant_credits;