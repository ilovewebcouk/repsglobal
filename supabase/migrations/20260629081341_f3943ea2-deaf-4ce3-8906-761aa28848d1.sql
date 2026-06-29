CREATE TYPE public.mailing_list_deletion_reason AS ENUM (
  'admin_cancel_immediate',
  'admin_cancel_period_end',
  'admin_end_trial',
  'admin_delete',
  'member_request'
);

CREATE TABLE public.mailing_list_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  profession TEXT,
  city TEXT,
  former_user_id UUID,
  last_tier TEXT,
  deletion_reason public.mailing_list_deletion_reason NOT NULL,
  deletion_notes TEXT,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'cancellation',
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX mailing_list_contacts_email_lower_idx
  ON public.mailing_list_contacts (lower(email));
CREATE INDEX mailing_list_contacts_optin_idx
  ON public.mailing_list_contacts (marketing_opt_in) WHERE marketing_opt_in = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mailing_list_contacts TO authenticated;
GRANT ALL ON public.mailing_list_contacts TO service_role;

ALTER TABLE public.mailing_list_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read mailing list" ON public.mailing_list_contacts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write mailing list" ON public.mailing_list_contacts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER mailing_list_contacts_updated_at
  BEFORE UPDATE ON public.mailing_list_contacts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
