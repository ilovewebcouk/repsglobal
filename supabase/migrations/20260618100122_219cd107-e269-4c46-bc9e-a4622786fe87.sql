-- 1. New columns on professionals
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS from_price_pennies integer,
  ADD COLUMN IF NOT EXISTS price_currency text NOT NULL DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS years_experience smallint,
  ADD COLUMN IF NOT EXISTS value_prop text;

-- Light validation: keep value_prop tight so it fits on a card
ALTER TABLE public.professionals
  DROP CONSTRAINT IF EXISTS professionals_value_prop_len_chk;
ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_value_prop_len_chk
  CHECK (value_prop IS NULL OR char_length(value_prop) <= 90);

ALTER TABLE public.professionals
  DROP CONSTRAINT IF EXISTS professionals_from_price_chk;
ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_from_price_chk
  CHECK (from_price_pennies IS NULL OR from_price_pennies BETWEEN 500 AND 100000);

ALTER TABLE public.professionals
  DROP CONSTRAINT IF EXISTS professionals_years_exp_chk;
ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_years_exp_chk
  CHECK (years_experience IS NULL OR years_experience BETWEEN 0 AND 60);

-- 2. Backfill demo seed pros (matched by email -> auth.users.id)
WITH seeds(email, from_price_pennies, years_experience, value_prop) AS (
  VALUES
    ('james.wilson@demo.repsuk.org',    7500::int,  12::smallint, 'Strength + lifestyle coach for busy professionals'),
    ('sophie.taylor@demo.repsuk.org',   6500::int,   9::smallint, 'Reformer Pilates for posture, mobility and pain-free movement'),
    ('liam.roberts@demo.repsuk.org',    8500::int,  11::smallint, 'Strength coach for intermediate and advanced lifters'),
    ('priya.sharma@demo.repsuk.org',    9000::int,   8::smallint, 'Registered nutritionist — sustainable fat loss and energy'),
    ('daniel.hughes@demo.repsuk.org',   7000::int,  10::smallint, 'Functional training and lifestyle coaching for 30s + 40s'),
    ('emily.carter@demo.repsuk.org',    6000::int,   7::smallint, 'Reformer Pilates for desk-bound clients and post-natal returners'),
    ('marcus.lee@demo.repsuk.org',      9500::int,  14::smallint, 'Strength and conditioning for athletes and serious lifters'),
    ('hannah.thompson@demo.repsuk.org', 7500::int,   9::smallint, 'Pre and post-natal coach — pelvic floor + diastasis recovery')
)
UPDATE public.professionals p
SET from_price_pennies = s.from_price_pennies,
    years_experience   = s.years_experience,
    value_prop         = s.value_prop,
    updated_at         = now()
FROM seeds s
JOIN auth.users u ON lower(u.email) = lower(s.email)
WHERE p.id = u.id;