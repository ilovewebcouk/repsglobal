
-- 1) Add derived-fields to verification_submissions (rules-engine output preview)
ALTER TABLE public.verification_submissions
  ADD COLUMN IF NOT EXISTS derived_title_slug text,
  ADD COLUMN IF NOT EXISTS derived_specialism_slugs text[];

-- 2) Canonical earned primary title on the professional row
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS primary_title_slug text;

-- 3) pro_titles — derived rows: which titles a pro has earned + the cert that granted it
CREATE TABLE IF NOT EXISTS public.pro_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  title_slug text NOT NULL,
  source_submission_id uuid REFERENCES public.verification_submissions(id) ON DELETE CASCADE,
  granted_by text NOT NULL DEFAULT 'system', -- 'system' | 'admin'
  admin_note text,
  is_primary boolean NOT NULL DEFAULT false,
  granted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pro_titles_unique_per_source
  ON public.pro_titles (professional_id, title_slug, source_submission_id);

CREATE INDEX IF NOT EXISTS pro_titles_pro_idx ON public.pro_titles (professional_id);
CREATE INDEX IF NOT EXISTS pro_titles_primary_idx
  ON public.pro_titles (professional_id) WHERE is_primary = true;

GRANT SELECT ON public.pro_titles TO anon, authenticated;
GRANT ALL ON public.pro_titles TO service_role;

ALTER TABLE public.pro_titles ENABLE ROW LEVEL SECURITY;

-- Pros read their own titles
CREATE POLICY "Pros read own titles"
  ON public.pro_titles
  FOR SELECT
  TO authenticated
  USING (professional_id = auth.uid());

-- Public titles for published pros (so public profile can show them)
CREATE POLICY "Public reads titles of published pros"
  ON public.pro_titles
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = pro_titles.professional_id
        AND p.is_published = true
    )
  );

-- Admins full access
CREATE POLICY "Admins manage titles"
  ON public.pro_titles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER pro_titles_set_updated_at
  BEFORE UPDATE ON public.pro_titles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
