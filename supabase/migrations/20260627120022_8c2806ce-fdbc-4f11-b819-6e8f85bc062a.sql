create or replace function public.get_user_ids_by_email(_email text)
returns table(user_id uuid)
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.id as user_id
  from auth.users u
  where lower(u.email) = lower(_email)
    and u.email_confirmed_at is not null
$$;

revoke all on function public.get_user_ids_by_email(text) from public, anon, authenticated;
grant execute on function public.get_user_ids_by_email(text) to service_role;
