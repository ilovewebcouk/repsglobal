
-- Trainer-side unread flag on tickets (mirrors admin-side `is_unread`).
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS requester_unread boolean NOT NULL DEFAULT false;

-- Update message-insert trigger so outbound (admin reply) flips requester_unread true,
-- and inbound (customer message) clears it (they obviously already saw their own message).
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
      WHEN NEW.direction = 'inbound' AND status = 'solved'  AND deleted_at IS NULL THEN 'open'::public.support_status
      WHEN NEW.direction = 'inbound' AND status = 'pending' AND deleted_at IS NULL THEN 'open'::public.support_status
      ELSE status
    END,
    is_unread = CASE
      WHEN NEW.direction = 'inbound' AND deleted_at IS NULL THEN true
      ELSE is_unread
    END,
    requester_unread = CASE
      WHEN NEW.direction = 'outbound' AND deleted_at IS NULL THEN true
      WHEN NEW.direction = 'inbound' THEN false
      ELSE requester_unread
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

-- Trainer-side: list their unread tickets (admin replied, not yet seen).
CREATE OR REPLACE FUNCTION public.list_my_unread_support_tickets()
RETURNS TABLE (
  id uuid,
  ticket_number text,
  subject text,
  last_message_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.id, t.ticket_number, t.subject, t.last_message_at, t.created_at
  FROM public.support_tickets t
  WHERE t.requester_user_id = auth.uid()
    AND t.requester_unread = true
    AND t.deleted_at IS NULL
  ORDER BY t.last_message_at DESC NULLS LAST
  LIMIT 50
$$;

-- Trainer-side: mark a single ticket read.
CREATE OR REPLACE FUNCTION public.mark_my_support_ticket_read(_ticket_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.support_tickets
  SET requester_unread = false, updated_at = now()
  WHERE id = _ticket_id
    AND requester_user_id = auth.uid();
END;
$$;

-- Trainer-side: mark all read.
CREATE OR REPLACE FUNCTION public.mark_all_my_support_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.support_tickets
  SET requester_unread = false, updated_at = now()
  WHERE requester_user_id = auth.uid()
    AND requester_unread = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_unread_support_tickets() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_my_support_ticket_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_my_support_read() TO authenticated;
