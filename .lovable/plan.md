## Goal

On `/for-professionals` only, replace the React `PlatformMockups` components (currently rendered inside `BrowserFrame`) with simple neutral gray placeholder blocks labelled with the screen name (e.g. "Dashboard preview"). Feature deep-dive pages (`/features/$slug`) keep the existing React mockups untouched.

## Changes

1. **New `src/components/mockups/MockupPlaceholder.tsx`**
   - Props: `label: string`, `aspect?: "video" | "wide" | "square"` (default `"video"` = 16:9), `className?`.
   - Renders a `bg-muted` block at the requested aspect ratio, rounded `18px` (card radius), subtle inner border (`border-border/60`), centered label using `text-muted-foreground` + small `text-xs uppercase tracking-wide` "Preview" eyebrow above the label. No browser chrome, no shadow.
   - Uses only semantic tokens — no hardcoded colors.

2. **Edit `src/routes/for-professionals.tsx`**
   - Remove imports of `BrowserFrame` and the `PlatformMockups` components.
   - Replace the hero mockup (currently `<BrowserFrame><DashboardMockup /></BrowserFrame>`) with `<MockupPlaceholder label="Dashboard" />`.
   - Replace the "See the platform" showcase tiles (3 mockups) with 3 `MockupPlaceholder`s labelled e.g. "Bookings", "Clients CRM", "Insights" — same grid layout, same surrounding copy.
   - Keep everything else (hero copy, sticky CTA, press strip, feature pillars, calculator, testimonials, demo form) unchanged.

3. **Do not touch**
   - `src/components/mockups/PlatformMockups.tsx` and `BrowserFrame.tsx` stay (still used by `/features/$slug`).
   - `/features` hub and sub-pages are unchanged.

## Out of scope

- No changes to feature pages, nav, footer, or routing.
- No real screenshots / image assets — pure CSS placeholder blocks.
- No animation or interactivity on the placeholders.
