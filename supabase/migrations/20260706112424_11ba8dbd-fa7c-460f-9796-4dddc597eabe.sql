
-- Phase 1: Training Provider Membership

-- ==========================================================================
-- 1. Enum types
-- ==========================================================================
CREATE TYPE public.organisation_status AS ENUM ('draft','active','suspended','cancelled');
CREATE TYPE public.organisation_user_role AS ENUM ('owner','manager');
CREATE TYPE public.course_status AS ENUM ('pending','accredited','rejected','expired');
CREATE TYPE public.course_delivery_mode AS ENUM ('in-person','online','hybrid');
CREATE TYPE public.provider_review_source AS ENUM ('open','verified');
CREATE TYPE public.provider_review_status AS ENUM ('pending_email','published','flagged','evidence_requested','removed');
CREATE TYPE public.subscription_owner_type AS ENUM ('user','organisation');

-- Extend subscription_tier with training_provider
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'training_provider';

-- ==========================================================================
-- 2. subscriptions: add owner_type / owner_id and backfill
-- ==========================================================================
ALTER TABLE public.subscriptions
  ADD COLUMN owner_type public.subscription_owner_type NOT NULL DEFAULT 'user',
  ADD COLUMN owner_id uuid;

UPDATE public.subscriptions SET owner_id = user_id WHERE owner_id IS NULL;

CREATE INDEX idx_subscriptions_owner ON public.subscriptions (owner_type, owner_id);

-- ==========================================================================
-- 3. organisations
-- ==========================================================================
CREATE TABLE public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  legal_name text,
  companies_house_number text,
  website_url text,
  logo_url text,
  cover_url text,
  about_md text,
  city text,
  country text,
  contact_email text,
  contact_phone text,
  status public.organisation_status NOT NULL DEFAULT 'draft',
  stripe_customer_id text UNIQUE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  membership_number text UNIQUE,
  published_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_organisations_status ON public.organisations (status);
CREATE INDEX idx_organisations_stripe_customer ON public.organisations (stripe_customer_id);

GRANT SELECT ON public.organisations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organisations TO authenticated;
GRANT ALL ON public.organisations TO service_role;

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active organisations"
  ON public.organisations FOR SELECT TO anon, authenticated
  USING (status = 'active' AND published_at IS NOT NULL);

CREATE POLICY "Admins can manage organisations"
  ON public.organisations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==========================================================================
-- 4. organisation_users (link auth.users <-> organisations)
-- ==========================================================================
CREATE TABLE public.organisation_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.organisation_user_role NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, user_id)
);
CREATE INDEX idx_organisation_users_user ON public.organisation_users (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organisation_users TO authenticated;
GRANT ALL ON public.organisation_users TO service_role;

ALTER TABLE public.organisation_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organisation links"
  ON public.organisation_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage organisation users"
  ON public.organisation_users FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Helper: is the current user a member of a given org?
CREATE OR REPLACE FUNCTION public.is_organisation_member(_organisation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organisation_users
    WHERE organisation_id = _organisation_id AND user_id = _user_id
  )
$$;

-- ==========================================================================
-- 5. courses
-- ==========================================================================
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  description_md text,
  duration_hours numeric(6,2),
  delivery_mode public.course_delivery_mode,
  level text,
  price_from numeric(10,2),
  external_url text,
  reps_course_id text UNIQUE,
  status public.course_status NOT NULL DEFAULT 'pending',
  accredited_at timestamptz,
  accredited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, slug)
);
CREATE INDEX idx_courses_org ON public.courses (organisation_id);
CREATE INDEX idx_courses_status ON public.courses (status);

GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view accredited courses of active orgs"
  ON public.courses FOR SELECT TO anon, authenticated
  USING (
    status = 'accredited'
    AND EXISTS (
      SELECT 1 FROM public.organisations o
      WHERE o.id = organisation_id AND o.status = 'active' AND o.published_at IS NOT NULL
    )
  );

CREATE POLICY "Org members can view their own courses"
  ON public.courses FOR SELECT TO authenticated
  USING (public.is_organisation_member(organisation_id, auth.uid()));

CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sequence for REPS-C-XXXXXX ids
CREATE SEQUENCE public.reps_course_id_seq START 1000;

