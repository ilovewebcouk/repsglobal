ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS trains_at_home_studio boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trains_at_clients_home boolean NOT NULL DEFAULT false;