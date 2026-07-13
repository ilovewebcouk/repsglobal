-- 1) Fix SECURITY DEFINER views by switching them to SECURITY INVOKER
ALTER VIEW public.v_identity_review_queue SET (security_invoker = on);
ALTER VIEW public.v_qualifications_review_queue SET (security_invoker = on);

-- 2) Lock down function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at_col()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$function$;

-- 3) Remove broad anon SELECT policy that allows listing on the public
--    'organisation-assets' bucket. Public files remain reachable by their
--    direct public URL (which does not go through RLS).
DROP POLICY IF EXISTS "Public can view organisation assets" ON storage.objects;

-- 4) Add DELETE policies to public.clients so owners, coaches, and admins
--    can remove their own health-record rows.
CREATE POLICY "Clients delete own record"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Pros delete their clients' client record"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (public.is_coach_of(auth.uid(), id));

-- 5) Tighten professional_gyms INSERT: require the caller to actually be
--    an existing professional (row in public.professionals) — not just any
--    authenticated user.
DROP POLICY IF EXISTS "Pros insert own gym links" ON public.professional_gyms;
CREATE POLICY "Pros insert own gym links"
  ON public.professional_gyms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = professional_id
    AND verified_by_gym = false
    AND EXISTS (
      SELECT 1 FROM public.professionals p WHERE p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Pros update own gym links" ON public.professional_gyms;
CREATE POLICY "Pros update own gym links"
  ON public.professional_gyms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = professional_id)
  WITH CHECK (
    auth.uid() = professional_id
    AND verified_by_gym = false
    AND EXISTS (
      SELECT 1 FROM public.professionals p WHERE p.id = auth.uid()
    )
  );
