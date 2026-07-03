-- Backfill missing shop_fronts rows for every published pro
INSERT INTO public.shop_fronts (professional_id, layout_variant)
SELECT id, 'full'
FROM public.professionals
WHERE is_published = true
ON CONFLICT (professional_id) DO NOTHING;

-- Replace the old published-gated public policy with a plain public-read policy
DROP POLICY IF EXISTS "Public can read published shop_fronts" ON public.shop_fronts;
CREATE POLICY "Public can read shop_fronts"
  ON public.shop_fronts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Remove the top-level website published flag entirely
ALTER TABLE public.shop_fronts DROP COLUMN IF EXISTS is_published;
ALTER TABLE public.shop_fronts DROP COLUMN IF EXISTS published_at;