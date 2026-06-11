DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'demo-client@repsuk.org' LIMIT 1;
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'demo-client@repsuk.org',
      crypt('DemoClient2026!', gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers',array['email']),
      jsonb_build_object('full_name','Demo Client','signup_kind','client'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email','demo-client@repsuk.org','email_verified',true),
      'email', v_uid::text, now(), now(), now());
  END IF;

  INSERT INTO public.profiles (id, full_name) VALUES (v_uid, 'Demo Client')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.clients (id) VALUES (v_uid) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- Clean up demo-admin: it currently has both admin + professional; keep only admin for clarity
DELETE FROM public.user_roles
WHERE role = 'professional'
  AND user_id = (SELECT id FROM auth.users WHERE email = 'demo-admin@repsuk.org');