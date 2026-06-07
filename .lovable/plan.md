## QA pass — `/specialisms` across desktop, tablet, mobile

### Heads-up on testing limits
The in-loop browser tool's `set_viewport_size(390, 844)` silently snapped back to a ~1200px window (confirmed via `window.innerWidth`), so I can't capture real mobile/tablet screenshots from here. Desktop is verified visually; tablet/mobile findings below come from reading the actual rendered breakpoints in the code against the page structure. **Please spot-check the live preview on tablet and mobile after these changes** — I'll talk you through what to look for.

### What's already 10/10
- Hero copy, gradient stops, image crop (`object-[70%_center]` → `lg:object-center`), animated stagger, top-anchored content block — all matches the Marketing Hero template.
- 7-section narrative grid (`lg:grid-cols-[1.4fr_1fr]`) stacks cleanly at md/sm, `sm:grid-cols-2` for "What they do / What REPs verifies" is right.
- Eyebrows 01–07 are sequential; PT stays L3→L4→REPs; L2 quals live only in Group Exercise.
- RegistersBlock 4-col → 2-col → 1-col responsive ladder is correct.
- FAQ, VerifyStrip, CrossLinkStrip wrap cleanly.

### Fixes (small, surgical — no redesign)

**1. Sticky-nav alignment + scroll affordance (`StickyNav`)**

The nav uses `sticky top-14` but `PublicHeader` is `h-16` (64px) on small screens — that 8px gap shows a sliver of page behind the nav as it sticks. Also, with 7 chips the row overflows on tablet/mobile and `overflow-x-auto` shows hard-cut chips with no fade hint.

  - Change `top-14` → `top-16` so the nav sits flush under the header.
  - Add a left+right linear-gradient mask on the inner scroll container so overflowing chips fade rather than getting clipped (same trick as `PressMarquee`).
  - Add `[-webkit-overflow-scrolling:touch]` and `scroll-smooth` on the scroller.

**2. Anchor scroll-margin (`SpecialismSection`)**

`scroll-mt-28` = 112px. With header (64) + sticky nav (48) = 112 only when nav is exactly 48; the nav is `h-12` (48) so the math works, but jumping to `#group-exercise` from the nav lands the eyebrow flush against the nav border with no breathing room. Change `scroll-mt-28` → `scroll-mt-32` (128px) to leave ~16px of clearance above the section eyebrow.

**3. Touch-friendly qualification tooltips (`SpecialismSection` aside)**

Radix `Tooltip` is hover/focus only — on touch devices tapping the underlined L3 PT / L2 GI / NSCA CSCS button does nothing useful (the full name is already displayed inline next to it, so it's just confusing UX). Two options:

  - **Option A (recommended, no behavior change for mouse):** Drop the `Tooltip` wrapper entirely. The full name is already rendered to the right of the acronym, so the tooltip is redundant. Keep the underline as a visual "definition" affordance. Cleaner, fewer moving parts, equal info on every device.
  - **Option B:** Swap `Tooltip` → `Popover` (Radix) so it opens on click/tap as well as hover. More work, more JS, no extra info.

Going with A unless you want to keep the hover-reveal motion.

**4. Hero CTA anchor target**

`Browse specialisms` button links to `#personal-trainers`. That's correct (PT is still position 01), but after adding Group Exercise the editorial chip strip and the visual ladder might lead a user to expect to land at the first card under the nav. Keep PT as the target; no change needed — flagging so you don't ask later.

**5. Hero trust-strip wrap at md**

The `mt-7 flex flex-wrap gap-x-5 gap-y-2` row works, but at 600–760px viewport the third item ("Reviews on the public record") wraps alone under a wide row. Tighten `gap-x-5` → `gap-x-6` and add `gap-y-2.5` so the wrapped row reads as deliberate, not orphaned. Cosmetic.

**6. CrossLinkStrip rounded radius**

`rounded-[22px]` matches the panel scale per the radius lock ✓ — no change. Just noting.

### Files touched
- `src/routes/specialisms.tsx` — `StickyNav` (top, mask, scroll), `SpecialismSection` (scroll-mt + Tooltip removal), `Hero` (gap tweak).

### Out of scope
- No copy rewrites, no new sections, no image swaps, no FAQ changes.
- No changes to PublicHeader, RegistersBlock, VerifyStrip, FaqBlock, CrossLinkStrip, or the locked memory.

### Verification (you, on the live preview)
- **Desktop (≥1280):** sticky nav sits flush under header; 7 chips fit without scroll; clicking each chip lands the eyebrow with ~16px above it.
- **Tablet (768–1024):** sticky nav scrolls horizontally; left/right edges fade rather than hard-clip; section narrative stacks above the qual card; "What they do / verify" sits in 2 columns.
- **Mobile (≤414):** hero h1 wraps over 3 lines without overflow; trust-strip wraps cleanly; sticky nav fades on both edges and scrolls smoothly with momentum; tapping any L2/L3 acronym does nothing weird (no broken tooltip popover).

If you want me to also QA `/professions/group-exercise` (the matching landing page from the find-a-pro list) in the same pass, say the word and I'll roll it in.
