CREATE OR REPLACE FUNCTION public._seed_one_demo_pro(_email text, _full_name text, _slug text, _profession text, _specs text[], _headline text, _bio text, _city text, _country_code text, _lat double precision, _lon double precision, _avatar text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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

  -- Subscription block intentionally removed. Demo pros must not carry a fake
  -- 'active' Pro subscription row — the membership dashboard treats every row
  -- in public.subscriptions as a real Stripe-backed customer.

  PERFORM public.refresh_pro_quality_score(v_uid);

  RETURN v_uid;
END;
$function$;