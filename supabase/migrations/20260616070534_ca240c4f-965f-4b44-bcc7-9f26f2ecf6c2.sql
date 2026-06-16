
CREATE OR REPLACE FUNCTION public.admin_seed_demo_pros()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  v_count int := 0;

  PROCEDURE_done boolean;
BEGIN
  -- noop, real work below
  RETURN 0;
END;
$fn$;

-- Drop & rebuild as a clean, debuggable version
DROP FUNCTION IF EXISTS public.admin_seed_demo_pros();

CREATE OR REPLACE FUNCTION public._seed_one_demo_pro(
  _email text, _full_name text, _slug text, _profession text,
  _specs text[], _headline text, _bio text,
  _city text, _country_code text, _lat double precision, _lon double precision,
  _avatar text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $sn$
DECLARE
  v_uid uuid;
BEGIN
  SELECT u.id INTO v_uid FROM auth.users u WHERE lower(u.email) = lower(_email) LIMIT 1;
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      lower(_email), now(),
      jsonb_build_object('provider','email','providers',array['email']),
      jsonb_build_object('signup_kind','professional','full_name',_full_name),
      now(), now(), '', '', '', ''
    );
  END IF;

  UPDATE public.profiles
  SET full_name = _full_name,
      avatar_url = _avatar,
      updated_at = now()
  WHERE id = v_uid;

  UPDATE public.professionals
  SET slug = _slug,
      headline = _headline,
      bio = _bio,
      city = _city,
      country = 'United Kingdom',
      primary_profession = _profession,
      specialisms = _specs,
      identity_status = 'approved',
      verification = 'verified',
      in_person_available = true,
      online_available = true,
      is_published = true,
      bd_seed_thin = false,
      updated_at = now()
  WHERE id = v_uid;

  DELETE FROM public.professional_locations WHERE professional_id = v_uid AND is_primary;
  INSERT INTO public.professional_locations (
    professional_id, label, type, town, country_code,
    latitude, longitude, is_primary, is_public
  ) VALUES (
    v_uid, 'Primary', 'primary', _city, _country_code,
    _lat, _lon, true, true
  );

  -- Pro subscription (if not already present)
  IF NOT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = v_uid
      AND tier = 'pro'::subscription_tier
      AND status IN ('active','trialing')
  ) THEN
    INSERT INTO public.subscriptions (user_id, tier, status)
    VALUES (v_uid, 'pro'::subscription_tier, 'active'::subscription_status);
  END IF;

  PERFORM public.refresh_pro_quality_score(v_uid);

  RETURN v_uid;
END;
$sn$;

