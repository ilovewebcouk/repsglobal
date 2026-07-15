
-- 1. Loosen CHECK, rename value, tighten CHECK again.
ALTER TABLE public.professionals
  DROP CONSTRAINT IF EXISTS professionals_account_type_check;

UPDATE public.professionals
   SET account_type = 'training_provider'
 WHERE account_type = 'organisation';

ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_account_type_check
  CHECK (account_type IN ('individual','training_provider'));

-- 2. Purge provider-side test data.
DELETE FROM public.certificate_batches;
DELETE FROM public.certificate_registrations;
DELETE FROM public.learners;
DELETE FROM public.provider_regulated_permissions;
DELETE FROM public.provider_domain_verifications;
DELETE FROM public.provider_change_requests;
DELETE FROM public.provider_name_requests;
DELETE FROM public.reps_course_evidence;
DELETE FROM public.reps_courses;
DELETE FROM public.course_accreditation_files;

-- 3. Drop dead `courses` table.
DROP TABLE IF EXISTS public.courses CASCADE;

-- 4. Delete the 2 test training-provider auth users (cascades to professionals row).
DELETE FROM auth.users
 WHERE id IN (
   SELECT id FROM public.professionals WHERE account_type = 'training_provider'
 );
