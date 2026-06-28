## Goal

Produce a PNG render of the `legacy-conversion-confirmation` email (the one BD members receive when their £34 legacy record is converted to a real £99 Stripe subscription) so you can sign it off before any more conversions are queued.

## Approach

1. Render the React Email template `src/lib/email-templates/legacy-conversion-confirmation.tsx` to HTML using its built-in `previewData` plus a realistic BD example (name: Katie Gibbs, renewal date matching her real anchor, card brand/last4 from a representative Stripe PaymentMethod, old price £34 → new price £99, "one client pays for it" value line).
2. Open the rendered HTML in headless Chromium at a true email-client width (600px content, 800px viewport) and screenshot the full email body.
3. Save the result to `/mnt/documents/legacy-conversion-confirmation-preview.png` and surface it as a `<presentation-artifact>` so you can preview/download it inline.
4. Also save a second PNG at mobile width (390px) so you can confirm it holds up on iOS Mail / Gmail mobile.

No application code or templates change. No emails are sent. No BD conversions are run. This is purely a visual QA artifact.

## Acceptance

- Two PNGs in `/mnt/documents/`:
  - `legacy-conversion-confirmation-desktop.png`
  - `legacy-conversion-confirmation-mobile.png`
- Both shown back to you as artifacts in chat.
- After you approve the look, we resume BD rail-swap conversions; if you want copy tweaks first, we iterate on the template and re-render before sending anything.
