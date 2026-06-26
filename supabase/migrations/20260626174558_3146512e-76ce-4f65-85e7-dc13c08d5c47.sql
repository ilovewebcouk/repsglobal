ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS secondary_title_slug TEXT NULL;

ALTER TABLE public.professionals DROP CONSTRAINT IF EXISTS professionals_secondary_title_distinct_chk;
ALTER TABLE public.professionals ADD CONSTRAINT professionals_secondary_title_distinct_chk
  CHECK (secondary_title_slug IS NULL OR primary_title_slug IS NULL OR secondary_title_slug <> primary_title_slug);