-- 1. Regulated qualifications catalogue
CREATE TABLE public.qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  level int,
  awarding_body_slug text NOT NULL,
  ofqual_ref text,
  title_slug text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (title, level, awarding_body_slug)
);
CREATE INDEX idx_qualifications_body ON public.qualifications(awarding_body_slug) WHERE is_active;
CREATE INDEX idx_qualifications_ofqual ON public.qualifications(ofqual_ref) WHERE ofqual_ref IS NOT NULL;

GRANT SELECT ON public.qualifications TO anon, authenticated;
GRANT ALL ON public.qualifications TO service_role;

ALTER TABLE public.qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualifications are public read" ON public.qualifications
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage qualifications" ON public.qualifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Provider regulated permissions
CREATE TABLE public.provider_regulated_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  qualification_id uuid NOT NULL REFERENCES public.qualifications(id),
  evidence_type text NOT NULL CHECK (evidence_type IN ('eqa_report','centre_certificate','approval_letter')),
  evidence_doc_paths text[] NOT NULL DEFAULT '{}',
  awarding_body_reference text,
  ai_extraction jsonb,
  ai_verdict text CHECK (ai_verdict IN ('recommend_approve','flagged','inconclusive')),
  ai_red_flags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected','changes_requested')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  admin_note text,
  evidence_issued_at date,
  evidence_expires_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_provider_qual_active
  ON public.provider_regulated_permissions(provider_id, qualification_id)
  WHERE status <> 'rejected';
