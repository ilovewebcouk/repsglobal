
UPDATE auth.users SET email='demo-pro@repsuk.org', updated_at=now() WHERE email='demo-fresh@repsuk.org';

UPDATE auth.identities
SET identity_data = jsonb_set(identity_data, '{email}', '"demo-pro@repsuk.org"'), updated_at=now()
WHERE identity_data->>'email' = 'demo-fresh@repsuk.org';

UPDATE auth.users
SET encrypted_password = crypt('DemoPass123!', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email IN ('demo-client@repsuk.org','demo-admin@repsuk.org','demo-verified@repsuk.org','demo-pro@repsuk.org');

INSERT INTO public.subscriptions (user_id, tier, billing_period, status, current_period_end, is_founding)
SELECT u.id, 'pro'::subscription_tier, 'monthly'::billing_period, 'active'::subscription_status,
       now() + interval '1 year', true
FROM auth.users u WHERE u.email='demo-pro@repsuk.org'
ON CONFLICT (user_id) DO UPDATE SET
  tier='pro'::subscription_tier, status='active'::subscription_status,
  billing_period='monthly'::billing_period, current_period_end=now() + interval '1 year',
  is_founding=true, updated_at=now();

INSERT INTO public.subscriptions (user_id, tier, billing_period, status, current_period_end)
SELECT u.id, 'verified'::subscription_tier, 'annual'::billing_period, 'active'::subscription_status,
       now() + interval '1 year'
FROM auth.users u WHERE u.email='demo-verified@repsuk.org'
ON CONFLICT (user_id) DO UPDATE SET
  tier='verified'::subscription_tier, status='active'::subscription_status,
  current_period_end=now() + interval '1 year', updated_at=now();

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'professional'::app_role FROM auth.users u
WHERE u.email IN ('demo-pro@repsuk.org','demo-verified@repsuk.org')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role FROM auth.users u WHERE u.email='demo-admin@repsuk.org'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'client'::app_role FROM auth.users u WHERE u.email='demo-client@repsuk.org'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.professionals (id)
SELECT u.id FROM auth.users u WHERE u.email IN ('demo-pro@repsuk.org','demo-verified@repsuk.org')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id)
SELECT u.id FROM auth.users u WHERE u.email='demo-client@repsuk.org'
ON CONFLICT (id) DO NOTHING;
