
CREATE TABLE IF NOT EXISTS public.onboarding_nudges (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage text NOT NULL,
  step smallint NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  message_id text,
  PRIMARY KEY (user_id, stage, step)
);

CREATE INDEX IF NOT EXISTS onboarding_nudges_sent_at_idx ON public.onboarding_nudges (sent_at DESC);
CREATE INDEX IF NOT EXISTS onboarding_nudges_user_sent_idx ON public.onboarding_nudges (user_id, sent_at DESC);

GRANT SELECT ON public.onboarding_nudges TO authenticated;
GRANT ALL ON public.onboarding_nudges TO service_role;

ALTER TABLE public.onboarding_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own onboarding nudges"
  ON public.onboarding_nudges FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role writes onboarding nudges"
  ON public.onboarding_nudges FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.resolve_onboarding_stage(_user_id uuid)
RETURNS TABLE (stage text, stage_entered_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_last_sign_in timestamptz;
  u_confirmed timestamptz;
  p_verification_status text;
  p_identity_at timestamptz;
  w_published_at timestamptz;
  w_exists boolean;
BEGIN
  SELECT last_sign_in_at, confirmed_at
    INTO u_last_sign_in, u_confirmed
    FROM auth.users WHERE id = _user_id;

  IF u_confirmed IS NULL THEN
    stage := 'muted'; stage_entered_at := NULL; RETURN NEXT; RETURN;
  END IF;

  SELECT verification_status::text, identity_verified_at
    INTO p_verification_status, p_identity_at
    FROM public.professionals WHERE id = _user_id;

  IF p_verification_status IS NULL THEN
    stage := 'muted'; stage_entered_at := NULL; RETURN NEXT; RETURN;
  END IF;

  IF u_last_sign_in IS NULL THEN
    stage := 'not_signed_in';
    stage_entered_at := u_confirmed;
    RETURN NEXT; RETURN;
  END IF;

  IF p_verification_status <> 'verified' THEN
    stage := 'verify_incomplete';
    stage_entered_at := u_last_sign_in;
    RETURN NEXT; RETURN;
  END IF;

  SELECT published_at, TRUE
    INTO w_published_at, w_exists
    FROM public.websites WHERE professional_id = _user_id;

  IF w_published_at IS NULL THEN
    stage := 'website_unpublished';
    stage_entered_at := COALESCE(p_identity_at, u_last_sign_in);
    RETURN NEXT; RETURN;
  END IF;

  stage := 'complete';
  stage_entered_at := w_published_at;
  RETURN NEXT; RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_onboarding_stage(uuid) TO authenticated, service_role;

DO $$
DECLARE tok text;
BEGIN
  SELECT token INTO tok FROM public.cron_secrets WHERE name = 'default';
  IF tok IS NULL THEN RAISE NOTICE 'cron_secrets default missing; skipping schedule'; RETURN; END IF;

  BEGIN PERFORM cron.unschedule('onboarding-nudges-daily'); EXCEPTION WHEN OTHERS THEN NULL; END;

  PERFORM cron.schedule(
    'onboarding-nudges-daily',
    '0 8 * * *',
    format($cron$
      SELECT net.http_post(
        url := 'https://repsglobal.lovable.app/api/public/hooks/onboarding-nudge-cron',
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer %s'),
        body := '{}'::jsonb
      )
    $cron$, tok)
  );
END $$;
