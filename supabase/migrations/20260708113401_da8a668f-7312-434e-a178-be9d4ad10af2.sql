ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS address text;

CREATE OR REPLACE FUNCTION public.apply_provider_change(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r        public.provider_change_requests%ROWTYPE;
  v_text   text;
  v_num    int;
BEGIN
  SELECT * INTO r FROM public.provider_change_requests WHERE id = _request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'change request % not found', _request_id; END IF;

  v_text := NULLIF(r.proposed_value->>'value', '');

  IF r.field_key IN ('tagline','about') THEN
    INSERT INTO public.websites (professional_id) VALUES (r.provider_id)
    ON CONFLICT (professional_id) DO NOTHING;

    IF r.field_key = 'tagline' THEN
      UPDATE public.websites SET tagline = v_text WHERE professional_id = r.provider_id;
    ELSIF r.field_key = 'about' THEN
      UPDATE public.websites SET about = v_text WHERE professional_id = r.provider_id;
    END IF;

  ELSIF r.field_key = 'year_established' THEN
    IF v_text IS NULL THEN v_num := NULL; ELSE v_num := v_text::int; END IF;
    UPDATE public.professionals SET year_established = v_num WHERE id = r.provider_id;

  ELSIF r.field_key IN (
    'website_url','contact_email','contact_phone','company_number','address',
    'social_instagram','social_linkedin','social_youtube','social_tiktok','social_x'
  ) THEN
    EXECUTE format('UPDATE public.professionals SET %I = $1 WHERE id = $2', r.field_key)
      USING v_text, r.provider_id;

  ELSE
    RAISE EXCEPTION 'unsupported field_key: %', r.field_key;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_provider_change(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_provider_change(uuid) TO service_role;