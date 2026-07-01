ALTER TABLE public.auth_events
  ADD COLUMN IF NOT EXISTS ip text,
  ADD COLUMN IF NOT EXISTS timezone text;

ALTER TABLE public.member_session_events
  ADD COLUMN IF NOT EXISTS ip text,
  ADD COLUMN IF NOT EXISTS timezone text;

ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS ip text,
  ADD COLUMN IF NOT EXISTS timezone text;

COMMENT ON COLUMN public.auth_events.ip IS 'Raw client IP from Cloudflare cf-connecting-ip. Admin-visible only (RLS).';
COMMENT ON COLUMN public.member_session_events.ip IS 'Raw client IP from Cloudflare cf-connecting-ip. Admin-visible only (RLS).';
COMMENT ON COLUMN public.user_sessions.ip IS 'Raw client IP from Cloudflare cf-connecting-ip. Admin-visible only (RLS).';