ALTER TABLE public.shop_fronts RENAME TO websites;
ALTER TABLE public.shop_front_client_results RENAME TO website_client_results;
ALTER TABLE public.shop_front_faqs RENAME TO website_faqs;
ALTER TABLE public.shop_front_transformations RENAME TO website_transformations;

DROP POLICY IF EXISTS "shop_front_client_results_owner_all" ON public.website_client_results;
DROP POLICY IF EXISTS "shop_front_client_results_public_read" ON public.website_client_results;
DROP POLICY IF EXISTS "shop_front_faqs_owner_all" ON public.website_faqs;
DROP POLICY IF EXISTS "shop_front_faqs_public_read" ON public.website_faqs;
DROP POLICY IF EXISTS "shop_front_transformations_owner_all" ON public.website_transformations;
DROP POLICY IF EXISTS "shop_front_transformations_public_read" ON public.website_transformations;
DROP POLICY IF EXISTS "Admin can manage shop_fronts" ON public.websites;
DROP POLICY IF EXISTS "Pro can insert own shop_front" ON public.websites;
DROP POLICY IF EXISTS "Pro can read own shop_front" ON public.websites;
DROP POLICY IF EXISTS "Pro can update own shop_front" ON public.websites;
DROP POLICY IF EXISTS "Public can read shop_fronts" ON public.websites;

CREATE POLICY "websites_public_read" ON public.websites FOR SELECT USING (true);
CREATE POLICY "websites_owner_insert" ON public.websites FOR INSERT TO authenticated WITH CHECK (auth.uid() = professional_id);
CREATE POLICY "websites_owner_update" ON public.websites FOR UPDATE TO authenticated USING (auth.uid() = professional_id) WITH CHECK (auth.uid() = professional_id);
CREATE POLICY "websites_admin_all" ON public.websites FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "website_client_results_public_read" ON public.website_client_results FOR SELECT USING (true);
CREATE POLICY "website_client_results_owner_all" ON public.website_client_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "website_faqs_public_read" ON public.website_faqs FOR SELECT USING (true);
CREATE POLICY "website_faqs_owner_all" ON public.website_faqs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "website_transformations_public_read" ON public.website_transformations FOR SELECT USING (true);
CREATE POLICY "website_transformations_owner_all" ON public.website_transformations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT ON public.websites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.websites TO authenticated;
GRANT ALL ON public.websites TO service_role;
GRANT SELECT ON public.website_client_results TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_client_results TO authenticated;
GRANT ALL ON public.website_client_results TO service_role;
GRANT SELECT ON public.website_faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_faqs TO authenticated;
GRANT ALL ON public.website_faqs TO service_role;
GRANT SELECT ON public.website_transformations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_transformations TO authenticated;
GRANT ALL ON public.website_transformations TO service_role;