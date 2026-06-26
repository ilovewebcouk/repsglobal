
CREATE TABLE public.help_article_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_slug TEXT NOT NULL,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id TEXT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX help_article_feedback_slug_idx ON public.help_article_feedback (article_slug);
CREATE INDEX help_article_feedback_created_idx ON public.help_article_feedback (created_at DESC);

GRANT INSERT ON public.help_article_feedback TO anon;
GRANT INSERT, SELECT ON public.help_article_feedback TO authenticated;
GRANT ALL ON public.help_article_feedback TO service_role;

ALTER TABLE public.help_article_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON public.help_article_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read all feedback"
  ON public.help_article_feedback
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
