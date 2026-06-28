ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS canceled_at timestamp with time zone;