# Pricing table — full visual QA pass

## Scope
`/pricing` page, focused on:
1. `PricingPlans` — Monthly/Annual toggle, 3 plan cards (Verified / Pro / Studio), Enterprise strip
2. `PricingCompare` — feature matrix below
3. `PricingFAQ` — accordion section
4. Founding banner + hero

## What I'll check

**Toggle (Monthly / Annual)**
- Both states render, `data-[state=on]` styling correct (orange pill, white text)
- "Save 2 months" badge present on Annual and reads correctly in both selected/unselected states
- Keyboard focus ring visible, arrow-key navigation works
- Hover state on inactive option

**Plan cards (Verified / Pro / Studio)**
- Pro card: orange border + ring, `-translate-y-3 scale-[1.03]` lift, no glow bleed into Enterprise (regression check from previous fix)
- "Most popular" badge position (`-top-3 left-7`) not clipped at any breakpoint
- "Founding price — limited" badge renders only where expected
- Price block: `was` strike-through, price size, period text alignment
- Feature list: check-icon circles aligned, line-height consistent, no orphaned bullets
- CTA buttons: primary (Pro) vs outline (others), loading spinner state, disabled state, hover colors
- Card heights line up; footers bottom-aligned

**Enterprise strip**
- Layout switches cleanly between stacked (mobile) and row (lg)
- Border / radius match plan cards (`rounded-[22px]`)
- Contact CTA hover

**Compare matrix + FAQ**
- Section dividers (`border-b border-reps-border`) consistent
- Accordion open/close, focus ring, chevron rotation
- Sticky/overflow behaviour on the compare table at mobile

**Breakpoints**
- 1920 (desktop), 1440, 1024 (lg boundary), 834 (tablet), 414, 375 (mobile)
- Verify lift/scale only kicks in at `lg` and doesn't cause clipping or overlap with the "Most popular" badge

**Other**
- Console errors / warnings while toggling and hovering
- Dark mode only (no light theme exists) — skip light check
- Founding banner doesn't overlap sticky header at scroll

## Deliverable
A written report listing:
- Issues found (with breakpoint + screenshot reference)
- "Looks good" items explicitly confirmed
- Recommended fixes grouped as **must-fix** vs **nice-to-have**

No code changes in this pass — once you approve the report, fixes go in a follow-up build turn.
