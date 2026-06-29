-- A4a: Lock writes on legacy archives. service_role retains full access for
-- emergency backfills; authenticated/anon can no longer write. Reads unchanged.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.legacy_stripe_link FROM authenticated, anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.bd_member_seed     FROM authenticated, anon, PUBLIC;

GRANT  SELECT                                ON public.legacy_stripe_link TO authenticated;
GRANT  SELECT                                ON public.bd_member_seed     TO authenticated;
GRANT  ALL                                   ON public.legacy_stripe_link TO service_role;
GRANT  ALL                                   ON public.bd_member_seed     TO service_role;

COMMENT ON TABLE public.legacy_stripe_link IS
  'DEPRECATED 2026-06-29 (Admin v2 / A4a). Read-only archive of pre-cutover BD↔Stripe links. New billing reads go through stripe-mirror.server.ts. service_role retained for emergency backfills only.';
COMMENT ON TABLE public.bd_member_seed IS
  'DEPRECATED 2026-06-29 (Admin v2 / A4a). Read-only archive of the BD CSV import cohort. Locked V7 snapshot in bd_member_seed_pre_v7_snapshot. New billing reads go through stripe-mirror.server.ts. service_role retained for emergency backfills only.';

-- Defensive trigger: log any non-service-role write attempt at NOTICE level
-- (does not block, since service_role bypasses RLS/grants; this catches
-- accidental routing through the authenticated client during A4b refactor).
CREATE OR REPLACE FUNCTION public.warn_legacy_archive_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role'
     AND session_user IS DISTINCT FROM 'service_role' THEN
    RAISE NOTICE 'A4a: write attempt on deprecated archive table % by role=% session_user=%',
      TG_TABLE_NAME, current_setting('role', true), session_user;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS warn_write_legacy_stripe_link ON public.legacy_stripe_link;
DROP TRIGGER IF EXISTS warn_write_bd_member_seed     ON public.bd_member_seed;

CREATE TRIGGER warn_write_legacy_stripe_link
  BEFORE INSERT OR UPDATE OR DELETE ON public.legacy_stripe_link
  FOR EACH ROW EXECUTE FUNCTION public.warn_legacy_archive_write();

CREATE TRIGGER warn_write_bd_member_seed
  BEFORE INSERT OR UPDATE OR DELETE ON public.bd_member_seed
  FOR EACH ROW EXECUTE FUNCTION public.warn_legacy_archive_write();