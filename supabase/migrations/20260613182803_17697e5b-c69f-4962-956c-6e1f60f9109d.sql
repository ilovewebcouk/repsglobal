
-- 0b.1 Add display_name + business_name to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS business_name text;

-- 0b.2 Audit log for legal-name changes
CREATE TABLE IF NOT EXISTS public.identity_name_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_full_name text,
  new_full_name text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  source text NOT NULL DEFAULT 'self', -- 'self' | 'admin' | 'identity_webhook' | 'fix_it'
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.identity_name_changes TO authenticated;
GRANT ALL ON public.identity_name_changes TO service_role;

ALTER TABLE public.identity_name_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all name changes"
  ON public.identity_name_changes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read their own name changes"
  ON public.identity_name_changes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS identity_name_changes_user_id_idx
  ON public.identity_name_changes(user_id, created_at DESC);

-- 0b.3 Trigger: lock profiles.full_name once identity_status='approved'
-- Service role (admin server fns, webhook) bypasses; signed-in users cannot
-- change their own legal name after approval.
CREATE OR REPLACE FUNCTION public.tg_lock_full_name_after_identity_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  IF NEW.full_name IS NOT DISTINCT FROM OLD.full_name THEN
    RETURN NEW;
  END IF;

  -- Privileged callers (service_role via supabaseAdmin, postgres) bypass.
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  SELECT identity_status INTO v_status
  FROM public.professionals
  WHERE id = NEW.id;

  IF v_status = 'approved' THEN
    RAISE EXCEPTION 'Legal name is locked after identity verification. Contact REPs support to update it.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_lock_full_name_after_identity_approved ON public.profiles;
CREATE TRIGGER tg_lock_full_name_after_identity_approved
  BEFORE UPDATE OF full_name ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_lock_full_name_after_identity_approved();

-- 0b.4 Trigger: log every full_name change (regardless of who made it)
CREATE OR REPLACE FUNCTION public.tg_log_full_name_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    INSERT INTO public.identity_name_changes (user_id, old_full_name, new_full_name, changed_by, source)
    VALUES (
      NEW.id,
      OLD.full_name,
      NEW.full_name,
      auth.uid(),
      CASE WHEN current_user IN ('service_role','postgres','supabase_admin') THEN 'admin' ELSE 'self' END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_log_full_name_change ON public.profiles;
CREATE TRIGGER tg_log_full_name_change
  AFTER UPDATE OF full_name ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_log_full_name_change();
