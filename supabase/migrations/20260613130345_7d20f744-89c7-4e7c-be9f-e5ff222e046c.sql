
CREATE TABLE public.insurance_upload_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploaded', 'consumed', 'expired')),
  doc_path TEXT,
  filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes')
);

CREATE INDEX idx_ins_upload_sess_pro ON public.insurance_upload_sessions(professional_id);
CREATE INDEX idx_ins_upload_sess_exp ON public.insurance_upload_sessions(expires_at);

GRANT SELECT, INSERT, UPDATE ON public.insurance_upload_sessions TO authenticated;
GRANT ALL ON public.insurance_upload_sessions TO service_role;

ALTER TABLE public.insurance_upload_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ins_upload_sess_owner_read"
  ON public.insurance_upload_sessions FOR SELECT
  TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "ins_upload_sess_owner_insert"
  ON public.insurance_upload_sessions FOR INSERT
  TO authenticated
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "ins_upload_sess_owner_update"
  ON public.insurance_upload_sessions FOR UPDATE
  TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

CREATE TRIGGER trg_ins_upload_sess_updated_at
  BEFORE UPDATE ON public.insurance_upload_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
