ALTER TABLE public.billing_setup_tokens
  ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS target_tier text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_reference text;

ALTER TABLE public.billing_setup_tokens
  DROP CONSTRAINT IF EXISTS billing_setup_tokens_kind_check;
ALTER TABLE public.billing_setup_tokens
  ADD CONSTRAINT billing_setup_tokens_kind_check
  CHECK (kind = ANY (ARRAY['setup'::text, 'reactivate'::text, 'admin_core_invite'::text]));

CREATE UNIQUE INDEX IF NOT EXISTS billing_setup_tokens_client_reference_key
  ON public.billing_setup_tokens(client_reference) WHERE client_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS billing_setup_tokens_professional_idx
  ON public.billing_setup_tokens(professional_id) WHERE professional_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS billing_setup_tokens_stripe_customer_idx
  ON public.billing_setup_tokens(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;