
CREATE TABLE public.legacy_stripe_payments (
  charge_id text PRIMARY KEY,
  stripe_customer_id text,
  email citext NOT NULL,
  paid_at timestamptz NOT NULL,
  amount_pence integer NOT NULL,
  currency text NOT NULL DEFAULT 'gbp',
  status text NOT NULL,
  description text,
  card_last4 text,
  card_brand text,
  refunded_amount_pence integer NOT NULL DEFAULT 0,
  refunded_at timestamptz,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  import_batch_id uuid,
  imported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX legacy_stripe_payments_email_idx ON public.legacy_stripe_payments (email);
CREATE INDEX legacy_stripe_payments_customer_idx ON public.legacy_stripe_payments (stripe_customer_id);
CREATE INDEX legacy_stripe_payments_user_idx ON public.legacy_stripe_payments (user_id, paid_at DESC);

GRANT SELECT ON public.legacy_stripe_payments TO authenticated;
GRANT ALL ON public.legacy_stripe_payments TO service_role;

ALTER TABLE public.legacy_stripe_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own payment history"
  ON public.legacy_stripe_payments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR lower(email::text) = lower((auth.jwt() ->> 'email'))
  );

CREATE POLICY "Admins view all payment history"
  ON public.legacy_stripe_payments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER legacy_stripe_payments_set_updated_at
  BEFORE UPDATE ON public.legacy_stripe_payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Extend legacy_stripe_link with derived fields
ALTER TABLE public.legacy_stripe_link
  ADD COLUMN IF NOT EXISTS last_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_paid_amount_pence integer,
  ADD COLUMN IF NOT EXISTS next_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_lifetime boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS legacy_stripe_link_next_due_idx
  ON public.legacy_stripe_link (next_due_at)
  WHERE is_lifetime = false;
