import { createMiddleware } from "@tanstack/react-start";

/**
 * Edge bot filter. Runs on every request before SSR / route handlers.
 *
 * Three layers:
 *   1. Allow-list well-known good bots (search engines, social previews).
 *   2. Block obvious scraper / abusive UAs with a cacheable 403.
 *   3. On marketing routes only, block high-abuse countries (CN, RU, KP)
 *      that aren't good bots. Auth, dashboard, API, Stripe, /lovable
 *      and webhook paths are always exempt.
 *   4. Per-IP rate limit on heavy marketing routes (in-memory, per
 *      worker isolate — not a true distributed limit, but enough to
 *      break a single-IP scraper).
 *
 * Edit the lists at the top of this file to tune. Backend has no
 * shared rate-limit primitive yet (see project rules), so the limiter
 * is intentionally simple.
 */

// --- Configuration ---------------------------------------------------------

const GOOD_BOT_UA_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /duckduckbot/i,
  /applebot/i,
  /baiduspider/i,
  /yandex(bot|images)/i,
  /facebookexternalhit/i,
  /facebookcatalog/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /discordbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /pinterest/i,
  /redditbot/i,
];

const BAD_UA_PATTERNS = [
  /^$/, // empty UA
  /\bcurl\//i,
  /\bwget\//i,
  /python-requests/i,
  /python-urllib/i,
  /aiohttp/i,
  /\bgo-http-client\b/i,
  /scrapy/i,
  /\baxios\//i,
  /node-fetch/i,
  /libwww-perl/i,
  /java\//i,
  /okhttp/i,
  /headlesschrome/i,
  /phantomjs/i,
  /puppeteer/i,
  /playwright/i,
  /bytespider/i,
  /petalbot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /dotbot/i,
  /mj12bot/i,
  /dataforseo/i,
  /claudebot/i,
  /gptbot/i,
  /ccbot/i,
  /serpstatbot/i,
  /seekport/i,
  /mauibot/i,
  /blexbot/i,
  /zoominfobot/i,
];

const HIGH_ABUSE_COUNTRIES = new Set(["CN", "RU", "KP"]);

// Paths that are NEVER blocked regardless of geo/UA, so real users in
// any country can still sign in, hit webhooks, etc.
const EXEMPT_PATH_PREFIXES = [
  "/api/",
  "/lovable/",
  "/auth",
  "/dashboard",
  "/admin",
  "/checkout",
  "/email",
  "/_build",
  "/_server",
  "/favicon",
  "/sitemap",
  "/robots",
  "/llms",
];

// Marketing surfaces that the scraper farm targets. Geo + rate limit
// only apply here.
const MARKETING_PATH_PATTERNS = [
  /^\/$/,
  /^\/reviews(\/|$)/,
  /^\/in\//,
  /^\/professions\//,
  /^\/compare/,
  /^\/features\//,
  /^\/pro\//,
  /^\/c\//,
  /^\/about/,
  /^\/pricing/,
  /^\/for-professionals/,
  /^\/specialisms/,
  /^\/find-a-professional/,
  /^\/how-it-works/,
  /^\/cpd/,
  /^\/resources/,
];

// --- Rate limiter (per worker isolate, best-effort) ------------------------

const RATE_LIMIT_MAX = 30; // requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per minute

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = buckets.get(ip);
  if (!existing || existing.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    // Opportunistic cleanup so the map doesn't grow forever.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) {
        if (v.resetAt < now) buckets.delete(k);
      }
    }
    return false;
  }
  existing.count += 1;
  return existing.count > RATE_LIMIT_MAX;
}

// --- Helpers ---------------------------------------------------------------

function isExempt(pathname: string): boolean {
  return EXEMPT_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATH_PATTERNS.some((re) => re.test(pathname));
}

function isGoodBot(ua: string): boolean {
  return GOOD_BOT_UA_PATTERNS.some((re) => re.test(ua));
}

function isBadUA(ua: string): boolean {
  return BAD_UA_PATTERNS.some((re) => re.test(ua));
}

function blockedResponse(reason: string): Response {
  return new Response("Forbidden", {
    status: 403,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-bot-blocked": reason,
      // Let Cloudflare cache the block so repeat scraper hits don't
      // even reach the worker.
      "cache-control": "public, max-age=86400",
    },
  });
}

function tooManyResponse(): Response {
  return new Response("Too Many Requests", {
    status: 429,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-bot-blocked": "rate-limit",
      "retry-after": "60",
    },
  });
}

// --- Middleware ------------------------------------------------------------

export const botFilterMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (isExempt(pathname)) {
      return next();
    }

    const ua = request.headers.get("user-agent") ?? "";

    // 1. Good bots always allowed.
    if (isGoodBot(ua)) {
      return next();
    }

    // 2. Block obvious scraper UAs everywhere.
    if (isBadUA(ua)) {
      return blockedResponse("ua");
    }

    // 3. Global geo block — high-abuse countries (CN/RU/KP) are blocked on
    //    every non-exempt path, not just marketing. /api, /auth, /dashboard,
    //    /admin, webhooks etc. are already exempted above.
    const country = (
      request.headers.get("cf-ipcountry") ??
      request.headers.get("x-vercel-ip-country") ??
      ""
    ).toUpperCase();

    if (country && HIGH_ABUSE_COUNTRIES.has(country)) {
      return blockedResponse("geo");
    }

    // 4. Marketing-only rate limit.
    if (isMarketingPath(pathname)) {
      const ip =
        request.headers.get("cf-connecting-ip") ??
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "";

      if (ip && rateLimited(ip)) {
        return tooManyResponse();
      }
    }

    return next();
  },
);
