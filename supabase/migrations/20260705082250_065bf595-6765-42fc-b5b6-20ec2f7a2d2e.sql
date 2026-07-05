-- Newsletter subscribers table with double opt-in flow

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','unsubscribed','bounced')),
  confirm_token uuid NOT NULL DEFAULT gen_random_uuid(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text NOT NULL DEFAULT 'article' CHECK (source IN ('article','footer','admin_import')),
  source_url text,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.newsletter_subscribers TO service_role;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Admin-only read; all writes go through service_role in server functions
CREATE POLICY "Admins can view newsletter subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_newsletter_subscribers_status ON public.newsletter_subscribers (status);
CREATE INDEX idx_newsletter_subscribers_confirm_token ON public.newsletter_subscribers (confirm_token) WHERE status = 'pending';

CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
