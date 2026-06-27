
-- =====================================================================
-- P1 #7 — has_role permissions hardening + ghost-subscription guardrails
-- =====================================================================

-- Part A: Tighten user_roles grants.
-- RLS already restricts writes to admins, but defense-in-depth: explicitly
-- revoke INSERT/UPDATE/DELETE from anon and authenticated. Admin mutations
-- go through service_role (supabaseAdmin) in src/lib/admin/team.functions.ts.
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.user_roles FROM authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Part B step 1: Auto-cancel + audit subscriptions when an auth user is deleted.
-- Prevents the Cruz/Raheela class of ghost subscription where the auth.users
-- row is gone but public.subscriptions still shows status='active'.
CREATE OR REPLACE FUNCTION public.on_auth_user_deleted_cleanup_subscriptions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INT;
BEGIN
  UPDATE public.subscriptions
     SET status        = 'canceled',
         canceled_at   = COALESCE(canceled_at, now()),
         updated_at    = now(),
         metadata      = COALESCE(metadata, '{}'::jsonb)
                       || jsonb_build_object('cancel_reason', 'user_deleted',
                                             'user_deleted_at', now())
   WHERE user_id = OLD.id
     AND status <> 'canceled';
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected > 0 THEN
    BEGIN
      INSERT INTO public.admin_audit_log (actor_id, action, target_table, target_id, metadata)
      VALUES (NULL, 'ghost_subscription_auto_cancel', 'subscriptions', OLD.id,
              jsonb_build_object('affected_rows', affected, 'reason', 'auth_user_deleted'));
    EXCEPTION WHEN OTHERS THEN
      -- Don't block the user delete on audit failure
      NULL;
    END;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted_cleanup_subscriptions ON auth.users;
CREATE TRIGGER on_auth_user_deleted_cleanup_subscriptions
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.on_auth_user_deleted_cleanup_subscriptions();
