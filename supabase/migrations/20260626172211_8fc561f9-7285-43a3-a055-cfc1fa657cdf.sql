ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_professionals_is_demo ON public.professionals (is_demo) WHERE is_demo;
UPDATE public.professionals SET is_demo = true WHERE slug IN ('emily-carter','sophie-taylor','liam-roberts','marcus-lee','priya-sharma','hannah-thompson','james-wilson');