-- ==========================================================================
-- 6. course_accreditation_files
-- ==========================================================================
CREATE TABLE public.course_accreditation_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_kind text NOT NULL DEFAULT 'syllabus',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_course_files_course ON public.course_accreditation_files (course_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_accreditation_files TO authenticated;
GRANT ALL ON public.course_accreditation_files TO service_role;

ALTER TABLE public.course_accreditation_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage course files"
  ON public.course_accreditation_files FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members can view their course files"
  ON public.course_accreditation_files FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id AND public.is_organisation_member(c.organisation_id, auth.uid())
  ));

-- ==========================================================================
-- 7. provider_review_requests (invite tokens -> verified reviews)
-- ==========================================================================
CREATE TABLE public.provider_review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  student_email text NOT NULL,
  student_name text,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  token_hash text NOT NULL UNIQUE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  used_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_provider_review_requests_org ON public.provider_review_requests (organisation_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_review_requests TO authenticated;
GRANT ALL ON public.provider_review_requests TO service_role;

ALTER TABLE public.provider_review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage provider review requests"
  ON public.provider_review_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members can view their review requests"
  ON public.provider_review_requests FOR SELECT TO authenticated
  USING (public.is_organisation_member(organisation_id, auth.uid()));

-- ==========================================================================
-- 8. provider_reviews
-- ==========================================================================
CREATE TABLE public.provider_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  rating smallint NOT NULL,
  title text,
  body text NOT NULL,
  author_display_name text NOT NULL,
  author_email_hash text NOT NULL,
  author_ip_hash text,
  user_agent_hash text,
  asn text,
  verification_source public.provider_review_source NOT NULL DEFAULT 'open',
  status public.provider_review_status NOT NULL DEFAULT 'pending_email',
  email_verification_token_hash text UNIQUE,
  email_verified_at timestamptz,
  invite_request_id uuid REFERENCES public.provider_review_requests(id) ON DELETE SET NULL,
  flagged_at timestamptz,
  evidence_requested_at timestamptz,
  evidence_deadline_at timestamptz,
  removed_at timestamptz,
  removed_reason text,
  moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_reviews_rating_range CHECK (rating BETWEEN 1 AND 5)
);
CREATE INDEX idx_provider_reviews_org ON public.provider_reviews (organisation_id);
CREATE INDEX idx_provider_reviews_status ON public.provider_reviews (status);
CREATE INDEX idx_provider_reviews_email_hash ON public.provider_reviews (author_email_hash);

GRANT SELECT ON public.provider_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_reviews TO authenticated;
GRANT ALL ON public.provider_reviews TO service_role;

ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published or flagged reviews of active orgs"
  ON public.provider_reviews FOR SELECT TO anon, authenticated
  USING (
    status IN ('published','flagged','evidence_requested')
    AND EXISTS (
      SELECT 1 FROM public.organisations o
      WHERE o.id = organisation_id AND o.status = 'active' AND o.published_at IS NOT NULL
    )
  );

CREATE POLICY "Admins can manage provider reviews"
  ON public.provider_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members can view all their reviews"
  ON public.provider_reviews FOR SELECT TO authenticated
  USING (public.is_organisation_member(organisation_id, auth.uid()));

-- ==========================================================================
-- 9. provider_review_flags (audit trail)
-- ==========================================================================
CREATE TABLE public.provider_review_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.provider_reviews(id) ON DELETE CASCADE,
  flagged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_provider_review_flags_review ON public.provider_review_flags (review_id);

GRANT SELECT, INSERT ON public.provider_review_flags TO authenticated;
GRANT ALL ON public.provider_review_flags TO service_role;

ALTER TABLE public.provider_review_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage review flags"
  ON public.provider_review_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==========================================================================
-- 10. provider_review_evidence
-- ==========================================================================
CREATE TABLE public.provider_review_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.provider_reviews(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_provider_review_evidence_review ON public.provider_review_evidence (review_id);

GRANT SELECT, INSERT ON public.provider_review_evidence TO authenticated;
GRANT ALL ON public.provider_review_evidence TO service_role;

ALTER TABLE public.provider_review_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all evidence"
  ON public.provider_review_evidence FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================================================
-- 11. updated_at triggers
-- ==========================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SET search_path = public AS $body$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $body$;
  END IF;
END $$;

CREATE TRIGGER trg_organisations_updated_at BEFORE UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_organisation_users_updated_at BEFORE UPDATE ON public.organisation_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_course_files_updated_at BEFORE UPDATE ON public.course_accreditation_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_provider_review_requests_updated_at BEFORE UPDATE ON public.provider_review_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_provider_reviews_updated_at BEFORE UPDATE ON public.provider_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
