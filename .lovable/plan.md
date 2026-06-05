# Sticky aside + truthful trust copy on `/pro/$slug/enquire`

Two surgical changes to the locked enquire page, plus a lock-memory refresh so the new copy is the new source of truth.

## 1. Sticky right column (desktop only)

In `src/routes/pro.$slug.enquire.tsx`, the `<aside>` becomes sticky from `lg:` up:

- Wrap the aside contents in a sticky container: `lg:sticky lg:top-24 lg:self-start`.
  - `top-24` clears the solid `PublicHeader` (matches the header offset used elsewhere).
  - `self-start` lets the aside size to its own height inside the grid row (otherwise sticky has no effect because grid items stretch).
- Mobile/tablet stack stays exactly as today — no `sticky` below `lg`.
- No height cap, no internal scroll — the aside is short enough to fit the viewport at any realistic desktop height.

## 2. Trust + journey copy (verification-led, no payment promises)

Drop every claim REPs can't deliver in Phase 1.

**"Booking on REPs is safe" block** — replace the three rows:

| Old | New |
| --- | --- |
| `ShieldCheck` — Identity, qualifications & insurance verified | `ShieldCheck` — Identity, qualifications & insurance verified |
| `Lock` — Payments secured by REPs — never paid before you confirm | `Lock` — Private enquiry — never shared, sold, or added to mailing lists |
| `CheckCircle2` — Refund protection on cancelled sessions | `CheckCircle2` — Every REPs pro signs our code of conduct |

**"What happens next" step 3** — currently sells a booking/payments engine that doesn't exist. Rework:

| Old step 3 | New step 3 |
| --- | --- |
| **Book and pay through REPs** — Card payment is taken when you confirm — never before. | **Agree the details directly** — Confirm scope, times and price with your pro before anything's locked in. |

Step 4 ("Start training") stays as-is.

**Heading caption** stays ("Tell {name} a bit about your goals… no payment until you accept.") because that one is literally true — there is no payment.

Wait — that line ("no payment until you accept") also implies a REPs payment moment. Tighten to: **"…they'll reply privately with a clear quote and next steps."** (drops the payment phrase entirely.)

## 3. Out of scope (Phase 1 guardrail)

- No actual sticky-on-mobile behaviour, no auto-collapsing summary, no scrollspy.
- No real submit, validation, email, or analytics — `Send enquiry` stays `type="button"`.
- No new icons, no new shadcn primitives — reuses the ones already in place.

## 4. QA

- Desktop 1366: confirm aside sticks on scroll past the form's three steps, with the pro card, "what happens next", and trust block all in view.
- Mobile 390: confirm no sticky behaviour, normal stacked order.
- `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` — must exit on the same baseline as today (only the documented 14px pro-photo exception remains for this file).
- Tab through form — no regressions to focus rings or shadcn controls.

## 5. Lock-memory refresh

Update `mem://design/locked-enquire` to:
- Add the sticky-aside rule (`lg:sticky lg:top-24 lg:self-start` on the aside, mobile stacked).
- Replace the trust block + step 3 copy in the "Section order" / "Copy rules" sections with the new wording above.
- Add an explicit "Banned on this page" list: no "payments secured by REPs", no "refund protection", no "card payment is taken when you confirm", no Stripe / booking-fee language (consistent with the global Core rule).

Add a 2026-06-05 entry to `docs/07_phase1_build_status.md` Lock log noting the sticky aside + verification-led trust copy refresh.

## Files touched

- `src/routes/pro.$slug.enquire.tsx`
- `mem://design/locked-enquire`
- `docs/07_phase1_build_status.md` (lock-log line only)
