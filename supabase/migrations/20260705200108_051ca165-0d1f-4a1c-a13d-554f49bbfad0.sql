ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS dispute_id UUID REFERENCES public.disputes(id) ON DELETE SET NULL;

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS unpublished_reason TEXT,
  ADD COLUMN IF NOT EXISTS unpublished_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_subscriptions_dispute_id
  ON public.subscriptions(dispute_id)
  WHERE dispute_id IS NOT NULL;