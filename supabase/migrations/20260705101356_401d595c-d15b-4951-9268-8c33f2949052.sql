ALTER TABLE public.outbound_campaigns
  ADD COLUMN IF NOT EXISTS prospect_tags text[] NOT NULL DEFAULT '{}';