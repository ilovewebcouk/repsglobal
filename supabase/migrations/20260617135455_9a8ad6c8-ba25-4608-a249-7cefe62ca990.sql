-- Campaign lifecycle + drafts + scheduling
ALTER TABLE public.outbound_campaigns
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS mode text,
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS direct_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text;

-- Backfill mode from existing data: broadcasts had tiers set, direct sends did not.
UPDATE public.outbound_campaigns
SET mode = CASE
  WHEN COALESCE(array_length(tiers, 1), 0) > 0 THEN 'broadcast'
  ELSE 'direct'
END
WHERE mode IS NULL;

-- Restrict status values
ALTER TABLE public.outbound_campaigns
  DROP CONSTRAINT IF EXISTS outbound_campaigns_status_check;
ALTER TABLE public.outbound_campaigns
  ADD CONSTRAINT outbound_campaigns_status_check
  CHECK (status IN ('draft','scheduled','sending','sent','failed'));

ALTER TABLE public.outbound_campaigns
  DROP CONSTRAINT IF EXISTS outbound_campaigns_mode_check;
ALTER TABLE public.outbound_campaigns
  ADD CONSTRAINT outbound_campaigns_mode_check
  CHECK (mode IN ('direct','broadcast'));

ALTER TABLE public.outbound_campaigns
  DROP CONSTRAINT IF EXISTS outbound_campaigns_format_check;
ALTER TABLE public.outbound_campaigns
  ADD CONSTRAINT outbound_campaigns_format_check
  CHECK (format IN ('text','html'));

-- Index for the scheduled-send cron
CREATE INDEX IF NOT EXISTS outbound_campaigns_scheduled_idx
  ON public.outbound_campaigns (scheduled_at)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS outbound_campaigns_status_idx
  ON public.outbound_campaigns (status, created_at DESC);