UPDATE public.subscriptions
   SET migrated_from_bd = true,
       updated_at = now()
 WHERE (metadata ->> 'migrated_from') IN ('bd_legacy', 'bd')
   AND migrated_from_bd IS DISTINCT FROM true;

INSERT INTO public.disputes (
  stripe_dispute_id,
  stripe_charge_id,
  stripe_payment_intent_id,
  amount_pence,
  currency,
  reason,
  status,
  lifecycle_stage,
  evidence_due_by,
  payload,
  funds_withdrawn_pence,
  funds_reinstated_pence,
  opened_at,
  updated_at
)
SELECT
  (latest.payload -> 'data' -> 'object' ->> 'id'),
  (latest.payload -> 'data' -> 'object' ->> 'charge'),
  (latest.payload -> 'data' -> 'object' ->> 'payment_intent'),
  COALESCE(((latest.payload -> 'data' -> 'object' ->> 'amount'))::int, 0),
  COALESCE((latest.payload -> 'data' -> 'object' ->> 'currency'), 'gbp'),
  (latest.payload -> 'data' -> 'object' ->> 'reason'),
  (latest.payload -> 'data' -> 'object' ->> 'status'),
  CASE
    WHEN (latest.payload -> 'data' -> 'object' ->> 'status') = 'won'  THEN 'won'
    WHEN (latest.payload -> 'data' -> 'object' ->> 'status') = 'lost' THEN 'lost'
    WHEN withdrawn.payload IS NOT NULL                                THEN 'funds_withdrawn'
    ELSE 'opened'
  END,
  CASE
    WHEN (latest.payload -> 'data' -> 'object' -> 'evidence_details' ->> 'due_by') IS NOT NULL
    THEN to_timestamp(((latest.payload -> 'data' -> 'object' -> 'evidence_details' ->> 'due_by'))::bigint)
    ELSE NULL
  END,
  (latest.payload -> 'data' -> 'object'),
  COALESCE(((withdrawn.payload -> 'data' -> 'object' ->> 'amount'))::int, 0),
  0,
  COALESCE(created.created_at, latest.created_at),
  latest.created_at
FROM (
  SELECT DISTINCT ON (payload -> 'data' -> 'object' ->> 'id')
         payload, created_at
    FROM public.payment_events
   WHERE event_type LIKE 'charge.dispute.%'
     AND payload -> 'data' -> 'object' ->> 'id' IS NOT NULL
   ORDER BY payload -> 'data' -> 'object' ->> 'id', created_at DESC
) latest
LEFT JOIN LATERAL (
  SELECT payload, created_at
    FROM public.payment_events
   WHERE event_type = 'charge.dispute.created'
     AND payload -> 'data' -> 'object' ->> 'id'
         = latest.payload -> 'data' -> 'object' ->> 'id'
   ORDER BY created_at ASC
   LIMIT 1
) created ON true
LEFT JOIN LATERAL (
  SELECT payload
    FROM public.payment_events
   WHERE event_type = 'charge.dispute.funds_withdrawn'
     AND payload -> 'data' -> 'object' ->> 'id'
         = latest.payload -> 'data' -> 'object' ->> 'id'
   ORDER BY created_at DESC
   LIMIT 1
) withdrawn ON true
ON CONFLICT (stripe_dispute_id) DO NOTHING;