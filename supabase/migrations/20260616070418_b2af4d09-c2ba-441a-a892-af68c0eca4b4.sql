
-- 1. Quality score column
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS quality_score int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS professionals_quality_rank_idx
  ON public.professionals (quality_score DESC, updated_at DESC)
  WHERE is_published = true;

-- 2. Compute function
CREATE OR REPLACE FUNCTION public.compute_pro_quality_score(_pro_id uuid)
RETURNS int
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score int := 0;
  v_p public.professionals%ROWTYPE;
  v_avatar_url text;
  v_tier text;
  v_has_coords boolean;
  v_has_service boolean;
  v_spec_count int;
BEGIN
  SELECT * INTO v_p FROM public.professionals WHERE id = _pro_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT avatar_url INTO v_avatar_url FROM public.profiles WHERE id = _pro_id;

  SELECT tier::text INTO v_tier
  FROM public.subscriptions
  WHERE user_id = _pro_id
    AND status IN ('active','trialing','past_due')
  ORDER BY CASE tier::text
             WHEN 'studio'   THEN 3
             WHEN 'pro'      THEN 2
             WHEN 'verified' THEN 1
             ELSE 0
           END DESC
  LIMIT 1;

  v_has_coords := EXISTS (
    SELECT 1 FROM public.professional_locations
    WHERE professional_id = _pro_id
      AND is_primary
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
  );

  v_has_service := EXISTS (
    SELECT 1 FROM public.services
    WHERE professional_id = _pro_id
      AND COALESCE(is_published, true)
  );

  v_spec_count := COALESCE(array_length(v_p.specialisms, 1), 0);

  -- tier
  v_score := v_score + CASE v_tier
    WHEN 'studio'   THEN 40
    WHEN 'pro'      THEN 30
    WHEN 'verified' THEN 15
    ELSE 0
  END;

  -- identity verified (weighted heavy per product call: higher verification = higher rank)
  IF v_p.identity_status = 'approved' THEN
    v_score := v_score + 30;
  END IF;
  IF v_p.verification::text = 'verified' THEN
    v_score := v_score + 10;
  END IF;

  -- photo (weighted heavy per product call: photos make the directory look good)
  IF v_avatar_url IS NOT NULL AND length(trim(v_avatar_url)) > 0 THEN
    v_score := v_score + 15;
  END IF;

  -- bio
  IF length(COALESCE(v_p.bio, '')) > 120 THEN
    v_score := v_score + 8;
  ELSIF length(COALESCE(v_p.bio, '')) > 0 THEN
    v_score := v_score + 3;
  END IF;

  -- headline
  IF length(COALESCE(v_p.headline, '')) > 0 THEN
    v_score := v_score + 4;
  END IF;

  -- specialisms
  v_score := v_score + CASE
    WHEN v_spec_count >= 2 THEN 8
    WHEN v_spec_count = 1 THEN 4
    ELSE 0
  END;

  -- profession
  IF v_p.primary_profession IS NOT NULL THEN
    v_score := v_score + 6;
  END IF;

  -- location with coords
  IF v_has_coords THEN v_score := v_score + 6; END IF;

  -- services
  IF v_has_service THEN v_score := v_score + 6; END IF;

  -- thin seed penalty
  IF COALESCE(v_p.bd_seed_thin, false) THEN
    v_score := v_score - 20;
  END IF;

  RETURN v_score;
END;
$$;

REVOKE ALL ON FUNCTION public.compute_pro_quality_score(uuid) FROM PUBLIC, anon, authenticated;

-- 3. Refresh helper + triggers
CREATE OR REPLACE FUNCTION public.refresh_pro_quality_score(_pro_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_new int;
BEGIN
  v_new := public.compute_pro_quality_score(_pro_id);
  UPDATE public.professionals
    SET quality_score = v_new
    WHERE id = _pro_id
      AND quality_score IS DISTINCT FROM v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_pro_quality_score(uuid) FROM PUBLIC, anon, authenticated;

-- Trigger fns
CREATE OR REPLACE FUNCTION public.tg_refresh_score_self()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.refresh_pro_quality_score(NEW.id);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_refresh_score_by_user_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.refresh_pro_quality_score(COALESCE(NEW.user_id, OLD.user_id));
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_refresh_score_by_pro_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.refresh_pro_quality_score(COALESCE(NEW.professional_id, OLD.professional_id));
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_refresh_score_by_profile_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.professionals WHERE id = COALESCE(NEW.id, OLD.id)) THEN
    PERFORM public.refresh_pro_quality_score(COALESCE(NEW.id, OLD.id));
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS professionals_refresh_score ON public.professionals;
CREATE TRIGGER professionals_refresh_score
AFTER INSERT OR UPDATE OF bio, headline, specialisms, primary_profession,
                          identity_status, verification, bd_seed_thin, is_published
ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.tg_refresh_score_self();

