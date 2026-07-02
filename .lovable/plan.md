## Scope

Core becomes **£34/year, billed yearly**, shown as **£34 reduced from £99**. No monthly Core. Pro and Studio unchanged.

Everyone is simply a **member / Core subscriber**. There is no such thing as a BD-migrated member on this platform anymore — that language is banned from every plan, copy string, support script, comment, email and admin surface going forward.

## Memory hygiene (first step, before any code)

Once you switch to build mode I will:

1. Update `mem://index.md` Core rules — change the Phase 2.0 line to reference **Core £34/yr (reduced from £99)** and add a hard rule: *"Never mention BD migration, BD migrated members, legacy members, or £34→£99 honour price. Everyone is a member / Core subscriber."*
2. Update the Reviews module memory to drop the "BD backfill" phrasing.
3. Add `mem://constraint/no-bd-migration` describing the ban.

This is so I never repeat the mistake in a future plan.

## Pricing change

### 1. Core price source of truth

`src/lib/billing.ts`:
- Core price label `£34`
- Interval `per year`
- Checkout display `£34/yr`
- Keep the Core annual checkout lookup key so nothing else has to change in the checkout wiring.

### 2. Pricing cards

`src/components/pricing/pricing-data.ts` — Core reads:
- Price `£34`, was `£99` (struck through)
- Period `per year`
- Meta `£34 billed yearly`

Same values under both Monthly and Annual toggle states (Core is annual-only). Pro and Studio card data untouched.

Compare table Core column shows `£34/year (was £99)` and `Charge today: £34`.

### 3. Payment provider price

The Core annual checkout lookup must resolve to a recurring **£34/year** price in the payment backend. If the environment exposes payment product tooling I will update it directly; otherwise I will call out the one manual step needed in the payment backend before publishing.

Existing Core subscribers renew at £34/year going forward. No refunds, no proration, no mid-cycle adjustments.

### 4. Account, admin and email surfaces

Anywhere Core is currently rendered as £99/year or 9900 pence, change to £34/year / 3400 pence:

- Member `dashboard/settings` billing labels
- Admin professionals list + subscription/renewal summaries
- Renewal, payment-failed, card-needed and purchase-confirmation email defaults
- Billing metrics / MRR / ARR constants for the Core tier

### 5. Copy sweep

Replace Core / Verified price mentions across:

- `/pricing`, `/signup`, `/for-professionals`, `/contact`, `/help`, `/terms`
- All `/features/*` Core-vs-Pro comparison blocks
- Comparison editorial snippets
- Support AI draft brief
- Renewal-related email templates

Preferred phrasings:
- `Core — £34/year`
- `£34 billed yearly`
- `£34/year, reduced from £99`

### 6. Remove obsolete migration copy

Any user-facing, support-facing or agent-facing string that describes members as migrated, legacy, BD, or as moving from £34 to £99 is rewritten or deleted. This is a copy sweep only — no database schema changes, no deletion of historical tables in this task.

### 7. QA before publish

1. `/pricing` shows Core `£34` with `£99` struck through; Pro and Studio unchanged.
2. `/signup` shows Core annual-only at £34.
3. Fresh Core checkout charges £34/year.
4. Member dashboard shows `Core · £34/year`.
5. Admin billing metrics compute Core against 3400 pence/year.
6. Grep confirms no remaining `£99` for Core, and no `BD`, `migrated`, `legacy member`, or `£34 → £99` copy anywhere user- or support-facing.

## Out of scope

- Command Center work.
- Pro / Studio pricing.
- Any database schema migration.
- Any monthly Core plan.