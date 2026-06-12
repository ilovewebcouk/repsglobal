
ALTER TABLE public.verification_submissions
  ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_checklist jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_vs_claimed ON public.verification_submissions(claimed_by) WHERE claimed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vs_status_created ON public.verification_submissions(status, created_at);

CREATE TABLE IF NOT EXISTS public.identity_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('passport','driving_licence','national_id')),
  doc_country text,
  doc_path_front text NOT NULL,
  doc_path_back text,
  selfie_path text,
  selfie_match_score numeric,
  liveness_passed boolean,
  name_on_doc text,
  dob_on_doc date,
  doc_expiry date,
  file_sha256 text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.identity_documents TO authenticated;
GRANT ALL ON public.identity_documents TO service_role;
ALTER TABLE public.identity_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "id_own_select" ON public.identity_documents FOR SELECT TO authenticated
  USING (professional_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "id_own_insert" ON public.identity_documents FOR INSERT TO authenticated
  WITH CHECK (professional_id = auth.uid());
CREATE POLICY "id_own_update" ON public.identity_documents FOR UPDATE TO authenticated
  USING (professional_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (professional_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "id_admin_delete" ON public.identity_documents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_id_pro ON public.identity_documents(professional_id);
CREATE INDEX idx_id_status ON public.identity_documents(status);
CREATE TRIGGER trg_id_updated_at BEFORE UPDATE ON public.identity_documents
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  provider text NOT NULL,
  policy_number text,
  cover_amount_gbp integer,
  start_date date,
  expiry_date date NOT NULL,
  doc_path text NOT NULL,
  file_sha256 text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected','expired')),
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_policies TO authenticated;
GRANT ALL ON public.insurance_policies TO service_role;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ins_own_select" ON public.insurance_policies FOR SELECT TO authenticated
  USING (professional_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ins_own_insert" ON public.insurance_policies FOR INSERT TO authenticated
  WITH CHECK (professional_id = auth.uid());
CREATE POLICY "ins_own_update" ON public.insurance_policies FOR UPDATE TO authenticated
  USING (professional_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (professional_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ins_admin_delete" ON public.insurance_policies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_ins_pro ON public.insurance_policies(professional_id);
CREATE INDEX idx_ins_expiry ON public.insurance_policies(expiry_date);
CREATE TRIGGER trg_ins_updated_at BEFORE UPDATE ON public.insurance_policies
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.verification_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.verification_submissions(id) ON DELETE SET NULL,
  professional_id uuid NOT NULL,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  decision text NOT NULL CHECK (decision IN ('approved','rejected','changes_requested')),
  notes text,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  unlocked_tier text,
  unlocked_title_slug text,
  unlocked_specialisms text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.verification_decisions TO authenticated;
GRANT ALL ON public.verification_decisions TO service_role;
ALTER TABLE public.verification_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vd_admin_or_owner_select" ON public.verification_decisions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR professional_id = auth.uid());
CREATE POLICY "vd_admin_insert" ON public.verification_decisions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND reviewer_id = auth.uid());
CREATE INDEX idx_vd_pro ON public.verification_decisions(professional_id, created_at DESC);
CREATE INDEX idx_vd_reviewer ON public.verification_decisions(reviewer_id, created_at DESC);

CREATE POLICY "id_docs_own_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'identity-docs' AND ((auth.uid()::text = (storage.foldername(name))[1]) OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "id_docs_own_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "id_docs_own_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "id_docs_own_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ins_docs_own_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'insurance-docs' AND ((auth.uid()::text = (storage.foldername(name))[1]) OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "ins_docs_own_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'insurance-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ins_docs_own_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'insurance-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ins_docs_own_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'insurance-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
