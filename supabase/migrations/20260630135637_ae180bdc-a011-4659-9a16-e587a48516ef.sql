
-- =====================================================================
-- Orphan professional signup cleanup
-- =====================================================================
-- A "deferred signup" can leave an auth.users row behind whenever the
-- pending → paid → ensureUserFromPendingSignup pipeline minted the user
-- but no subscription was ever written (failed webhook, refunded
-- session, manual /checkout/return probe, etc). This migration:
--   1. Deletes the 3 known orphan Kate accounts.
--   2. Installs a hardened daily cron that hard-deletes any
--      professional auth user older than 24h with no subscription,
--      no payment_events, and no remaining pending_signups row.
-- =====================================================================

-- 1) Targeted cleanup of the orphans surfaced in /admin/professionals
DELETE FROM auth.users
WHERE id IN (
  '6c70dc6b-9689-4020-95f4-1f35c23feaed', -- gibbs.krg@gmail.com (Kate G)
  'be8e2c9d-0bfd-41ba-ac63-671344d0a64d', -- kate_pt@icloud.com
  'fe66b5e0-3cac-4dda-b18f-be39c96f00c5'  -- kate_pt+reps@icloud.com
);

-- 2) Reusable cleanup function. SECURITY DEFINER so the cron job can
--    reach auth.users without granting service privileges elsewhere.
CREATE OR REPLACE FUNCTION public.purge_orphan_professional_signups(
  _min_age_hours int DEFAULT 24
)
RETURNS TABLE(deleted_user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT u.id, u.email::text AS email
    FROM auth.users u
    WHERE u.created_at < now() - make_interval(hours => GREATEST(_min_age_hours, 1))
      AND COALESCE(u.raw_user_meta_data->>'signup_kind','') = 'professional'
      AND NOT EXISTS (
        SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.payment_events pe WHERE pe.user_id = u.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.pending_signups ps
        WHERE lower(ps.email) = lower(u.email::text)
          AND ps.consumed_at IS NULL
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = u.id AND ur.role = 'admin'
      )
  LOOP
    BEGIN
      DELETE FROM auth.users WHERE id = r.id;
      deleted_user_id := r.id;
      email := r.email;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      -- Don't let a single bad row stop the sweep; surface via cron logs.
      RAISE NOTICE 'purge_orphan_professional_signups: % failed: %', r.id, SQLERRM;
    END;
  END LOOP;
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_orphan_professional_signups(int) FROM PUBLIC;

-- 3) Nightly cron (03:25 UTC, off-peak)
DO $$
BEGIN
  PERFORM cron.unschedule('purge-orphan-pro-signups-nightly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'purge-orphan-pro-signups-nightly',
  '25 3 * * *',
  $cron$ SELECT public.purge_orphan_professional_signups(24); $cron$
);
