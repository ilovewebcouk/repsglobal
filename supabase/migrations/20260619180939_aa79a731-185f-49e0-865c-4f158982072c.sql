
-- =========================================================================
-- Review moderation: admin-approval queue + AI pre-screen + notifications
-- =========================================================================

-- 1) Extend reviews with moderation + AI + submitter capture
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_verdict text,
  ADD COLUMN IF NOT EXISTS ai_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitter_ip inet,
  ADD COLUMN IF NOT EXISTS submitter_user_agent text,
  ADD COLUMN IF NOT EXISTS admin_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS pro_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_note text;

-- Constrain moderation_status values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_moderation_status_check'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_moderation_status_check
      CHECK (moderation_status IN ('pending','approved','removed'));
  END IF;
END $$;

-- Backfill: anything currently 'published' is grandfathered as 'approved'.
UPDATE public.reviews
SET moderation_status = 'approved',
    ai_verdict = COALESCE(ai_verdict, 'clean')
WHERE moderation_status = 'pending'
  AND status = 'published';

CREATE INDEX IF NOT EXISTS reviews_moderation_status_idx
  ON public.reviews (moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_submitter_ip_idx
  ON public.reviews (submitter_ip, created_at DESC) WHERE submitter_ip IS NOT NULL;
CREATE INDEX IF NOT EXISTS reviews_client_email_idx
  ON public.reviews (client_email, created_at DESC) WHERE client_email IS NOT NULL;

-- 2) review_notifications drives sidebar badge + bell feed
CREATE TABLE IF NOT EXISTS public.review_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role text NOT NULL CHECK (recipient_role IN ('admin','professional')),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.review_notifications TO authenticated;
GRANT ALL ON public.review_notifications TO service_role;

ALTER TABLE public.review_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipients read own review notifications" ON public.review_notifications;
CREATE POLICY "recipients read own review notifications"
  ON public.review_notifications FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "recipients mark own review notifications read" ON public.review_notifications;
CREATE POLICY "recipients mark own review notifications read"
  ON public.review_notifications FOR UPDATE
  TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS review_notifications_recipient_idx
  ON public.review_notifications (recipient_user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS review_notifications_review_idx
  ON public.review_notifications (review_id);

-- 3) Replace submit_review_by_token: capture IP + UA, hold for moderation,
--    fan out notifications to admins + the pro.
DROP FUNCTION IF EXISTS public.submit_review_by_token(text, smallint, text, text, text);

CREATE OR REPLACE FUNCTION public.submit_review_by_token(
  _token text,
  _rating smallint,
  _title text,
  _body text,
  _client_name text,
  _ip text DEFAULT NULL,
  _user_agent text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_req public.review_requests%ROWTYPE;
  v_review_id UUID;
  v_admin uuid;
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
    rating, title, body, source, status, moderation_status,
    service_label, submitter_ip, submitter_user_agent
  ) VALUES (
    v_req.professional_id, NULL,
    COALESCE(NULLIF(trim(_client_name),''), v_req.client_name, 'Anonymous'),
    v_req.client_email,
    _rating, NULLIF(trim(_title),''), _body,
    'request_link', 'pending', 'pending',
    v_req.service_label,
    NULLIF(_ip,'')::inet,
    NULLIF(_user_agent,'')
  ) RETURNING id INTO v_review_id;

  UPDATE public.review_requests
  SET status='submitted', submitted_at=now(), updated_at=now()
  WHERE id = v_req.id;

  -- Notify the pro
  INSERT INTO public.review_notifications (review_id, recipient_user_id, recipient_role)
  VALUES (v_review_id, v_req.professional_id, 'professional');

  -- Notify every admin
  FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.review_notifications (review_id, recipient_user_id, recipient_role)
    VALUES (v_review_id, v_admin, 'admin');
  END LOOP;

  UPDATE public.reviews
  SET admin_notified_at = now(), pro_notified_at = now()
  WHERE id = v_review_id;

  RETURN v_review_id;
END;
$function$;

-- 4) admin_moderate_review: approve or remove with audit fields
CREATE OR REPLACE FUNCTION public.admin_moderate_review(
  _review_id uuid,
  _action text,
  _note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF _action NOT IN ('approve','remove') THEN
    RAISE EXCEPTION 'invalid action';
  END IF;

  IF _action = 'approve' THEN
    UPDATE public.reviews
    SET moderation_status = 'approved',
        status = 'published',
        published_at = COALESCE(published_at, now()),
        moderated_by = v_uid,
        moderated_at = now(),
        moderation_note = _note,
        flag_reason = NULL,
        flagged_at = NULL,
        updated_at = now()
    WHERE id = _review_id;
  ELSE
    UPDATE public.reviews
    SET moderation_status = 'removed',
        status = 'hidden',
        moderated_by = v_uid,
        moderated_at = now(),
        moderation_note = _note,
        updated_at = now()
    WHERE id = _review_id;
  END IF;

  -- Mark all notifications for this review as read (queue closed)
  UPDATE public.review_notifications
  SET read_at = COALESCE(read_at, now())
  WHERE review_id = _review_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_moderate_review(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_review_by_token(text, smallint, text, text, text, text, text) TO anon, authenticated;
