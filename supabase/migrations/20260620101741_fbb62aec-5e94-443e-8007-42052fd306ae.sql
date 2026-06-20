
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS response text,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS response_edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS response_notified_at timestamptz;

CREATE OR REPLACE FUNCTION public.upsert_pro_review_response(
  _review_id uuid,
  _response  text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_row  public.reviews%ROWTYPE;
  v_text text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  v_text := btrim(coalesce(_response, ''));
  IF length(v_text) < 1 OR length(v_text) > 1000 THEN
    RAISE EXCEPTION 'reply must be 1-1000 characters';
  END IF;

  SELECT * INTO v_row FROM public.reviews WHERE id = _review_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'review not found'; END IF;
  IF v_row.professional_id <> v_uid THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  IF v_row.moderation_status <> 'approved' THEN
    RAISE EXCEPTION 'review is not approved';
  END IF;

  IF v_row.response IS NULL THEN
    UPDATE public.reviews
       SET response     = v_text,
           responded_at = now(),
           updated_at   = now()
     WHERE id = _review_id;
  ELSE
    UPDATE public.reviews
       SET response           = v_text,
           response_edited_at = now(),
           updated_at         = now()
     WHERE id = _review_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_pro_review_response(
  _review_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.reviews%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_row FROM public.reviews WHERE id = _review_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'review not found'; END IF;
  IF v_row.professional_id <> v_uid THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  UPDATE public.reviews
     SET response             = NULL,
         responded_at         = NULL,
         response_edited_at   = NULL,
         response_notified_at = NULL,
         updated_at           = now()
   WHERE id = _review_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_pro_review_response(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_pro_review_response(uuid) TO authenticated;
