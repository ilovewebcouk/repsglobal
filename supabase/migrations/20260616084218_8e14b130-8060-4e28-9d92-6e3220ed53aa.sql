
-- Add suspension columns to professionals
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Admin-issued invites to new professionals
CREATE TABLE IF NOT EXISTS public.admin_pro_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT NOT NULL DEFAULT 'pro' CHECK (plan IN ('verified','pro')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_url TEXT,
  email_message_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  accepted_at TIMESTAMPTZ,
  accepted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_pro_invites TO authenticated;
GRANT ALL ON public.admin_pro_invites TO service_role;

ALTER TABLE public.admin_pro_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all invites"
  ON public.admin_pro_invites FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_admin_pro_invites_email ON public.admin_pro_invites(lower(email));
CREATE INDEX IF NOT EXISTS idx_admin_pro_invites_invited_by ON public.admin_pro_invites(invited_by);

CREATE TRIGGER tg_admin_pro_invites_updated_at
  BEFORE UPDATE ON public.admin_pro_invites
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
