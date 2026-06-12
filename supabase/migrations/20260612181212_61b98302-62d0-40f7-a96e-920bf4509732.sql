
ALTER TABLE public.identity_documents
  ADD COLUMN IF NOT EXISTS vendor text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS veriff_session_id text,
  ADD COLUMN IF NOT EXISTS veriff_session_url text,
  ADD COLUMN IF NOT EXISTS veriff_status text,
  ADD COLUMN IF NOT EXISTS veriff_decision jsonb,
  ADD COLUMN IF NOT EXISTS veriff_reason text;

ALTER TABLE public.identity_documents ALTER COLUMN doc_path_front DROP NOT NULL;
ALTER TABLE public.identity_documents ALTER COLUMN doc_type DROP NOT NULL;

ALTER TABLE public.identity_documents DROP CONSTRAINT IF EXISTS identity_documents_status_check;
ALTER TABLE public.identity_documents ADD CONSTRAINT identity_documents_status_check
  CHECK (status = ANY (ARRAY['pending'::text,'approved'::text,'rejected'::text,'needs_more_info'::text,'expired'::text,'submitted'::text]));

ALTER TABLE public.identity_documents DROP CONSTRAINT IF EXISTS identity_documents_doc_type_check;
ALTER TABLE public.identity_documents ADD CONSTRAINT identity_documents_doc_type_check
  CHECK (doc_type IS NULL OR doc_type = ANY (ARRAY['passport'::text,'driving_licence'::text,'national_id'::text]));

CREATE UNIQUE INDEX IF NOT EXISTS idx_id_veriff_session ON public.identity_documents (veriff_session_id) WHERE veriff_session_id IS NOT NULL;
