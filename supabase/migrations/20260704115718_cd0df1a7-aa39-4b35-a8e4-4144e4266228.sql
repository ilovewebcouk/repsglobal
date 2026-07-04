ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS current_clients smallint;

CREATE OR REPLACE FUNCTION public.tg_websites_validate_current_clients()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.current_clients IS NOT NULL AND (NEW.current_clients < 0 OR NEW.current_clients > 20) THEN
    RAISE EXCEPTION 'current_clients must be between 0 and 20 (got %)', NEW.current_clients;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_websites_validate_current_clients ON public.websites;
CREATE TRIGGER trg_websites_validate_current_clients
BEFORE INSERT OR UPDATE ON public.websites
FOR EACH ROW EXECUTE FUNCTION public.tg_websites_validate_current_clients();