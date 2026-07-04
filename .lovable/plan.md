# Website editor launch email — HTML build

Deliverable: a single, polished, email-client-safe HTML file at `/mnt/documents/repsuk-website-editor-launch.html` you can paste straight into your ESP (Resend / Mailgun / Lovable Emails) or forward to yourself to test.

## What I'll build

A brand-matched HTML email using the copy from the previous plan, with the two uploaded snapshots embedded as hero visuals.

### Structure
1. **Preheader** (hidden) — "Your £34/year now includes a full professional website."
2. **Logo header** — REPS wordmark, dark bar, matches site header.
3. **H1** — "Your REPs website is here — and it's included."
4. **Intro paragraph** — one line, founder voice.
5. **Snapshot #1** — the public shop-front screenshot (`James-Wilson---Personal-Trainer...png`) with caption "This is what your public REPs page can look like."
6. **"Replaces your…" block** — Wix / Squarespace / Shopify / Carrd / bespoke, as styled pill tags.
7. **Price reassurance panel** — "£34/year. Unchanged. Website included." (orange accent card.)
8. **Snapshot #2** — the enquiry flow screenshot (`Send-an-enquiry---REPS...png`) with caption "Clients enquire, book and pay through your REPs page — no extra tools."
9. **Verification CTA block** — "Your site stays locked until you're verified" + 3-step list (ID / Insurance / Qualifications) + big orange **Get verified** button.
10. **What's next** — daily updates + REPs Insurance (coming) + REPs Business Software (coming).
11. **Final CTA** — "Log in and open the Website tab" button.
12. **Signature** — founder name + role.
13. **Footer** — REPS strapline, address line, unsubscribe token placeholder.

### Design tokens (matches the live site)
- Background: `#0B0B0C` outer, `#131316` card
- Text: `#F4F4F5` primary, `#A1A1AA` secondary
- Accent: REPs orange `#FF6A1A`
- Radius: 16px cards, 12px buttons, 999px pills
- Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` (web-safe — no external fonts, they don't render in most clients)
- Max width: 600px, centred, mobile-responsive with `<meta viewport>` + fluid images

### Email-client safety rules I'll follow
- Tables for layout (not flexbox / grid) — required for Outlook.
- All CSS inlined on elements — no `<style>` reliance beyond a small `<head>` block for dark-mode + media queries.
- `alt` text on every image so the message still reads if images are blocked.
- `role="presentation"` on layout tables, VML fallback for the primary button (Outlook).
- Images referenced by absolute HTTPS URL — I'll upload both snapshots via lovable-assets to get stable CDN URLs, then hotlink them from the email (this is how every ESP handles inline images).
- Total HTML weight kept under 100KB (Gmail clipping threshold).

### Handoff notes
- Merge fields left as `{{first_name}}`, `{{verify_url}}`, `{{login_url}}`, `{{sender_name}}`, `{{unsubscribe_url}}` so your ESP can substitute them.
- A matching **plain-text version** written to `/mnt/documents/repsuk-website-editor-launch.txt` (email clients expect a text alternative for deliverability).
- After generating, I'll render the HTML to an image and eyeball it end-to-end so you don't ship anything with clipped hero images, broken buttons, or dark-mode inversion problems.

Out of scope for this turn: wiring it into the app as a sendable template, building an admin "send to all members" button, or triggering the send. Those are follow-ups if you want them.

Say go and I'll produce the HTML, text, and QA screenshots.
