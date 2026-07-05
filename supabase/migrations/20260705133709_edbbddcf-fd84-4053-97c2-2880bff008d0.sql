-- Admin visibility into password reset requests.
-- Returns auth.users.recovery_sent_at for a given user. Restricted to admins.
CREATE OR REPLACE FUNCTION public.admin_get_recovery_sent_at(_user_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_ts timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT recovery_sent_at INTO v_ts FROM auth.users WHERE id = _user_id;
  RETURN v_ts;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_recovery_sent_at(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_recovery_sent_at(uuid) TO authenticated;

-- Returns the last N recovery email send attempts for a user email. Admin only.
CREATE OR REPLACE FUNCTION public.admin_get_recovery_email_log(_email text, _limit int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  status text,
  error_message text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT l.id, l.status, l.error_message, l.created_at
    FROM public.email_send_log l
    WHERE l.recipient_email = lower(_email)
      AND l.template_name = 'recovery'
    ORDER BY l.created_at DESC
    LIMIT COALESCE(_limit, 10);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_recovery_email_log(text, int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_recovery_email_log(text, int) TO authenticated;