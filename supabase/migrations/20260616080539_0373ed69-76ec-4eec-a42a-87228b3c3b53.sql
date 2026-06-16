
CREATE TABLE public.admin_impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  ended_at timestamptz,
  ended_reason text,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_aimp_admin_active ON public.admin_impersonation_sessions(admin_id, ended_at) WHERE ended_at IS NULL;
CREATE INDEX idx_aimp_token ON public.admin_impersonation_sessions(session_token);

GRANT SELECT, INSERT, UPDATE ON public.admin_impersonation_sessions TO authenticated;
GRANT ALL ON public.admin_impersonation_sessions TO service_role;

ALTER TABLE public.admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own impersonation sessions"
ON public.admin_impersonation_sessions FOR SELECT
TO authenticated
USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert their own impersonation sessions"
ON public.admin_impersonation_sessions FOR INSERT
TO authenticated
WITH CHECK (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update their own impersonation sessions"
ON public.admin_impersonation_sessions FOR UPDATE
TO authenticated
USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (admin_id = auth.uid());
