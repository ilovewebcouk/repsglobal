ALTER TABLE public.verification_submissions
  DROP CONSTRAINT IF EXISTS verification_submissions_claimed_by_fkey,
  ADD CONSTRAINT verification_submissions_claimed_by_fkey
    FOREIGN KEY (claimed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.identity_documents
  DROP CONSTRAINT IF EXISTS identity_documents_reviewed_by_fkey,
  ADD CONSTRAINT identity_documents_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.insurance_policies
  DROP CONSTRAINT IF EXISTS insurance_policies_reviewed_by_fkey,
  ADD CONSTRAINT insurance_policies_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.verification_decisions
  DROP CONSTRAINT IF EXISTS verification_decisions_reviewer_id_fkey,
  ADD CONSTRAINT verification_decisions_reviewer_id_fkey
    FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE SET NULL;