CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE public.launch_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'coming_soon',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.launch_waitlist TO anon, authenticated;
GRANT ALL ON public.launch_waitlist TO service_role;

ALTER TABLE public.launch_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can join waitlist"
  ON public.launch_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
