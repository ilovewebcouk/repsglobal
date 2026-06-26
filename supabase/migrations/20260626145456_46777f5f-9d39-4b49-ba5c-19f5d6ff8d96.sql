alter table public.verification_notifications
  add column if not exists policy_id uuid null references public.insurance_policies(id) on delete set null,
  add column if not exists threshold_days integer null;

create unique index if not exists verification_notifications_idem
  on public.verification_notifications (
    professional_id,
    event,
    coalesce(policy_id::text, ''),
    coalesce(threshold_days, -1)
  );

comment on column public.verification_notifications.policy_id is
  'Insurance policy associated with the notification (renewal nudges, blocked, etc.).';
comment on column public.verification_notifications.threshold_days is
  'For renewal nudges: 60/30/7/0 days before expiry. Null for one-off events.';