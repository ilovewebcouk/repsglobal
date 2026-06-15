-- Slice A: support queue overhaul — unread/snooze/last-opened signals.

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS is_unread       boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS snoozed_until   timestamptz,
  ADD COLUMN IF NOT EXISTS last_opened_at  timestamptz,
  ADD COLUMN IF NOT EXISTS last_opened_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_unread
  ON public.support_tickets (is_unread) WHERE is_unread = true;

CREATE INDEX IF NOT EXISTS idx_support_tickets_snoozed
  ON public.support_tickets (snoozed_until) WHERE snoozed_until IS NOT NULL;

-- Backfill: any existing inbound-only tickets with no outbound reply count as unread.
UPDATE public.support_tickets t
SET is_unread = true
WHERE status = 'open'
  AND first_response_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.support_messages m
    WHERE m.ticket_id = t.id AND m.direction = 'inbound'
  );

-- Extend trigger: inbound flips is_unread on and clears snooze.
CREATE OR REPLACE FUNCTION public.tg_support_message_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    is_unread = CASE
      WHEN NEW.direction = 'inbound' THEN true
      ELSE is_unread
    END,
    snoozed_until = CASE
      WHEN NEW.direction = 'inbound' THEN NULL
      ELSE snoozed_until
    END,
    updated_at = now()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$function$;
