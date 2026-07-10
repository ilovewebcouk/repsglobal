
-- Extend certificate_pricing with postage fee + default RM service
ALTER TABLE public.certificate_pricing
  ADD COLUMN IF NOT EXISTS postage_fee_pence integer NOT NULL DEFAULT 650,
  ADD COLUMN IF NOT EXISTS default_rm_service_code text NOT NULL DEFAULT 'TPN';

-- Extend certificate_batches with postage snapshot + Royal Mail shipment fields
ALTER TABLE public.certificate_batches
  ADD COLUMN IF NOT EXISTS postage_fee_pence_snapshot integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rm_service_code text,
  ADD COLUMN IF NOT EXISTS rm_order_identifier text,
  ADD COLUMN IF NOT EXISTS rm_order_reference text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS label_pdf_path text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS ship_to_address jsonb;

CREATE INDEX IF NOT EXISTS certificate_batches_tracking_idx
  ON public.certificate_batches (tracking_number)
  WHERE tracking_number IS NOT NULL;
