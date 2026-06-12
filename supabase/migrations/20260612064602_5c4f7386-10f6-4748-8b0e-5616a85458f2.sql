GRANT EXECUTE ON FUNCTION public.is_coach_of(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_tier(uuid, public.subscription_tier[]) TO authenticated;