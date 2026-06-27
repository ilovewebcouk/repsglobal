CREATE OR REPLACE FUNCTION public.erase_user_pii(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enq int := 0;
  v_rev int := 0;
  v_smsg int := 0;
  v_stkt int := 0;
  v_lact int := 0;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

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

  RETURN jsonb_build_object(
    'enquiries', v_enq,
    'reviews', v_rev,
    'support_messages', v_smsg,
    'support_tickets', v_stkt,
    'lead_activity', v_lact
  );
END;
$$;
