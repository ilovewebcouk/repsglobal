# Update memory: `/c/$slug` is available on every tier

Two memory files reference the old Pro+Studio-only rule for the coach website. Both need to change.

## Changes

1. **`.lovable/memories/design/locked-coaching.md`** (mem://design/coach-website)
   - Remove: "The trainer website is a Pro+Studio feature (NOT Verified)."
   - Remove: "Pro+Studio only." tag line at the end.
   - Replace with: "Every tier (Core, Pro, Studio) gets `/c/their-slug`. Pro/Studio unlock the richer customisation (accent colour, extra sections, multi-service layout); Core gets the same base template."
   - Keep everything else locked (dark theme, sticky SectionNav, hero, 3-tier services block, Foundation Method, proof-card transformations, accent tokens).

2. **`mem://index.md` — Core section**
   - Line currently reads: *"Coach website `/c/$slug` is LOCKED — see `mem://design/coach-website`. It is the canonical mock-up of what a Pro-tier trainer website on REPs looks like … The trainer website is a Pro+Studio feature (NOT Verified). Do not redesign without an explicit, section-named request. The old term for this page is BANNED — see `mem://constraint/word-ban-shopfront`."*
   - Update to: *"Coach website `/c/$slug` is LOCKED — see `mem://design/coach-website`. Available on every tier (Core, Pro, Studio); Pro/Studio unlock richer customisation. Canonical mock-up feeds copy/screenshots into `/features/website`, `/for-professionals`, `/pricing` and compare pages. Do not redesign without an explicit, section-named request. The old term for this page is BANNED — see `mem://constraint/word-ban-shopfront`."*

## Not changing (out of scope)

- The locked visual design of `/c/$slug` itself.
- `/features/website`, pricing pages, or compare pages — those may still describe website customisation depth as a Pro/Studio differentiator; that's accurate and stays.
- The word-ban memory.

Approve and I'll apply both edits.
