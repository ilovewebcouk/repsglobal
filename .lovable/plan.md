## Scope

Three small reverts/edits in `src/routes/pro.$slug.tsx`, About card and Location/Map stay as-is.

### 1. Revert Specialisms grid
The forced 3-column grid created awkward stretched pills and a lonely orphan in the last row. Restore the previous natural flex-wrap layout:
- Replace `grid grid-cols-3 gap-1.5` with `flex flex-wrap gap-1.5`
- Drop `justify-center` from the pill, keep `px-2 py-1 text-[11px]` sizing
- Lets pills size to their content and wrap organically

### 2. Restore "View all services" link
You confirmed this will point to a future dedicated all-services page for the pro. Put it back in the Services header:
- Header becomes a flex row: `H2` on the left, `View all services →` link on the right
- Link target: `/pro/${pro.slug}/services` (placeholder route, not built in this pass — link will 404 until that page exists, which matches every other "coming soon" link in the mock)
- Style: `text-[12px] font-semibold text-reps-orange hover:underline`

### 3. Remove per-card Enquire button
Hero already has the primary Enquire CTA, and a button on every service card was noisy. Remove:
- The `<button>…Enquire</button>` block (and the `MessageCircle` icon if it becomes unused elsewhere in the file — will verify before deleting the import)
- Keep the price lockup row as the card's bottom element
- Card stays `flex flex-col h-full` so heights remain equal

### Out of scope
No changes to About card, Map, hero, sub-nav, Qualifications, Trust, Reviews, FAQ, CTA band, footer, tokens, or radii. No new route file created for `/pro/$slug/services`.

### Verify
Screenshot `/pro/james-carter` and `/pro/sophie-taylor` at 1469px — confirm specialisms wrap naturally, "View all services" sits top-right of Services card, service cards end cleanly at the price line with no CTA button.
