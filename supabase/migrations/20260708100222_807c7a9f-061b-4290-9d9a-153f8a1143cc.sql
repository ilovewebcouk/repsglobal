CREATE TABLE IF NOT EXISTS public.provider_name_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(trim(requested_name)) > 0)
);

GRANT SELECT, INSERT ON public.provider_name_requests TO authenticated;
GRANT ALL ON public.provider_name_requests TO service_role;

ALTER TABLE public.provider_name_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin can read name requests"
  ON public.provider_name_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can insert own name request"
  ON public.provider_name_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE UNIQUE INDEX IF NOT EXISTS provider_name_requests_one_pending
  ON public.provider_name_requests (user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS provider_name_requests_status_created_idx
  ON public.provider_name_requests (status, created_at DESC);