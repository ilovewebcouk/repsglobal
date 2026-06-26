CREATE OR REPLACE FUNCTION public.recompute_pro_verification(_pro_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _fully boolean;
  _current public.verification_status;
  _current_state public.verification_state;
BEGIN
  IF _pro_id IS NULL THEN RETURN; END IF;

  SELECT public.is_pro_fully_verified(_pro_id) INTO _fully;
  SELECT verification, verification_status
    INTO _current, _current_state
    FROM public.professionals
   WHERE id = _pro_id;

  IF _fully THEN
    UPDATE public.professionals
       SET verification = 'verified'::public.verification_status,
           verification_status = 'verified'::public.verification_state
     WHERE id = _pro_id
       AND (verification IS DISTINCT FROM 'verified'::public.verification_status
            OR verification_status IS DISTINCT FROM 'verified'::public.verification_state);
  ELSE
    -- Preserve explicit 'rejected' / 'suspended' on the canonical column; collapse anything else to 'pending'.
    IF _current = 'verified'::public.verification_status OR _current IS NULL THEN
      UPDATE public.professionals
         SET verification = 'pending'::public.verification_status,
             verification_status = 'pending'::public.verification_state
       WHERE id = _pro_id;
    ELSIF _current_state = 'verified'::public.verification_state THEN
      -- Canonical says not verified but cached still says verified — clear the cache.
      UPDATE public.professionals
         SET verification_status = 'pending'::public.verification_state
       WHERE id = _pro_id;
    END IF;
  END IF;
END;
$function$;

-- Backfill: bring the cached column in line with the canonical one.
UPDATE public.professionals
   SET verification_status = 'verified'::public.verification_state
 WHERE verification = 'verified'::public.verification_status
   AND verification_status IS DISTINCT FROM 'verified'::public.verification_state;

UPDATE public.professionals
   SET verification_status = 'pending'::public.verification_state
 WHERE verification IN ('pending'::public.verification_status, 'rejected'::public.verification_status, 'suspended'::public.verification_status)
   AND verification_status = 'verified'::public.verification_state;