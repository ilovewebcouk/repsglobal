
-- 1. Normalise audit-trail FKs: preserve history when the acting admin is deleted.

ALTER TABLE public.admin_impersonation_sessions
  ALTER COLUMN admin_id DROP NOT NULL;

ALTER TABLE public.admin_impersonation_sessions
  DROP CONSTRAINT IF EXISTS admin_impersonation_sessions_admin_id_fkey;

ALTER TABLE public.admin_impersonation_sessions
  ADD CONSTRAINT admin_impersonation_sessions_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.admin_pro_invites
  ALTER COLUMN invited_by DROP NOT NULL;

ALTER TABLE public.admin_pro_invites
  DROP CONSTRAINT IF EXISTS admin_pro_invites_invited_by_fkey;

ALTER TABLE public.admin_pro_invites
  ADD CONSTRAINT admin_pro_invites_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;


-- 2. End-to-end deletion smoke test.
-- Attempts DELETE FROM auth.users WHERE id = _user_id inside a savepoint and
-- ALWAYS rolls back. Returns jsonb: { ok, blocking_table, blocking_constraint, error }.
-- Admin-only. Safe to run against any real user without side-effects.

CREATE OR REPLACE FUNCTION public.test_user_deletion_dry_run(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_err_msg    text;
  v_err_detail text;
  v_err_table  text;
  v_err_constr text;
  v_err_state  text;
  v_exists     boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = _user_id) INTO v_exists;
  IF NOT v_exists THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user not found');
  END IF;

  BEGIN
    -- Wrap in a subtransaction so we can catch AND rollback the delete.
    DELETE FROM auth.users WHERE id = _user_id;
    -- Force rollback regardless of success.
    RAISE EXCEPTION 'DRY_RUN_ROLLBACK' USING ERRCODE = 'P0001';
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
      -- Our intentional rollback: the delete would have succeeded.
      RETURN jsonb_build_object('ok', true, 'user_id', _user_id);
    WHEN foreign_key_violation THEN
      GET STACKED DIAGNOSTICS
        v_err_msg    = MESSAGE_TEXT,
        v_err_detail = PG_EXCEPTION_DETAIL,
        v_err_table  = TABLE_NAME,
        v_err_constr = CONSTRAINT_NAME,
        v_err_state  = RETURNED_SQLSTATE;
      RETURN jsonb_build_object(
        'ok', false,
        'user_id', _user_id,
        'error', v_err_msg,
        'detail', v_err_detail,
        'blocking_table', v_err_table,
        'blocking_constraint', v_err_constr,
        'sqlstate', v_err_state
      );
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS
        v_err_msg    = MESSAGE_TEXT,
        v_err_detail = PG_EXCEPTION_DETAIL,
        v_err_state  = RETURNED_SQLSTATE;
      RETURN jsonb_build_object(
        'ok', false,
        'user_id', _user_id,
        'error', v_err_msg,
        'detail', v_err_detail,
        'sqlstate', v_err_state
      );
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.test_user_deletion_dry_run(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.test_user_deletion_dry_run(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.test_user_deletion_dry_run(uuid) IS
  'Admin-only. Simulates deleting a user and rolls back. Returns { ok, blocking_table, blocking_constraint } so cancellation paths can be verified before running for real.';
