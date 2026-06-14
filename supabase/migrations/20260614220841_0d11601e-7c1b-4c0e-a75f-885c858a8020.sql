
-- ============================================================
-- Admin audit log
-- ============================================================

CREATE TABLE public.admin_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  target_table  TEXT,
  target_id     UUID,
  before_state  JSONB,
  after_state   JSONB,
  reason        TEXT,
  ip            INET,
  user_agent    TEXT,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- Helper: log_admin_action (SECURITY DEFINER)
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_admin_action(
  _actor_id     UUID,
  _action       TEXT,
  _target_table TEXT DEFAULT NULL,
  _target_id    UUID DEFAULT NULL,
  _before_state JSONB DEFAULT NULL,
  _after_state  JSONB DEFAULT NULL,
  _reason       TEXT DEFAULT NULL,
  _ip           INET DEFAULT NULL,
  _user_agent   TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.admin_audit_log (
    actor_id, action, target_table, target_id,
    before_state, after_state, reason, ip, user_agent
  ) VALUES (
    _actor_id, _action, _target_table, _target_id,
    _before_state, _after_state, _reason, _ip, _user_agent
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
