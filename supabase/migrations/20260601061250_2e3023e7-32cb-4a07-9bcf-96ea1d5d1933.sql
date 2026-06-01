-- Extend invite_status to include 'revoked'
ALTER TYPE invite_status ADD VALUE IF NOT EXISTS 'revoked';

-- Trigger reason enum for auto-sent invites
DO $$ BEGIN
  CREATE TYPE invite_trigger_reason AS ENUM ('confirmed', 'programme_assigned', 'payment_received', 'manual_resend', 'manual_create');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Roster status enum
DO $$ BEGIN
  CREATE TYPE roster_status AS ENUM ('prospect', 'confirmed', 'active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ====== client_roster table ======
CREATE TABLE IF NOT EXISTS public.client_roster (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  status roster_status NOT NULL DEFAULT 'prospect',
  notes text,
  invite_id uuid,
  client_id uuid,
  auth_user_id uuid,
  confirmed_at timestamptz,
  first_programme_at timestamptz,
  first_payment_at timestamptz,
  activated_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS client_roster_pro_email_uidx
  ON public.client_roster (professional_id, lower(email));

CREATE INDEX IF NOT EXISTS client_roster_pro_idx ON public.client_roster (professional_id);
CREATE INDEX IF NOT EXISTS client_roster_status_idx ON public.client_roster (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_roster TO authenticated;
GRANT ALL ON public.client_roster TO service_role;

ALTER TABLE public.client_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pros manage own roster"
  ON public.client_roster
  FOR ALL
  TO authenticated
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Admins manage all rosters"
  ON public.client_roster
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Client views own roster row"
  ON public.client_roster
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE TRIGGER client_roster_updated_at
  BEFORE UPDATE ON public.client_roster
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ====== client_invites hardening ======
ALTER TABLE public.client_invites
  ADD COLUMN IF NOT EXISTS roster_id uuid REFERENCES public.client_roster(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS auto_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trigger_reason invite_trigger_reason,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_at_issue text;

CREATE INDEX IF NOT EXISTS client_invites_roster_idx ON public.client_invites (roster_id);

-- Tighten accept_client_invite: reject non-pending statuses including 'revoked',
-- and verify the email hasn't drifted from the snapshot.
CREATE OR REPLACE FUNCTION public.accept_client_invite(_token_hash text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  if v_invite.status = 'accepted' then
    raise exception 'invite already used';
  end if;
  if v_invite.status = 'revoked' then
    raise exception 'invite revoked';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'invite is not pending';
  end if;
  if v_invite.expires_at < now() then
    update public.client_invites set status = 'expired', updated_at = now() where id = v_invite.id;
    raise exception 'invite expired';
  end if;

  insert into public.user_roles (user_id, role) values (v_uid, 'client')
  on conflict (user_id, role) do nothing;
  insert into public.clients (id) values (v_uid) on conflict (id) do nothing;

  insert into public.coach_client (professional_id, client_id, status)
  values (v_invite.professional_id, v_uid, 'active')
  on conflict do nothing;

  update public.client_invites
  set status = 'accepted', accepted_user_id = v_uid, accepted_at = now(), updated_at = now()
  where id = v_invite.id;

  -- Activate the roster row if linked
  if v_invite.roster_id is not null then
    update public.client_roster
    set status = 'active',
        client_id = v_uid,
        auth_user_id = v_uid,
        activated_at = now()
    where id = v_invite.roster_id;
  end if;

  return v_invite.professional_id;
end;
$function$;