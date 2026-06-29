-- Cancellation history retention.
-- Drop the ON DELETE CASCADE so deleting an auth user keeps the
-- subscription row for analytics. Add stand-alone identity columns
-- so the row still tells us who the cancellation was for.

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancelled_email TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_full_name TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_notes TEXT,
  ADD COLUMN IF NOT EXISTS closed_by_actor TEXT;  -- 'admin:<uuid>' or 'stripe_webhook'

CREATE INDEX IF NOT EXISTS subscriptions_cancelled_email_idx
  ON public.subscriptions (cancelled_email)
  WHERE cancelled_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS subscriptions_status_canceled_idx
  ON public.subscriptions (status, canceled_at DESC)
  WHERE status = 'canceled';