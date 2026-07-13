## What went wrong

The batch I ran created the auth users and inserted a `subscriptions` row, but two things are missing:

1. **No names** on the accounts. `profiles.full_name` was left as the email address because I never pulled the trainer's real name from the legacy data.
2. **No Stripe subscription**. I only wrote a row into our `subscriptions` table with `stripe_subscription_id = null`. There is nothing on the Stripe side, so Stripe will not bill them on their renewal date.

Both are in `bd_member_seed` / Stripe already — I just didn't wire them in. Fixing.

## What I'll change (all 15 members)

### 1. Set the name on each account
For each of the 15 emails, pull `first_name` + `last_name` from `bd_member_seed` and write it to `profiles.full_name`. All 15 have names available:

```text
altfitness@myyahoo.com              → April Collinson
elizabeth.payne@live.co.uk          → Elizabeth Payne
emily.young@slimmingworld.co.uk     → Emily Young
faracifitness@hotmail.co.uk         → Gerardo Faraci
hello@fionadillon.com               → Fiona Dillon
hellotiredmumclubnorwich@gmail.com  → Megan Bowe
sarah@theyogaconnection.co.uk       → Sarah Betteridge
scarrfitness@gmail.com              → Shaun Carr
sophia@sophiasmithfitness.com       → Sophia Smith
steven@trainyourneedsfirst.co.uk    → Steven Roleio Doe
thehuffkin@hotmail.com              → Lee Robertson-Young
support@newgenfitness.uk            → Brett Falconer
rmffitnes@outlook.com               → Ross McKee
prapti.dutt@gmail.com               → Prapti Dutt
billie@benefitbodyandmind.com       → Billie Wood
```

I'll also copy the same name into `professionals.display_name` (or the equivalent column the profile page reads) so their public listing shows correctly.

### 2. Create a real Stripe subscription on each customer
On the live Stripe account, for each `cus_...`:

- **Price**: `verified_annual` (Core £34/yr) — same price everyone else on Core is billed on.
- **`trial_end`** = the `current_period_end` we already calculated from their last legacy payment (so the FIRST Stripe charge fires on their renewal date, not today — nobody gets charged now).
- **`proration_behavior: 'none'`**, **`collection_method: 'charge_automatically'`**, using the customer's existing default payment method (they all paid before, so Stripe already has a card on file).
- **`metadata`**: `{ manual_relink: true, source: 'admin_batch_2026_07' }` so we can audit these in Stripe later.

Then update our `subscriptions` row with the real `stripe_subscription_id` and `stripe_price_id`.

### 3. If a customer has no payment method on file
Log the row as `payment_method_missing` and skip the Stripe create — do not fake it. I'll surface the list at the end so you can email them separately. (Very unlikely for this batch since they all paid recently, but need to handle it.)

## How I'll run it

Same endpoint pattern as before — `/api/public/admin/manual-relink-stripe` protected by `MANUAL_RELINK_SECRET`, triggered directly from my shell. No admin UI click needed. Idempotent: re-running skips rows that already have a Stripe sub attached and a name set.

## Technical notes

- File edited: `src/routes/api/public/admin/manual-relink-stripe.ts` — add name lookup + Stripe subscription creation using `createStripeClient('live')`.
- Stripe API: `stripe.subscriptions.create({ customer, items:[{price}], trial_end, proration_behavior:'none', metadata })` — the trial-end trick means Stripe waits until the renewal date and then charges normally, no invoice today.
- Report at the end lists per-row: `name_set`, `stripe_sub_id`, `first_charge_at`, and any error.

## Not touching

- The already-created auth users, the `subscriptions.current_period_end` dates you already saw, and the password-setup emails already sent. All correct — just missing the two pieces above.

Approve and I'll run it.