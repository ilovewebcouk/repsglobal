
-- 1. Backfill missing slugs from profile full_name (falls back to short id)
UPDATE public.professionals p
SET slug = public.slugify_unique(
  COALESCE(NULLIF(trim(pr.full_name), ''), 'pro-' || substr(p.id::text, 1, 8))
)
FROM public.profiles pr
WHERE pr.id = p.id
  AND (p.slug IS NULL OR p.slug = '');

-- Any row still without a profile row / name — fallback purely on id
UPDATE public.professionals
SET slug = public.slugify_unique('pro-' || substr(id::text, 1, 8))
WHERE slug IS NULL OR slug = '';

-- 2. Trigger to auto-assign a slug on INSERT when caller omits one
CREATE OR REPLACE FUNCTION public.tg_professionals_ensure_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;

  SELECT NULLIF(trim(full_name), '') INTO v_name
  FROM public.profiles
  WHERE id = NEW.id;

  NEW.slug := public.slugify_unique(
    COALESCE(v_name, 'pro-' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS professionals_ensure_slug ON public.professionals;
CREATE TRIGGER professionals_ensure_slug
  BEFORE INSERT ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_professionals_ensure_slug();
