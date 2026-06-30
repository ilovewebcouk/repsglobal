/**
 * Legacy 301 redirect rescue.
 *
 * Source-of-truth: the `public.legacy_redirects` table, populated from the
 * Brilliant Directories CSV export. Each row maps an OLD legacy URL path to
 * either another legacy path (a BD internal rewrite, e.g. postcode change)
 * or to a current resource on the new site.
 *
 * Server fns:
 *  - `importLegacyRedirectsCsv` — admin-only; ingests CSV, normalises, chains.
 *  - `resolveLegacyPath`         — public; called by `/$` catch-all.
 *  - `getLegacyCoverageStats`    — admin-only; coverage dashboard.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LEGACY_TYPES = [
  "exercise-professional",
  "training-provider",
  "business-partner",
  "awarding-organisation",
] as const;
type LegacyKind = (typeof LEGACY_TYPES)[number] | "other";

// ─── Normalisation helpers (pure) ────────────────────────────────────────────

/**
 * Strip protocol/host/query/hash, decode, lowercase, collapse slashes.
 * Returns a canonical path beginning with "/" or "" for empty input.
 */
export function normalisePath(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = String(raw).trim();
  if (!s) return "";
  // Strip protocol+host (legacy.repsuk.org, www.repsuk.org, repsuk.org)
  s = s.replace(/^https?:\/\/[^/]+/i, "");
  // Strip query + hash
  s = s.split("?")[0]!.split("#")[0]!;
  // Decode (best-effort)
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep s */
  }
  // Lowercase
  s = s.toLowerCase();
  // Strip trailing slash (except root)
  if (s.length > 1) s = s.replace(/\/+$/, "");
  // Collapse multiple slashes
  s = s.replace(/\/{2,}/g, "/");
  // Ensure leading slash
  if (s && !s.startsWith("/")) s = "/" + s;
  return s;
}

/** Pull the legacy "kind" + slug from a path like /united-kingdom/.../exercise-professional/{slug}. */
export function classifyLegacyPath(path: string): { kind: LegacyKind; slug: string | null } {
  const segs = path.split("/").filter(Boolean);
  if (segs.length < 2) return { kind: "other", slug: null };
  // Type is always second-to-last
  const type = segs[segs.length - 2]!;
  const slug = segs[segs.length - 1]!;
  if ((LEGACY_TYPES as readonly string[]).includes(type)) {
    return { kind: type as LegacyKind, slug };
  }
  return { kind: "other", slug: null };
}

