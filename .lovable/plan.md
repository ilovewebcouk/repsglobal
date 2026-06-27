## What I found

You deleted Stripe subscription `sub_1S6JUDAP31Yc4cJjY9uIY8Mv` (customer `cus_QqEMmtM3pkdUET`) at 14:54 today. The webhook arrived but failed:

> `processing_error: No REPS user found for Stripe customer cus_QqEMmtM3pkdUET`

That subscription is a legacy **£250/yr** plan on product `prod_Qrf1TGAhkKjUHL` — **not** one of our current Verified £99 / Pro £59 / Studio products. The customer has:

- no row in `subscriptions`
- no row in `legacy_stripe_link`
- no `metadata.reps_user_id`
- no email match in `auth.users`

So it was **never an active REPS member in our database**. The counts on `/admin` are unaffected — Active Members is still **392** and Active Professionals is still **391**. The 1-row gap I described in the previous turn (one ghost sub on the Members side + one over-subtracted admin on the Professionals side) is unchanged.

In other words: the delete worked correctly in the sense that there was nothing here to remove. The numbers don't match yet because the underlying drift is the gap I already identified, not this Stripe deletion.

## What to fix

The handler should not treat "deleted subscription for an unknown customer" as a hard error. Right now it leaves a permanent `processing_error` row and would re-noise the webhook recovery dashboard on every future orphan deletion.

### Code change
- `src/routes/api/public/payments/webhook.ts` — in the `customer.subscription.deleted` case, if `resolveUserId()` returns null:
  - swallow the throw,
  - mark `payment_events.processed_at = now()` with `processing_error = null`,
  - record a short note in the event row's `payload`-adjacent log (or just leave a `console.warn`) so it shows up as "no-op: customer not linked to a REPS user".
  - skip the `enter_churn_stage` call.
- Keep `customer.subscription.created` / `.updated` strict — those still legitimately need a resolved user, and the resolver ladder we shipped covers them.

### What this does NOT change
- The 392 vs 391 gap (separate cleanup — happy to do that as its own pass when you want).
- Any other webhook path.
- The resolver ladder.

After the fix, the failed event at 14:54 will be re-marked as processed (one-line UPDATE in the same migration / a one-off button on `/admin/webhook-recovery`).

Want me to ship just the deletion-handler hardening, or bundle in the 392 vs 391 reconciliation at the same time?