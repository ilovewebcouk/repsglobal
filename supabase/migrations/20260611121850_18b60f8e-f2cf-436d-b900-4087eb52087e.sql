CREATE OR REPLACE FUNCTION public.has_active_tier(_user_id uuid, _tiers public.subscription_tier[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND tier = ANY(_tiers)
      AND status IN ('active', 'trialing', 'past_due', 'unpaid')
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_active_tier(uuid, public.subscription_tier[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_tier(uuid, public.subscription_tier[]) TO authenticated, service_role;

DROP POLICY IF EXISTS "Pros manage own roster" ON public.client_roster;
CREATE POLICY "Active Pro members manage own roster"
  ON public.client_roster
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = professional_id
    AND public.has_active_tier(auth.uid(), ARRAY['pro'::public.subscription_tier, 'studio'::public.subscription_tier])
  )
  WITH CHECK (
    auth.uid() = professional_id
    AND public.has_active_tier(auth.uid(), ARRAY['pro'::public.subscription_tier, 'studio'::public.subscription_tier])
  );