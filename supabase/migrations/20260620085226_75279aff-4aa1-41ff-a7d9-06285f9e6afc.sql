-- Remove anon SELECT on reviews; all public review reads go through server functions using supabaseAdmin with explicit column projections that exclude client_email.
DROP POLICY IF EXISTS "Public can read published reviews" ON public.reviews;

-- Remove broad anon SELECT/listing policy on pro-photos bucket. Bucket remains public so direct file URLs continue to serve; listing the bucket via the storage API is no longer possible anonymously.
DROP POLICY IF EXISTS "Public read for pro-photos" ON storage.objects;