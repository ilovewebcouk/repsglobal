
-- 1) Hide sensitive professional columns from anonymous visitors
REVOKE SELECT (contact_phone, identity_verified_name, identity_verified_dob,
               stripe_identity_session_id, suspension_reason, suspended_at,
               verification_grace_until, cert_uploaded_at)
ON public.professionals FROM anon;

-- 2) Restrict Realtime channel subscriptions to admins (only support_tickets
-- and support_messages are published; the only in-app subscribers are admin
-- screens, so admin-only access is safe).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='realtime' AND tablename='messages'
      AND policyname='Admins read realtime messages'
  ) THEN
    CREATE POLICY "Admins read realtime messages"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END$$;

-- 3) Lock down mutable search_path on remaining functions
ALTER FUNCTION public.credit_tier_policy(public.subscription_tier) SET search_path = public;
ALTER FUNCTION public.professional_gyms_max_three() SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- 4) Remove broad SELECT policy on public avatars bucket. Public buckets serve
-- files via the storage CDN without needing a SELECT policy on storage.objects,
-- and the broad policy was allowing clients to LIST every file in the bucket.
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
