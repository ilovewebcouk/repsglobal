
DO $$
DECLARE
  v_admin uuid := gen_random_uuid();
  v_fresh uuid := gen_random_uuid();
  v_verified uuid := gen_random_uuid();
BEGIN
  -- Clean up any prior runs so this is idempotent
  DELETE FROM auth.users WHERE email IN (
    'demo-admin@repsuk.org','demo-fresh@repsuk.org','demo-verified@repsuk.org'
  );

  -- 1) demo-admin
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_admin, 'authenticated', 'authenticated',
    'demo-admin@repsuk.org', crypt('pUx3YhnMJj4ynyWkbNcv', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Demo Admin","signup_kind":"professional"}'::jsonb,
    now(), now(), '', '', '', ''
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (v_admin, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

  -- 2) demo-fresh
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_fresh, 'authenticated', 'authenticated',
    'demo-fresh@repsuk.org', crypt('EntgHREyCnYqx0iaywxa', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Demo Fresh Pro","signup_kind":"professional"}'::jsonb,
    now(), now(), '', '', '', ''
  );

  -- 3) demo-verified (fully wired)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_verified, 'authenticated', 'authenticated',
    'demo-verified@repsuk.org', crypt('os4Ix7KjlhWoVNumorUj', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Demo Verified Pro","signup_kind":"professional"}'::jsonb,
    now(), now(), '', '', '', ''
  );

  UPDATE public.professionals
  SET slug = 'demo-verified',
      trading_name = 'Demo Verified Coaching',
      headline = 'Strength and conditioning for busy professionals',
      bio = 'Demo verified profile used to showcase the REPS Verified tier. I help busy professionals build strength, improve fitness, and feel their best with structured 1:1 programmes.',
      specialisms = ARRAY['Strength Training','Fat Loss','Health & Fitness'],
      city = 'London',
      country = 'United Kingdom',
      online_available = true,
      in_person_available = true,
      hourly_rate_pence = 7500,
      verification = 'verified',
      verification_status = 'verified',
      is_published = true,
      updated_at = now()
  WHERE id = v_verified;

  INSERT INTO public.subscriptions (
    user_id, tier, billing_period, status, current_period_end,
    cancel_at_period_end, is_founding
  ) VALUES (
    v_verified, 'verified', 'annual', 'active', now() + interval '1 year',
    false, false
  );
END $$;
