## /training-academy polish pass

Screenshots saved to `/tmp/browser/academy/hero.png`, `full.png`, `mobile.png` — captured before any changes.

### What's wrong right now (from the screenshots + code audit)

**Hero** — flat white slab, one orange pill, black headline, no anchor. Reads like an admin page, not a marketing surface. Sits inside a `bg-[#f7f6f2]` ivory shell so it just looks pale.

**Colors are out — literal hex everywhere instead of tokens:**
- `#FF7A00`, `#E96F00` used raw in 8 places across the route and `CourseRow.tsx` (should be `bg-brand-orange` / `text-brand-orange` / `hover:bg-brand-orange-hover`).
- **Stars in gold/amber** — `text-[#E59819]` fill + `text-[#8A5A00]` rating number. The compliance skill is explicit: rating stars must be brand orange, never gold/yellow.
- **Bestseller pill in yellow** — `bg-[#FFF1C4]` + `text-[#6B4A00]`. Off-brand, clashes with everything else.
- **Course thumbnails** — every card generates a random 2-stop HSL gradient from the provider's `hue`, so the grid is a rainbow of teals, purples, reds, greens, and yellows next to a brand-orange page. Loud and unbranded.
- Hero orange pill and Ofqual pill both use `#FF7A00/10` — fine, but should be tokenised so they match every other marketing pill on the site.

**Hero content** — no tutor photo, no accent-orange headline split, no trust chips (contrary to the earlier summary in the conversation). Just a pill + headline + paragraph + search bar.

### Plan

Keep the light directory shell — it's consistent with `/find-a-training-provider` and `/find-a-coach`. Fix colors, add a real hero anchor, calm the thumbnails.

**1. Route the tokens (colors "out" fix)**

Do a full hex→token sweep in `src/routes/training-academy.tsx` and `src/components/academy/CourseRow.tsx`:

| Raw hex today | Replace with |
| --- | --- |
| `bg-[#FF7A00]`, `hover:bg-[#E96F00]` | `bg-brand-orange`, `hover:bg-brand-orange-hover` |
| `text-[#FF7A00]`, `border-[#FF7A00]/30`, `bg-[#FF7A00]/10` | `text-brand-orange`, `border-brand-orange-border`, `bg-brand-orange-soft` |
| Ring `focus:ring-[#FF7A00]/25` | `focus:ring-brand-orange/25` (via token) |
| Star fill `text-[#E59819]`, rating number `text-[#8A5A00]` | Both → `text-brand-orange` |
| Bestseller pill `bg-[#FFF1C4] text-[#6B4A00]` | `bg-brand-orange-soft text-brand-orange border border-brand-orange-border` (matches Ofqual pill) |
| "New" pill `bg-black/85 text-white` | Keep — reads as neutral chrome. |

**2. Calm the thumbnails**

The random `hsl(hue, 78%, 58%)` gradient per provider is the noisiest thing on the page. Replace with a single warm brand-adjacent gradient stack that all cards share, and let the provider logo (top-left initials chip) do the identification. Options for the shared background:

- Warm brand: `linear-gradient(135deg, #FF7A00 0%, #E96F00 55%, #1a1a1a 100%)` with a subtle radial highlight — one identity, matches the site.
- Neutral premium: `linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)` — dark cards, pop the initials chip forward.

I'd default to **neutral premium** because it lets the (upcoming) real course imagery drop in without redesigning, and keeps orange as an accent rather than plastering it 22 times down the grid. Initials chip stays white, provider name and price stay black on white below.

**3. Hero anchor**

Keep the layout but give it presence:

- Add a warm wash behind the hero: a soft `radial-gradient` from brand-orange-soft (top-right) fading into the ivory bg, so the hero doesn't sit on flat white.
- Split the H1: `"Every REPs-endorsed course,"` in near-black + `"in one catalogue."` in `text-brand-orange` — this is the "orange accent headline" pattern used on every other marketing page.
- Add three trust chips under the lede — the same visual pattern from other marketing heroes:
  - `GraduationCap` — "22 endorsed courses"
  - `ShieldCheck` — "Ofqual-regulated options"
  - `BadgeCheck` — "Vetted providers only"
- Move the search+sort rail down slightly (`mt-8`) so it doesn't fight the headline.

No tutor photo. It would be lovely but requires an image asset that has to follow the REPs-wordmark rules from memory — out of scope for a colour polish pass. Flagging so we can add it as a separate step if you want.

**4. Verify**

After edits, re-screenshot desktop hero + full page + mobile and paste back so we can eyeball contrast side-by-side with the current screenshots. Then run the reps-build-compliance audit script — it should now pass because there'll be no raw `#FF7A00` / `#E59819` / `#FFF1C4` / `#8A5A00` / `#6B4A00` left in the two files.

### Out of scope for this pass
- Real course photography (would need generated imagery with REPs wordmark compliance)
- Any data / filtering / server-fn work — the 22 mock courses stay as-is
- Tutor hero photo — separate ask

### Files touched
- `src/routes/training-academy.tsx` (hero, buttons, ring, empty-state reset button, focus ring)
- `src/components/academy/CourseRow.tsx` (thumbnail gradient, stars, bestseller pill, price hover, title hover, Ofqual pill)