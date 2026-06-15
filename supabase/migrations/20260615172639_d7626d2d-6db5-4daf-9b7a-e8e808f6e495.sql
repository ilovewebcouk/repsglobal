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
      WHEN NEW.direction = 'inbound' AND status IN ('pending','resolved','closed') THEN 'open'::public.support_status
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