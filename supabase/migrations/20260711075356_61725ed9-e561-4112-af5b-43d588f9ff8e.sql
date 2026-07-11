create or replace function public.count_provider_issued_certificates(_provider_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.certificate_registrations
  where provider_id = _provider_id
    and status = 'issued'
$$;

grant execute on function public.count_provider_issued_certificates(uuid) to anon, authenticated;