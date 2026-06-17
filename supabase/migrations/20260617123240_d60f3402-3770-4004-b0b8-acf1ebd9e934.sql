-- Fix functions left referencing the old 'resolved' enum value after it was renamed to 'solved'.
-- The trigger was failing every time an outbound message was inserted, which made
-- admin campaign sends report "failed" even though Mailgun had already delivered the email.

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
      -- Customer reply on a solved (soft-terminal) ticket → reopen.
      WHEN NEW.direction = 'inbound'
       AND status = 'solved'
       AND deleted_at IS NULL
        THEN 'open'::public.support_status
      -- Customer reply on pending → reopen (waiting-on-customer cleared).
      WHEN NEW.direction = 'inbound'
       AND status = 'pending'
       AND deleted_at IS NULL
        THEN 'open'::public.support_status
      -- closed / spam / deleted: stay put. Webhook spawns a new ticket.
      ELSE status
    END,
    is_unread = CASE
      WHEN NEW.direction = 'inbound' AND deleted_at IS NULL THEN true
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

CREATE OR REPLACE FUNCTION public.support_run_maintenance()
RETURNS TABLE(auto_closed integer, hard_purged integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_closed integer := 0;
  v_purged integer := 0;
BEGIN
  WITH bumped AS (
    UPDATE public.support_tickets
    SET status = 'closed'::public.support_status,
        closed_at = now(),
        updated_at = now()
    WHERE status = 'solved'
      AND deleted_at IS NULL
      AND solved_at IS NOT NULL
      AND solved_at < (now() - interval '30 days')
      AND COALESCE(last_message_at, solved_at) < (now() - interval '30 days')
    RETURNING 1
  )
  SELECT count(*) INTO v_closed FROM bumped;

  WITH gone AS (
    DELETE FROM public.support_tickets
    WHERE deleted_at IS NOT NULL
      AND deleted_at < (now() - interval '30 days')
    RETURNING 1
  )
  SELECT count(*) INTO v_purged FROM gone;

  auto_closed := v_closed;
  hard_purged := v_purged;
  RETURN NEXT;
END;
$function$;