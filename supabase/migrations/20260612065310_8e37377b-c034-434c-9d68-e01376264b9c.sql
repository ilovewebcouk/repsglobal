ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_is_ai_generated boolean NOT NULL DEFAULT false;