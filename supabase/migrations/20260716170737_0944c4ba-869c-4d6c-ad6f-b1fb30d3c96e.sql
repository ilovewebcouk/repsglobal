ALTER TABLE public.pending_signups DROP CONSTRAINT IF EXISTS pending_signups_tier_check;
ALTER TABLE public.pending_signups ADD CONSTRAINT pending_signups_tier_check
  CHECK (tier IN ('verified','pro','studio','training_provider'));