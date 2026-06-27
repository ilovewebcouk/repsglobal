-- GDPR erasure: anonymise trailing PII anchored to a user across tables that
-- aren't covered by auth.users FK cascade. Called by deleteMyAccount before
-- supabaseAdmin.auth.admin.deleteUser(userId).

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

  -- enquiries (the user as enquirer)
  UPDATE public.enquiries SET
    sender_user_id = NULL,
    sender_name    = '[erased]',
    sender_email   = 'erased+' || id || '@deleted.invalid',
    sender_phone   = NULL,
    goals          = '[erased]',
    message        = '[erased]',
    location       = NULL,
    ip_hash        = NULL,
    user_agent     = NULL
  WHERE sender_user_id = _user_id;
  GET DIAGNOSTICS v_enq = ROW_COUNT;

  -- reviews (the user as reviewer)
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

  -- support_messages authored by the user
  UPDATE public.support_messages SET
    author_user_id = NULL,
    from_email     = NULL,
    from_name      = NULL,
    body_text      = '[erased]',
    body_html      = NULL
  WHERE author_user_id = _user_id;
  GET DIAGNOSTICS v_smsg = ROW_COUNT;

  -- support_tickets where the user is the requester
  UPDATE public.support_tickets SET
    requester_user_id = NULL,
    requester_name    = NULL,
    requester_email   = 'erased+' || id || '@deleted.invalid'
  WHERE requester_user_id = _user_id;
  GET DIAGNOSTICS v_stkt = ROW_COUNT;

  -- lead_activity rows created by the user (payload may contain PII)
  UPDATE public.lead_activity SET
    created_by = NULL,
    payload    = '{"erased": true}'::jsonb
  WHERE created_by = _user_id;
  GET DIAGNOSTICS v_lact = ROW_COUNT;

  -- Also drop any storage objects under the user's folder across known buckets.
  -- (auth.users cascade does NOT clean storage.objects.)
  DELETE FROM storage.objects
  WHERE bucket_id IN ('avatars','pro-photos','identity-docs','insurance-docs','verification-docs','support-attachments','cpd-certificates')
    AND name LIKE (_user_id::text || '/%');

  RETURN jsonb_build_object(
    'enquiries', v_enq,
    'reviews', v_rev,
    'support_messages', v_smsg,
    'support_tickets', v_stkt,
    'lead_activity', v_lact
  );
END;
$$;

REVOKE ALL ON FUNCTION public.erase_user_pii(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erase_user_pii(uuid) TO service_role;

COMMENT ON FUNCTION public.erase_user_pii(uuid) IS
  'GDPR erasure helper. Anonymises PII in tables not cleaned by auth.users FK cascade, and drops storage objects under the user folder. Service-role only; called from the deleteMyAccount server function before auth.admin.deleteUser().';
