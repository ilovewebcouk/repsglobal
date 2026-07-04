
-- 1. Snapshot columns on websites
ALTER TABLE public.websites
  ADD COLUMN IF NOT EXISTS published_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS has_unpublished_changes boolean NOT NULL DEFAULT true;

-- 2. Dirty-tracking trigger. Marks the owning websites row as dirty on any
--    content change. Uses SECURITY DEFINER so editor writes (running as
--    authenticated user with RLS) can bump the websites row even where the
--    trigger updates another row that they own via the same auth.uid().
CREATE OR REPLACE FUNCTION public.mark_website_dirty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
BEGIN
  -- Resolve owner id from the row itself. Each table stores it under a
  -- slightly different column name, so probe both.
  IF TG_OP = 'DELETE' THEN
    BEGIN
      owner_id := (row_to_json(OLD)->>'professional_id')::uuid;
    EXCEPTION WHEN OTHERS THEN owner_id := NULL;
    END;
    IF owner_id IS NULL THEN
      BEGIN
        owner_id := (row_to_json(OLD)->>'user_id')::uuid;
      EXCEPTION WHEN OTHERS THEN owner_id := NULL;
      END;
    END IF;
  ELSE
    BEGIN
      owner_id := (row_to_json(NEW)->>'professional_id')::uuid;
    EXCEPTION WHEN OTHERS THEN owner_id := NULL;
    END;
    IF owner_id IS NULL THEN
      BEGIN
        owner_id := (row_to_json(NEW)->>'user_id')::uuid;
      EXCEPTION WHEN OTHERS THEN owner_id := NULL;
      END;
    END IF;
  END IF;

  IF owner_id IS NOT NULL THEN
    UPDATE public.websites
       SET has_unpublished_changes = true
     WHERE professional_id = owner_id
       AND has_unpublished_changes IS DISTINCT FROM true;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Websites own-row trigger: skip when only publish bookkeeping columns changed
CREATE OR REPLACE FUNCTION public.mark_website_dirty_self()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If ONLY publish bookkeeping fields changed, don't flag as dirty.
  IF NEW.published_snapshot IS DISTINCT FROM OLD.published_snapshot
     OR NEW.published_at IS DISTINCT FROM OLD.published_at
     OR NEW.has_unpublished_changes IS DISTINCT FROM OLD.has_unpublished_changes THEN
    -- Publish path can proceed; only mark dirty if a real content column moved.
    IF NEW.tagline IS NOT DISTINCT FROM OLD.tagline
       AND NEW.subtitle IS NOT DISTINCT FROM OLD.subtitle
       AND NEW.about IS NOT DISTINCT FROM OLD.about
       AND NEW.hero_image_url IS NOT DISTINCT FROM OLD.hero_image_url
       AND NEW.accent_hex IS NOT DISTINCT FROM OLD.accent_hex
       AND NEW.method_name IS NOT DISTINCT FROM OLD.method_name
       AND NEW.method_intro IS NOT DISTINCT FROM OLD.method_intro
       AND NEW.method_pillars IS NOT DISTINCT FROM OLD.method_pillars
       AND NEW.venues IS NOT DISTINCT FROM OLD.venues
       AND NEW.coaching_reach IS NOT DISTINCT FROM OLD.coaching_reach
       AND NEW.client_results_intro IS NOT DISTINCT FROM OLD.client_results_intro
       AND NEW.layout_variant IS NOT DISTINCT FROM OLD.layout_variant
       AND NEW.theme IS NOT DISTINCT FROM OLD.theme
    THEN
      RETURN NEW;
    END IF;
  END IF;

  NEW.has_unpublished_changes := true;
  RETURN NEW;
END;
$$;

-- 3. Attach triggers
DROP TRIGGER IF EXISTS mark_website_dirty_services ON public.services;
CREATE TRIGGER mark_website_dirty_services
  AFTER INSERT OR UPDATE OR DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.mark_website_dirty();

DROP TRIGGER IF EXISTS mark_website_dirty_transformations ON public.website_transformations;
CREATE TRIGGER mark_website_dirty_transformations
  AFTER INSERT OR UPDATE OR DELETE ON public.website_transformations
  FOR EACH ROW EXECUTE FUNCTION public.mark_website_dirty();

DROP TRIGGER IF EXISTS mark_website_dirty_client_results ON public.website_client_results;
CREATE TRIGGER mark_website_dirty_client_results
  AFTER INSERT OR UPDATE OR DELETE ON public.website_client_results
  FOR EACH ROW EXECUTE FUNCTION public.mark_website_dirty();

DROP TRIGGER IF EXISTS mark_website_dirty_faqs ON public.website_faqs;
CREATE TRIGGER mark_website_dirty_faqs
  AFTER INSERT OR UPDATE OR DELETE ON public.website_faqs
  FOR EACH ROW EXECUTE FUNCTION public.mark_website_dirty();

DROP TRIGGER IF EXISTS mark_website_dirty_self ON public.websites;
CREATE TRIGGER mark_website_dirty_self
  BEFORE UPDATE ON public.websites
  FOR EACH ROW EXECUTE FUNCTION public.mark_website_dirty_self();

-- 4. Backfill: existing websites should NOT be flagged as dirty on rollout —
--    people mid-flight expect their current live content to keep serving.
UPDATE public.websites
   SET has_unpublished_changes = false,
       published_at = COALESCE(published_at, now())
 WHERE has_unpublished_changes = true
   AND published_snapshot IS NULL;
