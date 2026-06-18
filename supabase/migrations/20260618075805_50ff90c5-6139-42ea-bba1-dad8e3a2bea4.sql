ALTER TABLE public.professional_locations
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS region   text;