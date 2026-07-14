-- 1) One-off backfill: verified pros that were never flipped published,
--    and were NOT explicitly hidden by an admin.
UPDATE public.professionals
   SET is_published = true
 WHERE verification = 'verified'::public.verification_status
   AND is_published = false
   AND unpublished_reason IS NULL
   AND suspended_at IS NULL;

-- 2) Update recompute_pro_verification so it also auto-publishes on
--    transition to 'verified'. Preserves admin unpublish semantics: if
--    `unpublished_reason` is set (admin_hidden, etc.) or the pro is
--    suspended, we leave `is_published` alone.
CREATE OR REPLACE FUNCTION public.recompute_pro_verification(_pro_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _fully boolean;
  _current_v public.verification_status;
  _target_v  public.verification_status;
  _target_s  public.verification_state;
  _after_v   public.verification_status;
  _after_s   public.verification_state;
BEGIN
  IF _pro_id IS NULL THEN RETURN; END IF;

  SELECT public.is_pro_fully_verified(_pro_id) INTO _fully;
  SELECT verification INTO _current_v FROM public.professionals WHERE id = _pro_id;

  IF _fully THEN
    _target_v := 'verified'::public.verification_status;
    _target_s := 'verified'::public.verification_state;
  ELSIF _current_v = 'rejected'::public.verification_status THEN
    _target_v := 'rejected'::public.verification_status;
    _target_s := 'unverified'::public.verification_state;
  ELSIF _current_v = 'suspended'::public.verification_status THEN
    _target_v := 'suspended'::public.verification_status;
    _target_s := 'unverified'::public.verification_state;
  ELSE
    _target_v := 'pending'::public.verification_status;
    _target_s := 'pending'::public.verification_state;
  END IF;

  UPDATE public.professionals
     SET verification        = _target_v,
         verification_status = _target_s
   WHERE id = _pro_id
     AND (verification IS DISTINCT FROM _target_v
          OR verification_status IS DISTINCT FROM _target_s);

  -- NEW: auto-publish on transition to fully verified, unless the
  -- professional has been explicitly hidden or suspended by an admin.
  IF _target_v = 'verified'::public.verification_status THEN
    UPDATE public.professionals
       SET is_published = true
     WHERE id = _pro_id
       AND is_published = false
       AND unpublished_reason IS NULL
       AND suspended_at IS NULL;
  END IF;

  -- Self-check: if we still don't agree, something else is racing us — log it.
  SELECT verification, verification_status
    INTO _after_v, _after_s
    FROM public.professionals WHERE id = _pro_id;

  IF (_after_v = 'verified'::public.verification_status)
       <> (_after_s = 'verified'::public.verification_state) THEN
    INSERT INTO public.admin_audit_log (
      actor_id, action, target_table, target_id, after_state, reason
    ) VALUES (
      NULL,
      'verification.drift_detected',
      'professionals',
      _pro_id,
      jsonb_build_object(
        'verification', _after_v::text,
        'verification_status', _after_s::text,
        'fully_verified', _fully
      ),
      'recompute_pro_verification: columns still disagree after update'
    );
  END IF;
END;
$function$;