
-- 1. Removal metadata columns on reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS removal_reason text,
  ADD COLUMN IF NOT EXISTS removal_category text,
  ADD COLUMN IF NOT EXISTS removal_internal_note text,
  ADD COLUMN IF NOT EXISTS removal_notified_at timestamptz;

-- 2. Extend admin_moderate_review with category/reason/internal note + notify pro
CREATE OR REPLACE FUNCTION public.admin_moderate_review(
  _review_id uuid,
  _action text,
  _note text DEFAULT NULL,
  _category text DEFAULT NULL,
  _internal_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_pro uuid;
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
        removal_reason = NULL,
        removal_category = NULL,
        removal_internal_note = NULL,
        removal_notified_at = NULL,
        flag_reason = NULL,
        flagged_at = NULL,
        updated_at = now()
    WHERE id = _review_id
    RETURNING professional_id INTO v_pro;
  ELSE
    UPDATE public.reviews
    SET moderation_status = 'removed',
        status = 'hidden',
        moderated_by = v_uid,
        moderated_at = now(),
        moderation_note = _note,
        removal_reason = NULLIF(btrim(coalesce(_note, '')), ''),
        removal_category = NULLIF(btrim(coalesce(_category, '')), ''),
        removal_internal_note = NULLIF(btrim(coalesce(_internal_note, '')), ''),
        updated_at = now()
    WHERE id = _review_id
    RETURNING professional_id INTO v_pro;

    -- Bell/sidebar notification for the trainer about the removal.
    IF v_pro IS NOT NULL THEN
      INSERT INTO public.review_notifications (review_id, recipient_user_id, recipient_role)
      VALUES (_review_id, v_pro, 'professional')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Mark all existing notifications for this review as read (admin queue closed).
  -- We re-insert the pro removal notification AFTER this so it stays unread.
  UPDATE public.review_notifications
  SET read_at = COALESCE(read_at, now())
  WHERE review_id = _review_id
    AND (recipient_role <> 'professional' OR _action = 'approve');
END;
$function$;
