-- Replace the self-referencing WITH CHECK guard with a BEFORE UPDATE trigger
-- that compares OLD vs NEW. The previous WITH CHECK subquery evaluated
-- against the post-update row, so it was trivially satisfied and allowed
-- authenticated pros to self-approve verification / publish / identity /
-- admin_seeded_public / quality_score.

CREATE OR REPLACE FUNCTION public.enforce_professional_self_update_locks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce for non-admin, non-service-role callers acting on their
  -- own row. Admin dashboards and service-role code (webhooks, verification
  -- workflows) bypass this check.
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service role / SQL editor
  END IF;

  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() <> NEW.id THEN
    RETURN NEW; -- other policies will reject; not our concern
  END IF;

  IF NEW.is_published IS DISTINCT FROM OLD.is_published
     OR NEW.verification IS DISTINCT FROM OLD.verification
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.identity_status IS DISTINCT FROM OLD.identity_status
     OR NEW.admin_seeded_public IS DISTINCT FROM OLD.admin_seeded_public
     OR NEW.quality_score IS DISTINCT FROM OLD.quality_score THEN
    RAISE EXCEPTION
      'Verification, publish, identity, admin_seeded_public, and quality_score fields are managed by REPS admins and cannot be changed here.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS professionals_self_update_lock ON public.professionals;
CREATE TRIGGER professionals_self_update_lock
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_professional_self_update_locks();

-- Simplify the self-update policy: the trigger now owns the immutability
-- guarantee, so the WITH CHECK subquery (which didn't actually work) is
-- replaced with a plain ownership check.
DROP POLICY IF EXISTS "Pros update own professional record" ON public.professionals;
CREATE POLICY "Pros update own professional record"
  ON public.professionals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
