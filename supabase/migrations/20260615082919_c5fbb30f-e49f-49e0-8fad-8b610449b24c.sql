
-- Enums
DO $$ BEGIN
  CREATE TYPE public.support_status AS ENUM ('open','pending','resolved','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_priority AS ENUM ('urgent','high','normal','low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_source AS ENUM ('email','web','admin','api');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_msg_direction AS ENUM ('inbound','outbound','internal_note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SEQUENCE IF NOT EXISTS public.support_ticket_seq START 4900;

-- support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number      TEXT NOT NULL UNIQUE
                       DEFAULT ('TKT-' || nextval('public.support_ticket_seq')::text),
  subject            TEXT NOT NULL,
  status             public.support_status NOT NULL DEFAULT 'open',
  priority           public.support_priority NOT NULL DEFAULT 'normal',
  source             public.support_source NOT NULL DEFAULT 'email',
  requester_email    TEXT NOT NULL,
  requester_name     TEXT,
  requester_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tags               TEXT[] NOT NULL DEFAULT '{}',
  sla_due_at         TIMESTAMPTZ,
  first_response_at  TIMESTAMPTZ,
  resolved_at        TIMESTAMPTZ,
  last_message_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  thread_key         TEXT UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.support_ticket_seq TO authenticated, service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert tickets" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete tickets" ON public.support_tickets
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_support_tickets_status    ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assignee  ON public.support_tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_requester ON public.support_tickets(requester_email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_thread    ON public.support_tickets(thread_key);
CREATE INDEX IF NOT EXISTS idx_support_tickets_last_msg  ON public.support_tickets(last_message_at DESC);

CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- support_messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id          UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  direction          public.support_msg_direction NOT NULL,
  from_email         TEXT,
  from_name          TEXT,
  author_user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body_text          TEXT,
  body_html          TEXT,
  mailgun_message_id TEXT,
  in_reply_to        TEXT,
  email_references   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read messages" ON public.support_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert messages" ON public.support_messages
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update messages" ON public.support_messages
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete messages" ON public.support_messages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_mgid   ON public.support_messages(mailgun_message_id);

CREATE OR REPLACE FUNCTION public.tg_support_message_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.support_tickets
  SET
    last_message_at = NEW.created_at,
    first_response_at = CASE
      WHEN first_response_at IS NULL AND NEW.direction = 'outbound' THEN NEW.created_at
      ELSE first_response_at
    END,
    status = CASE
      WHEN NEW.direction = 'inbound' AND status IN ('resolved','closed') THEN 'open'::public.support_status
      ELSE status
    END,
    updated_at = now()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_support_message_after_insert
  AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_support_message_after_insert();

-- support_attachments
CREATE TABLE IF NOT EXISTS public.support_attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   UUID NOT NULL REFERENCES public.support_messages(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename     TEXT NOT NULL,
  mime_type    TEXT,
  size_bytes   BIGINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_attachments TO authenticated;
GRANT ALL ON public.support_attachments TO service_role;

ALTER TABLE public.support_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage attachments" ON public.support_attachments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_support_attachments_msg ON public.support_attachments(message_id);

-- Storage policies for support-attachments bucket
CREATE POLICY "Admins read support attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'support-attachments' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write support attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'support-attachments' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update support attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'support-attachments' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete support attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'support-attachments' AND public.has_role(auth.uid(), 'admin'));
