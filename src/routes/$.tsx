/**
 * Legacy URL catch-all.
 *
 * Rescues SEO equity from the old repsuk.org site (now hosted at
 * legacy.repsuk.org, but still indexed by Google under the bare repsuk.org/...
 * paths). The legacy URL shape was:
 *
 *   /{country}/[{city}/[{postcode}/]]{type}/{slug}
 *
 * where `type` ∈ {exercise-professional, business-partner, training-provider,
 * awarding-organisation}.
 *
 * Logic:
 *   exercise-professional + slug matches a current pro  → 301 to /c/{slug}
 *   exercise-professional + no match                    → 410 Gone (deindex cleanly)
 *   other legacy types                                  → 410 Gone (we don't host these)
 *   anything else                                       → 404
 *
 * 410 is intentional — it tells Google "this URL is permanently gone, drop it"
 * far faster than a soft 404, and is the cleanest signal for migrated content
 * that no longer has a 1:1 mapping.
 */
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const LEGACY_TYPES = new Set([
  "exercise-professional",
  "business-partner",
  "training-provider",
  "awarding-organisation",
]);

const KNOWN_COUNTRIES = new Set([
  "united-kingdom",
  "ireland",
  "australia",
  "new-zealand",
  "united-states",
  "canada",
  "south-africa",
]);

function normaliseLegacySlug(raw: string): string[] {
  // Try several forms so apostrophes / accents from the WP URL still match
  // the new slug column (which is kebab-case ASCII).
  const candidates = new Set<string>();
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  candidates.add(raw.toLowerCase());
  candidates.add(decoded.toLowerCase());
  // Strip accents
  const stripped = decoded
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  candidates.add(stripped);
  // Apostrophe → dash (O’Donnell → o-donnell)
  candidates.add(stripped.replace(/['’`]/g, "-").replace(/-{2,}/g, "-"));
  // Drop apostrophes entirely (O’Donnell → odonnell)
  candidates.add(stripped.replace(/['’`]/g, "").replace(/-{2,}/g, "-"));
  return Array.from(candidates).filter(Boolean);
}

/**
 * Pure server fn — looks up whether ANY of the candidate slugs maps to a
 * current professional. Returns the canonical slug or null.
 */
const resolveLegacySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ candidates: z.array(z.string().min(1).max(160)).min(1).max(8) }).parse(d),
  )
  .handler(async ({ data }): Promise<string | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("professionals")
      .select("slug")
      .in("slug", data.candidates)
      .limit(1);
    return rows?.[0]?.slug ?? null;
  });

export const Route = createFileRoute("/$")({
  loader: async ({ params }) => {
    const splat = (params as { _splat?: string })._splat ?? "";
    if (!splat) throw notFound();

    const segments = splat.split("/").filter(Boolean);
    if (segments.length < 2) throw notFound();

    const country = segments[0]!.toLowerCase();
    // Find the legacy type segment (it's always the second-to-last)
    const typeIdx = segments.length - 2;
    const type = segments[typeIdx]!.toLowerCase();
    const rawSlug = segments[segments.length - 1]!;

    // Only treat as legacy when first segment looks like a country AND
    // second-to-last looks like a legacy type.
    if (!KNOWN_COUNTRIES.has(country) || !LEGACY_TYPES.has(type)) {
      throw notFound();
    }

    // Types we never migrated → permanent Gone.
    if (type !== "exercise-professional") {
      setResponseStatus(410);
      setResponseHeader("Cache-Control", "public, max-age=86400");
      return { gone: true as const, reason: "type-not-migrated" };
    }

    const candidates = normaliseLegacySlug(rawSlug);
    const matched = await resolveLegacySlug({ data: { candidates } });

    if (matched) {
      throw redirect({
        to: "/c/$slug",
        params: { slug: matched },
        statusCode: 301,
      });
    }

    // Pro existed on legacy but didn't migrate (or chose not to be public).
    setResponseStatus(410);
    setResponseHeader("Cache-Control", "public, max-age=86400");
    return { gone: true as const, reason: "pro-not-migrated" };
  },

  head: () => ({
    meta: [
      { title: "Page no longer available — REPS" },
      { name: "robots", content: "noindex,follow" },
    ],
  }),

  component: GonePage,
  notFoundComponent: () => {
    // Defer to the root not-found UI for non-legacy paths.
    throw notFound();
  },
});

function GonePage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center text-white">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
        410 · Permanently moved
      </p>
      <h1 className="mt-4 font-display text-[32px] leading-[1.1] lg:text-[44px]">
        This profile is no longer available
      </h1>
      <p className="mt-4 max-w-md text-[15px] text-white/70">
        The REPS register has been rebuilt. This professional either chose not to migrate or
        is no longer registered.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/find-a-trainer"
          className="inline-flex h-11 items-center rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
        >
          Find a trainer near you
        </a>
        <a
          href="/"
          className="inline-flex h-11 items-center rounded-[10px] border border-reps-border bg-reps-panel-soft px-5 text-[14px] font-semibold text-white/85 hover:text-white"
        >
          Home
        </a>
      </div>
    </main>
  );
}
