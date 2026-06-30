ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS bullets text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS price_unit text,
  ADD COLUMN IF NOT EXISTS cta_label text;