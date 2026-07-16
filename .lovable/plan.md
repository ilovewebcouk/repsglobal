## Reframe
The aside stops pretending to be a second plan card. It becomes a **"Pay-per-completion" panel** whose job is to make the £15 feel earned, not scary — by showing the artefact the learner (and their future employer) actually receives.

Hero of the box is a **miniature certificate mockup**, not a price. Price is a supporting caption. Deliverables are captions on the artefact, not a bullet list.

## New layout inside the existing `<aside>` (still `src/routes/training-providers.tsx` 674–692)

```text
┌──────────────────────────────────────────────┐
│  ▸ eyebrow: "Pay only when they finish"      │
│                                              │
│  ┌────────────────────────────────────────┐  │  ← mini-certificate
│  │  REPs · verified                       │  │    (mocked in JSX,
│  │  Certificate of Achievement            │  │     ~ 3:4 ratio,
│  │  ——————————————                        │  │     subtle paper
│  │  Awarded to  •  Learner Name           │  │     texture, gold
│  │  Level 3 Personal Trainer              │  │     hairline border,
│  │  Provider · Your Academy               │  │     tiny QR block
│  │                                        │  │     bottom-right)
│  │  ID · REPS-C-A73F   ▢ QR               │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  £15  per learner completion                 │  ← price demoted to
│                                              │    caption row
│  ✓ Achievement cert   ✓ Unit summary         │  ← 2×2 chip grid
│  ✓ Public verify URL  ✓ QR                   │    of deliverables
│                                              │
│  ─────────────────────────────────────────   │
│  Small print: 30-day refund if REPs can't    │
│  endorse any course. Membership is annual;   │
│  cancellation is immediate.                  │
└──────────────────────────────────────────────┘
```

## What actually changes in JSX

1. **Eyebrow:** replace the existing "Learner certificates" pill copy with "Pay only when they finish." Same pill component, same tokens.
2. **Mini-certificate mock** (new inline JSX, ~40 lines, no new file):
   - Rounded card, `rounded-[14px] border border-white/12 bg-gradient-to-br from-white/[0.04] to-white/[0.02]`, `aspect-[4/3]`, `p-5`.
   - Top row: tiny REPs lockup + "verified" badge in emerald (status-only, per memory).
   - Serif display title "Certificate of Achievement" (`font-display`).
   - Hairline divider.
   - "Awarded to · Learner Name" (placeholder styled as writing-line grey).
   - Course line: "Level 3 Personal Trainer".
   - Provider line: "Your Academy".
   - Bottom row: `ID · REPS-C-A73F` on left, a stylised 6×6 CSS QR block on right (pure divs, no image dependency).
   - No real names, no real photos — clearly a template, not a fake credential.
3. **Price row:** `£15` at `text-[28px]` (not 52px), inline "per learner completion" at `text-[13px] text-white/60`. Sits under the certificate, not above it.
4. **Deliverables grid:** 2×2 grid of small chip rows using existing `CheckCircle2` (`h-3.5 w-3.5 text-reps-orange`) + label at `text-[13px] text-white/75`. Labels: "Achievement certificate", "Learner unit summary", "Public verification URL", "Scannable QR code".
5. **Fine print:** unchanged position, but split into two lines separated by ` · `, dropped to `text-[12px] text-white/40`, above a `border-t border-reps-border/50 pt-4 mt-6`.

## Why this is stronger than v1
- **Shows the thing.** A prospect can see what their learner gets in half a second; text bullets can't do that.
- **Fixes the pricing hierarchy.** £15 stops competing with £479. It reads as a per-outcome caption on an artefact, which is what it actually is.
- **Trust from design, not adjectives.** Emerald "verified" chip + QR + ID number carry the credibility the current comma-soup sentence was trying to earn.
- **Reusable.** The same mini-cert component can be lifted into `/for-professionals`, the CPD page, and comparison pages later. Not building it as a separate file yet — inline — but structured so extraction is a copy-paste.

## Out of scope
- No changes to price value, membership card, `ORG_TIERS`, Stripe wiring, or any other section of the page.
- No new image assets (the certificate is pure JSX/CSS — no generation, no `<img>`).
- No new component files this pass; if we reuse it in another page later, we extract then.

## Note on the snapshot you asked for
I tried to capture the current aside via headless Chromium against the sandbox preview and it returned `403 Forbidden` on the localhost dev server, so I read the exact JSX (lines 674–692) directly instead. If you want a rendered before/after, I can capture it against the published preview URL once we're in build mode.
