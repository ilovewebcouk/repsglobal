
CREATE TYPE public.churn_stage AS ENUM (
  'active', 'at_risk', 'grace', 'lapsed', 'recovered', 'dormant'
);

CREATE TYPE public.renewal_token_purpose AS ENUM (
  'card_needed', 'payment_failed', 'reactivate'
);

CREATE TABLE public.churn_lifecycle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stage public.churn_stage NOT NULL DEFAULT 'active',
  reason text,
  source_event text,
  entered_at timestamptz NOT NULL DEFAULT now(),
  last_nudge_at timestamptz,
  nudge_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX churn_lifecycle_stage_idx ON public.churn_lifecycle (stage);
CREATE INDEX churn_lifecycle_entered_at_idx ON public.churn_lifecycle (entered_at);

GRANT SELECT ON public.churn_lifecycle TO authenticated;
GRANT ALL ON public.churn_lifecycle TO service_role;

ALTER TABLE public.churn_lifecycle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read churn lifecycle"
  ON public.churn_lifecycle FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role writes churn lifecycle"
  ON public.churn_lifecycle FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER churn_lifecycle_set_updated
  BEFORE UPDATE ON public.churn_lifecycle
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.renewal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose public.renewal_token_purpose NOT NULL,
  intended_tier text NOT NULL DEFAULT 'verified',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX renewal_tokens_user_id_idx ON public.renewal_tokens (user_id);
CREATE INDEX renewal_tokens_expires_at_idx ON public.renewal_tokens (expires_at);

GRANT SELECT ON public.renewal_tokens TO authenticated;
GRANT ALL ON public.renewal_tokens TO service_role;

ALTER TABLE public.renewal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read renewal tokens"
  ON public.renewal_tokens FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role writes renewal tokens"
  ON public.renewal_tokens FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.enter_churn_stage(
  _user_id uuid,
  _stage public.churn_stage,
  _reason text DEFAULT NULL,
  _source_event text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.churn_lifecycle
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  existing public.churn_lifecycle;
  result public.churn_lifecycle;
BEGIN
  SELECT * INTO existing FROM public.churn_lifecycle WHERE user_id = _user_id;
  IF NOT FOUND THEN
    INSERT INTO public.churn_lifecycle (user_id, stage, reason, source_event, metadata)
    VALUES (_user_id, _stage, _reason, _source_event, COALESCE(_metadata, '{}'::jsonb))
    RETURNING * INTO result;
    RETURN result;
  END IF;

  IF existing.stage = _stage THEN
    UPDATE public.churn_lifecycle
    SET reason = COALESCE(_reason, reason),
        source_event = COALESCE(_source_event, source_event),
        metadata = metadata || COALESCE(_metadata, '{}'::jsonb)
    WHERE id = existing.id RETURNING * INTO result;
    RETURN result;
  END IF;

  UPDATE public.churn_lifecycle
  SET stage = _stage, reason = _reason, source_event = _source_event,
      metadata = COALESCE(_metadata, '{}'::jsonb),
      entered_at = now(), last_nudge_at = NULL, nudge_count = 0
  WHERE id = existing.id RETURNING * INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.enter_churn_stage(uuid, public.churn_stage, text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.enter_churn_stage(uuid, public.churn_stage, text, text, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.record_churn_nudge(_user_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.churn_lifecycle
  SET last_nudge_at = now(), nudge_count = nudge_count + 1
  WHERE user_id = _user_id;
$$;
REVOKE ALL ON FUNCTION public.record_churn_nudge(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.record_churn_nudge(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.mint_renewal_token(
  _user_id uuid, _token_hash text, _purpose public.renewal_token_purpose,
  _intended_tier text DEFAULT 'verified', _ttl_days integer DEFAULT 30,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.renewal_tokens LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result public.renewal_tokens;
BEGIN
  INSERT INTO public.renewal_tokens (user_id, token_hash, purpose, intended_tier, expires_at, metadata)
  VALUES (_user_id, _token_hash, _purpose, _intended_tier,
          now() + (_ttl_days || ' days')::interval,
          COALESCE(_metadata, '{}'::jsonb))
  RETURNING * INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.mint_renewal_token(uuid, text, public.renewal_token_purpose, text, integer, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.mint_renewal_token(uuid, text, public.renewal_token_purpose, text, integer, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.consume_renewal_token(_token_hash text)
RETURNS public.renewal_tokens LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result public.renewal_tokens;
BEGIN
  UPDATE public.renewal_tokens
  SET consumed_at = now()
  WHERE token_hash = _token_hash
    AND consumed_at IS NULL
    AND expires_at > now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_renewal_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.consume_renewal_token(text) TO service_role;

CREATE OR REPLACE FUNCTION public.peek_renewal_token(_token_hash text)
RETURNS public.renewal_tokens LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.renewal_tokens
  WHERE token_hash = _token_hash AND consumed_at IS NULL AND expires_at > now()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.peek_renewal_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.peek_renewal_token(text) TO service_role;

CREATE OR REPLACE FUNCTION public.is_pro_hidden_by_churn(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT stage IN ('lapsed', 'dormant') FROM public.churn_lifecycle WHERE user_id = _user_id),
    false
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_pro_hidden_by_churn(uuid) TO authenticated, anon, service_role;
