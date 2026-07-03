# Polish pass — `/pro-v2/jordon-gumbley`

Yes, I'd polish it. The bones are good; it currently reads as "clean mock" rather than "premium product". Below are the changes I'd make, grouped by impact. No new sections — same 13-block structure.

## 1. Hero — earn the fold
- **Portrait**: add a subtle inner ring (`ring-1 ring-black/5`) + soft ground shadow (`shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]`) so it lifts off the ivory bg instead of sitting flat.
- **Name + role**: tighten leading, drop role to `text-reps-muted-light` at 15px so the H1 owns the space. Add a 1px orange underline swatch (24px wide) above the eyebrow, matching the marketing primitives.
- **Meta row**: replace the 3 chips (At Home / Online / Location) with **shadcn `Badge` variant="secondary"** + `data-icon` inline icons — current pills feel heavy vs the rest of the page.
- **"Get in touch" card**: promote it. Add `ring-1 ring-reps-orange/15`, a small "Usually replies in ~2 hours" line under Response rate, and make "Send an enquiry" full-width primary with a `ChevronRight` `data-icon="inline-end"`. Save profile → ghost `Button variant="ghost"` with `Bookmark` icon.

## 2. Trust strip
- Currently a flat row. Convert to a single `Card` with 4 columns separated by `Separator orientation="vertical"`. Numbers in `font-display` at 28px, labels in 12px uppercase tracked. Removes the "loose row of stats" feel.

## 3. Services / Pricing
- 3 cards are fine, but **only the "Most Popular" card should have the orange ring** — currently all three have similar visual weight. Bump the popular card's shadow, add a small `Badge` pinned top-right instead of inline in the title.
- Standardise price line: `£X` in display 32px, `/session` in muted 14px on the same baseline.
- CTA per card → `Button variant="outline"` except the popular one (`variant="default"`).

## 4. About + "At a glance"
- Split into a real 2-col: prose left (max-w prose), `Card` right with a `dl` of 6 rows (Experience / Speciality / Languages / Studios / Travel radius / Insurance). Use `Separator` between rows, not borders. Feels like a spec sheet — which is what buyers want.

## 5. Reviews
- Distribution bars: replace hand-rolled divs with **shadcn `Progress`** — instantly more polished and accessible.
- Each review → `Card` with `Avatar` + `AvatarFallback` initials, 5-star row using filled/empty `Star` at 14px, date in muted 12px. Add a "Verified booking" `Badge variant="secondary"` with `BadgeCheck` icon where applicable.

## 6. Qualifications
- Currently a list. Switch to a 2-col grid of small `Card`s: awarding body left, cert name + year right, `ShieldCheck` icon. Feels credentialed vs bulleted.

## 7. Specialisms / Who I Help
- Convert to `Badge variant="outline"` cluster with `size` consistency — right now some chips are wider than others depending on text length; add `px-3 py-1` uniformly.

## 8. Location + Availability
- Availability grid: current `Fragment` grid works, but swap cell backgrounds to `bg-emerald-500/15 text-emerald-300` for available and `bg-reps-panel/30 text-reps-muted-light` for unavailable — matches the locked status-colors rule (emerald = status only, which this is).
- Add a small legend row below the grid using `Badge`.

## 9. FAQ
- Already `Accordion` — good. Add `AccordionTrigger` chevron rotation is default; just tighten to `text-[15px] font-medium` and add `text-muted-foreground` on content.

## 10. Final CTA (dark section)
- Currently dark panel with two buttons. Add the `HeroOverlay`-style 5-layer wash primitive we already have, or at minimum a subtle radial glow behind the headline. Right now it looks like a plain footer band.

## 11. Mobile sticky enquire bar
- Add `shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.4)]` and `backdrop-blur` — currently a hard edge.
- Price on left (`£X from`), primary "Enquire" button right, full-width tap target.

## 12. Global polish
- **Sub-nav**: add scroll-spy active state (orange underline on the section currently in view). Currently all links look inert.
- **Section rhythm**: standardise every section to `py-16 lg:py-20` — currently varies section-to-section.
- **Radii audit**: portrait uses `rounded-[24px]` ✓ (hero exception). All other cards should be 18px per the locked radius system. Check service cards + review cards.
- **Motion**: add `motion-safe:animate-in fade-in slide-in-from-bottom-2 duration-500` on hero children with staggered delays (0/80/160/240ms) matching the marketing-hero-template rule.
- **Accessibility**: portrait `<img>` needs meaningful alt (already has it ✓); add `aria-current` to active sub-nav link; ensure all icon-only buttons have `sr-only` labels.

## Out of scope for this pass
- No new sections, no wiring to real data, no content rewrites — this is purely visual polish + shadcn-primitive swaps against locked design rules.

## Files touched
- `src/routes/pro-v2.$slug.tsx` (all edits)
- `src/components/pro-v2/sample-pro.ts` (only if I need to add response-time / verified-review flags — otherwise untouched)

Used the shadcn skill.
