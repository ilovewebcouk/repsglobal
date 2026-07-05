/**
 * SEO index monitor — core scan logic (server-only).
 *
 * Pulls per-URL indexing state from the Google Search Console URL Inspection
 * API for URLs in the project's public sitemap, diffs against the last
 * snapshot, and records change events.
 *
 * Scheduling: called from `/api/public/cron/seo-index-scan` once a day.
 * Priority A URLs (marketing spine) are checked on every run. Priority B
 * URLs (long-tail: pros, city×profession, help articles) rotate through in
 * daily slices so the full site cycles roughly every 5 days without
 * blowing past GSC's 2,000/day per-property quota.
 *
 * Never imported at module scope from client-reachable code (routes / server
 * fn modules) — this file loads `supabaseAdmin`.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SITE_URL = "https://repsuk.org/";
const SITEMAP_URL = "https://repsuk.org/sitemap.xml";
const GSC_GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const B_SLICE_SIZE = 200; // daily rotating slice size
const REQUEST_SPACING_MS = 120; // stay under 600/min

// --------------------------------------------------------------------------
// URL classification
// --------------------------------------------------------------------------

/** Priority A = high-value marketing spine, checked every run. */
const PRIORITY_A_PATH_PREFIXES = [
  "/", // homepage (exact match handled below too)
  "/about",
  "/how-it-works",
  "/find-a-professional",
  "/for-professionals",
  "/pricing",
  "/standards",
  "/cpd",
  "/specialisms",
  "/resources",
  "/compare",
  "/comparison-methodology",
  "/features/",
  "/reviews",
  "/help",
  "/contact",
  "/privacy",
  "/terms",
  "/cookies",
  "/professions/",
  "/in/", // both city-only (/in/london) and city×profession (/in/london/personal-trainer)
];

function classifyPriority(url: string): "A" | "B" {
  const path = new URL(url).pathname;
  if (path === "/") return "A";

  // City-only pages (/in/london) are A; city×profession (/in/london/personal-trainer) is B.
  if (path.startsWith("/in/")) {
    const segments = path.split("/").filter(Boolean); // ["in","london"] or ["in","london","personal-trainer"]
    return segments.length === 2 ? "A" : "B";
  }

  // Profession hubs (/professions/personal-trainer) are A.
  if (path.startsWith("/professions/")) return "A";

  for (const prefix of PRIORITY_A_PATH_PREFIXES) {
    if (prefix === "/") continue;
    if (prefix.endsWith("/")) {
      // Prefix like "/features/" — match /features and /features/anything, but
      // treat top-level pages as A too.
      if (path === prefix.slice(0, -1) || path.startsWith(prefix)) return "A";
    } else if (path === prefix) {
      return "A";
    }
  }
  return "B";
}

// --------------------------------------------------------------------------
// Sitemap
// --------------------------------------------------------------------------

async function fetchSitemapUrls(): Promise<string[]> {
  const res = await fetch(SITEMAP_URL, {
    headers: { Accept: "application/xml" },
  });
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const urls: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) urls.push(m[1]!.trim());
  return urls;
}

// --------------------------------------------------------------------------
// GSC URL Inspection
// --------------------------------------------------------------------------

type InspectionSnapshot = {
  verdict: string | null;
  coverage_state: string | null;
  indexing_state: string | null;
  google_canonical: string | null;
  user_canonical: string | null;
  robots_state: string | null;
  page_fetch_state: string | null;
  last_crawl_time: string | null;
  raw: unknown;
};