DROP TRIGGER IF EXISTS profiles_refresh_pro_score ON public.profiles;
CREATE TRIGGER profiles_refresh_pro_score
AFTER UPDATE OF avatar_url, full_name ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_refresh_score_by_profile_id();

DROP TRIGGER IF EXISTS subscriptions_refresh_pro_score ON public.subscriptions;
CREATE TRIGGER subscriptions_refresh_pro_score
AFTER INSERT OR UPDATE OF tier, status OR DELETE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.tg_refresh_score_by_user_id();

DROP TRIGGER IF EXISTS locations_refresh_pro_score ON public.professional_locations;
CREATE TRIGGER locations_refresh_pro_score
AFTER INSERT OR UPDATE OR DELETE ON public.professional_locations
FOR EACH ROW EXECUTE FUNCTION public.tg_refresh_score_by_pro_id();

DROP TRIGGER IF EXISTS services_refresh_pro_score ON public.services;
CREATE TRIGGER services_refresh_pro_score
AFTER INSERT OR UPDATE OR DELETE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.tg_refresh_score_by_pro_id();

-- 4. Backfill
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.professionals LOOP
    PERFORM public.refresh_pro_quality_score(r.id);
  END LOOP;
END $$;

-- 5. Demo pros seeder
CREATE OR REPLACE FUNCTION public.admin_seed_demo_pros()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  v_count int := 0;
  v_uid uuid;
  v_existing uuid;
  demo record;
