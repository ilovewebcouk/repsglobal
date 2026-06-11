
-- 1. Restrict profiles SELECT: remove blanket "any authenticated user" read.
DROP POLICY IF EXISTS "Authenticated users view profiles" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Prevent professionals from self-promoting via is_published / verification fields.
DROP POLICY IF EXISTS "Pros update own professional record" ON public.professionals;

CREATE POLICY "Pros update own professional record"
ON public.professionals
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND is_published         = (SELECT p.is_published         FROM public.professionals p WHERE p.id = professionals.id)
  AND verification         = (SELECT p.verification         FROM public.professionals p WHERE p.id = professionals.id)
  AND verification_status  = (SELECT p.verification_status  FROM public.professionals p WHERE p.id = professionals.id)
);

-- 3. Lock down internal email-queue SECURITY DEFINER helpers: service_role only + fixed search_path.
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.enqueue_email(text, jsonb)               SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint)               SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb)   SET search_path = public, pgmq;

-- 4. tg_set_updated_at trigger function: fix mutable search_path warning.
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
