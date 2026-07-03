
# Pro Profile v2 — Full Redesign (Mock, Un-wired)

Rebuild `/pro/$slug` from scratch as a **parallel** page. The current `pro.$slug.index.tsx` stays exactly as-is and keeps serving live traffic. v2 is a static design surface with hard-coded sample data so we can iterate on layout, hierarchy, and polish without dragging Supabase, analytics, saved-profiles, or trust-strip logic along.

## Where it lives

- New route: `src/routes/pro-v2.$slug.tsx` — accessible at `/pro-v2/jordon-gumbley`
- New folder: `src/components/pro-v2/` — all v2-only building blocks live here, fully isolated from `src/components/pro/*`
- Sample data file: `src/components/pro-v2/sample-pro.ts` — one hard-coded pro object (Jordon) so the page renders identically every load
- `noindex` in the route head — this is a design sandbox, not a public URL

Nothing outside these three paths gets touched.

## Page structure (top → bottom)

1. **Sticky sub-nav** — thin bar under the site header, in-page anchors: About · Services · Reviews · Qualifications · Location. Active section highlights on scroll.
2. **Hero (3-column, matches the reference screenshot)**
   - Left: portrait, 4:5 tall
   - Middle: verified pill → H1 name → role → tagline paragraph → review row (rating + "Based on N verified reviews") → location row → three service chips (At Home / Online Coaching / [City] & Surrounding Areas)
   - Right: **Get in touch** card — last active, response rate, verified pro; primary "Send an enquiry" CTA; secondary "Save profile"; small reassurance line about contact details
3. **Trust strip** — 4-tile band (REPS Verified · Qualifications Checked · Insurance Active · Member Since)
4. **About** — long-form bio, 2-column on desktop, with a small "At a glance" side card (years experience, sessions delivered, specialisms)
5. **Services & pricing** — three service cards (1:1, Small Group, Online), each with price, duration, what's included, "Enquire" CTA; one card marked "Most popular"
6. **Specialisms & who I help** — chip cloud + short paragraphs for 3 client types
7. **Qualifications & credentials** — grid of qualification cards with awarding body, level, year, expiry indicator
8. **Transformations / proof** — 3 proof cards (before/after style, but numbers-led not photos): outcome headline + short story + client initials
9. **Reviews** — rating summary, distribution bar, 4–6 review cards, "Read all reviews" link
10. **Location & availability** — static map placeholder (image, no Google Maps SDK), coverage radius chip, weekly availability grid (7×3 morning/afternoon/evening)
11. **FAQ** — 5 accordion items (session length, cancellation, first-session, kit needed, online setup)
12. **Final CTA band** — full-width dark band, "Ready to train with [Name]?" + Send an enquiry button
13. **Mobile sticky footer** — Enquire button pinned at bottom on `< lg`

## Visual direction

- Reuse the locked REPs tokens (`bg-reps-ivory`, `text-reps-charcoal`, `bg-reps-orange`, `border-reps-stone`, etc.) — no new colors
- Radii from the 9-step scale only: buttons `10px`, inputs `12px`, service/profile cards `18px`, hero panel `24px`, pills full
- Typography: `font-display` for H1/H2, existing body stack for prose
- Flat buttons (no shadows), emerald reserved for verified/status semantics only
- No REPS wordmark artwork on the portrait (we're using the existing Jordon photo, not regenerating)

## What is intentionally excluded

- No Supabase queries, no `createServerFn`, no loader
- No analytics tracking calls
- No saved-profiles logic, no auth-gated buttons
- No Google Maps — static image placeholder for the location tile
- No breadcrumb (this is a sandbox route)
- No routing to `/pro/$slug/enquire` — CTAs are `<button type="button">` with no handler
- No responsive polish pass on tablet — desktop and mobile only for v1 of v2

## Deliverable

One new route rendering the 13 sections above with sample data. You visit `/pro-v2/jordon-gumbley`, review it, tell me what to change. Once the layout is signed off, a separate follow-up plan will handle wiring real data, analytics, and CTAs, and swapping the live `/pro/$slug` over.

## Out of scope for this plan

- Any change to the current `pro.$slug.index.tsx`
- Wiring, data fetching, tracking, auth
- Redesigning `/pro/$slug/enquire`, `/c/$slug`, or any other locked page
