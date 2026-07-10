ALTER TABLE public.certificate_pricing
  ADD COLUMN IF NOT EXISTS international_postage_fee_pence integer NOT NULL DEFAULT 1500;

COMMENT ON COLUMN public.certificate_pricing.international_postage_fee_pence IS 'Flat postage fee applied to non-GB certificate batches (pence).';
COMMENT ON COLUMN public.certificate_pricing.postage_fee_pence IS 'Postage fee applied to GB certificate batches (pence).';