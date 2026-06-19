
ALTER TABLE public.bd_member_seed
  ADD COLUMN IF NOT EXISTS bd_next_due_date date;

WITH base AS (
  SELECT
    bd_member_id,
    CASE
      WHEN legacy_signup_at IS NULL THEN NULL
      ELSE (
        legacy_signup_at::date
        + (
            GREATEST(
              0,
              CEIL(
                ((DATE '2026-06-14' - legacy_signup_at::date))::numeric / 365.25
              )::int
            ) * INTERVAL '12 months'
          )
      )::date
    END AS computed_due
  FROM public.bd_member_seed
)
UPDATE public.bd_member_seed s
SET bd_next_due_date = base.computed_due
FROM base
WHERE s.bd_member_id = base.bd_member_id;

UPDATE public.bd_member_seed SET bd_next_due_date = DATE '2026-06-21' WHERE bd_member_id = 480;
UPDATE public.bd_member_seed SET bd_next_due_date = DATE '2026-06-26' WHERE bd_member_id = 705;
