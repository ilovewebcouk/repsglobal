### 1. Remove v2 preview banner
In `src/routes/index.tsx`, delete the fixed "Homepage v2 preview" badge block (the `<div className="fixed left-1/2 top-[88px] z-40 ...">` containing `<Sparkles /> Homepage v2 preview`). Remove `Sparkles` from the `lucide-react` import if it's no longer used elsewhere in the file.

### 2. Mobile menu — restore a direct path to Find a Professional
In `src/components/public/PublicHeader.tsx` `MobileDrawer`, the "Find a Pro" accordion currently only links to `/professions/$profession` and `/in/$location` sub-pages. Add a "Browse all professionals" link at the very top of that accordion's content, going to `/find-a-professional`, styled with `mobileSubLinkClass` and separated from the "Top professions" / "Top cities" sub-lists with a subtle divider. ("Train by goal" already links there, but this surfaces it as the obvious entry point.)

### 3. QA mobile + tablet hero above the fold
Open `/` in the browser at 390×844 (mobile) and 820×1180 (tablet). Screenshot and verify:
- Headline + search form visible above the fold
- "Find your coach" button not clipped
- Goal chips wrap cleanly, no horizontal scroll
- Solid black background (no image) on both
Only adjust hero top padding / headline scale if something actually clips. Report findings.

No other files change.