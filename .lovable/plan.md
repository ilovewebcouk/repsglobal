## Goal

Replace hand-rolled markup in `src/components/pricing/PricingPlans.tsx` and the plan-summary "checkout entry" card in `src/routes/signup.tsx` with shadcn primitives, keeping the locked dark-mode look 1:1.

## Scope (UI/presentation only)

In scope:
- `src/components/pricing/PricingPlans.tsx` — tier cards, billing toggle, Enterprise strip, CTA buttons.
- `src/routes/signup.tsx` (lines ~493–556) — `planSummary` checkout-entry card + its "Continue to secure checkout" note and Change plan link.
- `src/components/pricing/FoundingBanner.tsx` — convert the "Founding members" pill to `Badge`.

Out of scope (no changes):
- `pricing-data.ts`, `createCheckoutSession`, `handlePaidCta` logic, Stripe wiring, signup auth flow.
- `PricingCompare.tsx`, `PricingFAQ.tsx`, other pricing surfaces.
- Any colour tokens, radii, spacing, copy, or section order — visuals must match current screens.

## Primitives to use

`Card` (+ `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`), `Button` (variants `default` / `outline`, with `data-icon` for spinner/star), `Badge` (variants `default` for orange and a local `outline` for the soft-orange pill — keep current tokens), `ToggleGroup` + `ToggleGroupItem` (single-select, for Monthly/Annual), `Separator` (replaces the manual `border-t` inside the signup summary card), `Spinner` for the redirecting state.

Icons stay `lucide-react`; pass with `data-icon="inline-start"` inside buttons. No new sizing classes on icons.

## Changes

### 1. PricingPlans.tsx
- Wrap each tier in `<Card>` with `CardHeader` (title/description), `CardContent` (price block + features `<ul>`), `CardFooter` (CTA). Featured tier keeps the `lg:-translate-y-3 lg:scale-[1.03]` lift, orange ring, and warm shadow via `className` on the `Card` — pure layout overrides, no colour overrides.
- Replace billing pill row with `ToggleGroup type="single"` styled to keep the existing rounded-full orange active state via `data-[state=on]` classes. Keep "Save 2 months" sub-pill as `Badge`.
- Replace "Most popular" floating tag with `Badge` (absolute-positioned wrapper preserved).
- Replace CTAs with `Button` (`variant="default"` for featured/orange, `variant="outline"` for others), keeping `disabled` + "Redirecting…" text; show `Spinner` via `data-icon="inline-start"` while `checkoutTier === p.tierKey`.
- Replace founding-price tag with `Badge`.
- Enterprise strip becomes a `Card` with `CardContent` (flex row preserved); Contact CTA becomes `Button asChild` wrapping the `<Link>`.

### 2. signup.tsx plan-summary card
- Convert the `planSummary` wrapper div into `Card` (light-theme variant preserved via existing token classes on `Card`), with an inner orange ribbon kept as-is (it's a banner, not a card surface).
- Replace the manual `border-t` divider above highlights with `<Separator />`.
- "Founding member pricing" ribbon → `Badge` inside the ribbon strip.
- Keep all copy, columns, and the `Link to="/pricing"` change-plan affordance unchanged.

### 3. FoundingBanner.tsx
- Convert the inline "Founding members" pill `<span>` to `Badge` with the soft-orange token classes already in use.

## Constraints

- Dark-mode visuals must match pixel-for-pixel: keep `bg-reps-panel`, `border-reps-border`, `text-reps-orange`, radii (`rounded-[22px]` card, `rounded-[10px]` button), shadows, and the featured-tier lift/glow.
- No semantic-token swaps that would change colour output. Use `className` on shadcn primitives only for layout/positioning, per the shadcn skill rules.
- No `space-y-*` introduced; use `flex flex-col gap-*` where Card composition needs extra spacing.
- Replace `h-4 w-4` style square sizings on Avatar-like spots only if they're inside a shadcn primitive that owns sizing — otherwise leave existing classes (these aren't shadcn components).
- No behaviour changes: `handlePaidCta`, `continueAfterAuth`, billing state, URLs, and analytics-affecting markup unchanged.

## Verification

- Visual diff on `/pricing`, `/for-professionals`, `/signup?tier=pro&period=annual&next=checkout`, and the founding banner site-wide — featured tier still lifts, orange ring + glow present, Monthly/Annual toggle behaves identically, "Save 2 months" badge visible on Annual.
- Click each CTA: verify it calls `handlePaidCta` and shows "Redirecting…" with spinner; outline tiers still route correctly.
- Confirm dark mode unchanged; no console warnings about missing `DialogTitle`/etc. (n/a here, but check for shadcn a11y warnings).
