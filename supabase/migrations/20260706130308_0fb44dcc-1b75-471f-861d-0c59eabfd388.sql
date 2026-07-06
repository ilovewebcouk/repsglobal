
-- 1. Extend professionals with account type + organisation fields
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'individual'
    CHECK (account_type IN ('individual', 'organisation')),
  ADD COLUMN IF NOT EXISTS legal_entity_name text,
  ADD COLUMN IF NOT EXISTS company_registration text,
  ADD COLUMN IF NOT EXISTS staff_count integer,
  ADD COLUMN IF NOT EXISTS awarding_bodies text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_professionals_account_type
  ON public.professionals(account_type);

-- 2. Extend services with course fields
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS service_kind text NOT NULL DEFAULT 'session'
    CHECK (service_kind IN ('session', 'package', 'course', 'programme')),
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS seats_total integer,
  ADD COLUMN IF NOT EXISTS seats_taken integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS venue text,
  ADD COLUMN IF NOT EXISTS qualification_level text,
  ADD COLUMN IF NOT EXISTS awarding_body text;

CREATE INDEX IF NOT EXISTS idx_services_kind_starts
  ON public.services(service_kind, starts_at)
  WHERE service_kind IN ('course', 'programme');

-- 3. Drop the parallel provider/organisation tables (no live data)
DROP TABLE IF EXISTS public.provider_review_flags CASCADE;
DROP TABLE IF EXISTS public.provider_review_evidence CASCADE;
DROP TABLE IF EXISTS public.provider_review_requests CASCADE;
DROP TABLE IF EXISTS public.provider_reviews CASCADE;
DROP TABLE IF EXISTS public.organisation_users CASCADE;
DROP TABLE IF EXISTS public.organisations CASCADE;

-- 4. Drop the org-specific enum if it's no longer referenced
DROP TYPE IF EXISTS public.organisation_status CASCADE;
