-- Website (shop-front) editor: add editable content fields + child tables.

ALTER TABLE public.shop_fronts
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS method_name text,
  ADD COLUMN IF NOT EXISTS method_intro text,
  ADD COLUMN IF NOT EXISTS method_pillars jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS venues jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS coaching_reach jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS client_results_intro text,
  ADD COLUMN IF NOT EXISTS faq_auto_generated boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.shop_front_transformations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text,
  client_first_name text,
  headline text,
  metric text,
  quote text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shop_front_transformations_user_idx
  ON public.shop_front_transformations(user_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_front_transformations TO authenticated;
GRANT ALL ON public.shop_front_transformations TO service_role;
GRANT SELECT ON public.shop_front_transformations TO anon;

ALTER TABLE public.shop_front_transformations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_front_transformations_owner_all ON public.shop_front_transformations;
CREATE POLICY shop_front_transformations_owner_all
  ON public.shop_front_transformations
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS shop_front_transformations_public_read ON public.shop_front_transformations;
CREATE POLICY shop_front_transformations_public_read
  ON public.shop_front_transformations
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE TABLE IF NOT EXISTS public.shop_front_client_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id uuid REFERENCES public.reviews(id) ON DELETE SET NULL,
  headline text,
  body text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shop_front_client_results_user_idx
  ON public.shop_front_client_results(user_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_front_client_results TO authenticated;
GRANT ALL ON public.shop_front_client_results TO service_role;
GRANT SELECT ON public.shop_front_client_results TO anon;

ALTER TABLE public.shop_front_client_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_front_client_results_owner_all ON public.shop_front_client_results;
CREATE POLICY shop_front_client_results_owner_all
  ON public.shop_front_client_results
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS shop_front_client_results_public_read ON public.shop_front_client_results;
CREATE POLICY shop_front_client_results_public_read
  ON public.shop_front_client_results
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE TABLE IF NOT EXISTS public.shop_front_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shop_front_faqs_user_idx
  ON public.shop_front_faqs(user_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_front_faqs TO authenticated;
GRANT ALL ON public.shop_front_faqs TO service_role;
GRANT SELECT ON public.shop_front_faqs TO anon;

ALTER TABLE public.shop_front_faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_front_faqs_owner_all ON public.shop_front_faqs;
CREATE POLICY shop_front_faqs_owner_all
  ON public.shop_front_faqs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS shop_front_faqs_public_read ON public.shop_front_faqs;
CREATE POLICY shop_front_faqs_public_read
  ON public.shop_front_faqs
  FOR SELECT TO anon, authenticated
  USING (true);