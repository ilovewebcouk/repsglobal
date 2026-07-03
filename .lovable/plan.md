
## Goal

Two changes to the coach shop-front system:

1. **Remove the "Layout: Lite (Verified) / Full (Pro)" selector** — all tiers get the same page, so this field is dead weight.
2. **Add a Light theme option** for the public `/c/$slug` page. Each coach picks Dark (default) or Light in `dashboard → website`. Visitors just see whatever the coach chose. Scope is limited to the shop-front page and its own header/logo — the rest of REPs (marketing, dashboard, admin) stays dark.

## 1. Kill the Layout selector

- Remove the "Layout" `Field` block in `src/routes/_authenticated/_professional/dashboard_.website.tsx` (~line 384–394), the `layout` state (line 145), the `setLayout` in the hydration `useEffect` (152), and the `layout_variant: layout` line in `saveMutation` (163).
- Leave `shop_fronts.layout_variant` in the DB for now (harmless, no user surface). No migration.
- `src/lib/shop-front/shop-front.functions.ts` continues to read/write it with a default — no behavioural change.

## 2. Coach-picked light theme for /c/$slug

### Data

- Migration: add `theme text not null default 'dark' check (theme in ('dark','light'))` to `public.shop_fronts`. Backfill existing rows to `'dark'`.
- Extend `ShopFrontDTO` in `src/lib/shop-front/shop-front.functions.ts` to include `theme: 'dark' | 'light'`, read/write it in `getMyShopFront`, `upsertMyShopFront`, and `getShopFrontBySlug`.

### Dashboard control

- In `dashboard_.website.tsx`, replace the removed Layout field with a **Theme** `Field` using shadcn `ToggleGroup` (Dark / Light). Hydrate from `sf.theme`, save via `upsertSf`. Copy hint: "Choose how your public page looks. You can change this anytime."

### Public page theming (scoped, no global CSS refactor)

The `/c/$slug` page currently hardcodes dark tokens (`bg-reps-panel`, `text-white`, `border-reps-border`, `--coach-accent-*`, etc.). Rather than re-tokenising every component (huge, risky, and would touch locked marketing surfaces), scope light-mode overrides to a single wrapper class.

- Add a `data-coach-theme="light"` attribute on the outermost wrapper in `src/routes/c.$slug.index.tsx` (and the `enquire` / `review` child routes' outermost wrapper) based on `shopFront.theme`.
- In `src/styles.css`, add a scoped block:
  ```css
  [data-coach-theme="light"] {
    --coach-bg: #ffffff;
    --coach-surface: #f7f7f5;
    --coach-surface-soft: #ffffff;
    --coach-border: rgba(15,15,15,0.08);
    --coach-text: #0a0a0a;
    --coach-text-soft: rgba(10,10,10,0.68);
    --coach-text-mute: rgba(10,10,10,0.5);
  }
  [data-coach-theme="dark"] { /* same vars pointing at existing dark values */ }
  ```
- Refactor the shop-front page + its subcomponents (SectionNav, service cards, testimonials, foundation method, hero, sticky sub-nav, floating verified card, transformation proof cards) to consume `var(--coach-*)` instead of hardcoded `bg-reps-panel` / `text-white` / `border-reps-border` classes. Keep the accent oranges (`--coach-accent-*`) exactly as they are — they read fine on both backgrounds.
- Files touched (all under the coach shop-front only): `src/routes/c.$slug.index.tsx`, `src/routes/c.$slug.enquire.tsx`, `src/routes/c.$slug.review.tsx`, `src/routes/c.$slug.tsx` (layout wrapper), and any dedicated components under `src/components/coach/` or `src/components/shop-front/` that render inside those routes.

### Chrome (header/logo) on the coach page

The shop-front already has its own sticky `SectionNav` (per the locked mock-up), not the global `Navbar`. So:
- Update `SectionNav` background, text, border, and the REPS wordmark colour to consume the same `--coach-*` tokens. In light mode: white background, `#0a0a0a` REPS wordmark, subtle border, orange accents unchanged.
- Confirm nothing on `/c/$slug` renders the global marketing `Navbar` — if it does under any breakpoint, guard it out.

### What does NOT change

- Global light/dark system — none introduced.
- Marketing pages, homepage, city/profession pages, `/features/*`, `/for-professionals`, dashboard, admin — all remain dark.
- Accent oranges, radius system, type scale, section rhythm — untouched.
- Locked `mem://design/coach-shopfront` composition — untouched (only the token layer changes).

## 3. Verification

- Migration lints clean; existing rows read `theme = 'dark'`.
- `/c/james-wilson` renders identically to today (dark).
- Set `theme = 'light'` in dashboard → save → `/c/james-wilson` renders on white with dark text, white sticky nav, dark REPS wordmark, orange CTAs intact.
- `/c/$slug/enquire` and `/c/$slug/review` inherit the same theme.
- Playwright screenshot both themes at 1280×1800 to confirm no invisible-white-on-white or missing borders.

## 4. Memory

After landing, update `mem://design/coach-shopfront` to note the two-theme system (coach-picked, `data-coach-theme` wrapper, `--coach-*` tokens) so future edits don't re-introduce hardcoded dark tokens inside the shop-front tree.
