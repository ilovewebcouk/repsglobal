
-- =========================================================
-- 1. connected_accounts (1:1 with professionals)
-- =========================================================
CREATE TABLE public.connected_accounts (
  professional_id    uuid PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  stripe_account_id  text NOT NULL UNIQUE,
  environment        text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','live')),
  charges_enabled    boolean NOT NULL DEFAULT false,
  payouts_enabled    boolean NOT NULL DEFAULT false,
  details_submitted  boolean NOT NULL DEFAULT false,
  requirements_due   jsonb NOT NULL DEFAULT '[]'::jsonb,
  country            text,
  default_currency   text,
  connected_at       timestamptz NOT NULL DEFAULT now(),
  disconnected_at    timestamptz,
  last_synced_at     timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_connected_accounts_stripe ON public.connected_accounts(stripe_account_id);

GRANT SELECT ON public.connected_accounts TO authenticated;
GRANT ALL ON public.connected_accounts TO service_role;

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pro reads own connected account"
  ON public.connected_accounts FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "admin reads all connected accounts"
  ON public.connected_accounts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_connected_accounts_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- 2. bookings (client → pro payments via Connect)
-- =========================================================
CREATE TYPE public.booking_status AS ENUM (
  'pending','paid','refunded','partially_refunded','failed','canceled','disputed'
);

CREATE TABLE public.bookings (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id             uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id                  uuid REFERENCES public.services(id) ON DELETE SET NULL,
  service_title               text,
  client_user_id              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_email                text NOT NULL,
  client_name                 text,
  amount_pence                integer NOT NULL CHECK (amount_pence >= 0),
  currency                    text NOT NULL DEFAULT 'gbp',
  status                      public.booking_status NOT NULL DEFAULT 'pending',
  stripe_account_id           text NOT NULL,
  stripe_checkout_session_id  text UNIQUE,
  stripe_payment_intent_id    text,
  stripe_charge_id            text,
  paid_at                     timestamptz,
  refunded_at                 timestamptz,
  refunded_amount_pence       integer NOT NULL DEFAULT 0,
  dispute_status              text,
  environment                 text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','live')),
  metadata                    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_pro_created ON public.bookings(professional_id, created_at DESC);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_client_user ON public.bookings(client_user_id) WHERE client_user_id IS NOT NULL;
CREATE INDEX idx_bookings_client_email ON public.bookings(lower(client_email));
CREATE INDEX idx_bookings_pi ON public.bookings(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

GRANT SELECT ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pro reads own bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "client reads own bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (client_user_id = auth.uid());

CREATE POLICY "admin reads all bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
