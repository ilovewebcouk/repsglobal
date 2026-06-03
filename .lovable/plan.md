# Add 30-day free trial to REPs Pro

Pro tier gets a **30-day free trial**. Stripe handles the trial via `trial_period_days: 30` at checkout — card is captured during normal Stripe signup, but we do **not** mention "card required" anywhere in marketing copy. Verified and Studio are unchanged. Founding pricing claim is kept.

## Public wording (locked)
Short, everywhere: **"30-day free trial"**

No mentions of "card required", "no card needed", "free for 30 days then auto-bills", or any other qualifier. Stripe's own checkout page already discloses the card and trial terms at the point of payment, which is where that belongs.

## Marketing / copy changes

### 1. Pricing cards (`src/components/pricing/pricing-data.ts`)
Pro tier only:
- Append `" · 30-day free trial"` to the `meta` string on both `monthly` and `annual` pricing views.
- Change CTA from `"Start Founding Pro"` → `"Start free trial"` (keep `ctaHref: "/signup"`).
- Add a new lead feature bullet at the top of Pro features: **"30-day free trial"**.

### 2. Pricing FAQ (`src/components/pricing/pricing-data.ts`, `FAQ` array)
Insert one new Q&A near the top:
- **Q:** "Is there a free trial?"
- **A:** "Yes — Pro includes a 30-day free trial. You can cancel anytime during the trial from your dashboard. Verified and Studio don't currently include a trial."

### 3. Pricing route meta (`src/routes/pricing.tsx`)
Tighten description and include trial; stay under 160 chars and avoid banned phrases:
- New: `"Verified £99/yr. Founding Pro from £49/mo with a 30-day free trial. Studio £149/mo. Every feature in your tier is included — no add-on stack."`

### 4. Founding banner (`src/components/pricing/FoundingBanner.tsx`)
Append one short clause: **"Includes a 30-day free trial."** Primary line (founding £59/mo lock-in) stays.

### 5. Comparison data (`src/data/competitor-data.ts`)
Update `repsPro.freeTrial` so the REPs card on `/compare` and every `/compare/reps-vs-*` page surfaces the trial:
- Old: `"Founding pricing on Pro locked for early members before public launch"`
- New: `"30-day free trial · founding pricing locked for early members"`

### 6. Comparison editorial FAQs (`src/data/competitor-editorial.ts`)
The two existing "free trial" answers currently imply REPs has none. Update the REPs framing inside each:
- **MyPTHub** answer: append `" REPs Pro also includes a 30-day free trial."`
- **PT Distinction** answer: append `" REPs Pro also includes a 30-day free trial."`
- Trainerize: no existing trial Q&A — leave alone.

## Out of scope (this plan is copy/data only)
- Wiring `trial_period_days: 30` into `createCheckoutSession` (`src/lib/billing/billing.functions.ts`) and the Pro price in `src/lib/billing/prices.ts`. This is the Stripe-side change that actually delivers the trial. **Recommend doing it in a small follow-up plan** so the marketing copy and the checkout behaviour land together — flag this back to you before shipping the copy alone.
- Trial-expiry emails, dunning, in-app trial countdown UI.
- Any change to Verified or Studio.

## Banned-phrase check
No "15%", "booking fee/commission", "flat plan", "Stripe included/surcharge", "card required". Clean.
