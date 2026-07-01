# Geo Enrichment Plan — Admin Activity v1.2

Status: **Draft — for v1.2 decision.** Not implemented in v1.1.

Today `auth_events`, `user_sessions`, and `member_session_events` capture
`country_code` only (via request metadata). The v1.1 migration adds nullable
`region`, `city`, `latitude`, `longitude`, and `geo_source` columns so we can
enable city-level enrichment without another schema change.

This document compares enrichment options and recommends one for v1.2.

## Options

### 1. Cloudflare request headers (`CF-IPCountry`, `cf-ipcity`, `cf-region`, `cf-latitude`, `cf-longitude`)
- **Effort:** ~1 day. Read headers inside `capture.server.ts`; no vendor account.
- **Cost:** £0 (bundled with Cloudflare — REPs runs on Workers already).
- **Accuracy:** Country ~99%, city ~70–80% for consumer IPs, worse on mobile carriers/VPN.
- **Fields:** country, region, city, latitude, longitude (city-centroid, not device-precise).
- **Privacy:** No third-party call. Data never leaves the edge. Best posture.
- **Rate limits:** None — provided per-request.
- **Server-side:** Yes (native to Worker runtime).
- **Retention:** We keep only city/region strings; latitude/longitude are city centroids, not device coordinates.
- **Recommendation weight:** ⭐⭐⭐⭐⭐ Default choice.

### 2. MaxMind GeoIP2 (self-hosted MMDB)
- **Effort:** ~3 days. Ship MMDB bundle (~70 MB) or use MaxMind Lite API; add lookup helper.
- **Cost:** GeoLite2 free with attribution; GeoIP2 City ~$50/mo commercial.
- **Accuracy:** Country ~99.8%, city ~80%. Comparable to Cloudflare.
- **Fields:** country, region, city, lat/lng, postal.
- **Privacy:** No third-party call after DB download. Good posture.
- **Rate limits:** None (local).
- **Server-side:** Yes. MMDB bundle inflates Worker size — must use API or KV.
- **Retention:** Same as Cloudflare.
- **Recommendation weight:** ⭐⭐⭐ Only if we leave Cloudflare or need postal.

### 3. ipinfo.io / ipapi.co / AbstractAPI
- **Effort:** ~1 day. Add fetch on capture write.
- **Cost:** ipinfo Basic ~$249/mo for 250k lookups; free tiers 1k/day.
- **Accuracy:** Country ~99%, city ~75%. Comparable.
- **Fields:** country, region, city, lat/lng, ASN, ISP.
- **Privacy:** IP leaves our infra to third party. Weakest posture. Requires DPA update + privacy-policy line.
- **Rate limits:** Yes; per-request fetch adds 50–200 ms to every beacon write. Must debounce/cache per session.
- **Server-side:** Yes.
- **Retention:** Same as Cloudflare.
- **Recommendation weight:** ⭐⭐ Not worth the privacy cost when Cloudflare is free.

### 4. PostHog / analytics-provider enrichment
- **Effort:** ~2 days. Only useful if we adopt PostHog for public analytics in v1.1+; requires public analytics decision first.
- **Cost:** PostHog cloud from £0 (1M events free) to £450/mo at scale.
- **Accuracy:** Same underlying vendors as (1)/(3).
- **Fields:** country, region, city, lat/lng.
- **Privacy:** Third-party processor. DPA required.
- **Rate limits:** N/A (async).
- **Server-side:** Enrichment happens vendor-side; we get it back on event ingest.
- **Retention:** Depends on PostHog retention config.
- **Recommendation weight:** ⭐⭐ Only if we adopt PostHog for other reasons.

### 5. No enrichment — country-only forever
- **Effort:** 0. Status quo.
- **Cost:** £0.
- **Accuracy:** Country only.
- **Fields:** country.
- **Privacy:** Strongest.
- **Recommendation weight:** ⭐⭐ Ships fine for internal ops; loses city map ambition.

## Recommendation

**Adopt Option 1 (Cloudflare headers) for v1.2.** Zero cost, no third-party
call, no DPA change, no per-request latency, works out of the box on Workers.
Populate `city`, `region`, `latitude`, `longitude`, and set
`geo_source = 'cloudflare'` inside `capture.server.ts` when writing
`user_sessions` / `member_session_events` / `auth_events`.

Fall back to Option 2 (MaxMind) only if we later leave Cloudflare.
Reject Option 3 unless a specific enrichment (ISP/ASN) is genuinely needed.

## Privacy guardrails (all options)

- Never store raw IP — we already only store `ip_hash`.
- Never log/display latitude/longitude to admins beyond a map marker.
- City-level is the finest granularity we display; region is preferred where the country is small.
- Retention follows `purge_activity_detail()` (90 d sessions, 12 mo auth).
- Add a privacy-policy line naming the enrichment source before v1.2 ships.
