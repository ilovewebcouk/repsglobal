DROP INDEX IF EXISTS public.reviews_bd_review_id_key;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_bd_review_id_key UNIQUE (bd_review_id);