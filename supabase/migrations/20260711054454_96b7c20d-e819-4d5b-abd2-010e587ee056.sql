-- Certificate templates: Adobe-designed PDFs + coordinate field map
CREATE TABLE public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  certificate_pdf_path text NOT NULL,
  unit_summary_pdf_path text,
  field_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.certificate_templates TO authenticated;
GRANT ALL ON public.certificate_templates TO service_role;

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Admins manage; authenticated users can read (renderer runs under service role anyway)
CREATE POLICY "Admins manage certificate templates"
  ON public.certificate_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read templates"
  ON public.certificate_templates FOR SELECT
  TO authenticated
  USING (true);

-- Only one default at a time
CREATE UNIQUE INDEX certificate_templates_one_default
  ON public.certificate_templates (is_default)
  WHERE is_default = true;

CREATE TRIGGER certificate_templates_updated_at
  BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Provider logo (co-brand slot on certificate)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS certificate_logo_url text;