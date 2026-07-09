-- 1. Backfill full_name from business_name for provider accounts.
UPDATE public.profiles p
SET full_name = p.business_name, updated_at = now()
FROM public.professionals pr
WHERE pr.id = p.id
  AND pr.account_type = 'organisation'
  AND p.business_name IS NOT NULL
  AND p.business_name <> ''
  AND (p.full_name IS DISTINCT FROM p.business_name);

-- 2. Rebuild dependent views without display_name.
DROP VIEW IF EXISTS public.v_identity_review_queue;
CREATE VIEW public.v_identity_review_queue AS
SELECT p.id AS professional_id,
       pr.full_name,
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
 WHERE p.identity_status = ANY (ARRAY['pending','needs_more_info','rejected']);

DROP VIEW IF EXISTS public.v_qualifications_review_queue;
CREATE VIEW public.v_qualifications_review_queue AS
SELECT vs.id AS submission_id,
       vs.professional_id,
       pr.full_name,
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
 WHERE vs.status = ANY (ARRAY['submitted'::verification_submission_status,
                              'changes_requested'::verification_submission_status,
                              'rejected'::verification_submission_status]);

-- 3. Drop redundant columns.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS business_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_name;