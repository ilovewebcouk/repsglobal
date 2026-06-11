-- 1. verification_submissions table
CREATE TYPE public.verification_submission_status AS ENUM ('submitted','approved','rejected','changes_requested');

CREATE TABLE public.verification_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  awarding_body TEXT NOT NULL,
  qualification TEXT NOT NULL,
  year INTEGER,
  doc_paths TEXT[] NOT NULL DEFAULT '{}',
  status public.verification_submission_status NOT NULL DEFAULT 'submitted',
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_submissions_professional ON public.verification_submissions(professional_id);
CREATE INDEX idx_verification_submissions_status ON public.verification_submissions(status);

GRANT SELECT, INSERT, UPDATE ON public.verification_submissions TO authenticated;
GRANT ALL ON public.verification_submissions TO service_role;

ALTER TABLE public.verification_submissions ENABLE ROW LEVEL SECURITY;

-- Professional reads own
CREATE POLICY "Pros read own submissions"
  ON public.verification_submissions FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

-- Professional inserts own
CREATE POLICY "Pros insert own submissions"
  ON public.verification_submissions FOR INSERT TO authenticated
  WITH CHECK (professional_id = auth.uid());

-- Admin reads all
CREATE POLICY "Admins read all submissions"
  ON public.verification_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin updates all
CREATE POLICY "Admins update all submissions"
  ON public.verification_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_verification_submissions_updated_at
  BEFORE UPDATE ON public.verification_submissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2. Seed admin role for pros@repsuk.org (safe if user not yet created)
DO $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'pros@repsuk.org' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;