## Plan — `FeaturedProCard` visual polish (10/10)

You're right — the previous turn fixed data correctness but parked the visual upgrade ("Card visual redesign — out of scope"). This plan does the polish pass. Scope is strictly `src/components/public/FeaturedProCard.tsx`. No data, no business logic, no schema, no copy changes. Card renders in the same grid slots on `/in/$location` and `/professions/$profession`.

### What's wrong with the card today

1. **Photo aspect is wrong.** `h-44 w-full` produces a landscape banner that crops faces unpredictably — chins, foreheads, half-shoulders. Featured headshots should be portrait.
2. **Hierarchy is flat.** Name (16px), role (12px) and rating row compete on the same line. The name should dominate.
3. **Mode + city read as equal-weight metadata** — `MapPin London · Laptop In-person`. The city is the answer to "where", the mode is a filter cue; they shouldn't share a row at the same weight.
4. **Tag chips are solid ivory pills.** They land as bright noise above the CTA. Should be quieter outlined chips.
5. **CTA is full-width and a touch tall** at h-9 with a bare label. Reads as utility, not premium.
6. **Verified pill sits on a hard photo edge** with no scrim — vanishes on bright/white photos.
7. **No hover on the photo itself.** The card lifts (added last turn) but the image stays static — misses the "premium" feel.

### Visual changes (all inside `FeaturedProCard.tsx`)

| Element | Now | Polish |
| --- | --- | --- |
| Image frame | `h-44 w-full` | `aspect-[4/5] w-full` portrait crop (matches profile-grade headshots); image `object-cover object-top` so faces sit in the frame, not chins |
| Image hover | static | `transition-transform duration-500 group-hover:scale-[1.03]`; parent gets `group` |
| Photo scrim | none | thin top-down `bg-gradient-to-b from-black/30 to-transparent h-16` so Verified pill always has contrast |
| Verified pill | green solid | keep green (status-token rule), tighten to `h-5 px-2 text-[10px]`, add `shadow-[0_2px_8px_-2px_rgba(0,0,0,0.4)]` so it floats over any photo (pill only — button shadow rule unchanged) |
| Save button | warm-white circle | keep, but `bg-reps-black/45 backdrop-blur-sm text-white hover:bg-reps-orange hover:text-white` — reads as overlay, not a sticker |
| Name | 16px bold | **18px bold** `font-display` (the card's anchor) |
| Role | 12px muted | 12px muted, single line truncated; only one line ever |
| Rating row | inline with name | when reviews > 0, move it under name as `Star 4.9 · 128 reviews` (full word, not parens) |
| City + mode | one row, two icons | **two rows, two weights**: city gets MapPin at 13px charcoal; mode collapses to a tiny stacked dot pill (`● Online`, `◐ Hybrid`, `○ In-person`) right-aligned in the city row |
| Tag chips | solid ivory | outlined chips: `bg-transparent border border-reps-stone text-reps-muted-dark` — quieter, more editorial |
| CTA | full-width h-9 plain | full-width **h-10**, label `View profile` + `ChevronRight` icon, brand orange, flat (no shadow — skill rule), `group-hover:bg-reps-orange-dark` |
| Card border | static stone | already lifts on hover; add `transition-shadow` and a 1px brand-orange ring on focus-within for keyboard users |

Locked things that don't change: 18px card radius, 10px button radius, no button shadow, brand-orange token (no hex), warm-ivory bg, Verified = identity-approved green.

### Accessibility

- Whole card wrapped in `group` but keep the existing `<Link>` as the only navigation control. Save button keeps `aria-label="Save"` and stops event propagation so it doesn't trigger the card link (when we wrap it later).
- `<img>` keeps `alt={pro.name}` and `loading="lazy"`.
- Focus-visible ring on the card link for keyboard users.

### Files

- `src/components/public/FeaturedProCard.tsx` — only file touched.

### Verification

- View `/in/london` and `/in/leeds` — headshots are portrait, faces sit naturally, name dominates, mode reads as a quiet right-aligned cue, CTA feels premium, hover scales the image inside the fixed mask without breaking the card border.
- View `/professions/personal-trainer` — same.
- Run `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` — must exit 0 (radius set, no banned hex, button stays flat).
- Confirm no TypeScript errors (`bunx tsc --noEmit`).

### Out of scope (explicit)

- Homepage Featured rail (locked).
- Wiring the Save bookmark.
- Any change to the eligibility logic, copy, or the wrapping section header.
- Any change to other card components (results card, profile card).