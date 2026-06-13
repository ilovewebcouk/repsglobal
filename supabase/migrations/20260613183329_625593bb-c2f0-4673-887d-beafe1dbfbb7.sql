ALTER TABLE public.verification_decisions
  ADD COLUMN IF NOT EXISTS gates_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS override_reason text;