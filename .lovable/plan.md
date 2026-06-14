
## What we're changing

Stripe Embedded Checkout doesn't accept a per-session `appearance` object — the iframe contents are styled via the **Stripe Dashboard → Branding** settings only. So the work splits in two: a dashboard checklist for you, and code changes for me.

---

## Part 1 — Stripe Dashboard checklist (you, ~3 min, both sandbox + live)

Go to **Stripe Dashboard → Settings → Public Details / Branding** in **sandbox first**, then repeat for **live mode** (toggle top-right).

| Setting | Value | Notes |
|---|---|---|
| **Icon** (square) | Upload a 128×128 PNG of the REPs orange "R" mark on dark | Used as the favicon-style mark in the iframe header |
| **Logo** (horizontal) | Upload the REPs wordmark SVG/PNG (white on transparent) | Appears top-left of iframe |
| **Brand color** | `#FF7A00` | Drives the submit-button background |
| **Accent color** | `#0B0B0E` (REPs ink) | Drives links, focus rings inside iframe |
| **Button shape** | **Rounded** (10px equivalent — Stripe only offers Pill / Rounded / Sharp; pick Rounded) | Matches REPs button radius |
| **Font** | **Inter** (closest Stripe-supported match to our display stack) | If not in the picker, leave default |

I'll paste these exact values back in chat after you confirm so you can copy/paste.

---

## Part 2 — Code changes (me)

### A. Full split layout — dark left, light right, hard vertical seam
Refactor `src/routes/checkout.tsx` so the right column is **edge-to-edge off-white** (`#FAFAF7`), bleeding all the way to the viewport right edge with a single 1px vertical divider against the dark left panel. The Stripe iframe sits flush on this light surface — no more white card floating on dark. Mobile stacks as today (dark summary collapsible at top, light iframe panel below).

Concretely:
- Drop `max-w-[1240px]` outer container — split becomes truly full-bleed.
- Left column: dark `bg-reps-ink`, content constrained inside to ~520px, right-aligned to the seam.
- Right column: `bg-[#FAFAF7]` full-bleed, content constrained to ~520px, left-aligned to the seam.
- Iframe wrapper drops the white card / shadow — iframe sits directly on the light surface.
- Header becomes full-width dark band across both columns at the top; trust-footer microcopy moves under the iframe in matching dark-on-light type.
- Trust tiles + testimonial restyled for the dark column; "Powered by Stripe / 256-bit TLS / PCI DSS Level 1" footer restyled for the light column.

### B. REPs-voice microcopy inside the iframe
Update `createCheckoutSession` in `src/lib/billing/billing.functions.ts` to pass `custom_text`:

```ts
custom_text: {
  submit: {
    message: tier === "verified"
      ? "By joining REPs Verified, you're added to the global register of qualified, insured trainers."
      : "Your 30-day free trial starts today. Cancel any time from your REPs dashboard.",
  },
  after_submit: {
    message: "Setting up your verified REPs profile — this takes a few seconds.",
  },
  terms_of_service_acceptance: {
    message: "I agree to the [REPs Terms](https://repsglobal.lovable.app/terms) and [Privacy Policy](https://repsglobal.lovable.app/privacy).",
  },
},
consent_collection: {
  terms_of_service: "required",
},
```
(Stripe's `custom_text.submit.message` renders **above** the submit button — it's how we get REPs voice inside the locked iframe. The submit button label itself can't be overridden on Embedded; it shows "Subscribe" / "Start trial" automatically.)

Same `custom_text` pattern added to `createCreditTopupCheckout` in `src/lib/credits/credits.functions.ts` with a top-up-flavored message.

### C. Mirror the split layout on the credits checkout
Update `src/routes/_authenticated/_professional/checkout_.credits.tsx` to use the same dark-left / light-right split, so both checkout flows feel like one design system. Left column: pack summary + "what credits unlock" bullets. Right column: iframe on light.

---

## Out of scope

- No change to Stripe price IDs, tier logic, webhooks, RLS, server-fn auth.
- No change to `/checkout/return` success page.
- No marketing pages touched.
- Dark-mode Stripe iframe (impossible — Stripe doesn't offer it).
- Custom font upload into Stripe (not supported on the standard plan).

---

## After implementing

I'll ask you to refresh `/checkout?tier=pro&period=annual` and confirm the split reads right; then we tweak the seam / left-column density together.
