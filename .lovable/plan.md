## Goal
Replace `/auth` with a simple, centred shadcn `login-05`-style card: email + password, plus Google and Apple. Drop the right-hand shop-front mock.

## Steps

1. **Install the block**
   - Run `bunx --bun shadcn@latest add login-05` to pull in the canonical login-05 markup as a starting point under `src/components/`.
   - Review the added files and rewrite imports/icons to match the project (`@/` alias, lucide already present).

2. **Wire Apple in Lovable Cloud**
   - Call `supabase--configure_social_auth` with `providers: ["google", "apple"]` to enable Apple alongside the existing Google. (Email/password stays enabled.)

3. **Rebuild `src/routes/auth.tsx`**
   - Remove the 2-column grid and the `ShopFrontMock` import.
   - Centre a single login-05-style card on the page; keep the existing decorative orange glows for brand chrome.
   - Keep the existing `RepsWordmark` link above the card and the Terms/Privacy footer line below it.
   - Card contents (top → bottom):
     - Heading "Login to your account" (current copy, current 30 → 40 scale).
     - Short lede (current copy).
     - Email + password form using shadcn `FieldGroup` / `Field` / `Input` / `Button` (replacing the hand-rolled inputs). Keep "Forgot password?" link on the password row and the existing `handleSubmit` flow.
     - Inline error using shadcn `Alert` (`variant="destructive"`) instead of the hand-rolled red div.
     - Divider "Or continue with".
     - Two `Button variant="outline"` rows: Google (uses existing `handleGoogle`) and Apple (new `handleApple` using `lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin })`).
     - "Don't have an account? Sign up" link (`/signup`, unchanged).
   - Preserve the existing redirect logic (`redirectAfterAuth` + `navigate`).

4. **Cleanup**
   - Remove the now-unused `ShopFrontMock` import and the right-column markup.
   - Leave the `src/components/auth/ShopFrontMock.tsx` file in place (no other consumers? — verify with `rg` and delete only if truly unused).

## Notes
- Styling stays on REPs tokens (`bg-reps-ink`, `text-white`, `--reps-orange`); no raw hex colours.
- Radius map respected: button 10px, input 12px, card 22px (large panel).
- No backend/schema changes; only auth provider toggle + route file rewrite.