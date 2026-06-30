## Problem

Two issues on the legacy catch-all (`src/routes/$.tsx`):

1. **Colors are broken.** `GonePage` renders white text on the site's default body background. The body uses `var(--color-background)` which is `--reps-ivory` (cream) in light mode — we never apply a `dark` class on `<html>`, so anywhere a route forgets to set its own dark surface, you get white-on-cream. That's exactly what the screenshot shows: orange eyebrow + cream bg + invisible white body text and faded buttons.

2. **Redirects aren't firing for some legacy URLs.** The catch-all calls `resolveLegacyPath` → checks `legacy_redirects` table → falls back to fuzzy slug match on `professionals.slug`. When a row exists but `resolved_to_slug` is `null` (chain-resolve couldn't match the destination to a live pro at import time), we 410 even when the pro is now live on the new site. We never re-run chain-resolve after new pros publish, so the table goes stale.

## Plan

### 1. Fix the 410 page styling

Wrap `GonePage` in a full-bleed dark surface so it reads correctly regardless of body theme:

- Outer `<div className="min-h-screen bg-reps-ink">` wrapping `<main>`.
- Keep the existing typography; bump `text-white/70` to `text-white/80` for the lede (matches the locked marketing opacity scale).
- Same treatment for `NotFoundComponent` in `__root.tsx` (same root cause — `bg-background` resolves to cream).
- Same treatment for `ErrorComponent` in `__root.tsx`.

No new tokens, no design changes — just the missing dark surface.

### 2. Re-run chain-resolve so stale "gone" rows redirect

Add a lightweight admin server fn `rechainLegacyRedirects` in `src/lib/seo/legacy-redirects.functions.ts` that re-walks every existing row against the current `professionals.slug` set and updates `resolved_to_slug`. Same logic as the tail of `importLegacyRedirectsCsv` — extracted so we can run it without re-importing the CSV.

Wire a "Re-run chain resolve" button into `/admin/seo/legacy-redirects` next to the coverage stats. One click rescues every row whose pro has since published.

### 3. Tighten the fallback so live pros never 410

In `resolveLegacyPath`, when a `legacy_redirects` row is found with `resolved_to_slug = null` AND `kind = exercise-professional`, do a live fuzzy lookup against `professionals.slug` (same `slugCandidates` logic the fallback path already uses) BEFORE returning `gone`. If we find a match, redirect AND backfill the row so the next hit is a fast table read.

This makes the redirect layer self-healing — even without clicking the admin button, the first visitor to a stale URL fixes the row for everyone after them.

### 4. QA pass

After shipping, paste the legacy URL from the screenshot (or any sample BD URL) so I can confirm it now 301s instead of 410s, and screenshot the page so we can verify legibility.

## Out of scope

- Changing the global theme (adding `class="dark"` to `<html>`). That's a bigger refactor and would mask other latent contrast bugs on routes that currently happen to work.
- Editing the curated blog map — those are already correct.
