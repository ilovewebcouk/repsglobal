
ALTER TABLE public.identity_documents
  ADD COLUMN IF NOT EXISTS stripe_vs_id text,
  ADD COLUMN IF NOT EXISTS stripe_vs_url text,
  ADD COLUMN IF NOT EXISTS stripe_status text,
  ADD COLUMN IF NOT EXISTS stripe_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_id_stripe_vs
  ON public.identity_documents (stripe_vs_id)
  WHERE stripe_vs_id IS NOT NULL;
