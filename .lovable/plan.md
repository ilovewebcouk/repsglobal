
## Logo lock-up rollout

Adopt the uploaded full REPS lock-up ("REPS" wordmark + tagline lines) as the primary brand logo on the website. Keep the existing compact wordmark as a fallback for tight spaces (favicon, avatar chips, tiny UI).

### Assets to add

1. `src/assets/brand/logo-lockup.svg` — copy from `user-uploads://reps_logo_horizontal.svg`. White fills (for dark UI — matches our dark-first site).
2. `src/assets/brand/logo-lockup-dark.svg` — same artwork, black/`#0a0a0a` fills. Used on:
   - Certificate PDF (page 1 header)
   - Unit summary PDF (page 2 header)
   - Any future light-background printable
3. Keep existing `logo.svg` / `logo-dark.svg` (compact wordmark) untouched — still used for favicon, small chrome, `RepsWordmark` component fallback.

### Website wiring

- **Navbar** — swap current wordmark for the lock-up. Because the lock-up is taller (tagline underneath), the nav logo height goes from ~20px to ~36–40px. Verify header padding still balances; adjust nav row height if it feels cramped.
- **Footer** — use the lock-up (larger, ~56px tall) so the tagline reinforces authority at page bottom.
- **Auth shell / marketing hero corners** — lock-up.
- **Dashboard sidebar** — keep compact wordmark (space-constrained).
- **Favicon, og:image, avatar chips, small badges** — keep compact wordmark.

Create a shared `<RepsLockup />` component next to `RepsWordmark.tsx` that inlines the SVG (so it inherits `currentColor` and scales cleanly). Existing `RepsWordmark` stays for compact usage.

### Certificate wiring (ties into in-flight template work)

- Add a `logo-lockup-dark.svg` reference at the top of the Adobe certificate template you're designing. Since we're doing coordinate-mapped overlay, the logo is baked into the PDF template artwork itself — you'll place it in Illustrator, not overlay it at render time. No code change needed beyond having the dark SVG available for you to place in Illustrator.
- If you'd rather render it dynamically (so we can swap logos later without re-uploading the template), we'd add a `reps_logo` image field to the `field_map` and stamp it at issue time. Slower to iterate but more flexible. I'd recommend **baking it into the template** — the whole point of the Adobe approach was print-quality artwork.

### Files touched

- `src/assets/brand/logo-lockup.svg` (new, from upload)
- `src/assets/brand/logo-lockup-dark.svg` (new, recoloured fills)
- `src/components/brand/RepsLockup.tsx` (new)
- Navbar component (swap logo)
- Footer component (swap logo)
- Auth shell (swap logo)

### Not touched

- `RepsWordmark.tsx`, existing `logo.svg` / `logo-dark.svg`
- Favicon, og:image, avatar/monogram components
- Dashboard sidebar logo
- Any locked marketing page structure (only the logo swaps within existing header/footer slots)

### Verification

After the swap, screenshot the navbar and footer at desktop + mobile via Playwright to confirm the tagline is legible and the lock-up doesn't crowd nav items. If the tagline goes sub-legible on mobile (<640px), fall back to the compact wordmark below that breakpoint via a responsive `hidden sm:block` / `sm:hidden` pair.

Approve and I'll build it, then return to the certificate template work.
