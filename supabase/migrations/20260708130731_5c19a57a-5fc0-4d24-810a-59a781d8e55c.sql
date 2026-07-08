
DO $$
DECLARE
  r RECORD;
  base TEXT;
  candidate TEXT;
  i INT;
BEGIN
  FOR r IN
    SELECT p.id, pr.business_name, p.slug
    FROM professionals p
    JOIN profiles pr ON pr.id = p.id
    WHERE p.account_type = 'organisation'
      AND pr.business_name IS NOT NULL
      AND btrim(pr.business_name) <> ''
  LOOP
    base := lower(regexp_replace(r.business_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base := regexp_replace(base, '(^-+|-+$)', '', 'g');
    base := left(base, 60);
    IF base = '' THEN CONTINUE; END IF;
    candidate := base;
    i := 2;
    WHILE EXISTS (SELECT 1 FROM professionals WHERE slug = candidate AND id <> r.id) LOOP
      candidate := base || '-' || i;
      i := i + 1;
      IF i > 50 THEN EXIT; END IF;
    END LOOP;
    IF candidate IS DISTINCT FROM r.slug THEN
      UPDATE professionals SET slug = candidate WHERE id = r.id;
    END IF;
  END LOOP;
END $$;
