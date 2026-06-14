
CREATE TABLE public.legacy_stripe_link (
  bd_member_id BIGINT PRIMARY KEY REFERENCES public.bd_member_seed(bd_member_id) ON DELETE CASCADE,
  email extensions.citext NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_price_id TEXT,
  access_expires_at TIMESTAMPTZ,
  legacy_kind TEXT NOT NULL DEFAULT 'unknown',
  link_status TEXT NOT NULL DEFAULT 'pending',
  migration_status TEXT NOT NULL DEFAULT 'pending',
  last_attempt_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX legacy_stripe_link_status_idx ON public.legacy_stripe_link (migration_status);
CREATE INDEX legacy_stripe_link_expires_idx ON public.legacy_stripe_link (access_expires_at);
CREATE INDEX legacy_stripe_link_email_idx ON public.legacy_stripe_link (email);

GRANT SELECT ON public.legacy_stripe_link TO authenticated;
GRANT ALL ON public.legacy_stripe_link TO service_role;

ALTER TABLE public.legacy_stripe_link ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view legacy_stripe_link"
  ON public.legacy_stripe_link FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER legacy_stripe_link_set_updated_at
  BEFORE UPDATE ON public.legacy_stripe_link
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
