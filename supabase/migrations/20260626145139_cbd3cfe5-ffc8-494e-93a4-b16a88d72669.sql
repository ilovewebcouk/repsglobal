
-- Idempotency for nudges via the new bell table
CREATE UNIQUE INDEX IF NOT EXISTS verification_notifications_unique_nudge_idx
  ON public.verification_notifications (
    professional_id,
    event,
    ((context->>'policy_id')),
    ((context->>'threshold_days'))
  )
  WHERE event IN ('insurance.expires_soon','insurance.expired');

CREATE OR REPLACE FUNCTION public.insurance_check_renewals()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  v_threshold int;
  v_days int;
  v_inserted int := 0;
BEGIN
  FOR r IN
    SELECT ip.id, ip.professional_id, ip.expiry_date,
           (ip.expiry_date - CURRENT_DATE) AS days_left
    FROM public.insurance_policies ip
    WHERE ip.expiry_date IS NOT NULL
      AND ip.expiry_date >= CURRENT_DATE - 1
      AND ip.expiry_date <= CURRENT_DATE + 60
  LOOP
    v_days := r.days_left;
    v_threshold := CASE
      WHEN v_days <= 0 THEN 0
      WHEN v_days <= 7 THEN 7
      WHEN v_days <= 30 THEN 30
      WHEN v_days <= 60 THEN 60
      ELSE NULL
    END;
    IF v_threshold IS NULL THEN CONTINUE; END IF;

    BEGIN
      INSERT INTO public.verification_notifications (professional_id, event, context)
      VALUES (
        r.professional_id,
        CASE WHEN v_threshold = 0 THEN 'insurance.expired' ELSE 'insurance.expires_soon' END,
        jsonb_build_object(
          'policy_id', r.id::text,
          'threshold_days', v_threshold::text,
          'expiry_date', r.expiry_date,
          'days_left', v_days
        )
      );
      v_inserted := v_inserted + 1;
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END LOOP;
  RETURN v_inserted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.insurance_check_renewals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.insurance_check_renewals() TO service_role;

-- Mark-all-read RPC for the bell
CREATE OR REPLACE FUNCTION public.mark_verification_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  WITH upd AS (
    UPDATE public.verification_notifications
       SET read_at = now()
     WHERE professional_id = v_uid
       AND read_at IS NULL
    RETURNING 1
  )
  SELECT count(*)::int INTO v_count FROM upd;
  RETURN v_count;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mark_verification_notifications_read() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_verification_notifications_read() TO authenticated;
