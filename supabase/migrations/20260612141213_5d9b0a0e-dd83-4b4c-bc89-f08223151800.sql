-- Rename public_phone -> contact_phone (internal-only, never public) + E.164 constraint + backfill
ALTER TABLE public.professionals RENAME COLUMN public_phone TO contact_phone;

-- Normalise existing freeform values
UPDATE public.professionals
SET contact_phone = CASE
  WHEN contact_phone IS NULL THEN NULL
  WHEN regexp_replace(contact_phone, '\s|-|\(|\)', '', 'g') ~ '^\+[1-9]\d{6,14}$'
    THEN regexp_replace(contact_phone, '\s|-|\(|\)', '', 'g')
  WHEN regexp_replace(contact_phone, '\s|-|\(|\)', '', 'g') ~ '^07\d{9}$'
    THEN '+44' || substring(regexp_replace(contact_phone, '\s|-|\(|\)', '', 'g') from 2)
  ELSE NULL
END;

ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_contact_phone_e164_chk
  CHECK (contact_phone IS NULL OR contact_phone ~ '^\+[1-9]\d{6,14}$');