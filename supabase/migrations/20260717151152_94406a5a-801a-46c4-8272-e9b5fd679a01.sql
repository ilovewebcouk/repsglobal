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
  AND identity_status      = (SELECT p.identity_status      FROM public.professionals p WHERE p.id = professionals.id)
  AND admin_seeded_public  = (SELECT p.admin_seeded_public  FROM public.professionals p WHERE p.id = professionals.id)
  AND quality_score        = (SELECT p.quality_score        FROM public.professionals p WHERE p.id = professionals.id)
);