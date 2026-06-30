
-- ============================================================
-- Activity capture pipeline
-- ============================================================

CREATE TABLE IF NOT EXISTS public.auth_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event           text NOT NULL CHECK (event IN ('sign_in','sign_out','sign_in_failed','password_reset','email_confirmed','user_updated')),
  email           text,
  ip_hash         text,
  user_agent      text,
  country_code    text,
  city            text,
  device          text,
  browser         text,
  os              text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_events_created_idx     ON public.auth_events (created_at DESC);
CREATE INDEX IF NOT EXISTS auth_events_user_created_idx ON public.auth_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS auth_events_event_idx       ON public.auth_events (event);

GRANT ALL ON public.auth_events TO service_role;
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read auth_events"
  ON public.auth_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id         uuid NOT NULL,
  started_at      timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  current_path    text,
  referrer        text,
  ip_hash         text,
  user_agent      text,
  country_code    text,
  city            text,
  device          text,
  browser         text,
  os              text,
  pages_viewed    integer NOT NULL DEFAULT 0,
  is_admin_view   boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS user_sessions_anon_idx     ON public.user_sessions (anon_id);
CREATE INDEX IF NOT EXISTS user_sessions_user_idx     ON public.user_sessions (user_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS user_sessions_last_seen_idx ON public.user_sessions (last_seen_at DESC);

GRANT ALL ON public.user_sessions TO service_role;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read user_sessions"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.page_view_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id         uuid NOT NULL,
  session_id      uuid REFERENCES public.user_sessions(id) ON DELETE SET NULL,
  path            text NOT NULL,
  referrer        text,
  ip_hash         text,
  user_agent      text,
  country_code    text,
  city            text,
  device          text,
  browser         text,
  os              text,
  is_admin_view   boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_view_created_idx       ON public.page_view_events (created_at DESC);
CREATE INDEX IF NOT EXISTS page_view_user_created_idx  ON public.page_view_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS page_view_session_idx       ON public.page_view_events (session_id);
CREATE INDEX IF NOT EXISTS page_view_anon_created_idx  ON public.page_view_events (anon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS page_view_path_idx          ON public.page_view_events (path);

GRANT ALL ON public.page_view_events TO service_role;
ALTER TABLE public.page_view_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read page_view_events"
  ON public.page_view_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------
-- Retention: nightly purge of raw page views older than 90 days.
-- (Aggregates are computed on read, so we don't need a rollup table yet.)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purge-page-view-events')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-page-view-events');

    PERFORM cron.schedule(
      'purge-page-view-events',
      '17 3 * * *',
      $job$ DELETE FROM public.page_view_events WHERE created_at < now() - interval '90 days'; $job$
    );

    PERFORM cron.unschedule('purge-auth-events')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-auth-events');

    PERFORM cron.schedule(
      'purge-auth-events',
      '22 3 * * *',
      $job$ DELETE FROM public.auth_events WHERE created_at < now() - interval '365 days'; $job$
    );

    PERFORM cron.unschedule('purge-stale-sessions')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-stale-sessions');

    PERFORM cron.schedule(
      'purge-stale-sessions',
      '27 3 * * *',
      $job$ DELETE FROM public.user_sessions WHERE last_seen_at < now() - interval '30 days'; $job$
    );
  END IF;
END
$$;
