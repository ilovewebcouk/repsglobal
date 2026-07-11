# Roll out the new REPS logo everywhere

You've given us the full logo family, so we can retire the old `RepsWordmark` SVG entirely and use your artwork in every spot — including the compact places we previously kept on the old mark.

## Assets to add (via `lovable-assets`, not committed binaries)

From `/mnt/user-uploads/`:

| Upload | Purpose | Saved as |
|---|---|---|
| `reps_logo.svg` | Full lock-up, white (dark UI) | `src/assets/brand/logo-lockup.svg` *(replaces existing)* |
| `reps_logo_dark.svg` | Full lock-up, dark (light bg / print) | `src/assets/brand/logo-lockup-dark.svg` *(replaces existing)* |
| `reps_logo_min.svg` | Wordmark only, dark | `src/assets/brand/logo-wordmark-dark.svg` |
| `reps_logo_min_alt.svg` | Wordmark only, white | `src/assets/brand/logo-wordmark.svg` |
| `favicon.svg` | Icon-only mark, dark | `src/assets/brand/logo-mark-dark.svg` + `public/favicon.svg` |
| `favicon_alt.svg` | Icon-only mark, white | `src/assets/brand/logo-mark.svg` |

## Component updates

1. **`RepsLockup.tsx`** — repoint to the new `logo-lockup(-dark).svg`. No API change.
2. **`RepsWordmark.tsx`** — replace the hand-inlined old-logo `<path>`s with an `<img>` pointing to `logo-wordmark(-dark).svg`. Keeps the `variant?: "light"|"dark"` API so every existing call site (~40 files) picks up the new artwork with zero churn.
3. **New `RepsMark.tsx`** — icon-only component using `logo-mark(-dark).svg`, `variant`, `title`. For badge titles, list bullets, award icons — anywhere the compact 1:1 mark reads better than a wordmark.

## Targeted spots you called out

- **Dashboard** (sidebar, shell, demo content) — driven by `RepsWordmark` → picks up new wordmark automatically.
- **Checkout credits header** — swap `RepsWordmark` → new wordmark automatically; verify header height still balances.
- **Core certificate landing page inline marks** — swap inline `RepsWordmark` refs; check size (bump to `h-5` if the new wordmark reads smaller).
- **Competitor comparison tables** — REPS column header uses `RepsWordmark`; picks up automatically. Confirm it still fits the column.
- **"Replace your stack" tile grid** — REPS tile uses `RepsWordmark`; picks up automatically.
- **Qualifications page badge titles + awarding body list icons** — currently text or generic icons. Switch to new `<RepsMark />` at `h-4`/`h-5` for the badge titles and awarding-body list bullets, per your suggestion.
- **Campaign email headers** ("brutal honest truth", onboarding, etc.) — currently render "REPS" as inline text (email clients strip SVG-in-`img` unreliably, and 15KB inline is bad for deliverability). Best path: keep as text but style it to match, OR embed the wordmark as a hosted PNG served from CDN. I'll go with the hosted-PNG option (lovable-assets serves stable URLs) at ~140×30 for retina, since you want visual consistency.
- **Favicon** — replace `public/favicon.ico` with `public/favicon.svg` (icon-only mark) + update `__root.tsx` `head().links`. Delete the old `.ico`.

## Not touched

- `og:image` — separate hero art, not the logo.
- Certificate PDF templates — you're baking the dark lock-up into Illustrator directly.
- JSON-LD structured-data `logo` field — will point at the new hosted lock-up URL.
- Transactional Supabase auth emails (signup/recovery/reauth) — no REPS branding today; out of scope unless you want it.

## Verification

- `bun run build` after asset swap.
- Playwright screenshot pass: navbar, footer, dashboard sidebar, `/checkout`, `/certificate/*`, `/compare/*`, `/qualifications`, and one campaign email preview via `render-email.mjs`.
- Spot-check that no route still references `logo.svg` / `logo-dark.svg` (old files) — remove them if orphaned.

## Rough size

~8 files created (assets + `RepsMark`), 3 edited (`RepsLockup`, `RepsWordmark`, `__root.tsx`), 1 deleted (`favicon.ico`). All existing `<RepsWordmark />` call sites (~40) update visually with no code changes.

Approve and I'll ship it.