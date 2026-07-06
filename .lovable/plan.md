# New REPS Rollout — Member Re-engagement Email

Add a new app email template that prompts existing members to log back in (via forgot password), complete verification, and start using the new website editor. Wired so it can be sent from `/admin/campaigns` as a broadcast to Core members.

## Copy (final draft)

**Subject:** The new REPS is here — log in and unlock your trainer website
**Preheader:** Your £34/yr membership now includes a full trainer website. Log in and get verified.

Body (plain, matches existing template voice — no marketing fluff, no unsubscribe text (auto-appended)):

- Greeting: `Hi {{first_name}},`
- The new REPS is rolling out, and your membership is now much more than a listing.
- **You now get your own professional trainer website inside REPS — included in your membership.**
- Your price is not changing. Your REPS membership remains **£34 per year**.
- What the website editor gives you: profile, services, coaching plans, method, specialisms, locations, client results, FAQs, enquiry options. For many trainers this replaces paying separately for Wix, Squarespace, Shopify or a basic site builder.
- **To fully unlock your website, get verified.** Log in and upload: ID, insurance, qualifications. Once approved, clients see you as a verified REPS professional.
- Heads-up: REPS will be offering insurance options in future — more soon.
- Note on logging in: most members haven't signed in yet — use **Forgot password** on the sign-in screen to set your password the first time.
- Primary CTA button: **Log in to REPS** → `https://repsuk.org/auth`
- Secondary link: **Forgot password?** → `https://repsuk.org/auth?mode=reset`
- Closing: rolling out improvements daily; website editor is step one, full business software next.
- Sign-off: `— The REPS Team`

## Files

1. **New template** `src/lib/email-templates/new-reps-rollout.tsx`
   - React Email component matching the visual language of existing templates (e.g. `relaunch-announcement`, `welcome-signup`).
   - Props: `firstName?: string`.
   - Exports `template` satisfying `TemplateEntry` with `subject`, `displayName: "New REPS rollout — log in & verify"`, `previewData`.
   - Body bg `#ffffff`, brand orange CTA button, inline styles only.

2. **Registry** `src/lib/email-templates/registry.ts`
   - Import + register under key `new-reps-rollout`.

3. No route/logic changes — `/admin/campaigns` composer already lists registered templates and handles broadcast + tracking via `email_send_log`.

## Out of scope

- No pricing/tier changes.
- No auth changes (forgot-password flow already exists at `/auth`).
- No mention of "BD migration" / "legacy" / "£34 → £99" (per core memory).
- No insurance product build — email only mentions it's coming.

## After approval

I'll build the template, register it, and you can open **Admin → Campaigns → New campaign**, pick "New REPS rollout", target Core members, and send/schedule.
