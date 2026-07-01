
ALTER TABLE public.member_session_events
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geo_source TEXT;

ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geo_source TEXT;

ALTER TABLE public.auth_events
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geo_source TEXT;

CREATE INDEX IF NOT EXISTS idx_user_sessions_last_seen_country
  ON public.user_sessions (last_seen_at DESC, country_code)
  WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_member_session_events_created_country
  ON public.member_session_events (created_at DESC, country_code);

CREATE INDEX IF NOT EXISTS idx_member_session_events_session_created
  ON public.member_session_events (session_id, created_at DESC);
