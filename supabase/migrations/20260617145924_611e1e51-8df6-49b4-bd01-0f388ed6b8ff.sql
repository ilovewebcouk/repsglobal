
-- 1. Re-verify admin role on impersonation session updates
DROP POLICY IF EXISTS "Admins can update their own impersonation sessions" ON public.admin_impersonation_sessions;
CREATE POLICY "Admins can update their own impersonation sessions"
ON public.admin_impersonation_sessions
FOR UPDATE
USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Lock down programmes_waitlist inserts to the authenticated professional themselves
DROP POLICY IF EXISTS "Anyone can join programme wait-list" ON public.programmes_waitlist;
CREATE POLICY "Pros can join programme wait-list"
ON public.programmes_waitlist
FOR INSERT
TO authenticated
WITH CHECK (
  professional_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = auth.uid())
);
