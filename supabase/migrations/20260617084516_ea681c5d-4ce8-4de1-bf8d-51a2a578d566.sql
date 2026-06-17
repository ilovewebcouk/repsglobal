
ALTER TYPE support_status RENAME VALUE 'resolved' TO 'solved';
ALTER TYPE support_status ADD VALUE IF NOT EXISTS 'new' BEFORE 'open';
ALTER TABLE public.support_tickets RENAME COLUMN resolved_at TO solved_at;
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS first_viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_viewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
