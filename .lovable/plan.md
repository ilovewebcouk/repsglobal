## QA pass on `/auth`

Three tweaks to `src/routes/auth.tsx`:

1. **H1 all white** — remove `text-reps-orange` from the period in "Welcome back to REPs." so the entire headline is pure white (matches locked mid-page H2 rule).

2. **Reorder: email form first, OAuth below** — match shadcn `login-02` pattern:
   - Email + password fields + "Sign in" button (primary action) at top
   - "Or continue with" divider
   - Google + Apple buttons below
   Currently OAuth sits above the form.

3. **Vertically centre the left column** — the left pane currently top-anchors its content. Change the wrapper to `flex items-center justify-center min-h-screen` (or equivalent) so the wordmark + form block sits centred in the viewport, with the "Don't have an account?" footer absolutely positioned at the bottom (or kept in the stack with `mt-auto`).

No changes to the right-column `ShopFrontMock`, OAuth wiring, or routing.