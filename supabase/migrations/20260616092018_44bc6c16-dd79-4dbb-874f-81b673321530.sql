
ALTER TABLE public.legacy_stripe_link
  ADD COLUMN IF NOT EXISTS eligible_for_legacy_price BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stripe_schedule_id TEXT;

-- Backfill: every row created before launch represents a pre-launch BD member
-- who is honoured at the legacy £34 price for their first year on REPs.
UPDATE public.legacy_stripe_link
SET eligible_for_legacy_price = true
WHERE eligible_for_legacy_price IS DISTINCT FROM true;
