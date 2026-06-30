CREATE TABLE public.legacy_redirects (
  source_path text PRIMARY KEY,
  destination_path text NOT NULL,
  kind text NOT NULL DEFAULT 'other',
  terminal_path text,
  resolved_to_slug text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.legacy_redirects TO anon;
GRANT SELECT ON public.legacy_redirects TO authenticated;
GRANT ALL ON public.legacy_redirects TO service_role;

ALTER TABLE public.legacy_redirects ENABLE ROW LEVEL SECURITY;

-- Public read so the catch-all redirect route can resolve via the server publishable client
CREATE POLICY "legacy_redirects readable by all"
  ON public.legacy_redirects FOR SELECT
  USING (true);

CREATE INDEX legacy_redirects_kind_idx ON public.legacy_redirects (kind);
CREATE INDEX legacy_redirects_resolved_slug_idx ON public.legacy_redirects (resolved_to_slug) WHERE resolved_to_slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER legacy_redirects_updated_at
  BEFORE UPDATE ON public.legacy_redirects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();