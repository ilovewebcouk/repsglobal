
-- Extend verification_submissions
ALTER TABLE public.verification_submissions
  ADD COLUMN IF NOT EXISTS awarding_body_slug TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS certificate_number TEXT,
  ADD COLUMN IF NOT EXISTS holder_name TEXT,
  ADD COLUMN IF NOT EXISTS file_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS ai_extraction JSONB,
  ADD COLUMN IF NOT EXISTS verify_token TEXT,
  ADD COLUMN IF NOT EXISTS name_match BOOLEAN,
  ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES public.verification_submissions(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS verification_submissions_verify_token_key
  ON public.verification_submissions(verify_token)
  WHERE verify_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS verification_submissions_file_sha256_idx
  ON public.verification_submissions(file_sha256)
  WHERE file_sha256 IS NOT NULL;

-- Extend professionals with identity fields
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS identity_status TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS identity_verified_name TEXT,
  ADD COLUMN IF NOT EXISTS identity_verified_dob DATE,
  ADD COLUMN IF NOT EXISTS stripe_identity_session_id TEXT,
  ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ;

-- Renewal nudge tracking (so we send each reminder exactly once per cert)
CREATE TABLE IF NOT EXISTS public.verification_renewal_nudges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.verification_submissions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('60d','30d','7d','expired')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, kind)
);

GRANT SELECT ON public.verification_renewal_nudges TO authenticated;
GRANT ALL ON public.verification_renewal_nudges TO service_role;

ALTER TABLE public.verification_renewal_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pros can see their own nudges"
ON public.verification_renewal_nudges
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.verification_submissions vs
    WHERE vs.id = verification_renewal_nudges.submission_id
      AND vs.professional_id = auth.uid()
  )
);

-- Public read helper for /verify/{token} — bypasses RLS but only returns
-- safe, approved, non-expired certs.
CREATE OR REPLACE FUNCTION public.get_public_verify_record(_token TEXT)
RETURNS TABLE(
  id UUID,
  professional_id UUID,
  awarding_body TEXT,
  awarding_body_slug TEXT,
  qualification TEXT,
  issue_year INT,
  expiry_date DATE,
  certificate_number TEXT,
  holder_name TEXT,
  approved_at TIMESTAMPTZ,
  professional_full_name TEXT,
  professional_slug TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    vs.id,
    vs.professional_id,
    vs.awarding_body,
    vs.awarding_body_slug,
    vs.qualification,
    vs.year AS issue_year,
    vs.expiry_date,
    vs.certificate_number,
    COALESCE(p.identity_verified_name, vs.holder_name) AS holder_name,
    vs.reviewed_at AS approved_at,
    pr.full_name AS professional_full_name,
    p.slug AS professional_slug
  FROM public.verification_submissions vs
  JOIN public.professionals p ON p.id = vs.professional_id
  LEFT JOIN public.profiles pr ON pr.id = vs.professional_id
  WHERE vs.verify_token = _token
    AND vs.status = 'approved'
    AND (vs.expiry_date IS NULL OR vs.expiry_date >= CURRENT_DATE)
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_public_verify_record(TEXT) TO anon, authenticated;
