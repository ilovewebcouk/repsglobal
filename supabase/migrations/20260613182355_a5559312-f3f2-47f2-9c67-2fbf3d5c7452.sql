
-- 0a.1 Backfill: professionals.identity_status 'verified' -> 'approved'
UPDATE public.professionals
SET identity_status = 'approved'
WHERE identity_status = 'verified';

-- 0a.2 Idempotency column + unique partial index on verification_decisions
ALTER TABLE public.verification_decisions
  ADD COLUMN IF NOT EXISTS stripe_event_id text;

CREATE UNIQUE INDEX IF NOT EXISTS verification_decisions_stripe_event_id_uidx
  ON public.verification_decisions (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;
