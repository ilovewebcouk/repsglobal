
-- Outbound broadcast campaigns: replaces per-recipient tickets with a single
-- campaign row plus one recipient row per email. Inbound replies still create
-- support tickets, tagged so we can attribute them back to the campaign.

CREATE TYPE public.campaign_recipient_status AS ENUM (
  'queued', 'sent', 'failed', 'bounced', 'complained', 'replied'
);

CREATE TABLE public.outbound_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox text NOT NULL CHECK (inbox IN ('support', 'pros', 'partners', 'press')),
  subject text NOT NULL,
  body_text text NOT NULL,
  body_html text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_recipients integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  tiers text[] NOT NULL DEFAULT '{}',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX idx_outbound_campaigns_created_at ON public.outbound_campaigns (created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.outbound_campaigns TO authenticated;
GRANT ALL ON public.outbound_campaigns TO service_role;

ALTER TABLE public.outbound_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read campaigns" ON public.outbound_campaigns
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins write campaigns" ON public.outbound_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update campaigns" ON public.outbound_campaigns
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));


CREATE TABLE public.outbound_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.outbound_campaigns(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  status public.campaign_recipient_status NOT NULL DEFAULT 'queued',
  mailgun_message_id text,
  error_message text,
  sent_at timestamptz,
  replied_at timestamptz,
  reply_ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_campaign_recipients_unique
  ON public.outbound_campaign_recipients (campaign_id, lower(email));
CREATE INDEX idx_campaign_recipients_mgid
  ON public.outbound_campaign_recipients (mailgun_message_id)
  WHERE mailgun_message_id IS NOT NULL;
CREATE INDEX idx_campaign_recipients_campaign
  ON public.outbound_campaign_recipients (campaign_id);

GRANT SELECT, INSERT, UPDATE ON public.outbound_campaign_recipients TO authenticated;
GRANT ALL ON public.outbound_campaign_recipients TO service_role;

ALTER TABLE public.outbound_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read campaign recipients" ON public.outbound_campaign_recipients
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins write campaign recipients" ON public.outbound_campaign_recipients
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update campaign recipients" ON public.outbound_campaign_recipients
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
