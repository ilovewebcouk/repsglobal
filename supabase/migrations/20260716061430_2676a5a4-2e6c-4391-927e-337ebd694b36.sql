ALTER TABLE public.websites
  ADD COLUMN IF NOT EXISTS about_headline text
    CHECK (about_headline IS NULL OR char_length(about_headline) <= 200);