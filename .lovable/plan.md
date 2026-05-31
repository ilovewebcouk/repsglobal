## Mirror signup hero on /login + stop the form card stretching

Bring `/login` in line with `/signup` (50/50 layout with the REPs dashboard background) and fix the form card stretching to full page height.

### Changes to `src/routes/login.tsx`

1. **Import shared hero background** — `signupHeroBg` from `@/assets/signup-hero-bg.jpg`. Reuses the same asset as signup, no new image.
2. **Hero section background treatment** (currently lines 88–99):
   - Add the dashboard `<img>` as a `z-0` absolute background (`object-cover object-left`, `opacity-80`).
   - Add the same `z-10` ink-wash gradient overlay so the right-side form card stays high contrast.
   - Move the two existing orange radial swooshes to `z-10`.
   - Wrap the grid in `relative z-20`.
3. **Grid columns**: change `lg:grid-cols-[1.05fr_minmax(0,460px)]` → `lg:grid-cols-2` to match signup exactly.
4. **Fix the full-height card stretching**:
   - Remove `min-h-[calc(100vh-76px)]` from the grid container — that's what's forcing the whole hero to viewport height and making the white form card stretch.
   - Add `lg:items-start` to the grid so the form card sizes to its own content instead of filling the row.
   - Replace the form card's `p-7` with `p-8` to match signup's padding rhythm.

### Out of scope

- No copy, form, or header changes.
- No new assets.
- No changes to `/signup` or other pages.
