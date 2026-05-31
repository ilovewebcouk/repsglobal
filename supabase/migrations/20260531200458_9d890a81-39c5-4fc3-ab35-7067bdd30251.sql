-- Move citext to extensions schema (safer than public)
create schema if not exists extensions;
alter extension citext set schema extensions;

-- Fix search_path on tg_set_updated_at
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

-- Lock down execution on SECURITY DEFINER helpers.
-- has_role + is_coach_of are called only inside RLS policies and our own
-- server functions, both of which run as a privileged role internally.
-- handle_new_user is fired by an auth.users trigger and never called directly.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.is_coach_of(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
