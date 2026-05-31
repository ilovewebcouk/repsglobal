
-- Index for fast token lookup
create index if not exists idx_client_invites_token_hash on public.client_invites(token_hash);
create index if not exists idx_client_invites_email on public.client_invites(email);

-- Look up an invite by raw token (we hash it server-side). For now token_hash IS the token (server can hash before lookup).
create or replace function public.get_invite_by_token(_token_hash text)
returns table (
  id uuid,
  professional_id uuid,
  email text,
  full_name text,
  status invite_status,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select id, professional_id, email::text, full_name, status, expires_at
  from public.client_invites
  where token_hash = _token_hash
  limit 1;
$$;

revoke all on function public.get_invite_by_token(text) from public;
grant execute on function public.get_invite_by_token(text) to anon, authenticated;

-- Accept invite: must be called as the newly-signed-up user
create or replace function public.accept_client_invite(_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.client_invites%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_invite
  from public.client_invites
  where token_hash = _token_hash
  for update;

  if not found then
    raise exception 'invite not found';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'invite is not pending';
  end if;
  if v_invite.expires_at < now() then
    update public.client_invites set status = 'expired', updated_at = now() where id = v_invite.id;
    raise exception 'invite expired';
  end if;

  -- Ensure client role + client record exist for this user
  insert into public.user_roles (user_id, role) values (v_uid, 'client')
  on conflict (user_id, role) do nothing;
  insert into public.clients (id) values (v_uid) on conflict (id) do nothing;

  -- Link coach
  insert into public.coach_client (professional_id, client_id, status)
  values (v_invite.professional_id, v_uid, 'active')
  on conflict do nothing;

  update public.client_invites
  set status = 'accepted', accepted_user_id = v_uid, accepted_at = now(), updated_at = now()
  where id = v_invite.id;

  return v_invite.professional_id;
end;
$$;

revoke all on function public.accept_client_invite(text) from public;
grant execute on function public.accept_client_invite(text) to authenticated;
