CREATE TABLE public.certificate_upload_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','uploaded','consumed','expired')),
  doc_path text,
  filename text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
);

CREATE INDEX idx_cert_upload_sess_pro ON public.certificate_upload_sessions(professional_id);
CREATE INDEX idx_cert_upload_sess_exp ON public.certificate_upload_sessions(expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_upload_sessions TO authenticated;
GRANT ALL ON public.certificate_upload_sessions TO service_role;

ALTER TABLE public.certificate_upload_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cert_upload_sess_owner_insert" ON public.certificate_upload_sessions
  FOR INSERT TO authenticated
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "cert_upload_sess_owner_read" ON public.certificate_upload_sessions
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "cert_upload_sess_owner_update" ON public.certificate_upload_sessions
  FOR UPDATE TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

CREATE TRIGGER trg_cert_upload_sess_updated_at
  BEFORE UPDATE ON public.certificate_upload_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();