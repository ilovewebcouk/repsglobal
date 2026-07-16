-- provider_faqs: AI-drafted, provider-approved FAQs shown on /t/{slug}.
CREATE TABLE public.provider_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  question TEXT NOT NULL CHECK (char_length(question) BETWEEN 3 AND 240),
  answer TEXT NOT NULL CHECK (char_length(answer) BETWEEN 3 AND 800),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','hidden')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('ai_suggested','manual')),
  position INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX provider_faqs_pro_pos_idx
  ON public.provider_faqs (professional_id, position);
CREATE INDEX provider_faqs_public_idx
  ON public.provider_faqs (professional_id, position)
  WHERE status = 'published';

GRANT SELECT ON public.provider_faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_faqs TO authenticated;
GRANT ALL ON public.provider_faqs TO service_role;

ALTER TABLE public.provider_faqs ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can read PUBLISHED FAQs.
CREATE POLICY "provider_faqs_public_read"
  ON public.provider_faqs FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Owner can read all their own rows (draft/hidden included).
CREATE POLICY "provider_faqs_owner_read"
  ON public.provider_faqs FOR SELECT
  TO authenticated
  USING (auth.uid() = professional_id);

-- Owner can insert rows for themselves.
CREATE POLICY "provider_faqs_owner_insert"
  ON public.provider_faqs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = professional_id);

-- Owner can update their own rows.
CREATE POLICY "provider_faqs_owner_update"
  ON public.provider_faqs FOR UPDATE
  TO authenticated
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

-- Owner can delete their own rows.
CREATE POLICY "provider_faqs_owner_delete"
  ON public.provider_faqs FOR DELETE
  TO authenticated
  USING (auth.uid() = professional_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.provider_faqs_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER provider_faqs_set_updated_at
  BEFORE UPDATE ON public.provider_faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.provider_faqs_touch_updated_at();