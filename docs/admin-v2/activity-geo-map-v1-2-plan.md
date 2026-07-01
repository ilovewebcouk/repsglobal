# Activity Geo Map — v1.2 Design

Status: **Design spec. Not implemented in v1.1.**

v1.1 ships a country-level heat card (`GeoPanel`) because we only have
`country_code`. v1.2 will upgrade the same card slot into a live map once
Cloudflare header enrichment lands (see `geo-enrichment-map-plan.md`).

## Goals

Answer at a glance:
- Where are logged-in members active from right now?
- What countries/cities produced the most member page views in the last 24h?
- Where are sign-ins (and failed sign-ins) coming from?

## Component slot

`GeoPanel` in `/admin/activity` swaps its inner view from **HeatCard** →
**MapView** when `geo_source IS NOT NULL` for a threshold of recent sessions
(≥ 50 in last 24h). Below the threshold the heat card is kept — the map is
useless with sparse data.

## Data (city/region only)

New server fn `getGeoActivity({ level: 'country'|'city' })`:
- `country`: country_code, name, online_now, page_views_24h, sign_ins_24h, failed_sign_ins_24h, share%
- `city`: country_code, region, city, lat, lng (city centroid), online_now, page_views_24h, sign_ins_24h

Only city centroids from Cloudflare are stored. **No exact device coordinates.**
No street-level granularity. No IP shown.

## Map UI

- Library candidates: `react-simple-maps` (SVG, ~30 KB gz, no tiles, offline)
  or `maplibre-gl` (~200 KB gz, tiled).
- Prefer `react-simple-maps` for v1.2 — no map-tile provider needed, no
  external HTTP, matches the ops-console tone.
- Overlays:
  - **Country heat shading** — colour scale by `page_views_24h`.
  - **City pulse markers** — animated dots sized by `online_now`.
  - **Sign-in pings** — brief flash at city marker on new `auth_events` row (WebSocket-free polling every 15 s).
- Interactions:
  - Click country → filter feed by country and re-fetch city drill.
  - Click city → open right-side sheet listing current sessions in that city.
  - Toggle between **World**, **UK**, and **Europe** presets.

## Side panels (unchanged from HeatCard)

- Top countries 24h
- Top cities 24h (city view only)
- Sign-ins by location
- Failed sign-ins by location (severity-coloured)

## Fallbacks (mandatory)

- No `geo_source` yet → keep HeatCard, tooltip "City-level mapping is planned once geo enrichment is enabled."
- Enrichment enabled but sparse (<50 sessions/24h) → keep HeatCard.
- Fetch fails → render HeatCard from country-only data, show partial-source pill.

## Privacy

- No raw IP anywhere in payload or UI.
- No latitude/longitude values shown in tooltips — coordinates are used only to place the marker.
- City is the finest granularity a marker represents.
- Admin-only route; audited via `admin_audit_log` on map filter changes.

## Non-goals for v1.2

- Real-time WebSocket transport (poll only).
- Device-precise tracking.
- Public/anonymous traffic on the map (still gated behind the separate public analytics decision).
