create extension if not exists citext;

-- ---------- 1. Roles enum + user_roles table ----------
create type public.app_role as enum ('admin', 'professional', 'client');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Admins read all roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- ---------- 2. Profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "Authenticated users view profiles" on public.profiles for select to authenticated using (true);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.tg_set_updated_at();

-- ---------- 3. Professionals ----------
create type public.reps_level as enum ('Level_2', 'Level_3', 'Level_4', 'Level_5');
create type public.verification_status as enum ('pending', 'verified', 'rejected', 'suspended');

create table public.professionals (
  id uuid primary key references auth.users(id) on delete cascade,
  slug text unique,
  trading_name text,
  headline text,
  bio text,
  reps_level public.reps_level,
  specialisms text[] not null default '{}',
  city text,
  country text default 'United Kingdom',
  online_available boolean not null default true,
  in_person_available boolean not null default true,
  hourly_rate_pence int,
  verification public.verification_status not null default 'pending',
  dbs_valid_until date,
  insurance_valid_until date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.professionals to authenticated;
grant select on public.professionals to anon;
grant all on public.professionals to service_role;
alter table public.professionals enable row level security;

create policy "Anyone views published professionals" on public.professionals for select to anon, authenticated
  using (is_published = true and verification = 'verified');
create policy "Pros view own professional record" on public.professionals for select to authenticated using (auth.uid() = id);
create policy "Admins view all professionals" on public.professionals for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Pros insert own professional record" on public.professionals for insert to authenticated
  with check (auth.uid() = id and public.has_role(auth.uid(), 'professional'));
create policy "Pros update own professional record" on public.professionals for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins manage professionals" on public.professionals for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create trigger professionals_set_updated_at before update on public.professionals for each row execute function public.tg_set_updated_at();

-- ---------- 4. Clients ----------
create type public.sex_at_birth as enum ('female', 'male', 'prefer_not_to_say');

create table public.clients (
  id uuid primary key references auth.users(id) on delete cascade,
  date_of_birth date,
  sex public.sex_at_birth,
  height_cm numeric(5,1),
  starting_weight_kg numeric(5,1),
  primary_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.clients to authenticated;
grant all on public.clients to service_role;
alter table public.clients enable row level security;

create policy "Clients view own record" on public.clients for select to authenticated using (auth.uid() = id);
create policy "Clients update own record" on public.clients for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Clients insert own record" on public.clients for insert to authenticated with check (auth.uid() = id);
create policy "Admins manage clients" on public.clients for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create trigger clients_set_updated_at before update on public.clients for each row execute function public.tg_set_updated_at();

-- ---------- 5. coach_client link ----------
create type public.coach_client_status as enum ('active', 'paused', 'ended');

create table public.coach_client (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  status public.coach_client_status not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_id, client_id)
);

grant select, insert, update, delete on public.coach_client to authenticated;
grant all on public.coach_client to service_role;
alter table public.coach_client enable row level security;

create policy "Pro views own coach_client links" on public.coach_client for select to authenticated using (auth.uid() = professional_id);
create policy "Client views own coach_client links" on public.coach_client for select to authenticated using (auth.uid() = client_id);
create policy "Pro manages own coach_client links" on public.coach_client for all to authenticated
  using (auth.uid() = professional_id) with check (auth.uid() = professional_id);
create policy "Admins manage all coach_client links" on public.coach_client for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create trigger coach_client_set_updated_at before update on public.coach_client for each row execute function public.tg_set_updated_at();

create or replace function public.is_coach_of(_pro_id uuid, _client_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.coach_client where professional_id = _pro_id and client_id = _client_id and status = 'active')
$$;

create policy "Pros view their clients' profile" on public.profiles for select to authenticated using (public.is_coach_of(auth.uid(), id));
create policy "Pros view their clients' client record" on public.clients for select to authenticated using (public.is_coach_of(auth.uid(), id));
create policy "Pros update their clients' client record" on public.clients for update to authenticated
  using (public.is_coach_of(auth.uid(), id)) with check (public.is_coach_of(auth.uid(), id));

-- ---------- 6. Client invites ----------
create type public.invite_status as enum ('pending', 'accepted', 'expired', 'revoked');

create table public.client_invites (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  email citext not null,
  full_name text,
  token_hash text not null unique,
  status public.invite_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.client_invites to authenticated;
grant all on public.client_invites to service_role;
alter table public.client_invites enable row level security;

create policy "Pros view own invites" on public.client_invites for select to authenticated using (auth.uid() = professional_id);
create policy "Pros create own invites" on public.client_invites for insert to authenticated
  with check (auth.uid() = professional_id and public.has_role(auth.uid(), 'professional'));
create policy "Pros update own invites" on public.client_invites for update to authenticated
  using (auth.uid() = professional_id) with check (auth.uid() = professional_id);
create policy "Admins manage invites" on public.client_invites for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create trigger client_invites_set_updated_at before update on public.client_invites for each row execute function public.tg_set_updated_at();

create index client_invites_email_idx on public.client_invites (email);
create index coach_client_pro_idx on public.coach_client (professional_id);
create index coach_client_client_idx on public.coach_client (client_id);
create index professionals_published_idx on public.professionals (is_published) where is_published = true;
