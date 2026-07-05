
-- Prospects: CSV-imported cold contacts (non-members) for outreach campaigns.
-- Kept separate from newsletter_subscribers (public opt-ins) and members (auth users).

DO $$ BEGIN
  CREATE TYPE public.prospect_status AS ENUM ('active', 'converted', 'unsubscribed', 'bounced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS public.prospect_contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext NOT NULL UNIQUE,
  full_name     text,
  list_tag      text,
  source_note   text,
  status        public.prospect_status NOT NULL DEFAULT 'active',
  converted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  imported_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  imported_at   timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_contacts TO authenticated;
GRANT ALL ON public.prospect_contacts TO service_role;

ALTER TABLE public.prospect_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage prospects" ON public.prospect_contacts;
CREATE POLICY "Admins manage prospects"
  ON public.prospect_contacts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS prospect_contacts_status_idx ON public.prospect_contacts (status);
CREATE INDEX IF NOT EXISTS prospect_contacts_tag_idx ON public.prospect_contacts (list_tag) WHERE list_tag IS NOT NULL;

-- updated_at trigger (reuse existing function if present)
DROP TRIGGER IF EXISTS trg_prospect_contacts_updated_at ON public.prospect_contacts;
CREATE TRIGGER trg_prospect_contacts_updated_at
  BEFORE UPDATE ON public.prospect_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-convert prospects when they sign up as members.
CREATE OR REPLACE FUNCTION public.convert_prospect_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.prospect_contacts
     SET status = 'converted',
         converted_user_id = NEW.id,
         updated_at = now()
   WHERE email = NEW.email::citext
     AND status = 'active';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_convert_prospect_on_signup ON auth.users;
CREATE TRIGGER trg_convert_prospect_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.convert_prospect_on_signup();

-- Distinct list-tag helper for admin filter dropdown.
CREATE OR REPLACE FUNCTION public.list_prospect_tags()
RETURNS TABLE(list_tag text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT list_tag, count(*)::bigint
    FROM public.prospect_contacts
   WHERE list_tag IS NOT NULL
   GROUP BY list_tag
   ORDER BY list_tag;
$$;

GRANT EXECUTE ON FUNCTION public.list_prospect_tags() TO authenticated, service_role;
