ALTER TABLE public.bd_member_seed
  ADD COLUMN IF NOT EXISTS recrop_status text NOT NULL DEFAULT 'pending'
    CHECK (recrop_status IN ('pending','ok','rejected')),
  ADD COLUMN IF NOT EXISTS recrop_reason text,
  ADD COLUMN IF NOT EXISTS recropped_at timestamptz;

CREATE INDEX IF NOT EXISTS bd_member_seed_recrop_status_idx
  ON public.bd_member_seed (recrop_status);