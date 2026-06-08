## Goal

Drop a "this is what CPD looks like on a REPs profile" product band into `/cpd`, immediately after the hero. Closes the loop on the hero's claim (verified CPD = visible badge on a public profile) and gives the page a visual breather before the dense educational content.

## Placement

`src/routes/cpd.tsx` — insert a new `<ProfileScreenshot />` section between `<Hero />` and `<WhatCpdIs />` in `CpdPage()`.

## What the section contains

A standard dark-band section (`bg-reps-ink`, matching surrounding rhythm), 2-column on desktop, stacked on mobile:

**Left column (copy):**
- Small orange eyebrow: "On the profile"
- H2: "This is what verified CPD looks like to your clients."
- Body: One short paragraph — verified hours show up as live credentials on the public profile, with provider, level and date; unverified hours sit in a separate column the public can see.
- 3 short bullet rows with `Check` icons (mirrors hero trust chips style):
  - "Logged quarterly, audited annually"
  - "Verified-provider hours auto-count"
  - "Specialisms appear once the awarding body confirms"

**Right column (product shot):**
- A real screenshot of `/c/james-wilson` (the locked Pro shop-front), cropped to the qualifications / credentials area, wrapped in the existing `BrowserFrame` (`src/components/mockups/BrowserFrame.tsx`) with `url="repsglobal.com/c/james-wilson"`.
- Subtle orange glow behind the frame (`bg-[radial-gradient(...)]` using `--reps-orange`) for hero-grade polish.

## Implementation steps

1. Capture the screenshot
   - `browser--view_preview` to `/c/james-wilson`, scroll to the qualifications/credentials section.
   - `browser--screenshot` (viewport, not full page) framed around that area.
   - Save to `src/assets/cpd-profile-screenshot.jpg` via `lovable-assets create` and write the `.asset.json` pointer.

2. Add the section to `src/routes/cpd.tsx`
   - Import the asset pointer and `BrowserFrame`.
   - Add a new `ProfileScreenshot` component below `Hero`.
   - Mount it between `<Hero />` and `<WhatCpdIs />` in `CpdPage()`.

3. Verify
   - `browser--view_preview` `/cpd`, screenshot the new section, check copy fit, frame alignment and that it reads as "earned" rather than filler.

## Technical notes

- Use semantic tokens only (`bg-reps-ink`, `border-reps-border`, `text-reps-orange`, `bg-reps-orange-soft`) per project core rule.
- Radius: `BrowserFrame` already uses `rounded-[22px]` (large panel) — keep as-is. Container is a section, no card radius needed.
- No new dependencies, no business logic changes, no DB.
- The screenshot is a real capture of a locked page (`/c/james-wilson`), so it stays in sync with the canonical shop-front mock-up.
