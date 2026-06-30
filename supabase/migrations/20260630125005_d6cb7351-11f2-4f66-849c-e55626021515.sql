-- Pending signups: stage the credentials between /signup and Stripe webhook.
-- Service-role only; never readable by anon or authenticated.
CREATE TABLE public.pending_signups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL,
  password        text NOT NULL,
  full_name       text NOT NULL,
  tier            text NOT NULL CHECK (tier IN ('verified','pro','studio')),
  period          text NOT NULL CHECK (period IN ('monthly','annual')),
  stripe_customer_id  text,
  stripe_session_id   text,
  environment     text NOT NULL CHECK (environment IN ('sandbox','live')),
  consumed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pending_signups_email_idx   ON public.pending_signups (lower(email));
CREATE INDEX pending_signups_session_idx ON public.pending_signups (stripe_session_id);

-- No grants to anon / authenticated. Only service_role.
GRANT ALL ON public.pending_signups TO service_role;

ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

-- Explicit deny: even though no grants exist for anon/authenticated, add
-- a no-op policy slot so future grants don't accidentally open it up.
CREATE POLICY "pending_signups_service_only" ON public.pending_signups
  FOR ALL USING (false) WITH CHECK (false);

-- Janitor: drop unconsumed rows older than 24h, consumed rows older than 1h.
CREATE OR REPLACE FUNCTION public.cleanup_pending_signups()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.pending_signups
   WHERE (consumed_at IS NULL AND created_at < now() - interval '24 hours')
      OR (consumed_at IS NOT NULL AND consumed_at < now() - interval '1 hour');
$$;