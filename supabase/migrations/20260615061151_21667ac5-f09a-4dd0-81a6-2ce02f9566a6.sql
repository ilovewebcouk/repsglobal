CREATE OR REPLACE FUNCTION public.convert_lead_to_client(_enquiry_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enquiry public.enquiries%ROWTYPE;
  v_uid uuid := auth.uid();
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
    jsonb_build_object('client_id', v_enquiry.sender_user_id),
    v_uid
  );

  RETURN v_enquiry.sender_user_id;
END;
$$;