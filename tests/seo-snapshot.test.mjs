// Automated SEO snapshot test.
//
// Fetches a curated set of high-value pages from the running dev server
// (http://localhost:8080) and asserts that the SSR HTML contains:
//   - a non-default <title> matching an expected substring
//   - a <meta name="description"> with reasonable length
//   - a <link rel="canonical"> resolving to the page's own URL
//   - at least one <script type="application/ld+json"> with @context
//
// Run with:  node --test tests/seo-snapshot.test.mjs
// (or `bun run test:seo` once the npm script is wired)
//
// Requires the dev server already listening on :8080.

import { test } from "node:test";
import assert from "node:assert/strict";

const ORIGIN = process.env.SEO_TEST_ORIGIN ?? "http://localhost:8080";
const SITE = "https://repsuk.org";

/**
 * Each case = one URL we ship to crawlers / share targets. `titleIncludes`
 * is a case-insensitive substring assert (kept loose so copy tweaks don't
 * fail the test). `canonicalPath` defaults to the page path itself; canonical
 * may be absolute (https://repsuk.org/...) or relative (/...) — both pass.
 */
const PAGES = [
  { path: "/pricing", titleIncludes: "pricing" },
  { path: "/about", titleIncludes: "about" },
  { path: "/for-professionals", titleIncludes: "professional" },
  { path: "/features/shop-front", titleIncludes: "website" },
  { path: "/in/london/personal-trainer", titleIncludes: "london" },
  { path: "/professions/personal-trainer", titleIncludes: "personal trainer" },
];

const FORBIDDEN_TITLES = [
  "lovable app",
  "lovable generated project",
  "vite + react",
  "react app",
];

async function fetchHtml(path) {
  const res = await fetch(`${ORIGIN}${path}`, {
    headers: { "user-agent": "Mozilla/5.0 (seo-snapshot-test)" },
  });
  assert.equal(res.status, 200, `${path} returned HTTP ${res.status}`);
  const html = await res.text();
  assert.ok(html.length > 1000, `${path} SSR HTML suspiciously small (${html.length} bytes)`);
  return html;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

function extractMetaDescription(html) {
  // meta tags can be in any attribute order; match both name="..." content="..."
  // and content="..." name="...".
  const re = /<meta\b[^>]*?\bname=["']description["'][^>]*?\bcontent=["']([^"']*)["'][^>]*?>/i;
  const re2 = /<meta\b[^>]*?\bcontent=["']([^"']*)["'][^>]*?\bname=["']description["'][^>]*?>/i;
  return (html.match(re)?.[1] ?? html.match(re2)?.[1] ?? null);
}

function extractCanonical(html) {
  const re = /<link\b[^>]*?\brel=["']canonical["'][^>]*?\bhref=["']([^"']+)["']/i;
  const re2 = /<link\b[^>]*?\bhref=["']([^"']+)["'][^>]*?\brel=["']canonical["']/i;
  return html.match(re)?.[1] ?? html.match(re2)?.[1] ?? null;
}

function hasJsonLd(html) {
  // SSR escapes attribute quotes; match the type token and the @context marker.
  return /application\/ld\+json/i.test(html) && /@context/.test(html);
}

for (const page of PAGES) {
  test(`SEO snapshot — ${page.path}`, async () => {
    const html = await fetchHtml(page.path);

    const title = extractTitle(html);
    assert.ok(title, `${page.path}: missing <title>`);
    assert.ok(
      title.length >= 10 && title.length <= 70,
      `${page.path}: title length ${title.length} outside 10..70 ("${title}")`,
    );
    assert.ok(
      title.toLowerCase().includes(page.titleIncludes.toLowerCase()),
      `${page.path}: title "${title}" missing expected substring "${page.titleIncludes}"`,
    );
    for (const bad of FORBIDDEN_TITLES) {
      assert.ok(
        !title.toLowerCase().includes(bad),
        `${page.path}: title contains forbidden placeholder "${bad}"`,
      );
    }

    const desc = extractMetaDescription(html);
    assert.ok(desc, `${page.path}: missing <meta name="description">`);
    assert.ok(
      desc.length >= 50 && desc.length <= 200,
      `${page.path}: description length ${desc.length} outside 50..200`,
    );

    const canonical = extractCanonical(html);
    assert.ok(canonical, `${page.path}: missing <link rel="canonical">`);
    const expectedAbs = `${SITE}${page.path}`;
    assert.ok(
      canonical === expectedAbs || canonical === page.path,
      `${page.path}: canonical "${canonical}" did not match "${expectedAbs}" or "${page.path}"`,
    );

    assert.ok(
      hasJsonLd(html),
      `${page.path}: no application/ld+json with @context found in SSR HTML`,
    );
  });
}
