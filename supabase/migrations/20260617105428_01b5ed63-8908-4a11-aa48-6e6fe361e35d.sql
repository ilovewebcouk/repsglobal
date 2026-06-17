-- Add member_since to professionals: COALESCE(bd_member_seed.legacy_signup_at, professionals.created_at)
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS member_since timestamptz;

-- Backfill from BD seed where claimed; fall back to created_at otherwise.
UPDATE public.professionals p
SET member_since = COALESCE(s.legacy_signup_at, p.created_at)
FROM public.bd_member_seed s
WHERE s.claimed_user_id = p.id
  AND p.member_since IS DISTINCT FROM COALESCE(s.legacy_signup_at, p.created_at);

UPDATE public.professionals
SET member_since = created_at
WHERE member_since IS NULL;

-- Trigger: default member_since to created_at on insert when null
CREATE OR REPLACE FUNCTION public.tg_professionals_default_member_since()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.member_since IS NULL THEN
    NEW.member_since := COALESCE(NEW.created_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS professionals_default_member_since ON public.professionals;
CREATE TRIGGER professionals_default_member_since
  BEFORE INSERT ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_professionals_default_member_since();