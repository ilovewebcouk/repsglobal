
CREATE TABLE public.public_visitor_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id text,
  session_id text NOT NULL,
  posthog_distinct_id text,
  event_kind text NOT NULL CHECK (event_kind IN (
    'enquiry_started','enquiry_created',
    'signup_started','checkout_started','signup_complete'
  )),
  enquiry_id uuid REFERENCES public.enquiries(id) ON DELETE SET NULL,
  pending_signup_id uuid REFERENCES public.pending_signups(id) ON DELETE SET NULL,
  user_id uuid,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  path text,
  referrer text,
  country_code text,
  device text,
  browser text,
  ip_hash text,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pvc_session ON public.public_visitor_conversions (session_id, occurred_at DESC);
CREATE INDEX idx_pvc_anon ON public.public_visitor_conversions (anonymous_id, occurred_at DESC);
CREATE INDEX idx_pvc_kind ON public.public_visitor_conversions (event_kind, occurred_at DESC);
CREATE INDEX idx_pvc_enquiry ON public.public_visitor_conversions (enquiry_id);
CREATE INDEX idx_pvc_pending ON public.public_visitor_conversions (pending_signup_id);
CREATE INDEX idx_pvc_user ON public.public_visitor_conversions (user_id);
CREATE INDEX idx_pvc_pro ON public.public_visitor_conversions (professional_id, occurred_at DESC);
CREATE INDEX idx_pvc_occurred ON public.public_visitor_conversions (occurred_at DESC);

GRANT SELECT ON public.public_visitor_conversions TO authenticated;
GRANT ALL ON public.public_visitor_conversions TO service_role;
ALTER TABLE public.public_visitor_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read conversions"
ON public.public_visitor_conversions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.metrics_daily_public_analytics (
  metric_date date PRIMARY KEY,
  public_page_views int NOT NULL DEFAULT 0,
  public_profile_views int NOT NULL DEFAULT 0,
  public_unique_sessions int NOT NULL DEFAULT 0,
  directory_searches int NOT NULL DEFAULT 0,
  searches_no_results int NOT NULL DEFAULT 0,
  result_clicks int NOT NULL DEFAULT 0,
  enquiries_started int NOT NULL DEFAULT 0,
  enquiries_created int NOT NULL DEFAULT 0,
  signup_starts int NOT NULL DEFAULT 0,
  checkout_starts int NOT NULL DEFAULT 0,
  signup_completes int NOT NULL DEFAULT 0,
  top_pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_profiles jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_searches jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_no_result_searches jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_referrers jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_landing_pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  countries jsonb NOT NULL DEFAULT '[]'::jsonb,
  devices jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mdpa_date ON public.metrics_daily_public_analytics (metric_date DESC);

GRANT SELECT ON public.metrics_daily_public_analytics TO authenticated;
GRANT ALL ON public.metrics_daily_public_analytics TO service_role;
ALTER TABLE public.metrics_daily_public_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read daily public analytics"
ON public.metrics_daily_public_analytics FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_mdpa_updated_at
BEFORE UPDATE ON public.metrics_daily_public_analytics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.public_analytics_ingest_state (
  id text PRIMARY KEY,
  last_pulled_date date,
  last_run_at timestamptz,
  last_status text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.public_analytics_ingest_state TO authenticated;
GRANT ALL ON public.public_analytics_ingest_state TO service_role;
ALTER TABLE public.public_analytics_ingest_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ingest state"
ON public.public_analytics_ingest_state FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_pais_updated_at
BEFORE UPDATE ON public.public_analytics_ingest_state
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.public_analytics_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  choice text NOT NULL CHECK (choice IN ('accepted','rejected','withdrawn','customised')),
  scopes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ua_hash text,
  dnt boolean NOT NULL DEFAULT false,
  gpc boolean NOT NULL DEFAULT false,
  country_code text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pace_session ON public.public_analytics_consent_events (session_id, occurred_at DESC);
CREATE INDEX idx_pace_choice ON public.public_analytics_consent_events (choice, occurred_at DESC);
CREATE INDEX idx_pace_occurred ON public.public_analytics_consent_events (occurred_at DESC);

GRANT SELECT ON public.public_analytics_consent_events TO authenticated;
GRANT ALL ON public.public_analytics_consent_events TO service_role;
ALTER TABLE public.public_analytics_consent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read consent events"
ON public.public_analytics_consent_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.public_analytics_ingest_state (id, last_status)
VALUES ('posthog_daily', 'never_run')
ON CONFLICT (id) DO NOTHING;
