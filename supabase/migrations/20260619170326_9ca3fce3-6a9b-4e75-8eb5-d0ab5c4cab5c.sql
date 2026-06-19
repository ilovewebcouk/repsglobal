
-- Extend reviews table
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS flag_reason TEXT,
  ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS thanked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS service_label TEXT,
  ADD COLUMN IF NOT EXISTS client_email CITEXT,
  ADD COLUMN IF NOT EXISTS bd_review_id INT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='reviews_bd_review_id_key') THEN
    CREATE UNIQUE INDEX reviews_bd_review_id_key ON public.reviews(bd_review_id) WHERE bd_review_id IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS reviews_professional_status_created_idx
  ON public.reviews(professional_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_flagged_at_idx
  ON public.reviews(flagged_at) WHERE flagged_at IS NOT NULL;

-- review_requests table
CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  client_email CITEXT NOT NULL,
  client_name TEXT,
  service_label TEXT,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','opened','submitted','expired')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_requests TO authenticated;
GRANT ALL ON public.review_requests TO service_role;

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pros view own review requests"
  ON public.review_requests FOR SELECT
  TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Pros create own review requests"
  ON public.review_requests FOR INSERT
  TO authenticated
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Pros update own review requests"
  ON public.review_requests FOR UPDATE
  TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Admins manage all review requests"
  ON public.review_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS review_requests_pro_created_idx
  ON public.review_requests(professional_id, created_at DESC);
CREATE INDEX IF NOT EXISTS review_requests_token_idx
  ON public.review_requests(token);

CREATE TRIGGER tg_review_requests_set_updated_at
  BEFORE UPDATE ON public.review_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Public token lookup RPC (SECURITY DEFINER so anon can validate tokens
-- without seeing the underlying table)
CREATE OR REPLACE FUNCTION public.get_review_request_by_token(_token TEXT)
RETURNS TABLE (
  id UUID,
  professional_id UUID,
  professional_name TEXT,
  professional_slug TEXT,
  client_email CITEXT,
  client_name TEXT,
  service_label TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT rr.id, rr.professional_id,
         prof.full_name AS professional_name,
         p.slug AS professional_slug,
         rr.client_email, rr.client_name, rr.service_label,
         rr.status, rr.expires_at
  FROM public.review_requests rr
  JOIN public.professionals p ON p.id = rr.professional_id
  LEFT JOIN public.profiles prof ON prof.id = rr.professional_id
  WHERE rr.token = _token
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_review_request_by_token(TEXT) TO anon, authenticated;

-- Submit-by-token RPC: marks request submitted + inserts published review.
CREATE OR REPLACE FUNCTION public.submit_review_by_token(
  _token TEXT,
  _rating SMALLINT,
  _title TEXT,
  _body TEXT,
  _client_name TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_req public.review_requests%ROWTYPE;
  v_review_id UUID;
BEGIN
  SELECT * INTO v_req FROM public.review_requests WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid token'; END IF;
  IF v_req.status = 'submitted' THEN RAISE EXCEPTION 'review already submitted'; END IF;
  IF v_req.expires_at < now() THEN
    UPDATE public.review_requests SET status='expired', updated_at=now() WHERE id=v_req.id;
    RAISE EXCEPTION 'link expired';
  END IF;
  IF _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'rating must be 1-5'; END IF;

  INSERT INTO public.reviews (
    professional_id, client_user_id, client_name, client_email,
    rating, title, body, source, status, service_label, published_at
  ) VALUES (
    v_req.professional_id, NULL,
    COALESCE(NULLIF(trim(_client_name),''), v_req.client_name, 'Anonymous'),
    v_req.client_email,
    _rating, NULLIF(trim(_title),''), _body,
    'request_link', 'published', v_req.service_label, now()
  ) RETURNING id INTO v_review_id;

  UPDATE public.review_requests
  SET status='submitted', submitted_at=now(), updated_at=now()
  WHERE id = v_req.id;

  RETURN v_review_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_review_by_token(TEXT,SMALLINT,TEXT,TEXT,TEXT) TO anon, authenticated;

-- Mark opened RPC
CREATE OR REPLACE FUNCTION public.mark_review_request_opened(_token TEXT)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.review_requests
  SET opened_at = COALESCE(opened_at, now()),
      status = CASE WHEN status='sent' THEN 'opened' ELSE status END,
      updated_at = now()
  WHERE token = _token;
$$;
GRANT EXECUTE ON FUNCTION public.mark_review_request_opened(TEXT) TO anon, authenticated;

-- Aggregate view used by directory cards + admin KPIs
CREATE OR REPLACE VIEW public.professional_review_stats AS
SELECT
  professional_id,
  COUNT(*)::int AS review_count,
  ROUND(AVG(rating)::numeric, 2) AS avg_rating
FROM public.reviews
WHERE status = 'published'
GROUP BY professional_id;

GRANT SELECT ON public.professional_review_stats TO anon, authenticated, service_role;
