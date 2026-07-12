-- Collapse provider name fields to one source of truth.
-- profiles.full_name = the display name (provider or individual).
-- professionals.identity_verified_name = Stripe Identity result (compliance only).
-- Everything else is redundant.

ALTER TABLE public.professionals
  DROP COLUMN IF EXISTS contact_first_name,
  DROP COLUMN IF EXISTS contact_last_name,
  DROP COLUMN IF EXISTS legal_entity_name;
