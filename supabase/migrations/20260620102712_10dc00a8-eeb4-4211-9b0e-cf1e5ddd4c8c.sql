
-- Auto fan-out review notifications on any insert (covers token submits, client submits, BD seeds, admin manual inserts).
-- Plus backfill missing notifications for existing reviews.

CREATE OR REPLACE FUNCTION public.fan_out_review_notifications(_review_id uuid, _professional_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid;
BEGIN
  -- pro
  INSERT INTO public.review_notifications (review_id, recipient_user_id, recipient_role)
  VALUES (_review_id, _professional_id, 'professional')
  ON CONFLICT DO NOTHING;
  -- admins
  FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.review_notifications (review_id, recipient_user_id, recipient_role)
    VALUES (_review_id, v_admin, 'admin')
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Prevent duplicate notifications per (review, recipient)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'review_notifications_review_recipient_key'
  ) THEN
    -- Dedupe any existing duplicates first
    DELETE FROM public.review_notifications a
    USING public.review_notifications b
    WHERE a.ctid < b.ctid
      AND a.review_id = b.review_id
      AND a.recipient_user_id = b.recipient_user_id;
    ALTER TABLE public.review_notifications
      ADD CONSTRAINT review_notifications_review_recipient_key
      UNIQUE (review_id, recipient_user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trg_reviews_fan_out_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.professional_id IS NOT NULL THEN
    PERFORM public.fan_out_review_notifications(NEW.id, NEW.professional_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_fan_out_notifications ON public.reviews;
CREATE TRIGGER reviews_fan_out_notifications
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.trg_reviews_fan_out_notifications();

-- Backfill: every existing review that is still pending moderation should
-- have a notification row for the pro + every admin, so the sidebar badge
-- and bell feed reflect the real moderation queue.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, professional_id
    FROM public.reviews
    WHERE moderation_status = 'pending'
      AND professional_id IS NOT NULL
  LOOP
    PERFORM public.fan_out_review_notifications(r.id, r.professional_id);
  END LOOP;
END $$;
