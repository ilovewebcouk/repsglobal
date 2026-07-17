
-- ─────────────────────────────────────────────────────────────
-- Provider Reviews v1 — certificate-verified learner reviews
-- ─────────────────────────────────────────────────────────────

-- 1. reviews: add course + certificate provenance
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.reps_courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS certificate_registration_id uuid REFERENCES public.certificate_registrations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewer_kind text NOT NULL DEFAULT 'client' CHECK (reviewer_kind IN ('client','learner'));

CREATE UNIQUE INDEX IF NOT EXISTS reviews_certificate_registration_id_key
  ON public.reviews(certificate_registration_id)
  WHERE certificate_registration_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS reviews_course_id_idx ON public.reviews(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS reviews_professional_id_status_idx ON public.reviews(professional_id, status);

-- 2. review_requests: reuse for learner path
ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'client' CHECK (kind IN ('client','learner')),
  ADD COLUMN IF NOT EXISTS certificate_registration_id uuid REFERENCES public.certificate_registrations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.reps_courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS course_title_snapshot text,
  ADD COLUMN IF NOT EXISTS provider_name_snapshot text,
  ADD COLUMN IF NOT EXISTS resend_count int NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS review_requests_certificate_registration_id_key
  ON public.review_requests(certificate_registration_id)
  WHERE certificate_registration_id IS NOT NULL;

-- 3. learners: link to auth user on first token click
ALTER TABLE public.learners
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS learners_provider_auth_user_id_key
  ON public.learners(provider_id, auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 4. RPCs for /t/$slug reviews section
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.provider_course_review_stats(_provider_id uuid)
RETURNS TABLE(course_id uuid, course_title text, review_count bigint, average_rating numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.course_id,
    COALESCE(c.official_title, c.proposed_title) AS course_title,
    COUNT(*)::bigint AS review_count,
    ROUND(AVG(r.rating)::numeric, 1) AS average_rating
  FROM public.reviews r
  LEFT JOIN public.reps_courses c ON c.id = r.course_id
  WHERE r.professional_id = _provider_id
    AND r.reviewer_kind = 'learner'
    AND r.status = 'published'
    AND r.course_id IS NOT NULL
  GROUP BY r.course_id, c.official_title, c.proposed_title
  ORDER BY review_count DESC;
$$;

GRANT EXECUTE ON FUNCTION public.provider_course_review_stats(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_provider_reviews_page(
  _provider_id uuid,
  _limit int DEFAULT 10,
  _offset int DEFAULT 0,
  _course_id uuid DEFAULT NULL,
  _sort text DEFAULT 'recent'
)
RETURNS TABLE(
  id uuid,
  rating int,
  title text,
  body text,
  reviewer_name text,
  course_id uuid,
  course_title text,
  certificate_number text,
  response text,
  responded_at timestamptz,
  published_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total bigint;
BEGIN
  SELECT COUNT(*) INTO _total
  FROM public.reviews r
  WHERE r.professional_id = _provider_id
    AND r.reviewer_kind = 'learner'
    AND r.status = 'published'
    AND (_course_id IS NULL OR r.course_id = _course_id);

  RETURN QUERY
  SELECT
    r.id,
    r.rating,
    r.title,
    r.body,
    r.client_name AS reviewer_name,
    r.course_id,
    COALESCE(c.official_title, c.proposed_title) AS course_title,
    cr.certificate_number,
    r.response,
    r.responded_at,
    r.published_at,
    _total AS total_count
  FROM public.reviews r
  LEFT JOIN public.reps_courses c ON c.id = r.course_id
  LEFT JOIN public.certificate_registrations cr ON cr.id = r.certificate_registration_id
  WHERE r.professional_id = _provider_id
    AND r.reviewer_kind = 'learner'
    AND r.status = 'published'
    AND (_course_id IS NULL OR r.course_id = _course_id)
  ORDER BY
    CASE WHEN _sort = 'highest' THEN r.rating END DESC NULLS LAST,
    CASE WHEN _sort = 'lowest' THEN r.rating END ASC NULLS LAST,
    r.published_at DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_provider_reviews_page(uuid, int, int, uuid, text) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 5. RLS: learner-review insert branch (defence in depth;
--    server functions still write via service role)
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "learners can review printed certificates" ON public.reviews;
CREATE POLICY "learners can review printed certificates"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  reviewer_kind = 'learner'
  AND certificate_registration_id IS NOT NULL
  AND course_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.certificate_registrations cr
    JOIN public.certificate_batches cb ON cb.id = cr.batch_id
    JOIN public.learners l ON l.id = cr.learner_id
    WHERE cr.id = reviews.certificate_registration_id
      AND cr.provider_id = reviews.professional_id
      AND cr.course_id = reviews.course_id
      AND cb.status IN ('printed','dispatched')
      AND l.auth_user_id = auth.uid()
  )
);

-- review_requests: learner rows readable by the linked auth user
DROP POLICY IF EXISTS "learners can read their own review requests" ON public.review_requests;
CREATE POLICY "learners can read their own review requests"
ON public.review_requests
FOR SELECT
TO authenticated
USING (
  kind = 'learner'
  AND certificate_registration_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.certificate_registrations cr
    JOIN public.learners l ON l.id = cr.learner_id
    WHERE cr.id = review_requests.certificate_registration_id
      AND l.auth_user_id = auth.uid()
  )
);
