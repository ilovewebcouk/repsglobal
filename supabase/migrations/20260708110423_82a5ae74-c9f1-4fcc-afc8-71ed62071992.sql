
-- =============================================================
-- Provider change request queue
-- =============================================================

-- 1) enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provider_change_status') THEN
    CREATE TYPE public.provider_change_status AS ENUM ('pending','approved','rejected','superseded');
  END IF;
END $$;

-- 2) table
CREATE TABLE IF NOT EXISTS public.provider_change_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_group   text NOT NULL,
  field_key     text NOT NULL,
  proposed_value jsonb,
  current_value  jsonb,
  status        public.provider_change_status NOT NULL DEFAULT 'pending',
  admin_note    text,
  reviewer_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pcr_provider_status
  ON public.provider_change_requests (provider_id, status);
CREATE INDEX IF NOT EXISTS idx_pcr_status_created
  ON public.provider_change_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pcr_field_pending
  ON public.provider_change_requests (provider_id, field_key)
  WHERE status = 'pending';

-- 3) GRANTs (required by Data API)
GRANT SELECT, INSERT ON public.provider_change_requests TO authenticated;
GRANT ALL ON public.provider_change_requests TO service_role;

-- 4) RLS
ALTER TABLE public.provider_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can view their own change requests"
  ON public.provider_change_requests;
CREATE POLICY "Providers can view their own change requests"
  ON public.provider_change_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Providers can insert their own change requests"
  ON public.provider_change_requests;
CREATE POLICY "Providers can insert their own change requests"
  ON public.provider_change_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can update change requests"
  ON public.provider_change_requests;
CREATE POLICY "Admins can update change requests"
  ON public.provider_change_requests
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) updated_at trigger
CREATE OR REPLACE FUNCTION public.set_pcr_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pcr_updated_at ON public.provider_change_requests;
CREATE TRIGGER trg_pcr_updated_at
  BEFORE UPDATE ON public.provider_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_pcr_updated_at();

-- 6) Supersede older pending rows for the same (provider, field)
CREATE OR REPLACE FUNCTION public.pcr_supersede_prior()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    UPDATE public.provider_change_requests
       SET status = 'superseded', updated_at = now()
     WHERE provider_id = NEW.provider_id
       AND field_key   = NEW.field_key
       AND status      = 'pending'
       AND id         <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pcr_supersede ON public.provider_change_requests;
CREATE TRIGGER trg_pcr_supersede
  AFTER INSERT ON public.provider_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.pcr_supersede_prior();

-- 7) apply_provider_change — SECURITY DEFINER; called only by admin server fn.
--    Maps field_key to the correct public column on professionals or websites.
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

  -- proposed_value shape: {"value": <primitive|null>}
  v_text := NULLIF(r.proposed_value->>'value', '');

  IF r.field_key IN ('tagline','about') THEN
    -- websites table (upsert on professional_id)
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
    'website_url','contact_email','contact_phone','company_number',
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

-- 8) Convenience view — unified pending provider queue for admin.
CREATE OR REPLACE VIEW public.provider_pending_queue
WITH (security_invoker=on) AS
  SELECT
    'change'::text                AS source,
    pcr.id                        AS id,
    pcr.provider_id               AS provider_id,
    pcr.field_group               AS field_group,
    pcr.field_key                 AS field_key,
    pcr.proposed_value            AS proposed_value,
    pcr.current_value             AS current_value,
    pcr.status::text              AS status,
    pcr.created_at                AS created_at
  FROM public.provider_change_requests pcr
  WHERE pcr.status = 'pending'
  UNION ALL
  SELECT
    'name'::text                  AS source,
    pnr.id                        AS id,
    pnr.user_id                   AS provider_id,
    'identity'::text              AS field_group,
    'provider_name'::text         AS field_key,
    jsonb_build_object('value', pnr.requested_name) AS proposed_value,
    NULL::jsonb                   AS current_value,
    pnr.status::text              AS status,
    pnr.created_at                AS created_at
  FROM public.provider_name_requests pnr
  WHERE pnr.status = 'pending'
  UNION ALL
  SELECT
    'domain'::text                AS source,
    pdv.id                        AS id,
    pdv.professional_id           AS provider_id,
    'identity'::text              AS field_group,
    'provider_domain'::text       AS field_key,
    jsonb_build_object('value', pdv.email, 'domain', pdv.domain) AS proposed_value,
    NULL::jsonb                   AS current_value,
    pdv.status::text              AS status,
    pdv.created_at                AS created_at
  FROM public.provider_domain_verifications pdv
  WHERE pdv.status = 'pending_admin_review';

GRANT SELECT ON public.provider_pending_queue TO authenticated;
GRANT ALL   ON public.provider_pending_queue TO service_role;
