ALTER TABLE public.admin_audit_log
  ALTER COLUMN actor_id DROP NOT NULL;

ALTER TABLE public.verification_decisions
  ALTER COLUMN reviewer_id DROP NOT NULL;