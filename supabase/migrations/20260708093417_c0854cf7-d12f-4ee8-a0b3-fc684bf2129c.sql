ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS year_established smallint,
  ADD COLUMN IF NOT EXISTS company_number text;

ALTER TABLE public.professionals
  DROP CONSTRAINT IF EXISTS professionals_year_established_check;
ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_year_established_check
  CHECK (year_established IS NULL OR (year_established >= 1800 AND year_established <= extract(year from now())::int));

ALTER TABLE public.professionals
  DROP CONSTRAINT IF EXISTS professionals_website_url_check;
ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_website_url_check
  CHECK (website_url IS NULL OR website_url ~* '^https?://');