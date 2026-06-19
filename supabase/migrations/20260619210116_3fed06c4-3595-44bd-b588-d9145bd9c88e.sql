
-- Remove the pro reply-to-review feature: drop RPCs, columns, and RLS policy.
DROP FUNCTION IF EXISTS public.upsert_pro_review_response(uuid, text);
DROP FUNCTION IF EXISTS public.clear_pro_review_response(uuid);

ALTER TABLE public.reviews
  DROP COLUMN IF EXISTS response,
  DROP COLUMN IF EXISTS responded_at,
  DROP COLUMN IF EXISTS response_edited_at,
  DROP COLUMN IF EXISTS response_notified_at;

DROP POLICY IF EXISTS "Pro can respond to own reviews" ON public.reviews;
