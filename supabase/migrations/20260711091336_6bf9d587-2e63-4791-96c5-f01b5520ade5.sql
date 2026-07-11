ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS contact_first_name text,
  ADD COLUMN IF NOT EXISTS contact_last_name text;