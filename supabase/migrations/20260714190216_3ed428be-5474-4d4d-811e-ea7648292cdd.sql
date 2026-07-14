
-- Close the anonymous enumeration hole on certificate_registrations.
-- Replace the broad anon SELECT policy with a SECURITY DEFINER RPC that
-- returns only safe public fields for the exact verification token.

DROP POLICY IF EXISTS "Public verify by token" ON public.certificate_registrations;

CREATE OR REPLACE FUNCTION public.verify_certificate_by_token(_token text)
RETURNS TABLE (
  certificate_number text,
  learner_name text,
  course_title text,
  course_level int,
  reps_course_number text,
  provider_name text,
  issued_at timestamptz,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.certificate_number,
    l.full_name AS learner_name,
    r.course_title,
    r.course_level,
    r.reps_course_number,
    COALESCE(p.full_name, 'Training provider') AS provider_name,
    r.issued_at,
    r.status
  FROM public.certificate_registrations r
  LEFT JOIN public.learners l ON l.id = r.learner_id
  LEFT JOIN public.profiles p ON p.id = r.provider_id
  WHERE r.verification_token = _token
    AND r.status IN ('issued','dispatched','revoked')
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_certificate_by_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.verify_certificate_by_token(text) TO anon, authenticated;
