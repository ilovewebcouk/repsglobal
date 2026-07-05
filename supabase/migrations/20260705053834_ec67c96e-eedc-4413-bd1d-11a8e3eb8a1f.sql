
-- =====================================================================
-- 1. website_faqs.is_published
-- =====================================================================
ALTER TABLE public.website_faqs
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- =====================================================================
-- 2. RLS: drop wide-open public_read policies, add owner_select
-- =====================================================================
DROP POLICY IF EXISTS websites_public_read ON public.websites;
DROP POLICY IF EXISTS website_transformations_public_read ON public.website_transformations;
DROP POLICY IF EXISTS website_client_results_public_read ON public.website_client_results;
DROP POLICY IF EXISTS website_faqs_public_read ON public.website_faqs;

DROP POLICY IF EXISTS websites_owner_select ON public.websites;
CREATE POLICY websites_owner_select ON public.websites
  FOR SELECT TO authenticated
  USING (auth.uid() = professional_id);

-- Data API grants (defensive top-up)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.websites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_transformations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_client_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_faqs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.websites TO service_role;
GRANT ALL ON public.website_transformations TO service_role;
GRANT ALL ON public.website_client_results TO service_role;
GRANT ALL ON public.website_faqs TO service_role;
GRANT ALL ON public.services TO service_role;

-- =====================================================================
-- 3. Dirty-tracking triggers for edits outside the four snapshot tables
-- =====================================================================
CREATE OR REPLACE FUNCTION public.mark_website_dirty_for_pro(_pro_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _pro_id IS NULL THEN RETURN; END IF;
  UPDATE public.websites
     SET has_unpublished_changes = true
   WHERE professional_id = _pro_id
     AND has_unpublished_changes IS DISTINCT FROM true;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_website_dirty_from_professionals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.mark_website_dirty_for_pro(NEW.id);
    RETURN NEW;
  END IF;
  IF NEW.specialisms IS DISTINCT FROM OLD.specialisms
     OR NEW.languages IS DISTINCT FROM OLD.languages
     OR NEW.contact_phone IS DISTINCT FROM OLD.contact_phone
     OR NEW.social_instagram IS DISTINCT FROM OLD.social_instagram
     OR NEW.social_tiktok IS DISTINCT FROM OLD.social_tiktok
     OR NEW.social_youtube IS DISTINCT FROM OLD.social_youtube
     OR NEW.social_x IS DISTINCT FROM OLD.social_x
     OR NEW.social_linkedin IS DISTINCT FROM OLD.social_linkedin
     OR NEW.in_person_available IS DISTINCT FROM OLD.in_person_available
     OR NEW.online_available IS DISTINCT FROM OLD.online_available
     OR NEW.trains_at_home_studio IS DISTINCT FROM OLD.trains_at_home_studio
     OR NEW.trains_at_clients_home IS DISTINCT FROM OLD.trains_at_clients_home
     OR NEW.headline IS DISTINCT FROM OLD.headline
     OR NEW.primary_profession IS DISTINCT FROM OLD.primary_profession
     OR NEW.city IS DISTINCT FROM OLD.city
  THEN
    PERFORM public.mark_website_dirty_for_pro(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_website_dirty_on_professionals ON public.professionals;
CREATE TRIGGER mark_website_dirty_on_professionals
AFTER INSERT OR UPDATE ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.mark_website_dirty_from_professionals();

CREATE OR REPLACE FUNCTION public.mark_website_dirty_from_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
    PERFORM public.mark_website_dirty_for_pro(NEW.id);
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.mark_website_dirty_for_pro(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_website_dirty_on_profiles ON public.profiles;
CREATE TRIGGER mark_website_dirty_on_profiles
AFTER INSERT OR UPDATE OF avatar_url ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.mark_website_dirty_from_profiles();

DROP TRIGGER IF EXISTS mark_website_dirty_on_locations ON public.professional_locations;
CREATE TRIGGER mark_website_dirty_on_locations
AFTER INSERT OR UPDATE OR DELETE ON public.professional_locations
FOR EACH ROW EXECUTE FUNCTION public.mark_website_dirty();

DROP TRIGGER IF EXISTS mark_website_dirty_on_gyms ON public.professional_gyms;
CREATE TRIGGER mark_website_dirty_on_gyms
AFTER INSERT OR UPDATE OR DELETE ON public.professional_gyms
FOR EACH ROW EXECUTE FUNCTION public.mark_website_dirty();

-- =====================================================================
-- 4. Purge cert / policy numbers from existing snapshots
-- =====================================================================
UPDATE public.websites
   SET published_snapshot = jsonb_set(
     published_snapshot,
     '{website,trust,items}',
     COALESCE(
       (
         SELECT jsonb_agg(item - 'id')
         FROM jsonb_array_elements(published_snapshot->'website'->'trust'->'items') AS item
       ),
       '[]'::jsonb
     ),
     false
   )
 WHERE published_snapshot IS NOT NULL
   AND jsonb_typeof(published_snapshot #> '{website,trust,items}') = 'array';
