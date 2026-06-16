
-- 1) noindex flag for thin migrated profiles
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS bd_seed_thin boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS professionals_bd_seed_thin_idx
  ON public.professionals(bd_seed_thin) WHERE bd_seed_thin = true;

-- 2) Extend bd_migration status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid
    WHERE t.typname='bd_migration_status' AND e.enumlabel='seeded'
  ) THEN
    ALTER TYPE public.bd_migration_status ADD VALUE 'seeded';
  END IF;
END $$;

-- 3) Slug helper (unique)
CREATE OR REPLACE FUNCTION public.slugify_unique(_base text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_root text;
  v_slug text;
  v_i int := 1;
BEGIN
  v_root := lower(regexp_replace(coalesce(_base,''), '[^a-zA-Z0-9]+', '-', 'g'));
  v_root := regexp_replace(v_root, '(^-+|-+$)', '', 'g');
  IF v_root = '' THEN v_root := 'pro'; END IF;
  v_slug := v_root;
  WHILE EXISTS (SELECT 1 FROM public.professionals WHERE slug = v_slug) LOOP
    v_i := v_i + 1;
    v_slug := v_root || '-' || v_i::text;
  END LOOP;
  RETURN v_slug;
END;
$$;

-- 4) Auto-clear bd_seed_thin when profile gets real content
CREATE OR REPLACE FUNCTION public.tg_clear_bd_seed_thin()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_has_avatar boolean;
BEGIN
  IF NEW.bd_seed_thin = false THEN RETURN NEW; END IF;
  SELECT avatar_url IS NOT NULL INTO v_has_avatar FROM public.profiles WHERE id = NEW.id;
  IF (NEW.bio IS NOT NULL AND length(trim(NEW.bio)) > 0)
     OR (NEW.headline IS NOT NULL AND length(trim(NEW.headline)) > 0)
     OR NEW.identity_status = 'approved'
     OR coalesce(v_has_avatar, false) THEN
    NEW.bd_seed_thin := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS professionals_clear_seed_thin ON public.professionals;
CREATE TRIGGER professionals_clear_seed_thin
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_clear_bd_seed_thin();

-- 5) Main seeding RPC: fills in a professional shell from bd_member_seed
-- The auth.users + handle_new_user trigger have already created profiles + professionals shells.
CREATE OR REPLACE FUNCTION public.seed_bd_member_into_directory(
  _bd_member_id bigint,
  _user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Avatar: only if BD photo was approved
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

  -- profiles (created by handle_new_user trigger — enrich)
  UPDATE public.profiles
  SET full_name  = v_full_name,
      avatar_url = COALESCE(v_avatar_url, avatar_url),
      updated_at = now()
  WHERE id = _user_id;

  -- professionals (shell created by handle_new_user — fill it out)
  UPDATE public.professionals
  SET slug                = COALESCE(slug, v_slug),
      bio                 = v_bio,
      headline            = v_headline,
      city                = NULLIF(trim(coalesce(r.city,'')), ''),
      country             = v_country,
      public_email        = r.email::text,
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

  -- Primary location (if we have city OR coords)
  IF r.city IS NOT NULL OR r.lat IS NOT NULL THEN
    INSERT INTO public.professional_locations (
      professional_id, label, type, postcode, town, country_code,
      latitude, longitude, is_primary, is_public
    ) VALUES (
      _user_id,
      'Primary',
      'in_person',
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

  -- Tracking row
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

  -- Update seed claim status
  UPDATE public.bd_member_seed
  SET claim_status   = 'claimed',
      claimed_user_id = _user_id,
      updated_at     = now()
  WHERE bd_member_id = _bd_member_id;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_bd_member_into_directory(bigint, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_bd_member_into_directory(bigint, uuid) TO service_role;
