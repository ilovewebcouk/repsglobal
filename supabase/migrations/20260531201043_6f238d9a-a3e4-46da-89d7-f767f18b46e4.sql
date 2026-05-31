
-- Replace handle_new_user to also seed professional role + professionals row,
-- but skip when the new user came in via a client invite (raw_user_meta_data.signup_kind = 'client').
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_kind text;
begin
  signup_kind := coalesce(new.raw_user_meta_data ->> 'signup_kind', 'professional');

  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  if signup_kind = 'professional' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'professional')
    on conflict (user_id, role) do nothing;

    insert into public.professionals (id)
    values (new.id)
    on conflict (id) do nothing;
  elsif signup_kind = 'client' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'client')
    on conflict (user_id, role) do nothing;

    insert into public.clients (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

-- Ensure the trigger exists on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
