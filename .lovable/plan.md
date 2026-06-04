## Verification report

### Desktop (1440px) — ✅ PASS
- Heritage anchor (shield → eyebrow → "Trusted since 2009." → subline) centred and balanced
- Press row renders six wordmarks in a single line with dot separators, no orphan, no clipping
- Spacing between sections breathes correctly
- Orange glow reads as a focal anchor, not a distraction

### Tablet (768px) — ❌ FAIL (page-level overflow)
- Entire page is wider than the viewport
- A horizontal scrollbar appears at the bottom of the window
- The proof band visually appears clipped on the right (so does ACT 1, the heading, and everything else)
- Cause is NOT the proof band — the same overflow is present in sections above and below it
- Until the sitewide overflow is fixed, the proof band cannot be evaluated cleanly at this width

### Mobile (390px) — ❌ FAIL (same root cause)
- Same horizontal-overflow symptom as tablet
- Body content shifted ~150–200px to the right of the viewport
- Hero copy ("Not just software."), eyebrow chip, and ACT 1 heading all clip
- Proof band sits inside the overflowing body so it also appears clipped

## Root cause hypothesis

Something in `/for-professionals` is forcing the page body wider than the viewport on widths below `md`. Candidates to inspect:

1. **`HeroDeviceCluster`** — uses absolute `-bottom-12 right-4` and `min-w-[150px]` phone overlay; the laptop frame is `w-full`. Should be `hidden md:block` per the parent (`<div className="relative hidden md:block">`), so likely not the culprit on mobile, but worth verifying.
2. **Hero headline** — `font-display text-[44px] lg:text-[64px]` with words like "professionals." at 44px bold on a 390px viewport. With display font tracking this can exceed viewport width and force horizontal scroll. Likely culprit on mobile.
3. **`StickyCtaPill`** — fixed positioning; if width is mis-calculated on small screens it can push body width.
4. **Any child section** with a horizontal-scrolling table, wide image, or `min-w-*` value (e.g. `ReplacedStackBoard`, `PillarTabs`, `WeekWithReps`, `AiCommandCentreMock`).
5. **My proof band** — I'll re-audit but the wrapping flex with `hidden ... sm:inline-block` dots should not overflow on mobile.

## Proposed diagnostic + fix pass (small, surgical)

1. **Diagnose**: add `overflow-x-clip` on the page root as a temporary safety net, then walk the DOM in dev tools to find the actual offender by removing sections one at a time. (Won't ship the `overflow-x-clip` long-term unless needed as a belt-and-braces.)
2. **Likely fixes** (in order of probability):
   - Reduce hero headline mobile size from `text-[44px]` to `text-[36px] sm:text-[44px]` so "professionals." fits at 390px
   - Confirm `HeroDeviceCluster` and its absolute phone overlay are fully gated behind `md:` and don't leak width
   - Ensure any wide marketing components inside `for-professionals.tsx` use `overflow-hidden` or `min-w-0` on their inner scroll areas
3. **Re-verify** the proof band at 390 / 768 / 1440 after the fix
4. **Confirm** no horizontal scrollbar on any of the three breakpoints

## Scope guardrails

- Only fix what's causing the horizontal overflow — do not redesign any section
- Do not touch hero copy, proof band structure, or any approved layouts
- Do not touch header/footer/nav/routes/pricing/backend
- Phase 1 presentational only

## Question for you

Want me to run the diagnostic + apply the fix in the same pass (recommended — the proof band can't be verified at tablet/mobile until this is resolved), or would you prefer I only report and let you triage which sections to fix?
