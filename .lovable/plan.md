## What "Where we all fit!" actually is

That line on the dashboard hub is `professionals.headline` — a **legacy column** left over from the old profile editor. Confirmed against the DB:

- `professionals.headline` = `"Where we all fit!"` (orphan — no editor writes to it any more)
- `websites.tagline` = `"Active group exercise classes for local residents"` (what the Website editor actually saves)

The hub header (`src/components/dashboard/hub/index.tsx:138`) and the sidebar footer (`src/components/dashboard/DashboardSidebar.tsx:186`) both still read `professionals.headline`, so the trainer sees a value they can't find or edit anywhere in the current UI. Your instinct is right: it's loose text.

## Scope of the orphan audit

Grep across `src/components/dashboard` + `src/routes/_authenticated` for legacy profile fields that still render but have no editor surface:

| Field | Rendered in | Editor today | Verdict |
|---|---|---|---|
| `professionals.headline` | Hub header, Sidebar footer fallback | none (Website editor uses `websites.tagline`) | **orphan — fix** |
| `professionals.bio` | not rendered on dashboard (verified) | none (Website editor uses `websites.about`) | dead read; safe |
| `professionals.city` | dashboard read, not surfaced in hub | Where I train (`location`) | overlap; note only |

Only `headline` is actually shown. Nothing else on the dashboard leaks a stale legacy field to the user.

## Fix

1. **Hub header** — change the source from `data.profile.headline` to `data.website?.tagline`. Same fallback rule (hide `<p>` when empty). File: `src/routes/_authenticated/_professional/dashboard.tsx` (loader shape) + hub prop wiring; no change to `hub/index.tsx` other than the prop it consumes.
2. **Sidebar footer** — drop the `member?.headline` fallback in `DashboardSidebar.tsx:186`. Sidebar there is meant to show the account email; the headline fallback was noise.
3. **Loader** — extend `getDashboardOverview` to include `websites.tagline` alongside the existing profile row so both surfaces read the same value the Website editor writes.
4. **Data**: leave `professionals.headline` in place in the DB (don't destroy old copy); just stop reading it. If you want it wiped from the 1 affected account, that's a one-line follow-up UPDATE — call it out and I'll do it on your say-so.

## Out of scope this pass

- Removing `professionals.headline`/`bio` columns from the schema (bigger migration; other systems may still read them — needs its own audit).
- Redesigning the hub header layout — purely a data-source swap.
- Any Website editor changes — the tagline field already exists and works.

## Verify

- Reload `/dashboard` as Charlotte: hub header now shows the website tagline (or nothing if blank), never `"Where we all fit!"`.
- Sidebar footer shows email only.
- Edit tagline in Website editor → publish → hub header updates on refetch.
