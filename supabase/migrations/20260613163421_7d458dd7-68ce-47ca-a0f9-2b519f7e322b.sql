
-- 1. gyms
CREATE TABLE public.gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  chain_slug text,
  chain_name text,
  area text,
  city text,
  postcode text,
  lat double precision,
  lng double precision,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('active','pending_review','rejected')),
  claim_status text NOT NULL DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed','pending','verified')),
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  logo_url text,
  hero_url text,
  tagline text,
  facilities text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gyms_status_idx ON public.gyms(status);
CREATE INDEX gyms_city_idx ON public.gyms(city) WHERE status = 'active';
CREATE INDEX gyms_chain_idx ON public.gyms(chain_slug) WHERE status = 'active';
CREATE INDEX gyms_name_lower_idx ON public.gyms (lower(name));
CREATE INDEX gyms_area_lower_idx ON public.gyms (lower(area));

GRANT SELECT ON public.gyms TO anon;
GRANT SELECT, INSERT ON public.gyms TO authenticated;
GRANT ALL ON public.gyms TO service_role;

ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active gyms"
  ON public.gyms FOR SELECT
  USING (status = 'active');

CREATE POLICY "Owners can read their own submissions"
  ON public.gyms FOR SELECT
  USING (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Admins can read all gyms"
  ON public.gyms FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can submit gyms"
  ON public.gyms FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND status = 'pending_review'
    AND claim_status = 'unclaimed'
  );

CREATE POLICY "Admins can update gyms"
  ON public.gyms FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete gyms"
  ON public.gyms FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER gyms_set_updated_at
  BEFORE UPDATE ON public.gyms
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Anti-spam throttle: max 2 pending submissions per pro, soft 1/hour
CREATE OR REPLACE FUNCTION public.gyms_throttle_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending int;
  v_recent int;
BEGIN
  IF NEW.created_by IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(NEW.created_by, 'admin') THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO v_pending
    FROM public.gyms
    WHERE created_by = NEW.created_by AND status = 'pending_review';
  IF v_pending >= 2 THEN
    RAISE EXCEPTION 'You already have 2 gym submissions awaiting review. Please wait for them to be reviewed before adding more.'
      USING ERRCODE = 'check_violation';
  END IF;
  SELECT count(*) INTO v_recent
    FROM public.gyms
    WHERE created_by = NEW.created_by AND created_at > (now() - interval '1 hour');
  IF v_recent >= 1 THEN
    RAISE EXCEPTION 'You can only submit one new gym per hour. Please try again shortly.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER gyms_throttle_submission_trg
  BEFORE INSERT ON public.gyms
  FOR EACH ROW EXECUTE FUNCTION public.gyms_throttle_submission();

-- 2. professional_gyms (link table)
CREATE TABLE public.professional_gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  position smallint NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 2),
  verified_by_gym boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, gym_id),
  UNIQUE (professional_id, position)
);

CREATE INDEX professional_gyms_gym_idx ON public.professional_gyms(gym_id);
CREATE INDEX professional_gyms_pro_idx ON public.professional_gyms(professional_id);

GRANT SELECT ON public.professional_gyms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_gyms TO authenticated;
GRANT ALL ON public.professional_gyms TO service_role;

ALTER TABLE public.professional_gyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pro-gym links"
  ON public.professional_gyms FOR SELECT
  USING (true);

CREATE POLICY "Pros insert own gym links"
  ON public.professional_gyms FOR INSERT
  WITH CHECK (auth.uid() = professional_id AND verified_by_gym = false);

CREATE POLICY "Pros update own gym links"
  ON public.professional_gyms FOR UPDATE
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id AND verified_by_gym = false);

CREATE POLICY "Pros delete own gym links"
  ON public.professional_gyms FOR DELETE
  USING (auth.uid() = professional_id);

CREATE POLICY "Admins manage all pro-gym links"
  ON public.professional_gyms FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enforce max 3 gyms per pro
CREATE OR REPLACE FUNCTION public.professional_gyms_max_three()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count
    FROM public.professional_gyms
    WHERE professional_id = NEW.professional_id;
  IF v_count >= 3 THEN
    RAISE EXCEPTION 'You can list up to 3 gyms.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER professional_gyms_max_three_trg
  BEFORE INSERT ON public.professional_gyms
  FOR EACH ROW EXECUTE FUNCTION public.professional_gyms_max_three();