/** Generate fuzzy slug candidates for matching against `professionals.slug`. */
export function slugCandidates(raw: string): string[] {
  const candidates = new Set<string>();
  const base = raw.toLowerCase();
  candidates.add(base);
  // Strip accents
  const stripped = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  candidates.add(stripped);
  // Apostrophe → dash, then collapse
  candidates.add(stripped.replace(/['’`]/g, "-").replace(/-{2,}/g, "-"));
  // Apostrophe → drop
  candidates.add(stripped.replace(/['’`]/g, "").replace(/-{2,}/g, "-"));
  return Array.from(candidates).filter(Boolean);
}

// ─── Importer (admin only) ───────────────────────────────────────────────────

const ImportRow = z.object({
  source: z.string().min(1).max(800),
  destination: z.string().min(1).max(800),
});
const ImportInput = z.object({
  rows: z.array(ImportRow).min(1).max(50000),
  replace: z.boolean().default(true),
});

export const importLegacyRedirectsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ImportInput.parse(d))
  .handler(async ({ data, context }) => {
    // Authorize: caller must be admin
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Normalise + dedupe by source path
    const byPath = new Map<string, { source_path: string; destination_path: string; kind: LegacyKind }>();
    let dropped = 0;
    for (const row of data.rows) {
      const source = normalisePath(row.source);
      const destination = normalisePath(row.destination);
      if (!source || !destination || source === destination) {
        dropped++;
        continue;
      }
      const { kind } = classifyLegacyPath(source);
      byPath.set(source, { source_path: source, destination_path: destination, kind });
    }

    const rows = Array.from(byPath.values());

    if (data.replace) {
      // Hard reset
      await supabaseAdmin.from("legacy_redirects").delete().neq("source_path", "__never__");
    }

    // Chunked upsert
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const { error } = await supabaseAdmin
        .from("legacy_redirects")
        .upsert(slice, { onConflict: "source_path" });
      if (error) throw new Error(`Upsert failed at row ${i}: ${error.message}`);
    }

    // Chain-resolve every row: follow source→destination hops (cap 5) and
    // compute the terminal_path + resolved_to_slug.
    const { data: all } = await supabaseAdmin
      .from("legacy_redirects")
      .select("source_path, destination_path");
    const map = new Map<string, string>();
    for (const r of all ?? []) map.set(r.source_path, r.destination_path);

    // Build slug → exists lookup from professionals
    const { data: pros } = await supabaseAdmin
      .from("professionals")
      .select("slug")
      .not("slug", "is", null);
    const proSlugs = new Set<string>();
    for (const p of pros ?? []) if (p.slug) proSlugs.add(p.slug.toLowerCase());

    const updates: Array<{
      source_path: string;
      destination_path: string;
      terminal_path: string;
      resolved_to_slug: string | null;
    }> = [];
    for (const r of all ?? []) {
      let cur = r.destination_path;
      const seen = new Set<string>([r.source_path]);
      for (let hop = 0; hop < 5; hop++) {
        if (seen.has(cur)) break;
        seen.add(cur);
        const next = map.get(cur);
        if (!next) break;
        cur = next;
      }
      const { kind, slug } = classifyLegacyPath(cur);
      let resolved: string | null = null;
      if (kind === "exercise-professional" && slug) {
        const cands = slugCandidates(slug);
        for (const c of cands) {
          if (proSlugs.has(c)) {
            resolved = c;
            break;
          }
        }
      }
      updates.push({
        source_path: r.source_path,
        destination_path: r.destination_path,
        terminal_path: cur,
        resolved_to_slug: resolved,
      });
    }

    for (let i = 0; i < updates.length; i += CHUNK) {
      const slice = updates.slice(i, i + CHUNK);
      const { error } = await supabaseAdmin
        .from("legacy_redirects")
        .upsert(slice, { onConflict: "source_path" });
      if (error) throw new Error(`Chain-resolve upsert failed at row ${i}: ${error.message}`);
    }

    return {
      ok: true as const,
      imported: rows.length,
      dropped,
      resolved: updates.filter((u) => u.resolved_to_slug).length,
    };
  });

// ─── Public resolver (called from /$) ────────────────────────────────────────

export type LegacyResolution =
  | { action: "redirect"; toSlug: string; toPath?: never }
  | { action: "redirect"; toPath: string; toSlug?: never }
  | { action: "gone"; reason: string }
  | { action: "miss" };

const ResolveInput = z.object({ path: z.string().min(1).max(800) });

const CURATED_LEGACY_BLOG_REDIRECTS: Record<string, string> = {
  "the-register-of-exercise-professionals-reps-relaunched-to-support-fitness-professionals-to-grow-and-succeed":
    "/resources/behind-the-scenes-how-we-built-the-public-register",
  // Consumer guides
  "how-to-become-a-personal-trainer-a-beginners-guide": "/resources/choosing-level-4-specialism",
  "how-to-choose-a-personal-trainer": "/resources/choosing-the-right-personal-trainer",
  "how-to-find-a-personal-trainer": "/resources/choosing-the-right-personal-trainer",
  "personal-trainer-cost-uk": "/resources/personal-trainer-cost-uk-2026",
  "how-much-does-a-personal-trainer-cost": "/resources/personal-trainer-cost-uk-2026",
  "online-vs-in-person-personal-training": "/resources/online-vs-in-person-coaching",
  "what-to-expect-from-your-first-pt-session": "/resources/what-to-expect-first-pt-session",
  "red-flags-when-hiring-a-personal-trainer": "/resources/red-flags-hiring-personal-trainer",
  "why-insurance-matters-for-fitness-professionals": "/resources/why-insurance-matters-fitness-coach",
  "recognised-vs-unrecognised-fitness-qualifications": "/resources/recognised-vs-unrecognised-qualifications",
  "what-reps-verified-means": "/resources/what-reps-verified-actually-means",
  "how-reps-verifies-fitness-professionals": "/resources/how-reps-verifies-a-fitness-professional",
  // Pro / business guides
  "how-to-grow-your-personal-training-business": "/resources/grow-your-pt-business-in-2026",
  "how-to-price-personal-training-sessions": "/resources/how-to-price-12-week-programme",
};

function legacyBlogSlug(path: string): string | null {
  for (const prefix of ["/reps/blog/", "/blog/"] as const) {
    if (path.startsWith(prefix)) return path.slice(prefix.length).split("/")[0] || null;
  }
  return null;
}

async function markGoneStatus() {
  try {
    const { setResponseStatus } = await import("@tanstack/react-start/server");
    setResponseStatus(410);
  } catch {
    /* client navigation — status not applicable */
  }
}

export const resolveLegacyPath = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => ResolveInput.parse(d))
  .handler(async ({ data }): Promise<LegacyResolution> => {
    const path = normalisePath(data.path);
    if (!path) return { action: "miss" };

    const blogSlug = legacyBlogSlug(path);
    if (blogSlug) {
      const toPath = CURATED_LEGACY_BLOG_REDIRECTS[blogSlug];
      if (toPath) return { action: "redirect", toPath };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Direct table hit
    const { data: row } = await supabaseAdmin
      .from("legacy_redirects")
      .select("destination_path, terminal_path, resolved_to_slug")
      .eq("source_path", path)
      .maybeSingle();

    if (row) {
      if (row.resolved_to_slug) {
        return { action: "redirect", toSlug: row.resolved_to_slug };
      }
      // Terminal known but no live pro → 410 Gone (server-side only)
      const terminal = row.terminal_path || row.destination_path;
      const { kind } = classifyLegacyPath(terminal);
      await markGoneStatus();
      return {
        action: "gone",
        reason: kind === "exercise-professional" ? "pro-not-migrated" : `type-not-migrated:${kind}`,
      };
    }

    if (blogSlug) {
      await markGoneStatus();
      return { action: "gone", reason: "legacy-blog-not-migrated" };
    }

    // No table row — fallback: try direct slug match for exercise-professional shape
    const { kind, slug } = classifyLegacyPath(path);
    if (kind !== "exercise-professional" || !slug) {
      if (kind !== "other") return { action: "gone", reason: `type-not-migrated:${kind}` };
      return { action: "miss" };
    }

    const cands = slugCandidates(slug);
    const { data: pro } = await supabaseAdmin
      .from("professionals")
      .select("slug")
      .in("slug", cands)
      .limit(1)
      .maybeSingle();

    if (pro?.slug) return { action: "redirect", toSlug: pro.slug };
    await markGoneStatus();
    return { action: "gone", reason: "pro-not-migrated" };
  });

// ─── Coverage stats (admin only) ─────────────────────────────────────────────

export const getLegacyCoverageStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ count: total }, { count: resolved }, { data: byKindRows }, { data: latest }] = await Promise.all([
      supabaseAdmin.from("legacy_redirects").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("legacy_redirects")
        .select("*", { count: "exact", head: true })
        .not("resolved_to_slug", "is", null),
      supabaseAdmin.from("legacy_redirects").select("kind"),
      supabaseAdmin
        .from("legacy_redirects")
        .select("imported_at")
        .order("imported_at", { ascending: false })
        .limit(1),
    ]);

    const byKind: Record<string, number> = {};
    for (const r of byKindRows ?? []) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;

    return {
      total: total ?? 0,
      resolved: resolved ?? 0,
      gone: (total ?? 0) - (resolved ?? 0),
      byKind,
      lastImportedAt: latest?.[0]?.imported_at ?? null,
    };
  });
