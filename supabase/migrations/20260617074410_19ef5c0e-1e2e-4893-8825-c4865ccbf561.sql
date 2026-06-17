
REVOKE EXECUTE ON FUNCTION public.support_run_maintenance() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_run_maintenance() TO service_role, postgres;
