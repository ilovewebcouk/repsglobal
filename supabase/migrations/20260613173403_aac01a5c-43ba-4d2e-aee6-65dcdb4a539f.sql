
-- Phase 1.5: Google Places hybrid integration
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS google_place_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'curated',
  ADD COLUMN IF NOT EXISTS business_status text;

ALTER TABLE public.gyms
  DROP CONSTRAINT IF EXISTS gyms_source_check;
ALTER TABLE public.gyms
  ADD CONSTRAINT gyms_source_check CHECK (source IN ('curated','google_places','user_submission'));

CREATE INDEX IF NOT EXISTS gyms_google_place_id_idx ON public.gyms (google_place_id) WHERE google_place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS gyms_source_idx ON public.gyms (source);

-- Throttle bypass: Google-sourced gyms are auto-active and never count toward pending limit.
CREATE OR REPLACE FUNCTION public.gyms_throttle_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pending int;
  v_recent int;
BEGIN
  IF NEW.created_by IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(NEW.created_by, 'admin') THEN RETURN NEW; END IF;
  -- Google Places imports bypass the throttle (one-time dedup'd writes).
  IF NEW.source = 'google_places' THEN RETURN NEW; END IF;

  SELECT count(*) INTO v_pending
    FROM public.gyms
    WHERE created_by = NEW.created_by AND status = 'pending_review';
  IF v_pending >= 2 THEN
    RAISE EXCEPTION 'You already have 2 gym submissions awaiting review. Please wait for them to be reviewed before adding more.'
      USING ERRCODE = 'check_violation';
  END IF;
  SELECT count(*) INTO v_recent
    FROM public.gyms
    WHERE created_by = NEW.created_by
      AND created_at > (now() - interval '1 hour')
      AND source <> 'google_places';
  IF v_recent >= 1 THEN
    RAISE EXCEPTION 'You can only submit one new gym per hour. Please try again shortly.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$function$;
