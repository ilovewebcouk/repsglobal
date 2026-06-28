
REVOKE EXECUTE ON FUNCTION public.platform_health_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_health_snapshot() TO service_role;