CREATE INDEX idx_prp_status ON public.provider_regulated_permissions(status);
CREATE INDEX idx_prp_provider ON public.provider_regulated_permissions(provider_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_regulated_permissions TO authenticated;
GRANT SELECT ON public.provider_regulated_permissions TO anon;
GRANT ALL ON public.provider_regulated_permissions TO service_role;

ALTER TABLE public.provider_regulated_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved regulated permissions are public" ON public.provider_regulated_permissions
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');
CREATE POLICY "Providers read own regulated permissions" ON public.provider_regulated_permissions
  FOR SELECT TO authenticated
  USING (provider_id = auth.uid());
CREATE POLICY "Providers submit own regulated permissions" ON public.provider_regulated_permissions
  FOR INSERT TO authenticated
  WITH CHECK (provider_id = auth.uid() AND status = 'submitted');
CREATE POLICY "Providers update own submitted regulated permissions" ON public.provider_regulated_permissions
  FOR UPDATE TO authenticated
  USING (provider_id = auth.uid() AND status IN ('submitted','changes_requested'))
  WITH CHECK (provider_id = auth.uid());
CREATE POLICY "Providers delete own submitted regulated permissions" ON public.provider_regulated_permissions
  FOR DELETE TO authenticated
  USING (provider_id = auth.uid() AND status = 'submitted');
CREATE POLICY "Admins manage regulated permissions" ON public.provider_regulated_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. CPD courses
CREATE SEQUENCE public.reps_cpd_number_seq START 1;

CREATE TABLE public.cpd_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  title text NOT NULL,
  level int,
  hours numeric(6,2),
  delivery_mode text CHECK (delivery_mode IN ('in_person','online','blended')),
  summary text,
  syllabus_doc_path text,
  assessment_criteria_doc_path text,
  tutor_cv_doc_path text,
  ai_extraction jsonb,
  ai_verdict text CHECK (ai_verdict IN ('recommend_approve','flagged','inconclusive')),
  ai_red_flags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected','changes_requested')),
  reps_cpd_number text UNIQUE,
  accredited_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cpd_provider ON public.cpd_courses(provider_id);
CREATE INDEX idx_cpd_status ON public.cpd_courses(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cpd_courses TO authenticated;
GRANT SELECT ON public.cpd_courses TO anon;
GRANT ALL ON public.cpd_courses TO service_role;

ALTER TABLE public.cpd_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved CPD courses are public" ON public.cpd_courses
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');
CREATE POLICY "Providers read own CPD courses" ON public.cpd_courses
  FOR SELECT TO authenticated
  USING (provider_id = auth.uid());
CREATE POLICY "Providers submit own CPD courses" ON public.cpd_courses
  FOR INSERT TO authenticated
  WITH CHECK (provider_id = auth.uid() AND status = 'submitted');
CREATE POLICY "Providers update own submitted CPD courses" ON public.cpd_courses
  FOR UPDATE TO authenticated
  USING (provider_id = auth.uid() AND status IN ('submitted','changes_requested'))
  WITH CHECK (provider_id = auth.uid());
CREATE POLICY "Providers delete own submitted CPD courses" ON public.cpd_courses
  FOR DELETE TO authenticated
  USING (provider_id = auth.uid() AND status = 'submitted');
CREATE POLICY "Admins manage CPD courses" ON public.cpd_courses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Assign CPD number on first approval
CREATE OR REPLACE FUNCTION public.assign_reps_cpd_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') AND NEW.reps_cpd_number IS NULL THEN
    NEW.reps_cpd_number := 'REPS-CPD-' || lpad(nextval('public.reps_cpd_number_seq')::text, 6, '0');
    NEW.accredited_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_cpd_assign_number
  BEFORE UPDATE ON public.cpd_courses
  FOR EACH ROW EXECUTE FUNCTION public.assign_reps_cpd_number();

-- 4. Member ID on professionals
CREATE SEQUENCE public.reps_member_id_seq START 1;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS reps_member_id text UNIQUE;

CREATE OR REPLACE FUNCTION public.assign_reps_member_id(_professional_id uuid)
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE new_id text; existing text;
BEGIN
  SELECT reps_member_id INTO existing FROM public.professionals WHERE id = _professional_id;
  IF existing IS NOT NULL THEN RETURN existing; END IF;
  new_id := 'REPS-' || lpad(nextval('public.reps_member_id_seq')::text, 6, '0');
  UPDATE public.professionals SET reps_member_id = new_id WHERE id = _professional_id AND reps_member_id IS NULL;
  SELECT reps_member_id INTO existing FROM public.professionals WHERE id = _professional_id;
  RETURN existing;
END;
$$;
GRANT EXECUTE ON FUNCTION public.assign_reps_member_id(uuid) TO service_role;

-- Trigger: on first approved regulated permission or CPD course, assign member ID
CREATE OR REPLACE FUNCTION public.assign_member_id_on_approval()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    PERFORM public.assign_reps_member_id(NEW.provider_id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_prp_assign_member_id
  AFTER UPDATE ON public.provider_regulated_permissions
  FOR EACH ROW EXECUTE FUNCTION public.assign_member_id_on_approval();
CREATE TRIGGER trg_cpd_assign_member_id
  AFTER UPDATE ON public.cpd_courses
  FOR EACH ROW EXECUTE FUNCTION public.assign_member_id_on_approval();

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at_col()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_qual_updated BEFORE UPDATE ON public.qualifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_col();
CREATE TRIGGER trg_prp_updated BEFORE UPDATE ON public.provider_regulated_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_col();

-- 5. Seed regulated qualifications catalogue (~30 common)
INSERT INTO public.qualifications (title, level, awarding_body_slug) VALUES
  ('Certificate in Gym Instructing', 2, 'active-iq'),
  ('Certificate in Fitness Instructing', 2, 'active-iq'),
  ('Diploma in Personal Training', 3, 'active-iq'),
  ('Diploma in Instructing Exercise and Fitness', 3, 'active-iq'),
  ('Certificate in Instructing Group Cycling Sessions', 2, 'active-iq'),
  ('Certificate in Teaching Group Exercise', 2, 'active-iq'),
  ('Diploma in Exercise Referral', 3, 'active-iq'),
  ('Diploma in Strength and Conditioning', 4, 'active-iq'),
  ('Certificate in Yoga Teaching', 3, 'active-iq'),
  ('Certificate in Pilates Matwork Instruction', 3, 'active-iq'),
  ('Diploma in Sport and Exercise Nutrition', 4, 'active-iq'),
  ('Diploma in Pre and Postnatal Exercise', 4, 'active-iq'),
  ('Diploma in Physical Activity for Older Adults', 4, 'active-iq'),
  ('Diploma in Personal Training', 3, 'focus-awards'),
  ('Certificate in Gym Instructing', 2, 'focus-awards'),
  ('Diploma in Instructing Exercise and Fitness', 3, 'focus-awards'),
  ('Diploma in Exercise Referral', 3, 'focus-awards'),
  ('Diploma in Personal Training', 3, 'ymca-awards'),
  ('Certificate in Gym Instructing', 2, 'ymca-awards'),
  ('Diploma in Advanced Personal Training', 4, 'ymca-awards'),
  ('Diploma in Personal Training', 3, 'ncfe'),
  ('Certificate in Gym Instructing', 2, 'ncfe'),
  ('Diploma in Personal Training', 3, 'vtct'),
  ('Certificate in Fitness Instructing', 2, 'vtct'),
  ('Diploma in Personal Training', 3, 'innovate-awarding'),
  ('Certificate in Gym Instructing', 2, 'innovate-awarding'),
  ('Diploma in Personal Training', 3, 'tquk'),
  ('Certificate in Personal Training', 3, '1st4sport'),
  ('Certificate in Coaching Weightlifting', 2, '1st4sport')
ON CONFLICT (title, level, awarding_body_slug) DO NOTHING;