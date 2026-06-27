The dashboard is wrong right now. Yesterday was not £198. It was £99.

What I found:
- There is one real paid transaction yesterday: Jordon Gumbley, £99, at 12:02 London time.
- The backend stored two related payment rows for the same money:
  - `charge.succeeded` = £99, payment intent `pi_3TmXVs...`
  - `invoice.payment_succeeded` = £99, same payment intent `pi_3TmXVs...`
- The existing “skip charge if it has an invoice” logic failed because this Stripe charge row does not carry `invoice` directly; the invoice row carries the charge/payment intent link instead.
- So the dashboard counted the same cash twice: £99 + £99 = £198.
- New registrations is correct for yesterday: Jordon has one first live paid subscription in that period.

Plan:
1. Replace the revenue aggregation in `src/lib/admin/overview.functions.ts` so it counts money by a stable payment key, not by event row.
   - Prefer `payment_intent` as the de-duplication key.
   - Fall back to charge id / object id / event id only when no payment intent exists.
   - When both invoice and charge events exist for the same payment, count exactly one amount.
   - Prefer `invoice.payment_succeeded` as the canonical row for subscription payments because it carries the user id and billing reason.

2. Keep standalone payments safe.
   - Continue counting standalone `charge.succeeded` rows when there is no invoice event for the same payment.
   - Continue subtracting charge refunds where the only available payment row is a charge event.

3. Add a small diagnostic DTO field only if useful in development? No UI change unless needed.
   - I will avoid changing the admin UI design.
   - The visible fix should simply make “Revenue received” show £99 for yesterday.

4. Verify after implementation.
   - Query the database again for yesterday’s rows.
   - Check the live `/admin?period=yesterday` page value.
   - Confirm revenue = £99 and new registrations = 1.

Technical detail:
```text
Current broken logic:
count invoice.payment_succeeded £99
count charge.succeeded £99 because charge.invoice is null
= £198

Correct logic:
group both rows by payment_intent pi_3TmXVs...
choose invoice.payment_succeeded as canonical
count £99 once
= £99
```