REVOKE ALL ON FUNCTION public._seed_one_demo_pro(text,text,text,text,text[],text,text,text,text,double precision,double precision,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_seed_demo_pros()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE v_n int := 0;
BEGIN
  PERFORM public._seed_one_demo_pro('james.wilson@demo.repsuk.org','James Wilson','james-wilson','personal-trainer',
    ARRAY['strength','fat-loss','hybrid-functional']::text[],
    'Helping busy professionals build strength, improve fitness and feel their best.',
    'Strength, conditioning and lifestyle coaching for busy professionals — small-group and 1:1 sessions in Mayfair, hybrid online programming for clients across the city. 10+ years coaching, qualified through an Ofqual-regulated awarding body, fully insured, REPs identity-verified.',
    'Mayfair','GB',51.5083,-0.1521,'/demo-avatars/pro-james.jpg'); v_n := v_n + 1;

  PERFORM public._seed_one_demo_pro('sophie.taylor@demo.repsuk.org','Sophie Taylor','sophie-taylor','pilates-instructor',
    ARRAY['mobility','posture-back-pain','rehab-injury']::text[],
    'Pilates for strength, mobility and long-term wellness. All levels welcome.',
    'Reformer and mat Pilates with a focus on posture, breathing and resilient movement. Studio sessions in Marylebone, 1:1 corrective work, group classes. STOTT Pilates certified, pre & post-natal trained.',
    'Marylebone','GB',51.5226,-0.1571,'/demo-avatars/pro-sophie.jpg'); v_n := v_n + 1;

  PERFORM public._seed_one_demo_pro('liam.roberts@demo.repsuk.org','Liam Roberts','liam-roberts','strength-coach',
    ARRAY['strength','sports-performance','muscle-gain']::text[],
    'Build strength, move better and perform at your best.',
    'Strength and conditioning coach working with intermediate and advanced lifters. Block-periodised programming, technique-first, no gimmicks. Soho and Victoria.',
    'Soho','GB',51.5136,-0.1318,'/demo-avatars/pro-daniel.jpg'); v_n := v_n + 1;

  PERFORM public._seed_one_demo_pro('priya.sharma@demo.repsuk.org','Priya Sharma','priya-sharma','nutritionist',
    ARRAY['nutrition-coaching','weight-management','habit-lifestyle']::text[],
    'Science-based nutrition advice to help you build healthy habits and feel your best.',
    'Registered nutritionist running 1:1 online consultations and longer-term coaching programmes. Specialism in sustainable fat loss, energy management and clinical lifestyle conditions.',
    'Fitzrovia','GB',51.5202,-0.1392,'/demo-avatars/pro-laura.jpg'); v_n := v_n + 1;

  PERFORM public._seed_one_demo_pro('daniel.hughes@demo.repsuk.org','Daniel Hughes','daniel-hughes','personal-trainer',
    ARRAY['hybrid-functional','fat-loss','habit-lifestyle']::text[],
    'Functional training and lifestyle coaching for long-term results.',
    'Functional training, fat-loss and lifestyle coaching for clients in their 30s and 40s. Covent Garden and Holborn, hybrid online available. Honest, evidence-led, no quick fixes.',
    'Covent Garden','GB',51.5117,-0.124,'/demo-avatars/pro-james.jpg'); v_n := v_n + 1;

  PERFORM public._seed_one_demo_pro('emily.carter@demo.repsuk.org','Emily Carter','emily-carter','pilates-instructor',
    ARRAY['mobility','posture-back-pain','pre-post-natal']::text[],
    'Reformer and mat Pilates to improve strength, flexibility and posture.',
    'Reformer-led Pilates with a focus on long-term postural health. Bloomsbury studio, small-group reformer classes, 1:1 sessions for desk-bound clients and post-natal returners.',
    'Bloomsbury','GB',51.5226,-0.1278,'/demo-avatars/pro-sophie.jpg'); v_n := v_n + 1;

  PERFORM public._seed_one_demo_pro('marcus.lee@demo.repsuk.org','Marcus Lee','marcus-lee','strength-coach',
    ARRAY['strength','sports-performance','muscle-gain']::text[],
    'Strength and conditioning for athletes and everyday lifters.',
    'Strength and conditioning for athletes, contact-sport returners and everyday lifters who want to take training seriously. Holborn, Farringdon and Barbican.',
    'Holborn','GB',51.5174,-0.1182,'/demo-avatars/pro-daniel.jpg'); v_n := v_n + 1;

  PERFORM public._seed_one_demo_pro('hannah.thompson@demo.repsuk.org','Hannah Thompson','hannah-thompson','personal-trainer',
    ARRAY['pre-post-natal','rehab-injury','mobility']::text[],
    'Support for every stage of pregnancy and postpartum recovery.',
    'Pre and post-natal specialist with a clinical background. Pelvic-floor-aware programming, gradual return-to-training, diastasis recovery. Clerkenwell and Islington, online too.',
    'Clerkenwell','GB',51.5247,-0.1063,'/demo-avatars/pro-laura.jpg'); v_n := v_n + 1;

  RETURN v_n;
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_seed_demo_pros() FROM PUBLIC, anon, authenticated;
