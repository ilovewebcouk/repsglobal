-- Drop the orphaned legacy columns from professionals.
-- profiles.business_name is the user-editable single source of truth for
-- their public/business name, and auth.users.email is the source for contact email.
-- These two columns were leftover seed columns and had drifted from reality.

ALTER TABLE public.professionals DROP COLUMN IF EXISTS trading_name;
ALTER TABLE public.professionals DROP COLUMN IF EXISTS public_email;

-- Update the demo seed functions to stop writing to the dropped columns.

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
$function$;

CREATE OR REPLACE FUNCTION public.seed_bd_member_into_directory(_bd_member_id bigint, _user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r public.bd_member_seed%ROWTYPE;
  v_full_name text;
  v_slug text;
  v_avatar_url text;
  v_bio text;
  v_headline text;
  v_country text;
  v_thin boolean;
BEGIN
  SELECT * INTO r FROM public.bd_member_seed WHERE bd_member_id = _bd_member_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'bd_member_seed % not found', _bd_member_id; END IF;

  v_full_name := trim(coalesce(r.first_name,'') || ' ' || coalesce(r.last_name,''));
  IF v_full_name = '' THEN v_full_name := split_part(r.email::text, '@', 1); END IF;

  v_slug := public.slugify_unique(v_full_name);

  IF r.profile_photo_status = 'ok' AND r.profile_photo_storage_path IS NOT NULL THEN
    v_avatar_url := r.profile_photo_storage_path;
  ELSE
    v_avatar_url := NULL;
  END IF;

  v_bio := NULLIF(trim(coalesce(r.about_me, '')), '');
  IF v_bio IS NOT NULL AND length(v_bio) > 4000 THEN
    v_bio := left(v_bio, 4000);
  END IF;

  v_headline := NULLIF(trim(coalesce(r.quote, '')), '');
  IF v_headline IS NOT NULL AND length(v_headline) > 200 THEN
    v_headline := left(v_headline, 200);
  END IF;

  v_country := coalesce(NULLIF(trim(coalesce(r.country_ln,'')), ''), 'United Kingdom');

  v_thin := (v_bio IS NULL AND v_avatar_url IS NULL);

  UPDATE public.profiles
  SET full_name  = v_full_name,
      avatar_url = COALESCE(v_avatar_url, avatar_url),
      updated_at = now()
  WHERE id = _user_id;

  UPDATE public.professionals
  SET slug                = COALESCE(slug, v_slug),
      bio                 = v_bio,
      headline            = v_headline,
      city                = NULLIF(trim(coalesce(r.city,'')), ''),
      country             = v_country,
      website             = NULLIF(trim(coalesce(r.website,'')), ''),
      social_instagram    = NULLIF(trim(coalesce(r.instagram,'')), ''),
      social_linkedin     = NULLIF(trim(coalesce(r.linkedin,'')), ''),
      social_youtube      = NULLIF(trim(coalesce(r.youtube,'')), ''),
      social_tiktok       = NULLIF(trim(coalesce(r.tiktok,'')), ''),
      social_x            = NULLIF(trim(coalesce(r.twitter,'')), ''),
      primary_profession  = NULL,
      primary_title_slug  = NULL,
      identity_status     = 'unverified',
      verification        = 'pending',
      online_available    = false,
      in_person_available = true,
      is_published        = true,
      bd_seed_thin        = v_thin,
      updated_at          = now()
  WHERE id = _user_id;

  IF r.city IS NOT NULL OR r.lat IS NOT NULL THEN
    INSERT INTO public.professional_locations (
      professional_id, label, type, postcode, town, country_code,
      latitude, longitude, is_primary, is_public
    ) VALUES (
      _user_id,
      'Primary',
      'primary',
      NULLIF(trim(coalesce(r.zip_code,'')), ''),
      NULLIF(trim(coalesce(r.city,'')), ''),
      upper(left(coalesce(r.country_ln,'GB'), 2)),
      r.lat,
      r.lon,
      true,
      true
    )
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.bd_migration (
    bd_member_id, email, full_name, rep_user_id, status, processed_at
  ) VALUES (
    _bd_member_id::text, r.email, v_full_name, _user_id, 'seeded', now()
  )
  ON CONFLICT (bd_member_id) DO UPDATE
    SET rep_user_id  = EXCLUDED.rep_user_id,
        full_name    = EXCLUDED.full_name,
        status       = 'seeded',
        processed_at = now(),
        updated_at   = now();

  UPDATE public.bd_member_seed
  SET claim_status   = 'claimed',
      claimed_user_id = _user_id,
      updated_at     = now()
  WHERE bd_member_id = _bd_member_id;
END;
$function$;
