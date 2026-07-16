-- Enforce: at most one open impersonation session per admin.
-- The application layer already closes prior sessions before inserting a new
-- one, but that pair is not transactional; a race can leave two rows with
-- ended_at IS NULL for the same admin. This partial unique index makes that
-- state impossible at the DB layer.
CREATE UNIQUE INDEX IF NOT EXISTS admin_impersonation_sessions_one_open_per_admin
  ON public.admin_impersonation_sessions (admin_id)
  WHERE ended_at IS NULL;