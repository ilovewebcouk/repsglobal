## Goal

On public coach websites (`/c/$slug`) only:
1. Hide the orange "Core membership — now £34/year · Join today" strip.
2. Replace the wishy-washy "H is finishing their REPS profile" line with a stronger trust-first warning (and fix the bug where the first name renders as a single letter).

Everywhere else (marketing, home, directory, etc.) the promo bar stays.

## Changes

### 1. Hide `<SiteBanner />` on `/c/$slug`

In `src/routes/c.$slug.index.tsx` (line 766), remove the `<SiteBanner />` render from the coach website page. The bar continues to render on all other routes that mount it.

No menu adjustment needed: `ChromeBar` uses `sticky top-0` and `SectionNav` uses `sticky top-14`, both relative to the viewport — the site banner sat above them and scrolled away independently. Removing it does not shift the sticky header.

### 2. Fix name bug + rewrite placeholder banner

Current bug (line 769): `(coach.name ?? "").split("")[0]` splits by empty string and returns a single character ("H" instead of "Hedvika"). Change to `.split(" ")[0]`.

Rewrite `TemplateContentBanner` (lines 798–827) as a trust-first warning:

```text
[shield icon]  Not yet verified by REPS
              This professional is still completing their profile —
              some content on this page is placeholder.
                                          [Finish your website →]  (owner only)
```

Visual treatment:
- Keep the amber palette (same warning family used across the app), but tighten the hierarchy: a bold single-line title + a smaller supporting line, replacing the current run-on sentence.
- Swap the `Sparkles` icon for `ShieldAlert` to match the trust-warning tone.
- Owner CTA button unchanged (still links to `/dashboard/website`).

### 3. Verification

- Load `/c/hedvika-chau` (unverified) — confirm no orange promo bar, amber warning banner reads correctly with full first name, sticky nav still anchors to the top.
- Load a verified pro (e.g. `/c/james-wilson`) — confirm no promo bar, no warning banner.
- Load `/` and `/find-a-professional` — confirm the promo bar still renders.

## Files touched

- `src/routes/c.$slug.index.tsx` — remove `<SiteBanner />`, fix `split("")` → `split(" ")`, rewrite `TemplateContentBanner` copy + icon.
