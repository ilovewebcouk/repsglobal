UPDATE public.legacy_stripe_link
SET migration_status = 'awaiting_payment_method',
    migration_kind = 'no_payment_method',
    notes = COALESCE(notes,'') || ' | folded into setup-link cohort (no reusable PM on Stripe customer; one_time/guest legacy)'
WHERE converted_at IS NULL
  AND stripe_subscription_id IS NULL
  AND is_lifetime = false
  AND stripe_customer_id IS NOT NULL
  AND next_due_at >= now()
  AND legacy_kind = 'one_time'
  AND migration_status IN ('ready','skipped');