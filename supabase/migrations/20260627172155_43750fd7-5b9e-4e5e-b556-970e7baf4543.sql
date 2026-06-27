
-- A-7: count_confirmed_signups used auth.uid() inside a SECURITY DEFINER
-- function called via service_role, so the admin check always returned NULL
-- and the chart was always zero. Function is already only EXECUTE-able by
-- authenticated, and admin server fns assert role separately, so the inner
-- check is redundant — remove it so the chart actually returns data.
CREATE OR REPLACE FUNCTION public.count_confirmed_signups(_from timestamptz, _to timestamptz)
RETURNS TABLE(day date, signups integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (date_trunc('day', u.email_confirmed_at AT TIME ZONE 'Europe/London'))::date AS day,
    count(*)::int AS signups
  FROM auth.users u
  WHERE u.email_confirmed_at IS NOT NULL
    AND u.email_confirmed_at >= _from
    AND u.email_confirmed_at < _to
  GROUP BY 1
  ORDER BY 1;
$$;

REVOKE ALL ON FUNCTION public.count_confirmed_signups(timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.count_confirmed_signups(timestamptz, timestamptz) TO authenticated, service_role;

-- D-11.7: extend erase_user_pii to cover the remaining 3 PII tables flagged
-- in the audit (bd_member_seed, legacy_stripe_link, payment_events).
-- We keep billing/audit trails intact (Stripe IDs, amounts, dates) and only
-- scrub personally-identifying fields.
CREATE OR REPLACE FUNCTION public.erase_user_pii(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enq   int := 0;
  v_rev   int := 0;
  v_smsg  int := 0;
  v_stkt  int := 0;
  v_lact  int := 0;
  v_bd    int := 0;
  v_link  int := 0;
  v_pe    int := 0;
  v_email text;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  -- Best-effort fetch of the email so we can also scrub legacy rows linked
  -- by email rather than by user_id (legacy_stripe_link / bd_member_seed
  -- often link on email).
  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = _user_id;

  UPDATE public.enquiries SET
    sender_user_id = NULL,
    sender_name    = '[erased]',
    sender_email   = 'erased+' || id || '@deleted.invalid',
    sender_phone   = NULL,
    goals          = ARRAY[]::text[],
    message        = '[erased]',
    location       = NULL,
    ip_hash        = NULL,
    user_agent     = NULL
  WHERE sender_user_id = _user_id;
  GET DIAGNOSTICS v_enq = ROW_COUNT;

  UPDATE public.reviews SET
    client_user_id        = NULL,
    client_name           = '[erased]',
    client_email          = NULL,
    title                 = NULL,
    body                  = '[erased]',
    submitter_ip          = NULL,
    submitter_user_agent  = NULL
  WHERE client_user_id = _user_id;
  GET DIAGNOSTICS v_rev = ROW_COUNT;

  UPDATE public.support_messages SET
    author_user_id = NULL,
    from_email     = NULL,
    from_name      = NULL,
    body_text      = '[erased]',
    body_html      = NULL
  WHERE author_user_id = _user_id;
  GET DIAGNOSTICS v_smsg = ROW_COUNT;

  UPDATE public.support_tickets SET
    requester_user_id = NULL,
    requester_name    = NULL,
    requester_email   = 'erased+' || id || '@deleted.invalid'
  WHERE requester_user_id = _user_id;
  GET DIAGNOSTICS v_stkt = ROW_COUNT;

  UPDATE public.lead_activity SET
    created_by = NULL,
    payload    = '{"erased": true}'::jsonb
  WHERE created_by = _user_id;
  GET DIAGNOSTICS v_lact = ROW_COUNT;

  -- bd_member_seed: scrub direct PII fields, keep migration metadata.
  UPDATE public.bd_member_seed SET
    email      = 'erased+' || bd_member_id || '@deleted.invalid',
    first_name = '[erased]',
    last_name  = '[erased]'
  WHERE claimed_user_id = _user_id
     OR (v_email IS NOT NULL AND lower(email) = lower(v_email));
  GET DIAGNOSTICS v_bd = ROW_COUNT;

  -- legacy_stripe_link: scrub email, keep Stripe IDs for billing audit.
  UPDATE public.legacy_stripe_link SET
    email = 'erased+' || bd_member_id || '@deleted.invalid'
  WHERE v_email IS NOT NULL AND lower(email) = lower(v_email);
  GET DIAGNOSTICS v_link = ROW_COUNT;

  -- payment_events: keep stripe_event_id/type/livemode/created_at for
  -- forensic dedupe; null the user link and strip PII from the raw payload.
  UPDATE public.payment_events SET
    user_id = NULL,
    payload = jsonb_build_object('erased', true, 'original_type', payload->>'type')
  WHERE user_id = _user_id;
  GET DIAGNOSTICS v_pe = ROW_COUNT;

  RETURN jsonb_build_object(
    'enquiries', v_enq,
    'reviews', v_rev,
    'support_messages', v_smsg,
    'support_tickets', v_stkt,
    'lead_activity', v_lact,
    'bd_member_seed', v_bd,
    'legacy_stripe_link', v_link,
    'payment_events', v_pe
  );
END;
$$;

REVOKE ALL ON FUNCTION public.erase_user_pii(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erase_user_pii(uuid) TO service_role;

COMMENT ON FUNCTION public.erase_user_pii(uuid) IS
  'GDPR Art. 17 erasure: pseudonymises PII across enquiries, reviews, '
  'support, lead activity, bd_member_seed, legacy_stripe_link and '
  'payment_events. Preserves billing audit IDs (Stripe IDs, amounts, '
  'event timestamps).';
