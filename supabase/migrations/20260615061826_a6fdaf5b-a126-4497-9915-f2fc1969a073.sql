CREATE OR REPLACE FUNCTION public.convert_lead_to_client(_enquiry_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enquiry public.enquiries%ROWTYPE;
  v_uid uuid := auth.uid();
  v_roster_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_enquiry FROM public.enquiries WHERE id = _enquiry_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'enquiry not found';
  END IF;

  IF v_enquiry.professional_id <> v_uid THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  IF v_enquiry.sender_user_id IS NULL THEN
    RAISE EXCEPTION 'Client needs a REPs account before they can be converted.';
  END IF;

  INSERT INTO public.clients (id) VALUES (v_enquiry.sender_user_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.coach_client (professional_id, client_id, status)
  VALUES (v_uid, v_enquiry.sender_user_id, 'active')
  ON CONFLICT (professional_id, client_id)
  DO UPDATE SET status = 'active', ended_at = NULL, updated_at = now();

  INSERT INTO public.client_roster (
    professional_id, email, full_name,
    status, client_id, auth_user_id,
    confirmed_at, activated_at
  )
  VALUES (
    v_uid,
    lower(v_enquiry.sender_email),
    v_enquiry.sender_name,
    'active'::roster_status,
    v_enquiry.sender_user_id,
    v_enquiry.sender_user_id,
    now(),
    now()
  )
  ON CONFLICT (professional_id, lower(email))
  DO UPDATE SET
    status        = 'active'::roster_status,
    client_id     = EXCLUDED.client_id,
    auth_user_id  = EXCLUDED.auth_user_id,
    full_name     = COALESCE(client_roster.full_name, EXCLUDED.full_name),
    activated_at  = COALESCE(client_roster.activated_at, now()),
    archived_at   = NULL,
    updated_at    = now()
  RETURNING id INTO v_roster_id;

  UPDATE public.enquiries
  SET converted_client_id = v_enquiry.sender_user_id,
      stage = 'converted'::lead_stage,
      updated_at = now()
  WHERE id = _enquiry_id;

  INSERT INTO public.lead_activity (enquiry_id, professional_id, type, payload, created_by)
  VALUES (
    _enquiry_id,
    v_uid,
    'converted',
    jsonb_build_object('client_id', v_enquiry.sender_user_id, 'roster_id', v_roster_id),
    v_uid
  );

  RETURN v_enquiry.sender_user_id;
END;
$$;