## What the issue is

Do I know what the issue is? Yes.

You were told test purchases would work in preview. With the current implementation, they do not.

The exact problem is:
- `src/lib/billing/billing.functions.ts` creates a redirect-style hosted checkout session and returns `session.url`
- `src/routes/signup.tsx` and `src/routes/auth.tsx` then do `window.location.href = result.url`
- in Lovable preview, that means the app iframe is being sent to hosted Stripe checkout
- that iframe flow hangs on the skeleton instead of completing

So the problem is not “test mode is unavailable.” The problem is that **this project is using the wrong checkout pattern for preview**.

## Files involved

- `src/lib/billing/billing.functions.ts`
- `src/lib/billing/stripe.server.ts`
- `src/routes/signup.tsx`
- `src/routes/auth.tsx`
- new checkout UI route/component files for embedded checkout

## Plan

1. Convert checkout session creation from redirect checkout to embedded checkout
   - use `ui_mode: "embedded_page"`
   - return `clientSecret` instead of `session.url`
   - switch from `success_url` / `cancel_url` to `return_url`

2. Add the client-side embedded checkout layer
   - create the Stripe client helper from the managed payments token
   - mount Stripe’s embedded checkout component inline in the app
   - show a real loading/error state instead of the flashing skeleton

3. Add a dedicated in-app checkout route
   - navigate users to `/checkout` after auth/signup
   - keep selected tier and billing period in route state/search
   - render checkout inside the REPs app instead of bouncing the iframe away

4. Update auth/signup continuation flow
   - stop using `window.location.href = result.url`
   - after sign-in/sign-up, route to the embedded checkout page
   - preserve the existing post-auth purchase intent

5. Add a return/confirmation route
   - handle successful completion cleanly
   - continue into the existing dashboard sync path
   - handle cancellation without dumping the user into a broken state

## Outcome

After this change, preview test purchases should work the way you were told they would: inside preview, without the hosted Stripe skeleton hang.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>