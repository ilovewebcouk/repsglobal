## Rebuild `/forgot-password` to match the new `/auth` shell

The current page uses the old light-themed `AuthShell` 2-column layout. Restyle it to mirror the rebuilt `/auth` page: dark `bg-reps-ink`, centred REPs wordmark above a single 420px card, brand glow decorations, inline validation, friendly errors.

### Changes to `src/routes/forgot-password.tsx`

1. **Drop `AuthShell` / `AuthField` / `AuthPrimaryButton`** — replace with the same primitives `/auth` uses (`Card` markup via inline divs, shadcn `Input`, `Label`, `Button`, `Alert`).
2. **Page shell** — copy the `/auth` skeleton verbatim:
   - `bg-reps-ink text-reps-text` root with the two orange radial glow `div`s
   - Centred column (`max-w-[420px]`) with `RepsWordmark` (h-7) above the card
   - Card: `rounded-[22px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)] backdrop-blur-sm`
   - Footer "Remember your password? Sign in" link below the card
3. **Card content**:
   - H1 "Reset your password" (24/28px, white, font-display)
   - Sub "Enter your email and we'll send you a secure link." (white/65)
   - Email field with shadcn `Label` + `Input` styled identically to `/auth` (h-11, rounded-[12px], white/15 border, dark fill)
   - Inline email validation: blur + onChange revalidate after touched, red border on `aria-invalid`, helper text `text-red-300`
   - Friendly error mapping helper (rate limit, invalid email, network) → red `Alert`
   - Success state: emerald `Alert` "If an account exists for that email, a reset link is on its way." (uses the only-emerald-for-status token triplet from memory: `border-emerald-400/30 bg-emerald-500/15 text-emerald-300`)
   - Primary button: full-width, h-11, `bg-reps-orange hover:bg-reps-orange-hover`, loading spinner via `Loader2` with `data-icon="inline-start"`
   - "Back to sign in" link to `/auth` (orange, semibold) under the button
4. **Security note** — keep the "we'll only confirm whether a reset email has been sent" note but restyle to the dark card: `rounded-[12px] border border-white/10 bg-white/[0.03] p-4 text-[12px] text-white/55`.
5. **Preserve all behaviour** — same `supabase.auth.resetPasswordForEmail` call, same `redirectTo`, same generic success message (no email-existence disclosure), same `sent` lockout to prevent re-sends.
6. **Head meta** — leave the existing title/description/OG tags; just update the title casing to "Reset your password — REPs" (lowercase "REPs" per brand rule).

### Out of scope

- `/reset-password` (the page users land on from the email) — not touched in this turn. Flag at the end that it still uses the light `AuthShell` if the user wants it migrated next.
- `AuthShell` component itself — leave in place; it may still be used by `/reset-password` or `/signup`.
