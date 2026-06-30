## Short answer

Yes — this changes the game. The BD redirect table is the **authoritative list of every URL Google has ever seen on the old site**, including all the postcode-change rewrites BD did internally (e.g. `se1-0fn/...` → `ec1v-2nx/...`). The legacy sitemap I pulled earlier only had 363 URLs; this CSV looks like ~4,141 rules. Using it makes the rescue go from "good" to "complete."

## What I'll do once you export and upload the CSV

### 1. Fix the build error first
The `src/routes/$.tsx` file I added last turn is being flagged by TanStack's import-protection plugin (the splat route is being bundled into the client graph and the `createServerFn` resolver is tripping it). I'll restructure it so all DB access lives in a sibling `*.functions.ts` file and the route file only calls it — the same pattern used elsewhere in the project. No behaviour change.

### 2. Ingest the BD redirects CSV
- You export the full table from BD as CSV (the green **Import CSV File** button has an Export counterpart, or "Bulk Actions → Export"). Expected columns: source URL, destination URL, type.
- I add an admin-only importer at `/admin/seo/legacy-redirects` that:
  - Parses the CSV (PapaParse).
  - Normalises both source and destination (strip `https://legacy.repsuk.org/`, decode, lowercase, kebab-clean).
  - Stores rows in a new `legacy_redirects` table (`source_path` PK, `destination_path`, `kind` enum, `imported_at`).
  - Idempotent — re-importing replaces rather than duplicates.
- A small stats panel: total rules, by type, % resolvable to a current `/c/{slug}`.

### 3. Wire the table into the catch-all redirect
The `$.tsx` handler becomes a 3-step resolver, fastest path first:

```text
incoming legacy URL
   │
   ▼
1. Exact match in legacy_redirects.source_path ──► follow chain → resolve to terminal destination
   │                                                                │
   │                                                                ▼
   │                                          2. If terminal is /exercise-professional/{slug}
   │                                             and slug matches a live professional
   │                                             → 301 to /c/{slug}
   │
   ▼
3. If destination is a non-migrated type (training-provider, business-partner, etc.)
   → 410 Gone (clean deindex)
   │
   ▼
4. Fallback to the slug-fuzzy match I shipped last turn → 301 or 410
```

This way, BD's internal "we moved trainfitness from SE1 to EC1V" rewrites resolve in **one hop** on our side. Google sees a single clean 301, never a chain.

### 4. Optional: write the BD redirects as additional sitemap entries
For any BD `source_path` that resolves to a live `/c/{slug}`, the destination is already in our main sitemap (from last turn's work). No extra emission needed — but I'll add a `legacy-coverage.xml` debug page at `/admin/seo/legacy-coverage` showing exactly which legacy URLs resolve cleanly vs which 410, so you can spot-check.

### 5. legacy.repsuk.org reminder
Independent of all this, the bare `legacy.repsuk.org` host should still be wildcard-301'd to `repsuk.org` at the DNS/host layer (that's outside our app). Without it, both copies stay live and Google keeps splitting authority — same point I flagged last turn.

## What I need from you

1. **Export the BD redirects table as CSV** (or paste a sample so I can confirm column names before building the importer). The visible columns in your screenshot — `ID, Actions, Source URL, Destination URL, Type, Date Updated` — are all I need.
2. Confirm you're happy with the **410 Gone** behaviour for unmigrated trainers / all training-providers / business-partners. (My recommendation; tells Google "drop these URLs" faster than soft-404.)

## Technical details

- New table `public.legacy_redirects` — columns `source_path text PK`, `destination_path text not null`, `kind text not null` (`exercise-professional` | `training-provider` | `business-partner` | `awarding-organisation` | `other`), `terminal_path text` (cached chain-follow), `resolved_to_slug text null`, `imported_at timestamptz`, `updated_at timestamptz`. Service-role-only RLS — read happens via `createServerFn` with admin client.
- New `src/lib/seo/legacy-redirects.functions.ts` — server fns: `importLegacyRedirectsCsv`, `resolveLegacyPath`, `getLegacyCoverageStats`.
- New `src/routes/_authenticated/_admin/admin_.seo_.legacy-redirects.tsx` — upload UI + stats.
- `src/routes/$.tsx` — refactored to call `resolveLegacyPath` first, then fall back to current fuzzy logic. Server-only imports moved out of the route file to satisfy the import-protection plugin (fixes the current build error).
- Chain-follow cap at 5 hops to prevent loops; cycles caught and logged.
- `Cache-Control: public, max-age=86400` on 301 responses so CDN/Workers cache the resolution.
