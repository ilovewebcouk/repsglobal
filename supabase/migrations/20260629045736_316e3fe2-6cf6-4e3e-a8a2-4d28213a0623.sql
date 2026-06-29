REVOKE EXECUTE ON FUNCTION public.warn_legacy_archive_write() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.warn_legacy_archive_write() TO service_role;