async function inspectUrl(url: string): Promise<InspectionSnapshot | { error: string }> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gscKey = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
  if (!lovableKey || !gscKey) {
    return { error: "GSC connector not configured" };
  }
  const res = await fetch(`${GSC_GATEWAY}/v1/urlInspection/index:inspect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gscKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE_URL }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: `GSC ${res.status}: ${body.slice(0, 200)}` };
  }
  const json = (await res.json()) as {
    inspectionResult?: { indexStatusResult?: Record<string, unknown> };
  };
  const r = json?.inspectionResult?.indexStatusResult ?? {};
  const asStr = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    verdict: asStr(r.verdict),
    coverage_state: asStr(r.coverageState),
    indexing_state: asStr(r.indexingState),
    google_canonical: asStr(r.googleCanonical),
    user_canonical: asStr(r.userCanonical),
    robots_state: asStr(r.robotsTxtState),
    page_fetch_state: asStr(r.pageFetchState),
    last_crawl_time: asStr(r.lastCrawlTime),
    raw: r,
  };
}

// --------------------------------------------------------------------------
// Diff → event decisions
// --------------------------------------------------------------------------

type StoredRow = {
  verdict: string | null;
  coverage_state: string | null;
  indexing_state: string | null;
  google_canonical: string | null;
  user_canonical: string | null;
  robots_state: string | null;
  page_fetch_state: string | null;
};

function diffToEvent(
  prev: StoredRow | null,
  next: InspectionSnapshot,
): { severity: "error" | "warn" | "info"; summary: string } | null {
  const wasPass = prev?.verdict === "PASS";
  const nowPass = next.verdict === "PASS";

  // First-time record: only alert if not passing.
  if (!prev) {
    if (nowPass) return null;
    return {
      severity: next.verdict === "FAIL" ? "error" : "warn",
      summary: `First check: ${next.coverage_state ?? next.verdict ?? "unknown"}`,
    };
  }

  // Recovery — always worth logging as info.
  if (!wasPass && nowPass) {
    return { severity: "info", summary: `Now indexed (was: ${prev.coverage_state ?? prev.verdict})` };
  }

  // Regression — verdict got worse.
  if (wasPass && !nowPass) {
    return {
      severity: next.verdict === "FAIL" ? "error" : "warn",
      summary: `Was indexed, now: ${next.coverage_state ?? next.verdict ?? "unknown"}`,
    };
  }

  // Both non-pass: alert on state transitions (e.g. 404 → noindex).
  if (!wasPass && !nowPass && prev.coverage_state !== next.coverage_state) {
    return {
      severity: "warn",
      summary: `Coverage state changed: ${prev.coverage_state ?? "?"} → ${next.coverage_state ?? "?"}`,
    };
  }

  // Canonical mismatch appearing where none existed before.
  const hadMismatch =
    prev.google_canonical && prev.user_canonical && prev.google_canonical !== prev.user_canonical;
  const hasMismatch =
    next.google_canonical && next.user_canonical && next.google_canonical !== next.user_canonical;
  if (!hadMismatch && hasMismatch) {
    return {
      severity: "warn",
      summary: `Google picked a different canonical: ${next.google_canonical}`,
    };
  }

  // Robots blocked when previously allowed.
  const wasAllowed = prev.robots_state === "ALLOWED";
  const nowBlocked = next.robots_state && next.robots_state !== "ALLOWED";
  if (wasAllowed && nowBlocked) {
    return { severity: "error", summary: `Robots now: ${next.robots_state}` };
  }

  return null;
}

// --------------------------------------------------------------------------
// Batch selection
// --------------------------------------------------------------------------

function pickBatch(allUrls: string[], sliceIndex: number): { A: string[]; B: string[] } {
  const A: string[] = [];
  const bAll: string[] = [];
  for (const u of allUrls) {
    (classifyPriority(u) === "A" ? A : bAll).push(u);
  }
  bAll.sort(); // deterministic order for stable rotation
  const totalSlices = Math.max(1, Math.ceil(bAll.length / B_SLICE_SIZE));
  const slice = sliceIndex % totalSlices;
  const start = slice * B_SLICE_SIZE;
  const B = bAll.slice(start, start + B_SLICE_SIZE);
  return { A, B };
}

function dayOfYearUtc(d = new Date()): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86_400_000);
}

// --------------------------------------------------------------------------
// Public entrypoint
// --------------------------------------------------------------------------

export type ScanResult = {
  runId: string;
  urlsChecked: number;
  urlsChanged: number;
  errors: number;
  status: "ok" | "partial" | "failed";
  sliceIndex: number;
};

export async function runSeoIndexScan(
  opts: { batchKind?: "daily" | "manual" | "priority_a" } = {},
): Promise<ScanResult> {
  const batchKind = opts.batchKind ?? "daily";
  const { data: run, error: runErr } = await supabaseAdmin
    .from("seo_scan_runs")
    .insert({ batch_kind: batchKind })
    .select("id")
    .single();
  if (runErr || !run) throw runErr ?? new Error("failed to create scan run");
  const runId = run.id as string;

  let urlsChecked = 0;
  let urlsChanged = 0;
  let errors = 0;
  let notes: string | null = null;

  try {
    const allUrls = await fetchSitemapUrls();
    const sliceIndex = dayOfYearUtc();
    const { A, B } = pickBatch(allUrls, sliceIndex);
    const target = batchKind === "priority_a" ? A : [...A, ...B];

    for (const url of target) {
      const snap = await inspectUrl(url);
      if ("error" in snap) {
        errors++;
        // Skip storing; move on.
        await sleep(REQUEST_SPACING_MS);
        continue;
      }

      const { data: prevRow } = await supabaseAdmin
        .from("seo_index_status")
        .select(
          "verdict, coverage_state, indexing_state, google_canonical, user_canonical, robots_state, page_fetch_state",
        )
        .eq("url", url)
        .maybeSingle();

      const event = diffToEvent(prevRow as StoredRow | null, snap);
      const now = new Date().toISOString();
      const priority = classifyPriority(url);

      await supabaseAdmin.from("seo_index_status").upsert(
        {
          url,
          priority,
          last_checked_at: now,
          last_changed_at: event ? now : (prevRow ? undefined : now),
          verdict: snap.verdict,
          coverage_state: snap.coverage_state,
          indexing_state: snap.indexing_state,
          google_canonical: snap.google_canonical,
          user_canonical: snap.user_canonical,
          robots_state: snap.robots_state,
          page_fetch_state: snap.page_fetch_state,
          last_crawl_time: snap.last_crawl_time,
          raw: snap.raw,
        },
        { onConflict: "url" },
      );

      if (event) {
        urlsChanged++;
        await supabaseAdmin.from("seo_index_events").insert({
          url,
          severity: event.severity,
          summary: event.summary,
          prev: prevRow ?? null,
          next: {
            verdict: snap.verdict,
            coverage_state: snap.coverage_state,
            indexing_state: snap.indexing_state,
            google_canonical: snap.google_canonical,
            user_canonical: snap.user_canonical,
            robots_state: snap.robots_state,
            page_fetch_state: snap.page_fetch_state,
          },
        });
      }

      urlsChecked++;
      await sleep(REQUEST_SPACING_MS);
    }

    notes = `slice ${sliceIndex} of B (${B.length}); A checked=${A.length}`;
  } catch (e) {
    notes = `scan failed: ${e instanceof Error ? e.message : String(e)}`;
  }

  const status: ScanResult["status"] =
    urlsChecked === 0 ? "failed" : errors > 0 ? "partial" : "ok";

  await supabaseAdmin
    .from("seo_scan_runs")
    .update({
      finished_at: new Date().toISOString(),
      urls_checked: urlsChecked,
      urls_changed: urlsChanged,
      errors,
      status,
      notes,
    })
    .eq("id", runId);

  return { runId, urlsChecked, urlsChanged, errors, status, sliceIndex: dayOfYearUtc() };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
