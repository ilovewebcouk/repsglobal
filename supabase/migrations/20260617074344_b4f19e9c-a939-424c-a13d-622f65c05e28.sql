
-- Support ticket lifecycle: soft-delete (Trash) + real Closed/archive semantics

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS reopened_from_ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS support_tickets_deleted_at_idx
  ON public.support_tickets (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS support_tickets_closed_at_idx
  ON public.support_tickets (closed_at) WHERE closed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS support_tickets_reopened_from_idx
  ON public.support_tickets (reopened_from_ticket_id) WHERE reopened_from_ticket_id IS NOT NULL;

-- Backfill closed_at for any tickets already in the closed state
UPDATE public.support_tickets
SET closed_at = COALESCE(closed_at, resolved_at, updated_at)
WHERE status = 'closed' AND closed_at IS NULL;

-- Update the inbound-message trigger:
--  - `resolved` still auto-reopens (unchanged)
--  - `closed` / `spam` / soft-deleted: do NOT flip status; the inbound webhook
--    is responsible for spawning a new linked ticket instead.
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
      -- Customer reply on a resolved (soft-terminal) ticket → reopen.
      WHEN NEW.direction = 'inbound'
       AND status = 'resolved'
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

-- Maintenance: auto-close resolved tickets after 30 days of inactivity,
-- and hard-purge tickets that have been in Trash for 30 days.
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
    WHERE status = 'resolved'
      AND deleted_at IS NULL
      AND resolved_at IS NOT NULL
      AND resolved_at < (now() - interval '30 days')
      AND COALESCE(last_message_at, resolved_at) < (now() - interval '30 days')
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

-- Schedule it nightly (idempotent — unschedule first if already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('support-maintenance-nightly')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'support-maintenance-nightly');
    PERFORM cron.schedule(
      'support-maintenance-nightly',
      '17 3 * * *',
      $cron$ SELECT public.support_run_maintenance(); $cron$
    );
  END IF;
END $$;
