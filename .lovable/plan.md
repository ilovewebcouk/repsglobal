
## Problem

Two real issues in the current split-view editor shell (`WebsiteEditorLayout.tsx`):

1. **Preview panel is too narrow.** It's a fixed `w-[420px]` column only shown at `xl:` (≥1280px). After padding + border, the iframe sits inside a ~388px slot. The trainer's public page (`/c/$slug`) is a full desktop layout, so at 388px it collapses to its mobile breakpoints. That's why the preview looks small and cramped.

2. **Desktop vs Mobile toggle produces the same view.** Desktop mode sets the frame to `w-full` (≈388px). Mobile mode sets it to `w-[320px]`. Both are below the site's `md`/`lg` breakpoints, so both render the mobile stack of the public page. The toggle changes the frame width by ~68px but not the rendered layout — so the two states look almost identical.

## Fix

Rework only the right-hand preview pane inside `WebsiteEditorLayout.tsx`. No changes to the editor content, section nav, save flow, or any public route.

### 1. Give the preview real room

- Preview column becomes **flex-1** (fills remaining width) instead of `w-[420px]`, with `min-w-[360px]` and `max-w-[720px]`.
- Show it from **`lg:` (≥1024px)** instead of `xl:`. Below `lg:` keep the current "View public" fallback (no iframe).
- Center column keeps `min-w-0` and a comfortable editor max-width (`max-w-[640px]`) so the middle stays readable when the preview expands.

Resulting rough proportions at 1440px: rail 236 / editor ~560 / preview ~640.

### 2. Make Desktop and Mobile visually distinct via scaled iframes

Render the iframe at a **true device width** and CSS-scale it to fit the panel. This is the standard pattern (Framer, Webflow, Vercel preview).

- **Desktop mode**: iframe intrinsic `width: 1280px`, `height: 100%` of a scaled wrapper. Compute `scale = panelWidth / 1280` (measured with a `ResizeObserver` on the preview container). Wrapper uses `transform: scale(var(--s)); transform-origin: top left;` and the outer box compensates height. Result: the real desktop layout, shrunk to fit — clearly different from mobile.
- **Mobile mode**: iframe intrinsic `width: 390px`, centered in a phone-shaped frame (`rounded-[22px]`, thin bezel). Scale only if `panelWidth < 390`, otherwise 1:1.
- Small badge above the frame: `Desktop · 1280 → 62%` or `Mobile · 390`.

### 3. QA polish while in the file

- Default device: `desktop` (matches "large preview" intent). Mobile is opt-in.
- Preview panel gets a lightweight header row: device toggle (left), width label (center), reload + open-in-new-tab (right).
- Add a **collapse-preview** button (chevron) so a trainer can reclaim full editor width on a smaller laptop; state persisted in `localStorage`.
- Iframe gets `sandbox="allow-same-origin allow-scripts allow-forms"` and `title` for a11y.
- Fix the current `key={reloadNonce}` + `#nonce-…` combo — one mechanism is enough; keep `key` and drop the hash so the URL stays clean.
- Empty-slug state gets a proper illustration slot instead of a single line of grey text.

## Technical notes

- Scaling implementation uses one `ResizeObserver` on the preview container, writing `--preview-scale` on a wrapper div. No layout thrash on the iframe itself.
- Height compensation: wrapper height = `panelHeight / scale`, then transformed back down — keeps the scaled desktop page fully scrollable inside the pane.
- No changes to `/c/$slug`, no new routes, no data-fetching changes, no new deps.

## Out of scope

- Section-scroll sync between editor and preview (already noted as future work).
- Any changes to the public coach page or to other editor sections.
- Design-system token changes.

## File touched

- `src/components/dashboard/website/WebsiteEditorLayout.tsx` (only)
