ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS social_tiktok text,
  ADD COLUMN IF NOT EXISTS social_x text;