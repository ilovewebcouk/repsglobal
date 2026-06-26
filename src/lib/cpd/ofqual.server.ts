// Server-only helpers for cross-checking a qualification against the public
// Ofqual register. Uses a Postgres-backed 7-day cache to avoid hammering
// gov.uk on every submission view.

import { OFQUAL_QUAL_NO_REGEX, matchesAwardingBody } from "./awarding-bodies";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type OfqualRecord = {
  qualificationNumber: string;
  title: string | null;
  awardingOrganisation: string | null;
  level: string | null;
  status: string | null;
  // The raw response shape varies — we keep the full object for the admin reviewer.
  raw: unknown;
};

export type OfqualLookupResult = {
  found: boolean;
  record: OfqualRecord | null;
  // Match scoring against the pro's submission
  matches?: {
    awardingBody: boolean;
    title: boolean;
    isLive: boolean;
  };
};

function normalise(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function titleSimilarity(a: string, b: string): number {
  const A = new Set(normalise(a).split(" ").filter((w) => w.length > 2));
  const B = new Set(normalise(b).split(" ").filter((w) => w.length > 2));
  if (A.size === 0 || B.size === 0) return 0;
  let hits = 0;
  for (const w of A) if (B.has(w)) hits++;
  return hits / Math.max(A.size, B.size);
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchFromOfqual(qualNo: string): Promise<OfqualRecord | null> {
  // The legacy register.ofqual.gov.uk JSON API was decommissioned (now 301s to gov.uk).
  // The current public surface is the HTML page on find-a-qualification.services.ofqual.gov.uk
  // keyed by the qualification number with slashes stripped (e.g. 601/3866/X -> 6013866X).
  const slug = qualNo.replace(/\//g, "");
  const url = `https://find-a-qualification.services.ofqual.gov.uk/qualifications/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "text/html", "User-Agent": "REPs-Verification/1.0 (+https://repsuk.org)" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const html = await res.text();

    // Title lives in the first <h1>.
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const title = h1 ? stripHtml(h1[1]) : null;

    // Detail rows render as <dt>Label</dt><dd>Value</dd>. Extract into a map.
    const fields: Record<string, string> = {};
    const re = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const k = stripHtml(m[1]).toLowerCase();
      const v = stripHtml(m[2]);
      if (k) fields[k] = v;
    }

    // Confirm we actually landed on the qual page (defends against HTML error pages).
    const qnOnPage = fields["qualification number"];
    if (!qnOnPage || qnOnPage.replace(/\//g, "").toUpperCase() !== slug.toUpperCase()) {
      return null;
    }

    return {
      qualificationNumber: qualNo,
      title,
      awardingOrganisation: fields["awarding organisation"] ?? null,
      level: fields["qualification level"] ?? null,
      status: fields["status"] ?? null,
      raw: { source: "find-a-qualification.services.ofqual.gov.uk", url, fields, title },
    };
  } catch {
    return null;
  }
}


/**
 * Look up an Ofqual qualification number. Reads from cache first, falls back
 * to a live fetch on miss or stale entry, then writes the result back to cache.
 * Never throws — Ofqual API issues should never block a submission.
 */
export async function lookupOfqualQualification(
  qualNoRaw: string,
  submission: {
    awardingBody?: string | null;
    awardingBodySlug?: string | null;
    qualification?: string | null;
  } = {},
  options: { force?: boolean } = {},
): Promise<OfqualLookupResult> {
  const qualNo = qualNoRaw.trim().toUpperCase();
  if (!OFQUAL_QUAL_NO_REGEX.test(qualNo)) {
    return { found: false, record: null };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Read cache (skipped on force)
  const { data: cached } = options.force
    ? { data: null as unknown as { record: OfqualRecord | null; found: boolean; fetched_at: string } | null }
    : await supabaseAdmin
        .from("ofqual_cache")
        .select("record, found, fetched_at")
        .eq("qualification_number", qualNo)
        .maybeSingle();

  let record: OfqualRecord | null = null;
  let found = false;

  const stale =
    options.force ||
    !cached ||
    Date.now() - new Date((cached as { fetched_at: string }).fetched_at).getTime() > CACHE_TTL_MS;

  if (cached && !stale) {
    found = Boolean((cached as { found: boolean }).found);
    record = (cached as { record: OfqualRecord | null }).record;
  } else {
    record = await fetchFromOfqual(qualNo);
    found = record !== null;
    // Best-effort cache write
    await supabaseAdmin
      .from("ofqual_cache")
      .upsert(
        {
          qualification_number: qualNo,
          record: record as unknown as never,
          found,
          fetched_at: new Date().toISOString(),
        } as never,
        { onConflict: "qualification_number" },
      );
  }

  if (!record) return { found: false, record: null };

  const awardingBodyMatch = matchesAwardingBody(record.awardingOrganisation, {
    slug: submission.awardingBodySlug ?? null,
    name: submission.awardingBody ?? null,
  });

  const titleMatch =
    !!submission.qualification && !!record.title && titleSimilarity(submission.qualification, record.title) >= 0.6;

  // "Live" for our purposes means the qualification exists on the register and
  // wasn't withdrawn before certification — historic statuses like "No longer
  // awarded" are still valid evidence that a learner earned it during its
  // operational window. Only flag genuinely invalid states.
  const isLive =
    !record.status || !/withdrawn|removed|expired|invalid/i.test(record.status);


  return {
    found,
    record,
    matches: { awardingBody: awardingBodyMatch, title: titleMatch, isLive },
  };
}
