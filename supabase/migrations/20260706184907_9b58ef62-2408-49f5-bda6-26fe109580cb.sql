UPDATE storage.objects SET bucket_id = 'website-hero' WHERE bucket_id = 'shop-front-hero';

UPDATE public.websites
SET hero_image_url = REPLACE(hero_image_url,
    '/storage/v1/object/public/shop-front-hero/',
    '/storage/v1/object/public/website-hero/')
WHERE hero_image_url ILIKE '%/shop-front-hero/%';

DROP POLICY IF EXISTS "Owners can delete their hero images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update their hero images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload their hero images" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access to shop-front hero" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their result images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update their result images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload their result images" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access to shop-front results" ON storage.objects;
DROP POLICY IF EXISTS "shop_front_services_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "shop_front_services_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "shop_front_services_owner_update" ON storage.objects;

SELECT cron.unschedule('churn-lifecycle-daily');
SELECT cron.unschedule('legacy-stripe-renewal-daily');
SELECT cron.unschedule('support-auto-close-daily');