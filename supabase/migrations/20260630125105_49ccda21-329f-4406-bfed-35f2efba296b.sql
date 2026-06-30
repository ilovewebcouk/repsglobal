REVOKE EXECUTE ON FUNCTION public.cleanup_pending_signups() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_pending_signups() TO service_role;