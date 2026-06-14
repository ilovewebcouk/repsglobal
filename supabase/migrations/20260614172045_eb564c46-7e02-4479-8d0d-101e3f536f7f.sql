
-- Enums
DO $$ BEGIN
  CREATE TYPE public.bd_member_photo_status AS ENUM ('pending','ok','rejected','missing','fetch_error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bd_member_claim_status AS ENUM ('staged','invited','claimed','skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table
CREATE TABLE public.bd_member_seed (
  bd_member_id        bigint PRIMARY KEY,
  email               citext NOT NULL,
  first_name          text,
  last_name           text,
  phone_raw           text,

  address1            text,
  address2            text,
  city                text,
  zip_code            text,
  country_ln          text,
  lat                 double precision,
  lon                 double precision,
  service_areas       text,

  about_me            text,
  quote               text,
  credentials         text,
  services_text       text,
  experience          text,
  years_active        text,

  website             text,
  instagram           text,
  linkedin            text,
  youtube             text,
  tiktok              text,
  twitter             text,

  profile_photo_src              text,
  profile_photo_status           public.bd_member_photo_status NOT NULL DEFAULT 'pending',
  profile_photo_reject_category  text,
  profile_photo_reject_reason    text,
  profile_photo_storage_path     text,

  legacy_plan             text,
  legacy_billing_period   text,
  legacy_signup_at        timestamptz,
  legacy_last_login_at    timestamptz,

  claim_status        public.bd_member_claim_status NOT NULL DEFAULT 'staged',
  claimed_user_id     uuid,
  notes               text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX bd_member_seed_email_key ON public.bd_member_seed (email);
CREATE INDEX bd_member_seed_photo_status_idx ON public.bd_member_seed (profile_photo_status);
CREATE INDEX bd_member_seed_claim_status_idx ON public.bd_member_seed (claim_status);

-- Grants
GRANT SELECT ON public.bd_member_seed TO authenticated;
GRANT ALL ON public.bd_member_seed TO service_role;

-- RLS
ALTER TABLE public.bd_member_seed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bd_member_seed"
  ON public.bd_member_seed FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger (reuse existing tg_set_updated_at)
CREATE TRIGGER bd_member_seed_set_updated_at
  BEFORE UPDATE ON public.bd_member_seed
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
