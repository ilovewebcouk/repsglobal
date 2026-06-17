# Fix small text in REPs emails on iPhone

## Diagnosis

The wrapper in `src/lib/campaigns/outbound.functions.ts` (`wrapEmail`, lines 810–855) builds a fixed **600px** content table with **32px horizontal padding** and body copy hard-coded to **15px** / footer text at **11.5–13px**. On an iPhone (~390px CSS px) iOS Mail/Gmail render the 600px table and then **shrink-to-fit the viewport**, so everything looks ~65% of intended size — which is exactly what you're seeing.

There is no `<style>` block and no `@media` query, so we can't override on mobile, and there are no mobile-friendly class hooks on the tables.

## Fix (single function, presentation-only)

Edit `wrapEmail` and `textToHtml` in `src/lib/campaigns/outbound.functions.ts`:

1. **Add a `<style>` block in `<head>`** with a mobile media query:
   - `@media only screen and (max-width:600px)` →
     - `.reps-shell { width:100% !important; padding:16px 8px !important; }`
     - `.reps-card  { width:100% !important; border-radius:12px !important; }`
     - `.reps-pad   { padding:22px 18px !important; }`
     - `.reps-foot  { padding:20px 18px 22px 18px !important; }`
     - `.reps-body, .reps-body p, .reps-body li { font-size:16px !important; line-height:1.6 !important; }`
     - `.reps-foot p { font-size:13px !important; line-height:1.6 !important; }`
   - Also include `img { -ms-interpolation-mode:bicubic; } a { color:#0f172a; }` housekeeping.

2. **Tag the existing tables/cells** with the class names above (no visual change on desktop — classes are no-ops without the media query):
   - Outer table → `class="reps-shell"`
   - Inner 600px table → `class="reps-card"`
   - Header padding cell unchanged; main content cell → `class="reps-pad reps-body"`
   - Footer cell → `class="reps-foot"`

3. **Body copy baseline 16px** (industry standard for mobile mail). Bump `textToHtml` `<p>` and `<ul>` inline `font-size` from `15px` → `16px`; bump footer paragraph from `12.5/13px` → `14px` so it survives shrink-to-fit on clients that ignore media queries (Outlook desktop is unaffected because the 600px card is still rendered).

4. **Add `width="100%"` and `style="width:100%"`** on the outer shell table (already 100%) and set `meta name="format-detection" content="telephone=no,address=no,email=no"` to stop iOS auto-linking turning chunks blue/small.

5. **Preheader div** keep as-is.

No changes to send logic, recipient resolution, campaign tracking, ticket creation, or HTML-mode sanitiser — purely the wrapper + `textToHtml` font sizes.

## Verification

- Send a test direct email to yourself from `/admin/campaigns` → Compose, open on iPhone Mail and Gmail iOS.
- Spot-check Outlook desktop (600px card unchanged).
- Re-screenshot via browser preview at 390×844 of the rendered HTML (we can dump `previewHtml` to a temp route or just inline-preview via the existing Compose preview).

## Out of scope

- HTML-mode user-authored bodies (admin owns those styles).
- Ticket-thread emails in `src/lib/support/tickets.functions.ts` (separate wrapper — say the word and I'll apply the same treatment in the same pass).
