#!/usr/bin/env node
/**
 * Compares nav/footer links against existing route files.
 * - Flags links pointing to routes that don't exist (broken).
 * - Flags public route files that aren't linked from any nav/footer (orphans).
 *
 * Usage: node scripts/check-nav-links.mjs
 * Exits 1 if any broken links are found (orphans are warnings only).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const ROUTES_DIR = join(ROOT, "src/routes");

// Files whose link `to="..."` props define the public-facing navigation.
const NAV_SOURCES = [
  "src/components/public/PublicHeader.tsx",
  "src/components/public/PublicFooter.tsx",
  "src/components/public/nav-config.ts",
];

// Public route prefixes that SHOULD appear in nav/footer. Routes outside
// these are considered "private" and excluded from the orphan check.
const PRIVATE_PREFIXES = [
  "/admin", "/dashboard", "/portal", "/pro/", "/api",
  "/login", "/signup", "/logout", "/forgot-password", "/reset-password",
  "/verify-email", "/accept-invite", "/unsubscribe",
  "/in/", "/professions/", "/resources/", // dynamic / programmatic
  "/email", "/lovable", // internal email infra / lovable routes
];

// Routes intentionally not in nav (allowlist).
const ORPHAN_ALLOWLIST = new Set([
  "/", // home — linked via logo
  "/home-legacy", // legacy preview
  "/find-a-professional", // linked via header CTA
  "/pro/$slug", "/pro/$slug/enquire", // dynamic
  "/in/$location", "/professions/$profession",
  "/resources", "/resources/$slug",
  "/email", "/lovable",
]);

function walkRoutes(dir, prefix = "") {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkRoutes(full, prefix + "/" + entry));
      continue;
    }
    if (!/\.tsx?$/.test(entry)) continue;
    if (entry === "__root.tsx" || entry === "README.md") continue;
    const base = entry.replace(/\.tsx?$/, "");
    // dot-segmented filename -> URL
    let path = base
      .replace(/_\./g, "/") // admin_.cpd -> admin/cpd
      .replace(/\./g, "/");
    if (path === "index") path = "";
    path = path.replace(/\/index$/, ""); // resources/index -> resources
    out.push(("/" + (prefix.replace(/^\//, "") + "/" + path)).replace(/\/+/g, "/").replace(/\/$/, "") || "/");
  }
  return out;
}

function isPrivate(route) {
  return PRIVATE_PREFIXES.some((p) => route === p || route.startsWith(p));
}

function extractLinks(src) {
  const links = new Set();
  // to="/foo" or to='/foo' or to={"/foo"}
  const re = /\bto\s*=\s*(?:\{?\s*["'`])(\/[^"'`]*)["'`]/g;
  let m;
  while ((m = re.exec(src))) {
    const raw = m[1].split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
    links.add(raw);
  }
  // Also catch `href: "/foo"` patterns in nav-config arrays.
  const re2 = /\b(?:href|to|path|url)\s*:\s*["'`](\/[^"'`]+)["'`]/g;
  while ((m = re2.exec(src))) {
    const raw = m[1].split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
    links.add(raw);
  }
  return links;
}

function normalizeLinkToRoute(link) {
  // Map a concrete link like /pro/jane to dynamic /pro/$slug if needed.
  if (/^\/pro\/[^/]+\/enquire$/.test(link)) return "/pro/$slug/enquire";
  if (/^\/pro\/[^/]+$/.test(link)) return "/pro/$slug";
  if (/^\/in\/[^/]+$/.test(link)) return "/in/$location";
  if (/^\/professions\/[^/]+$/.test(link)) return "/professions/$profession";
  if (/^\/resources\/[^/]+$/.test(link)) return "/resources/$slug";
  return link;
}

const routes = new Set(walkRoutes(ROUTES_DIR));

const allLinks = new Set();
for (const f of NAV_SOURCES) {
  const p = join(ROOT, f);
  try {
    const src = readFileSync(p, "utf8");
    for (const l of extractLinks(src)) allLinks.add(l);
  } catch {
    console.warn("skip (not found):", f);
  }
}

const broken = [];
const linkedRoutes = new Set();
for (const link of allLinks) {
  const r = normalizeLinkToRoute(link);
  if (routes.has(r)) {
    linkedRoutes.add(r);
  } else {
    broken.push(link);
  }
}

const orphans = [];
for (const r of routes) {
  if (isPrivate(r)) continue;
  if (ORPHAN_ALLOWLIST.has(r)) continue;
  if (!linkedRoutes.has(r)) orphans.push(r);
}

const fmt = (arr) => arr.sort().map((x) => "  - " + x).join("\n");

console.log("Nav/Footer link audit");
console.log("=====================");
console.log(`Routes found: ${routes.size}`);
console.log(`Links found:  ${allLinks.size}`);
console.log("");

if (broken.length) {
  console.log(`❌ Broken links (${broken.length}) — point to non-existent routes:`);
  console.log(fmt(broken));
  console.log("");
} else {
  console.log("✅ No broken links.");
}

if (orphans.length) {
  console.log(`⚠️  Orphan public routes (${orphans.length}) — exist but not linked from nav/footer:`);
  console.log(fmt(orphans));
  console.log("(Add to nav, footer, or ORPHAN_ALLOWLIST if intentional.)");
} else {
  console.log("✅ No orphan public routes.");
}

process.exit(broken.length ? 1 : 0);
