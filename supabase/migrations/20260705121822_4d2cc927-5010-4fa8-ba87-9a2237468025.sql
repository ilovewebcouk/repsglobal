
DROP POLICY IF EXISTS "Anyone can record a profile view" ON public.profile_view_events;
CREATE POLICY "Anyone can record a profile view"
ON public.profile_view_events
FOR INSERT
WITH CHECK (
  professional_id IS NOT NULL
  AND (viewer_user_id IS NULL OR viewer_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Authenticated client can submit review" ON public.reviews;
CREATE POLICY "Authenticated client can submit review"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  client_user_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.professional_id = reviews.professional_id
        AND b.client_user_id = auth.uid()
        AND b.status IN ('paid'::booking_status, 'refunded'::booking_status, 'partially_refunded'::booking_status)
    )
    OR EXISTS (
      SELECT 1 FROM public.client_roster cr
      WHERE cr.professional_id = reviews.professional_id
        AND cr.auth_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Public can view campaign media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view shop-front hero images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view shop-front results images" ON storage.objects;
DROP POLICY IF EXISTS "shop_front_services_public_read" ON storage.objects;
DROP POLICY IF EXISTS "website_hero_public_read" ON storage.objects;
DROP POLICY IF EXISTS "website_results_public_read" ON storage.objects;
DROP POLICY IF EXISTS "website_services_public_read" ON storage.objects;

CREATE TABLE IF NOT EXISTS public.cron_secrets (
  name text PRIMARY KEY,
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cron_secrets TO service_role;
ALTER TABLE public.cron_secrets ENABLE ROW LEVEL SECURITY;

INSERT INTO public.cron_secrets(name, token)
VALUES ('default', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
  tok text;
BEGIN
  SELECT token INTO tok FROM public.cron_secrets WHERE name = 'default';

  PERFORM cron.alter_job(
    job_id := 8,
    command := format($cmd$
      SELECT net.http_post(
        url := 'https://project--53bfbf09-bff5-41a5-a363-d717a797570f.lovable.app/api/public/hooks/send-scheduled-campaigns',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{}'::jsonb
      );
    $cmd$, tok)
  );

  PERFORM cron.alter_job(
    job_id := 560,
    command := format($cmd$
      SELECT net.http_post(
        url := 'https://project--53bfbf09-bff5-41a5-a363-d717a797570f.lovable.app/api/public/cron/seo-index-scan',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $cmd$, tok)
  );
END $$;