BEGIN
  FOR demo IN
    SELECT * FROM (VALUES
      ('james.wilson@demo.repsuk.org','James Wilson','james-wilson','personal-trainer',
       ARRAY['strength','fat-loss','hybrid-functional'],
       'Helping busy professionals build strength, improve fitness and feel their best.',
       'Strength, conditioning and lifestyle coaching for busy professionals — small-group and 1:1 sessions in Mayfair, hybrid online programming for clients across the city. 10+ years coaching, qualified through an Ofqual-regulated awarding body, fully insured, REPs identity-verified.',
       'Mayfair','GB',51.5083,-0.1521,'/demo-avatars/pro-james.jpg'),
      ('sophie.taylor@demo.repsuk.org','Sophie Taylor','sophie-taylor','pilates-instructor',
       ARRAY['mobility','posture-back-pain','rehab-injury'],
       'Pilates for strength, mobility and long-term wellness. All levels welcome.',
       'Reformer and mat Pilates with a focus on posture, breathing and resilient movement. Studio sessions in Marylebone, 1:1 corrective work, group classes. STOTT Pilates certified, pre & post-natal trained.',
       'Marylebone','GB',51.5226,-0.1571,'/demo-avatars/pro-sophie.jpg'),
      ('liam.roberts@demo.repsuk.org','Liam Roberts','liam-roberts','strength-coach',
       ARRAY['strength','sports-performance','muscle-gain'],
       'Build strength, move better and perform at your best.',
       'Strength and conditioning coach working with intermediate and advanced lifters. Block-periodised programming, technique-first, no gimmicks. Soho and Victoria.',
       'Soho','GB',51.5136,-0.1318,'/demo-avatars/pro-daniel.jpg'),
      ('priya.sharma@demo.repsuk.org','Priya Sharma','priya-sharma','nutritionist',
       ARRAY['nutrition-coaching','weight-management','habit-lifestyle'],
       'Science-based nutrition advice to help you build healthy habits and feel your best.',
       'Registered nutritionist (ANutr) running 1:1 online consultations and longer-term coaching programmes. Specialism in sustainable fat loss, energy management and clinical lifestyle conditions.',
       'Fitzrovia','GB',51.5202,-0.1392,'/demo-avatars/pro-laura.jpg'),
      ('daniel.hughes@demo.repsuk.org','Daniel Hughes','daniel-hughes','personal-trainer',
       ARRAY['hybrid-functional','fat-loss','habit-lifestyle'],
       'Functional training and lifestyle coaching for long-term results.',
       'Functional training, fat-loss and lifestyle coaching for clients in their 30s and 40s. Covent Garden and Holborn, hybrid online available. Honest, evidence-led, no quick fixes.',
       'Covent Garden','GB',51.5117,-0.124,'/demo-avatars/pro-james.jpg'),
      ('emily.carter@demo.repsuk.org','Emily Carter','emily-carter','pilates-instructor',
       ARRAY['mobility','posture-back-pain','pre-post-natal'],
       'Reformer and mat Pilates to improve strength, flexibility and posture.',
       'Reformer-led Pilates with a focus on long-term postural health. Bloomsbury studio, small-group reformer classes, 1:1 sessions for desk-bound clients and post-natal returners.',
       'Bloomsbury','GB',51.5226,-0.1278,'/demo-avatars/pro-sophie.jpg'),
      ('marcus.lee@demo.repsuk.org','Marcus Lee','marcus-lee','strength-coach',
       ARRAY['strength','sports-performance','muscle-gain'],
       'Strength and conditioning for athletes and everyday lifters.',
       'Strength and conditioning for athletes, contact-sport returners and everyday lifters who want to take training seriously. Holborn, Farringdon and Barbican.',
       'Holborn','GB',51.5174,-0.1182,'/demo-avatars/pro-daniel.jpg'),
      ('hannah.thompson@demo.repsuk.org','Hannah Thompson','hannah-thompson','personal-trainer',
       ARRAY['pre-post-natal','rehab-injury','mobility'],
       'Support for every stage of pregnancy and postpartum recovery.',
       'Pre and post-natal specialist with a clinical background. Pelvic-floor-aware programming, gradual return-to-training, diastasis recovery. Clerkenwell and Islington, online too.',
       'Clerkenwell','GB',51.5247,-0.1063,'/demo-avatars/pro-laura.jpg')
    ) AS t(email,full_name,slug,profession,specs,headline,bio,city,country_code,lat,lon,avatar)
  LOOP
    BEGIN
      SELECT id INTO v_existing FROM auth.users WHERE lower(email) = lower(demo.email) LIMIT 1;
      IF v_existing IS NOT NULL THEN
        v_uid := v_existing;
      ELSE
        v_uid := gen_random_uuid();
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data,
          created_at, updated_at, confirmation_token, recovery_token,
          email_change_token_new, email_change
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
          lower(demo.email), now(),
          jsonb_build_object('provider','email','providers',array['email']),
          jsonb_build_object('signup_kind','professional','full_name',demo.full_name),
          now(), now(), '', '', '', ''
        );
      END IF;

      -- Profile (handle_new_user trigger creates the row on auth.users insert)
      UPDATE public.profiles
      SET full_name = demo.full_name,
          avatar_url = demo.avatar,
          updated_at = now()
      WHERE id = v_uid;

      -- Professional (also created by handle_new_user)
      UPDATE public.professionals
      SET slug = demo.slug,
          headline = demo.headline,
          bio = demo.bio,
          city = demo.city,
          country = 'United Kingdom',
          primary_profession = demo.profession,
          specialisms = demo.specs,
          identity_status = 'approved',
          verification = 'verified',
          in_person_available = true,
          online_available = true,
          is_published = true,
          bd_seed_thin = false,
          updated_at = now()
      WHERE id = v_uid;

      -- Primary location
      DELETE FROM public.professional_locations WHERE professional_id = v_uid AND is_primary;
      INSERT INTO public.professional_locations (
        professional_id, label, type, town, country_code,
        latitude, longitude, is_primary, is_public
      ) VALUES (
        v_uid, 'Primary', 'primary', demo.city, demo.country_code,
        demo.lat, demo.lon, true, true
      );

      -- Pro-tier subscription (active)
      INSERT INTO public.subscriptions (user_id, tier, status)
      VALUES (v_uid, 'pro'::subscription_tier, 'active'::subscription_status)
      ON CONFLICT DO NOTHING;

      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'demo seed % failed: %', demo.email, SQLERRM;
    END;
  END LOOP;
  RETURN v_count;
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_seed_demo_pros() FROM PUBLIC, anon, authenticated;
