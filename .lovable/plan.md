## Rebalance /signup hero to match mockup

Single, scoped change to `src/routes/signup.tsx` — hero section only. No other pages, no token changes, no new components.

### What changes

1. **Grid columns** — change the hero grid from `lg:grid-cols-[1.05fr_minmax(0,460px)]` to `lg:grid-cols-2` with a generous `lg:gap-14` (~56px) gutter so the two columns read as ~50/50 with clear breathing room, like the mockup.

2. **Left column (value prop)**
   - Drop the `max-w-[520px]` / `max-w-[560px]` constraints on the paragraph and bullet list so they fill the narrower (now ~50%) column naturally.
   - Keep the h1 unchanged — at ~50% width the headline naturally wraps to 3 lines ("Your fitness business, clients and professional profile" / "in one place.") as in the mockup. Verify after render; if it still wraps to 2, nudge with a soft break.
   - Testimonial card: bump `max-w-[420px]` to `max-w-[480px]` so it sits proportionally in the wider column.

3. **Right column (form card)**
   - Remove the `minmax(0,460px)` cap so the card expands to fill its 50% column (will land around ~560–600px wide at 1469px viewport, matching the mockup's wider card).
   - Internal padding bump from `p-7` to `p-8` so the form doesn't feel cramped at the new width.
   - Account-type pills, fields, and social buttons keep their current structure — they reflow naturally inside the wider card.

### Out of scope
- No changes to header, stats strip, features, FAQ, CTA, or footer.
- No copy changes, no new fields, no token/radius changes.
- `/login` is not touched in this pass (can mirror after approval if you want parity).

### Verification
Screenshot `/signup` at 1469px and compare side-by-side with `src/mockups/reps_fullpage_signup_login_v1.png` — confirm column balance, headline line count, and form card width match.
