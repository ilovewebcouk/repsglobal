
-- 1. Drop the old table (blank canvas — no data to preserve)
DROP TABLE IF EXISTS public.cpd_courses CASCADE;

-- 2. Global REPS qualification-number sequence + formatter
CREATE SEQUENCE IF NOT EXISTS public.reps_qual_number_seq START 1;
GRANT USAGE ON SEQUENCE public.reps_qual_number_seq TO service_role;

CREATE OR REPLACE FUNCTION public.next_reps_qual_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'REPS-QUAL-' || lpad(nextval('public.reps_qual_number_seq')::text, 6, '0');
$$;

-- 3. New reps_courses table
CREATE TABLE public.reps_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,

  -- Provider submission (proposal only — never appears on the public profile)
  proposed_title text NOT NULL,
  syllabus_doc_path text NOT NULL,
  assessment_criteria_doc_path text NOT NULL,
  tutor_cv_doc_path text NOT NULL,

  -- AI-drafted spec (audit trail + starting point for admin editing)
  ai_draft jsonb,
  ai_verdict text CHECK (ai_verdict IN ('recommend_approve','flagged','inconclusive')),
  ai_red_flags text[] NOT NULL DEFAULT '{}',
  ai_drafted_at timestamptz,

  -- Admin-approved official spec (source of truth once published)
  official_title text,
  official_level int CHECK (official_level BETWEEN 1 AND 7),
  reps_qual_number text UNIQUE,
  spec_who_for text,
  spec_learning_outcomes jsonb,           -- string[]
  spec_how_youll_study text,
  spec_how_youre_assessed text,
  spec_prerequisites text,
  spec_guided_learning_hours numeric(6,2),
  spec_total_qualification_time numeric(6,2),
  spec_delivery_mode text CHECK (spec_delivery_mode IN ('in_person','online','blended')),
  spec_published_at timestamptz,

  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','ai_drafted','changes_requested','approved','rejected','withdrawn')),
  accredited_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  admin_note text,
  withdrawn_at timestamptz,
  withdrawn_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reps_courses_provider ON public.reps_courses(provider_id);
CREATE INDEX idx_reps_courses_status ON public.reps_courses(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reps_courses TO authenticated;
GRANT SELECT ON public.reps_courses TO anon;
GRANT ALL ON public.reps_courses TO service_role;

ALTER TABLE public.reps_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved REPS courses are public"
  ON public.reps_courses FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Providers read own REPS courses"
  ON public.reps_courses FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

CREATE POLICY "Providers submit own REPS courses"
  ON public.reps_courses FOR INSERT
  TO authenticated
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers update own pending REPS courses"
  ON public.reps_courses FOR UPDATE
  TO authenticated
  USING (provider_id = auth.uid() AND status IN ('submitted','ai_drafted','changes_requested','approved'))
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers delete own draft REPS courses"
  ON public.reps_courses FOR DELETE
  TO authenticated
  USING (provider_id = auth.uid() AND status IN ('submitted','ai_drafted','changes_requested','rejected'));

CREATE POLICY "Admins manage all REPS courses"
  ON public.reps_courses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Validation + auto-allocation trigger:
--   * On transition to 'approved', require the official spec to be complete
--     and allocate a REPS number if one hasn't been set yet.
--   * On transition to 'ai_drafted', stamp ai_drafted_at.
--   * Always bump updated_at.
CREATE OR REPLACE FUNCTION public.reps_courses_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();

  IF NEW.status = 'ai_drafted' AND (OLD IS NULL OR OLD.status <> 'ai_drafted') THEN
    IF NEW.ai_drafted_at IS NULL THEN NEW.ai_drafted_at := now(); END IF;
  END IF;

  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status <> 'approved') THEN
    IF NEW.official_title IS NULL OR btrim(NEW.official_title) = '' THEN
      RAISE EXCEPTION 'Cannot approve: official_title is required';
    END IF;
    IF NEW.official_level IS NULL THEN
      RAISE EXCEPTION 'Cannot approve: official_level is required';
    END IF;
    IF NEW.spec_who_for IS NULL OR btrim(NEW.spec_who_for) = '' THEN
      RAISE EXCEPTION 'Cannot approve: spec_who_for is required';
    END IF;
    IF NEW.spec_learning_outcomes IS NULL
       OR jsonb_typeof(NEW.spec_learning_outcomes) <> 'array'
       OR jsonb_array_length(NEW.spec_learning_outcomes) = 0 THEN
      RAISE EXCEPTION 'Cannot approve: spec_learning_outcomes must be a non-empty list';
    END IF;
    IF NEW.spec_how_youll_study IS NULL OR btrim(NEW.spec_how_youll_study) = '' THEN
      RAISE EXCEPTION 'Cannot approve: spec_how_youll_study is required';
    END IF;
    IF NEW.spec_how_youre_assessed IS NULL OR btrim(NEW.spec_how_youre_assessed) = '' THEN
      RAISE EXCEPTION 'Cannot approve: spec_how_youre_assessed is required';
    END IF;

    IF NEW.reps_qual_number IS NULL THEN
      NEW.reps_qual_number := public.next_reps_qual_number();
    END IF;
    IF NEW.spec_published_at IS NULL THEN
      NEW.spec_published_at := now();
    END IF;
    IF NEW.accredited_at IS NULL THEN
      NEW.accredited_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reps_courses_before_write
  BEFORE INSERT OR UPDATE ON public.reps_courses
  FOR EACH ROW EXECUTE FUNCTION public.reps_courses_before_write();

-- 5. Parallel spec fields on provider_regulated_permissions so
--    regulated qualifications carry the same public description as
--    REPS-accredited courses.
ALTER TABLE public.provider_regulated_permissions
  ADD COLUMN IF NOT EXISTS spec_who_for text,
  ADD COLUMN IF NOT EXISTS spec_learning_outcomes jsonb,
  ADD COLUMN IF NOT EXISTS spec_how_youll_study text,
  ADD COLUMN IF NOT EXISTS spec_how_youre_assessed text,
  ADD COLUMN IF NOT EXISTS spec_prerequisites text,
  ADD COLUMN IF NOT EXISTS spec_guided_learning_hours numeric(6,2),
  ADD COLUMN IF NOT EXISTS spec_total_qualification_time numeric(6,2),
  ADD COLUMN IF NOT EXISTS spec_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_draft jsonb,
  ADD COLUMN IF NOT EXISTS ai_drafted_at timestamptz;
