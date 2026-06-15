
-- Inbox tag on tickets (which mailbox the email/ticket came in on)
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS inbox text NOT NULL DEFAULT 'support';

ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_inbox_chk;
ALTER TABLE public.support_tickets
  ADD CONSTRAINT support_tickets_inbox_chk
  CHECK (inbox IN ('support','pros','partners','press'));

CREATE INDEX IF NOT EXISTS idx_support_tickets_inbox
  ON public.support_tickets(inbox);

-- Mark messages that were sent automatically (e.g. contact-form autoresponse)
ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS is_auto boolean NOT NULL DEFAULT false;

-- New source value for tickets created by the public contact form
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.support_source'::regtype
      AND enumlabel = 'contact_form'
  ) THEN
    ALTER TYPE public.support_source ADD VALUE 'contact_form';
  END IF;
END$$;
