// Server-only helpers for cross-checking a qualification against the public
// Ofqual register. Uses a Postgres-backed 7-day cache to avoid hammering
// gov.uk on every submission view.

import { OFQUAL_QUAL_NO_REGEX } from "./awarding-bodies";

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

async function fetchFromOfqual(qualNo: string): Promise<OfqualRecord | null> {
  // The Ofqual register exposes a public JSON API.
  const url = `https://register.ofqual.gov.uk/api/v2/Qualifications/${encodeURIComponent(qualNo)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    return {
      qualificationNumber: qualNo,
      title: (json.Title as string | undefined) ?? (json.title as string | undefined) ?? null,
      awardingOrganisation:
        (json.OrganisationName as string | undefined) ??
        (json.awardingOrganisation as string | undefined) ??
        null,
      level: (json.Level as string | undefined) ?? (json.level as string | undefined) ?? null,
      status: (json.OperationalStatus as string | undefined) ?? (json.status as string | undefined) ?? null,
      raw: json,
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
  submission: { awardingBody?: string | null; qualification?: string | null } = {},
): Promise<OfqualLookupResult> {
  const qualNo = qualNoRaw.trim().toUpperCase();
  if (!OFQUAL_QUAL_NO_REGEX.test(qualNo)) {
    return { found: false, record: null };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Read cache
  const { data: cached } = await supabaseAdmin
    .from("ofqual_cache")
    .select("record, found, fetched_at")
    .eq("qualification_number", qualNo)
    .maybeSingle();

  let record: OfqualRecord | null = null;
  let found = false;

  const stale =
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

  const awardingBodyMatch =
    !!submission.awardingBody &&
    !!record.awardingOrganisation &&
    (normalise(submission.awardingBody).includes(normalise(record.awardingOrganisation)) ||
      normalise(record.awardingOrganisation).includes(normalise(submission.awardingBody)));

  const titleMatch =
    !!submission.qualification && !!record.title && titleSimilarity(submission.qualification, record.title) >= 0.5;

  const isLive =
    !record.status || /live|available|active|operational/i.test(record.status);

  return {
    found,
    record,
    matches: { awardingBody: awardingBodyMatch, title: titleMatch, isLive },
  };
}
