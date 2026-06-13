alter table public.identity_documents
  add column if not exists environment text not null default 'sandbox';

create index if not exists idx_identity_documents_vs_env
  on public.identity_documents(stripe_vs_id, environment);