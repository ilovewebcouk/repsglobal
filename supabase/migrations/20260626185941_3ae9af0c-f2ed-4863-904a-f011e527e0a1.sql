-- Flag Daniel Hughes as demo (missed in original batch) and backfill any
-- future @demo.repsuk.org accounts so they never leak into the admin list.
UPDATE public.professionals p
SET is_demo = true
FROM auth.users u
WHERE u.id = p.id
  AND u.email ILIKE '%@demo.repsuk.org'
  AND p.is_demo = false;