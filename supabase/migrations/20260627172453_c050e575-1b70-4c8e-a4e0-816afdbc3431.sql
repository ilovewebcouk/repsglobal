ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dead_lettered_at timestamptz;
CREATE INDEX IF NOT EXISTS payment_events_dead_letter_idx
  ON public.payment_events (dead_lettered_at)
  WHERE dead_lettered_at IS NOT NULL;