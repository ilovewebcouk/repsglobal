
CREATE TABLE IF NOT EXISTS public.feature_flags (
  flag_key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO authenticated, anon;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ff_public_read ON public.feature_flags;
CREATE POLICY ff_public_read ON public.feature_flags FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS ff_admin_write ON public.feature_flags;
CREATE POLICY ff_admin_write ON public.feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.feature_flags (flag_key, enabled, description) VALUES
  ('verification.identity_status_fix',   true,  '0a — identity_status approved (vs verified)'),
  ('verification.three_names_model',     true,  '0b — display_name / business_name / locked legal'),
  ('verification.hard_soft_gates',       true,  '0c — gates engine + adaptive action bar'),
  ('verification.ocr_verify_links',      true,  '0d — OCR holder name + awarding-body verify links'),
  ('verification.observability',         true,  '0e — full timestamps + queue views'),
  ('directory.search_v1',                false, 'A — /find-a-professional live search'),
  ('shopfront.lite_seed',                false, 'B — Verified Lite shop-front seed'),
  ('shopfront.full_editor',              false, 'B — Pro shop-front editor'),
  ('enquiries.public_submit',            false, 'D — anonymous enquiry submit'),
  ('reviews.collect_v1',                 false, 'E — collect + display reviews'),
  ('programmes.waitlist',                false, 'G — 2.2 programme generator waitlist')
ON CONFLICT (flag_key) DO NOTHING;

CREATE OR REPLACE VIEW public.v_identity_review_queue
WITH (security_invoker = on) AS
SELECT
  p.id AS professional_id,
  pr.full_name,
  pr.display_name,
  p.identity_status,
  p.identity_verified_name,
  p.identity_verified_at,
  id_doc.created_at AS submitted_at,
  id_doc.id AS document_id,
  (SELECT count(*) FROM public.identity_documents d2
     WHERE d2.professional_id = p.id) AS submission_count
FROM public.professionals p
LEFT JOIN public.profiles pr ON pr.id = p.id
LEFT JOIN LATERAL (
  SELECT d.id, d.created_at
  FROM public.identity_documents d
  WHERE d.professional_id = p.id
  ORDER BY d.created_at DESC
  LIMIT 1
) id_doc ON true
WHERE p.identity_status IN ('pending','needs_more_info','rejected');
GRANT SELECT ON public.v_identity_review_queue TO authenticated;

CREATE OR REPLACE VIEW public.v_qualifications_review_queue
WITH (security_invoker = on) AS
SELECT
  vs.id AS submission_id,
  vs.professional_id,
  pr.full_name,
  pr.display_name,
  vs.awarding_body,
  vs.awarding_body_slug,
  vs.qualification,
  vs.qualification_number,
  vs.certificate_number,
  vs.holder_name,
  vs.year,
  vs.expiry_date,
  vs.status,
  vs.created_at AS submitted_at,
  vs.reviewed_at,
  vs.claimed_by,
  vs.claimed_at,
  vs.duplicate_of,
  (SELECT count(*) FROM public.verification_submissions vs2
     WHERE vs2.professional_id = vs.professional_id) AS resubmission_count
FROM public.verification_submissions vs
LEFT JOIN public.profiles pr ON pr.id = vs.professional_id
WHERE vs.status IN ('submitted','changes_requested','rejected');
GRANT SELECT ON public.v_qualifications_review_queue TO authenticated;

CREATE INDEX IF NOT EXISTS idx_identity_documents_pro_created
  ON public.identity_documents (professional_id, created_at DESC);
