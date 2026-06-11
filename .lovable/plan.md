## Move REPs wordmark above the login card

Currently the `RepsWordmark` is pinned top-left of the page (with the "Register of Exercise Professionals" tagline beside it). The login card stands alone in the middle of the page.

Reposition to match the shadcn `login-03` reference: a centred brand mark sitting **above** the card, outside it — so the visual stack reads logo → card → terms.

### Changes to `src/routes/auth.tsx`

1. **Remove** the absolutely-positioned top-left `Link` block containing `<RepsWordmark />` + the "Register of Exercise Professionals" tagline.
2. **Add** a centred `Link to="/"` directly above the card (inside the existing `max-w-[420px]` column, before the card `div`):
   - `RepsWordmark` rendered at `h-7 w-auto` (slightly larger than the previous 24px since it now anchors the page)
   - Centred via `inline-flex` on a `flex justify-center` wrapper
   - `mb-6` spacing to the card below
   - `aria-label="REPs — back to home"` preserved
3. Drop the small "Register of Exercise Professionals" tagline — it doesn't belong sitting next to a centred page-anchor logo (it was only there because the wordmark was top-left chrome). The card heading "Login to your account" already carries context.
4. Keep the decorative orange glows, the card, and everything below it unchanged.

### Result

```
        [ REPS wordmark ]            ← centred, above card
   ┌────────────────────────────┐
   │  Login to your account     │
   │  Email / Password / OAuth  │
   └────────────────────────────┘
   By signing in you agree to…    ← unchanged
```

No copy, validation, OAuth, or styling logic changes — purely repositioning the brand mark.