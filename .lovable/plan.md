## Brutal honest read on what's happening

Your analytics for the last 7 days:
- **32,191 of 32,830 visits are from CN** (98%), almost all desktop, almost all hitting `/reviews`.
- Today alone: 31,481 visits, bounce rate 100%, session duration 2.78s, 1.01 pages/visit.
- Real human signal in the same window is tiny (UK 245, US 300, a handful of Stripe/Instagram referrers).

That is a scraper farm, not real visitors. The "449 current visitors" number is bots. None of this is hurting Stripe, auth or the DB — they're hitting a static marketing page — but it's polluting analytics and burning bandwidth.

There is **no way to make bots impossible** on a public website. Anything we ship is a deterrent, not a wall. With that said, here's the layered fix I'd put in.

## What I'll build

### 1. Edge bot filter (request middleware, runs on every request)

Add `src/lib/bot-filter.ts` + a new `botFilterMiddleware` registered in `src/start.ts` *before* `errorMiddleware`. It runs on Cloudflare's edge so blocked traffic never touches React/SSR/DB.

Rules, in order:
1. **Allow-list good bots by UA** (Googlebot, Bingbot, DuckDuckBot, Applebot, FacebookExternalHit, Twitterbot, LinkedInBot, Slackbot) — return `next()`.
2. **Block obvious scraper UAs**: empty UA, `curl`, `wget`, `python-requests`, `Go-http-client`, `Scrapy`, `axios`, `node-fetch`, `HeadlessChrome`, `PhantomJS`, `Bytespider`, `PetalBot`, `SemrushBot`, `AhrefsBot`, `DotBot`, `MJ12bot`, `DataForSeoBot`, `ClaudeBot` (configurable allow-list later). Return **403** with `cache-control: public, max-age=86400` so Cloudflare caches the block.
3. **Geo throttle on marketing routes only** (`/reviews`, `/`, `/in/*`, `/professions/*`, `/compare*`, `/features/*`): if `cf-ipcountry` is in a high-abuse list (default: `CN`, `RU`, `KP`) AND the UA is not in the good-bot allow-list, return 403. Auth, dashboard, `/api/*`, and Stripe return paths are exempt so legit users in those countries can still sign in.
4. **Per-IP rate limit** on `/reviews` and other heavy marketing pages: max 30 req/min per `cf-connecting-ip`, enforced in-memory per worker isolate (good enough to break a single-IP scraper; not a true distributed limit — backend has no rate-limit primitive yet, per project rules).

All three lists live in one config object at the top of `bot-filter.ts` so you can edit them in one place.

### 2. robots.txt tightening

Update `public/robots.txt`:
```
User-agent: Googlebot
Allow: /
User-agent: Bingbot
Allow: /
User-agent: DuckDuckBot
Allow: /
User-agent: Applebot
Allow: /

User-agent: Bytespider
Disallow: /
User-agent: PetalBot
Disallow: /
User-agent: ClaudeBot
Disallow: /
User-agent: GPTBot
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: AhrefsBot
Disallow: /
User-agent: SemrushBot
Disallow: /
User-agent: MJ12bot
Disallow: /
User-agent: DotBot
Disallow: /
User-agent: DataForSeoBot
Disallow: /

User-agent: *
Allow: /
Crawl-delay: 5

Sitemap: https://repsuk.org/sitemap.xml
```
(Polite scrapers honour this. The CN farm won't — that's what step 1 is for.)

### 3. Stop analytics double-counting bots that slip through

The middleware sets a response header `x-bot-blocked: 1` on rejections and Lovable analytics only counts 200s, so blocked traffic stops inflating the dashboard immediately.

## What I'm NOT doing (and why)

- **No Cloudflare Turnstile / hCaptcha on `/reviews`.** It's a public marketing page; gating it would tank SEO and real conversions. Save captcha for `/auth` and the enquire form if abuse moves there.
- **No country block on auth / dashboard / API.** Some of your real users (and Stripe webhooks) need global access.
- **No DB-backed rate limit.** Project rule: "backend does not have a standard rate-limiting primitive." In-memory per-isolate limit is the honest compromise.
- **No changes to `/reviews` content or SEO.** Page stays indexable for Google/Bing.

## Stronger options if this keeps happening

If the scraper rotates UA + IP and gets past the above, the real fix is to put **your custom domain `repsuk.org` behind your own Cloudflare account** and turn on Bot Fight Mode + a CN geo rule in the WAF. I can't do that from inside the app — it's a 10-minute DNS + dashboard change on your side. I'll flag it in the closing message with the exact steps if you want.

## Files

- **New**: `src/lib/bot-filter.ts`
- **Edit**: `src/start.ts` (register middleware before `errorMiddleware`)
- **Edit**: `public/robots.txt`

## Verify after build

1. `curl -A "python-requests/2.31" https://repsuk.org/reviews -I` → expect `403`.
2. `curl -A "Googlebot/2.1" https://repsuk.org/reviews -I` → expect `200`.
3. Normal browser load of `/reviews` from UK → expect `200`.
4. Re-check analytics over the next 24h — CN line should collapse.
