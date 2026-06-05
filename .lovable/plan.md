## Swap "As featured in" → "Where you'll find our trainers" + add gym data to Find-a-Pro and profiles

### 1. New component: `VenueStrip.tsx`
**File:** `src/components/marketing/VenueStrip.tsx`

A new editorial logo strip modelled on `PressMarquee` but framed for **venues, not press**.

- Eyebrow: `Where you'll find our trainers`
- Sub-line (small, muted): `Independent REPs professionals — not affiliated with the gyms shown.` (legal hygiene per comparison-rules memory)
- 8 venue wordmarks rendered as inline SVG (typographic credits in `currentColor`, same technique as `PressWordmarks.tsx`):
  - PureGym, The Gym Group, Virgin Active, Bannatyne, David Lloyd, Nuffield Health, Third Space, Anytime Fitness
- Same continuous R→L marquee mechanic, same edge mask, `prefers-reduced-motion` honoured.
- **Each wordmark is a `<Link>`** to `/find-a-professional?venue={slug}` — turns the strip into a navigation surface, not just decoration.
- Sits on `bg-reps-warm-white` (ivory) so it reads as a marketplace credibility band, distinct from the dark press marquee.

New companion file `VenueWordmarks.tsx` containing the 8 SVG marks (mirrors `PressWordmarks.tsx` shape).

### 2. Homepage swap — `src/routes/index.tsx`
- **Insert `<VenueStrip />` directly under the hero** (above the existing Social Proof Rail, around current line 256), so the first thing below the search panel answers *"are there coaches at my gym?"*.
- **Move `<PressMarquee />` to the bottom**, just above the footer CTA / final section. Keep it as-is — same dark band, same animation — it still earns its place for pro / investor / journalist trust, just demoted from hero-adjacent.

### 3. Find-a-Professional — gym data + filter
**File:** `src/routes/find-a-professional.tsx`

- Extend the `Pro` type with `venues: string[]` (venue slugs).
- Add 1–3 venues to each of the 8 directory pros in `directoryPros` (realistic spread across the 8 brand options).
- **New filter row item** in the existing filter bar: a "Gym / venue" `Select` populated from the 8 venues + "Any venue" default. Wire it to filter `directoryPros` client-side (read `?venue=` from search params so the homepage strip deep-links).
- **On each result card**: small venue chip row beneath the existing tags (e.g. `📍 PureGym Holborn`) — single-line, max 2 chips, `+N` overflow if more. Subtle styling (border-reps-stone, no orange).
- Empty-state copy already says "Try widening… or removing a specialism" — append "or venue".

### 4. Professional profile — `src/routes/pro.$slug.index.tsx`
- Add a `Trains at` section in the profile sidebar/about block (one short row of venue chips with the gym name + neighbourhood, e.g. *Virgin Active Barbican · PureGym Old Street*).
- No icons inside the chips (per locked-profile memory — keep it text-led).
- Phase 1 = static — hard-coded to 2–3 venues per pro in the existing mock data.

### 5. Out of scope (deferred)
- Real venue database / admin-managed venue list (Phase 2).
- Map-pin clustering by venue.
- Pro dashboard UI to self-select venues.
- Logo licensing artwork — typographic SVG credits only for now (matches PressMarquee approach and your confirmed permission).

### Notes
- All venue copy uses "independent professionals" framing; no claim of partnership.
- Tokens only — no hardcoded colors; chips use `border-reps-stone` / `bg-reps-warm-white`.
- Radius: chips `rounded-[999px]` (pill), strip uses existing `rounded-[22px]` panel rhythm — no new radii introduced.
