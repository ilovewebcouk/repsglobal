create or replace function public.search_profiles_by_id_prefix(_q text)
returns table (id uuid, full_name text, business_name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.business_name
  from public.profiles p
  where p.id::text ilike '%' || _q || '%'
  limit 20
$$;

revoke all on function public.search_profiles_by_id_prefix(text) from public, anon;
grant execute on function public.search_profiles_by_id_prefix(text) to authenticated, service_role;