## Lock professional profile + build Sign Up / Login

### Part 1 — Lock the profile page

- Add a memory file `mem://design/locked-profile` noting `/pro/$slug` is the locked Phase 1 visual for `reps_fullpage_professional_profile_v1.png`.
- Update `mem://index.md` to list it under Memories so future edits don't drift from the agreed layout (horizontal service cards, no icons, current radii and tokens).
- No code changes to `src/routes/pro.$slug.tsx`.

### Part 2 — Build Sign Up / Login (static Phase 1)

Source of truth: `src/mockups/reps_fullpage_signup_login_v1.png`.

**Routes (two new files):**
- `src/routes/login.tsx` → `/login`
- `src/routes/signup.tsx` → `/signup`

Each route gets its own `head()` with distinct title, description, og:title, og:description.

**Shared layout (both pages):**
- Use existing `PublicHeader` (solid variant) and `PublicFooter`.
- Two-column split: left = form panel on `bg-reps-warm-white`, right = visual / value-prop panel (image + bullet trust points), matching the mockup composition.
- Card radius 22px for the form panel, 24px for the hero-style visual, inputs 12px, buttons 10px — per locked radius system.
- All colors via tokens (`bg-reps-orange`, `text-reps-charcoal`, `border-reps-stone`, etc.) — no hex in components.

**Login page elements:**
- Email + password inputs (static, no auth wiring)
- "Remember me" checkbox + "Forgot password?" link
- Primary CTA: "Log in" (flat, no shadow)
- Social: "Continue with Google" / "Continue with Apple" outline buttons
- Footer line: "New to REPs? Sign up" linking to `/signup`

**Sign up page elements:**
- First name, last name, email, password, confirm password
- Account type selector: "I'm looking for a professional" / "I'm a professional" (pill toggle)
- Terms checkbox
- Primary CTA: "Create account"
- Social sign-up buttons (same as login)
- Footer line: "Already have an account? Log in" → `/login`

**Out of scope (Phase 1 rule):**
- No Lovable Cloud / auth wiring, no real form submit, no validation logic beyond `required` attributes
- No password-strength meter logic, no email verification flow

### Verification
After build, screenshot both `/login` and `/signup` at 1469px wide and compare to the mockup. Run the REPs compliance audit (no banned hex, no banned radii, no button shadows).

### Open question (non-blocking)
If you'd rather start with the **Professional Dashboard** or **Admin Dashboard** instead of Sign Up / Login, say the word and I'll re-scope the plan to that mockup. Otherwise I'll proceed with Sign Up / Login on approval.