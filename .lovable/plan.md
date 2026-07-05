## Goal

Two additions to `/admin/seo`, both driven by the Google Search Console connector that already powers the daily URL Inspection scan:

1. Show that Google is actually fetching your sitemap.
2. Give you a one-click way to push a priority URL into Google's "request indexing" queue.

No changes to the daily scan, the events table, or any user-facing pages.

## 1. Sitemap health panel

New card on `/admin/seo`, sits next to "Recent scans".

Calls GSC once per view:

```
GET /webmasters/v3/sites/https%3A%2F%2Frepsuk.org%2F/sitemaps/https%3A%2F%2Frepsuk.org%2Fsitemap.xml
```

Displays:
- **Status pill** — green "Submitted & healthy" / amber "Warnings" / red "Errors" / grey "Not submitted"
- **Last downloaded** — e.g. "6 hours ago" (from `lastDownloaded`)
- **URLs Google saw** — `contents[0].submitted` / `indexed` counts
- **Errors / warnings** — surfaced only when non-zero
- **Resubmit button** — `PUT` the same path; refreshes on success

If GSC returns 404 (sitemap not registered on the property), the card shows a one-time "Register sitemap with Google" button which does the `PUT` and then re-fetches.

Runs in a new server fn `getSitemapHealth` / `resubmitSitemap` under `src/lib/seo/sitemap-health.functions.ts` (admin-only via `has_role`), using the same `GSC_GATEWAY` + `LOVABLE_API_KEY` + `GOOGLE_SEARCH_CONSOLE_API_KEY` pattern already in `index-monitor.server.ts`.

## 2. "Request indexing" helper on open events

Realistic constraint: **Google's public Indexing API only accepts JobPosting / BroadcastEvent** — it won't index generic landing pages via API. The reliable path is GSC's URL Inspection UI, which has a "Request indexing" button and a ~10/day quota per property.

So each Open Event row gains a small **"Open in GSC →"** action:

```
https://search.google.com/search-console/inspect
  ?resource_id=https%3A%2F%2Frepsuk.org%2F
  &id=<encoded full URL>
```

Opens the URL Inspection view in a new tab, pre-loaded on that exact URL. You click "Request indexing" there. No API call, no quota risk, works today.

Optional secondary action on the same row: **"Re-check now"** — calls the existing `inspectUrl` server fn from `index-monitor.server.ts` for just that one URL and refreshes its verdict without waiting for the next daily scan.

## Files

- **New** `src/lib/seo/sitemap-health.functions.ts` — `getSitemapHealth`, `resubmitSitemap`, `recheckUrl` server fns (admin-gated).
- **Edit** `src/routes/admin_.seo.tsx` — add `<SitemapHealthCard />` next to Recent Scans; add "Open in GSC" + "Re-check" buttons to each open-event row.
- **New** `src/components/admin/seo/SitemapHealthCard.tsx` — the card UI.
- No DB migration, no new secrets, no cron changes.

## Out of scope

- Bulk "request indexing" (no API supports it for generic pages).
- Automatic sitemap resubmission on route changes.
- Redesigning the SEO page.
- Any change to the scan cadence or event classification.

## Explanation for you (non-technical)

The panel proves Google is fetching your sitemap and shows when it last did. The per-row button jumps straight into Google's own indexing tool for that URL — that's the only supported way to nudge Google to look at a specific page sooner. Everything else on this screen (28 warnings) will resolve on its own as Google works through the site; the panel just gives you visibility while it does.
