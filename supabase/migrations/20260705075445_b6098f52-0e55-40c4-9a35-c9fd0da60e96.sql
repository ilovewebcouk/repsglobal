
CREATE TABLE public.seo_index_status (
  url text PRIMARY KEY,
  priority text NOT NULL DEFAULT 'B' CHECK (priority IN ('A','B')),
  first_checked_at timestamptz NOT NULL DEFAULT now(),
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  last_changed_at timestamptz,
  verdict text,
  coverage_state text,
  indexing_state text,
  google_canonical text,
  user_canonical text,
  robots_state text,
  page_fetch_state text,
  last_crawl_time timestamptz,
  raw jsonb
);

CREATE INDEX seo_index_status_priority_idx ON public.seo_index_status (priority, last_checked_at);
CREATE INDEX seo_index_status_verdict_idx ON public.seo_index_status (verdict) WHERE verdict <> 'PASS';

GRANT SELECT ON public.seo_index_status TO authenticated;
GRANT ALL ON public.seo_index_status TO service_role;
ALTER TABLE public.seo_index_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can read seo_index_status"
  ON public.seo_index_status
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.seo_index_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  severity text NOT NULL CHECK (severity IN ('error','warn','info')),
  summary text NOT NULL,
  prev jsonb,
  next jsonb,
  acknowledged_at timestamptz,
  acknowledged_by uuid
);

CREATE INDEX seo_index_events_detected_idx ON public.seo_index_events (detected_at DESC);
CREATE INDEX seo_index_events_open_idx ON public.seo_index_events (severity, detected_at DESC) WHERE acknowledged_at IS NULL;
CREATE INDEX seo_index_events_url_idx ON public.seo_index_events (url, detected_at DESC);

GRANT SELECT, UPDATE ON public.seo_index_events TO authenticated;
GRANT ALL ON public.seo_index_events TO service_role;
ALTER TABLE public.seo_index_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can read seo_index_events"
  ON public.seo_index_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can acknowledge seo_index_events"
  ON public.seo_index_events
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.seo_scan_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  batch_kind text NOT NULL DEFAULT 'daily' CHECK (batch_kind IN ('daily','manual','priority_a')),
  urls_checked int NOT NULL DEFAULT 0,
  urls_changed int NOT NULL DEFAULT 0,
  errors int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','ok','partial','failed')),
  notes text
);

CREATE INDEX seo_scan_runs_started_idx ON public.seo_scan_runs (started_at DESC);

GRANT SELECT ON public.seo_scan_runs TO authenticated;
GRANT ALL ON public.seo_scan_runs TO service_role;
ALTER TABLE public.seo_scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can read seo_scan_runs"
  ON public.seo_scan_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
