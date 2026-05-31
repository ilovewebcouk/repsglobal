## Leftover button shadows

The shadcn `Button` variants are now flat, but four hand-rolled CTA buttons in route/component files still apply a custom orange drop shadow via arbitrary `shadow-[...]` utilities. These should be removed for consistency with the locked mock-ups and the earlier flat-button decision.

## Files to change

- `src/routes/index.tsx:258` — hero "Find a REP" CTA: drop `shadow-[0_10px_28px_-10px_rgba(242,140,56,0.8)]`
- `src/routes/index.tsx:590` — closing CTA: drop `shadow-[0_10px_28px_-10px_rgba(242,140,56,0.7)]`
- `src/routes/find-a-professional.tsx:190` — search CTA: drop `shadow-[0_10px_28px_-10px_rgba(242,140,56,0.8)]`
- `src/components/public/PublicHeader.tsx:56` — header "Find a REP" CTA: drop `shadow-[0_8px_24px_-8px_rgba(242,140,56,0.6)]`

No other classes change; flat orange buttons remain orange with hover color transition only.

**Status:** completed — all four CTA shadows removed.

## Out of scope

- Card / panel `shadow-[var(--reps-shadow-card)]` on `index.tsx` lines 381 and 531 — these are container surfaces, not buttons; mock-ups show elevation on those cards.
- Form-control shadows (`input`, `textarea`, `select`, `toggle`, `checkbox`, `input-otp`, `calendar`) and overlay shadows (`popover`, `menubar`, `hover-card`, `alert-dialog`, `sonner`, `navigation-menu`) — not buttons.
- `badge.tsx` `shadow` on default/destructive variants — not buttons; leave for a separate decision if desired.
- `--reps-shadow-*` tokens in `src/styles.css` — still used by cards.
- Plan/doc update: append a short note under the existing shadow entry in `.lovable/plan.md` recording the four CTA cleanups.
