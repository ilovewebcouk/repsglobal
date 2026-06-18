/**
 * Featured pros — server-side helper for the homepage rail, city pages,
 * profession pages, the directory `featured=true` filter and the admin
 * directory dashboard.
 *
 * "Featured" is a perk of the paid tier (Verified / Pro / Studio). Until a
 * scope has STRICTLY MORE than `FEATURED_PAID_THRESHOLD` paid pros, we
 * backfill with any published pro that has an avatar so the rail never
 * looks empty.
 *
 * Rotation is deterministic per UTC date + scope, so SSR and client agree
 * and the order changes once per day without admin work.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  FEATURED_MIN_QUALITY,
  FEATURED_PAID_THRESHOLD,
} from "./featured.config";

/**
 * Quality score is roughly capped at ~135 (sum of bonuses in
 * compute_pro_quality_score). 100 reads as "good enough" for display, so the
 * UI-facing `FEATURED_MIN_QUALITY` (0-100) is mapped onto the raw score with
 * the same /100 scale used in admin.
 */
const QUALITY_SCORE_DISPLAY_MAX = 100;
const FEATURED_MIN_QUALITY_RAW = FEATURED_MIN_QUALITY; // raw and display share scale

const FeaturedScope = z.enum(["global", "city", "profession"]);

const FeaturedInputSchema = z.object({
  scope: FeaturedScope,
  value: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(60).default(8),
});

export type FeaturedScope = z.infer<typeof FeaturedScope>;
export type FeaturedProRow = {
  id: string;
  slug: string;
  full_name: string;
  avatar_url: string | null;
  primary_profession: string | null;
  specialisms: string[];
  city: string | null;
  headline: string | null;
  in_person_available: boolean | null;
  online_available: boolean | null;
  rating_avg: number | null;
  review_count: number;
  tier: "studio" | "pro" | "verified" | "free";
  identity_status: string | null;
  /** True when this pro is part of the paid pool (vs avatar-backfill). */
  is_paid: boolean;
};

/* ------------------------------------------------------------------ */
/* Deterministic daily shuffle                                         */
/* ------------------------------------------------------------------ */

function stringSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function dailyShuffle<T>(items: T[], scopeKey: string): T[] {
  const today = new Date().toISOString().slice(0, 10);
  const rng = mulberry32(stringSeed(`${today}|${scopeKey}`));
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ------------------------------------------------------------------ */
/* Core query                                                          */
/* ------------------------------------------------------------------ */

type ProRow = {
  id: string;
  slug: string | null;
  city: string | null;
  primary_profession: string | null;
  specialisms: string[] | null;
  headline: string | null;
  in_person_available: boolean | null;
  online_available: boolean | null;
  identity_status: string | null;
  quality_score: number | null;
};

async function fetchFeaturedPool(
  scope: FeaturedScope,
  value: string | undefined,
): Promise<{
  pool: FeaturedProRow[];
  paidCount: number;
  backfillUsed: boolean;
  eligibleCount: number;
  belowThresholdCount: number;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let qb = supabaseAdmin
    .from("professionals")
    .select(
      "id, slug, city, primary_profession, specialisms, headline, in_person_available, online_available, identity_status, quality_score",
    )
    .eq("is_published", true);

  if (scope === "city" && value) qb = qb.ilike("city", `%${value}%`);
  if (scope === "profession" && value) qb = qb.eq("primary_profession", value);

  const { data: prosRaw, error } = await qb
    .order("quality_score", { ascending: false, nullsFirst: false })
    .limit(500);

  if (error || !prosRaw || prosRaw.length === 0) {
    return { pool: [], paidCount: 0, backfillUsed: false, eligibleCount: 0, belowThresholdCount: 0 };
  }

  const pros = prosRaw as ProRow[];
  const ids = pros.filter((p) => p.slug).map((p) => p.id);
  if (ids.length === 0) {
    return { pool: [], paidCount: 0, backfillUsed: false, eligibleCount: 0, belowThresholdCount: 0 };
  }

  const [profilesRes, subsRes, reviewsRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, full_name, avatar_url").in("id", ids),
    supabaseAdmin
      .from("subscriptions")
      .select("user_id, tier, status")
      .in("user_id", ids)
      .in("status", ["active", "trialing", "past_due"]),
    supabaseAdmin
      .from("reviews")
      .select("professional_id, rating, status")
      .in("professional_id", ids)
      .eq("status", "published"),
  ]);

  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

  const tierRank = (t: string | null | undefined) =>
    t === "studio" ? 3 : t === "pro" ? 2 : t === "verified" ? 1 : 0;
  const tierById = new Map<string, "studio" | "pro" | "verified">();
  for (const s of subsRes.data ?? []) {
    const t = s.tier as "studio" | "pro" | "verified" | "free" | null;
    if (!t || t === "free") continue;
    const prev = tierById.get(s.user_id);
    if (!prev || tierRank(t) > tierRank(prev)) tierById.set(s.user_id, t);
  }

  const reviewAggById = new Map<string, { count: number; sum: number }>();
  for (const r of reviewsRes.data ?? []) {
    const prev = reviewAggById.get(r.professional_id) ?? { count: 0, sum: 0 };
    prev.count += 1;
    prev.sum += Number(r.rating) || 0;
    reviewAggById.set(r.professional_id, prev);
  }

  const enriched: FeaturedProRow[] = pros
    .filter((p) => p.slug)
    .map((p) => {
      const prof = profileById.get(p.id);
      const tier = tierById.get(p.id) ?? "free";
      const agg = reviewAggById.get(p.id);
      return {
        id: p.id,
        slug: p.slug as string,
        full_name: prof?.full_name ?? "REPs Professional",
        avatar_url: prof?.avatar_url ?? null,
        primary_profession: p.primary_profession,
        specialisms: Array.isArray(p.specialisms) ? p.specialisms : [],
        city: p.city,
        headline: p.headline,
        in_person_available: p.in_person_available,
        online_available: p.online_available,
        rating_avg: agg && agg.count > 0 ? agg.sum / agg.count : null,
        review_count: agg?.count ?? 0,
        tier,
        identity_status: p.identity_status,
        is_paid: tier !== "free",
      };
    });

  // Hard eligibility — every featured pro must clear ALL of these gates.
  // No exceptions, no backfill bypass. If we can't fill the rail, we hide it.
  const isEligible = (p: FeaturedProRow) =>
    Boolean(p.avatar_url) &&
    p.identity_status === "approved" &&
    Boolean(p.headline && p.headline.trim().length > 0) &&
    (p.specialisms?.length ?? 0) >= 1 &&
    (pros.find((x) => x.id === p.id)?.quality_score ?? 0) >= FEATURED_MIN_QUALITY_RAW;

  const eligible = enriched.filter(isEligible);
  const belowThreshold = enriched.length - eligible.length;

  const paidPool = eligible.filter((p) => p.is_paid);
  const usePaidOnly = paidPool.length > FEATURED_PAID_THRESHOLD;

  if (usePaidOnly) {
    return {
      pool: paidPool,
      paidCount: paidPool.length,
      backfillUsed: false,
      eligibleCount: eligible.length,
      belowThresholdCount: belowThreshold,
    };
  }

  // Backfill draws from the SAME eligible pool — just non-paid pros.
  // They still have a real headshot, are identity-verified, and pass quality.
  const backfill = eligible.filter((p) => !p.is_paid);
  return {
    pool: [...paidPool, ...backfill],
    paidCount: paidPool.length,
    backfillUsed: true,
    eligibleCount: eligible.length,
    belowThresholdCount: belowThreshold,
  };
}

export type GetFeaturedProsResult = {
  pros: FeaturedProRow[];
  paid_count: number;
  pool_size: number;
  backfill_used: boolean;
  eligible_count: number;
};

export const getFeaturedPros = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => FeaturedInputSchema.parse(raw ?? {}))
  .handler(async ({ data }): Promise<GetFeaturedProsResult> => {
    const { pool, paidCount, backfillUsed, eligibleCount } = await fetchFeaturedPool(
      data.scope,
      data.value,
    );

    const scopeKey = `${data.scope}:${(data.value ?? "").toLowerCase()}`;
    const shuffled = dailyShuffle(pool, scopeKey).slice(0, data.limit);

    return {
      pros: shuffled,
      paid_count: paidCount,
      pool_size: pool.length,
      backfill_used: backfillUsed,
      eligible_count: eligibleCount,
    };
  });

/* ------------------------------------------------------------------ */
/* Featured-only directory filter helper                              */
/* ------------------------------------------------------------------ */

/**
 * Returns the set of professional IDs that count as "featured" globally.
 * Used by `searchProfessionals` when `featured: true` is in the filters.
 *
 * Larger pool than the public rail (capped at 200) so the directory has
 * room for pagination.
 */
export const getFeaturedProIds = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ids: string[] }> => {
    const { pool } = await fetchFeaturedPool("global", undefined);
    return { ids: pool.slice(0, 200).map((p) => p.id) };
  },
);

/* ------------------------------------------------------------------ */
/* Admin directory health                                              */
/* ------------------------------------------------------------------ */

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DirectoryHealth = {
  kpis: {
    live_listings: number;
    completeness_pct: number | null;
    broken_links: number | null;
    featured_slots: { filled: number; capacity: number };
  };
  needs_attention: Array<{
    id: string;
    slug: string | null;
    name: string;
    issue: string;
    completeness_pct: number;
    last_edit: string | null;
  }>;
  geographic_coverage: Array<{ city: string; count: number }>;
  featured_rotation: Array<{
    id: string;
    slug: string;
    name: string;
    role: string;
    city: string | null;
    tier: "studio" | "pro" | "verified" | "free";
    is_paid: boolean;
  }>;
  backfill_active: boolean;
  paid_total: number;
  /** Pros that pass every featured-rail eligibility gate globally. */
  eligible_total: number;
  /** Published pros that miss at least one gate (no photo / unverified / thin / low quality). */
  below_threshold_total: number;
};

// Quality score is roughly capped at ~135 (sum of all bonuses in
// compute_pro_quality_score). 100 is "good enough" for display so completeness
// reads as a percentage clients understand.
const QUALITY_SCORE_MAX = 100;

function describeIssue(p: {
  has_avatar: boolean;
  has_bio: boolean;
  has_headline: boolean;
  has_location: boolean;
  specialism_count: number;
  identity_status: string | null;
  bd_seed_thin: boolean | null;
}): string {
  if (!p.has_avatar) return "No profile photo";
  if (p.bd_seed_thin) return "Migrated profile — needs claim";
  if (p.identity_status !== "approved") return "Identity unverified";
  if (!p.has_bio) return "Empty about section";
  if (!p.has_location) return "Missing primary location";
  if (p.specialism_count === 0) return "No specialisms selected";
  if (!p.has_headline) return "Missing headline";
  return "Profile incomplete";
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms) || ms < 0) return "—";
  const d = Math.floor(ms / 86_400_000);
  if (d <= 0) return "today";
  if (d === 1) return "1d ago";
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export const getDirectoryHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DirectoryHealth> => {
    const { supabase } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) {
      throw new Response("Forbidden", { status: 403 });
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // KPIs — live listings + completeness average
    const [{ count: liveCount }, { data: qualityRows }] = await Promise.all([
      supabaseAdmin
        .from("professionals")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      supabaseAdmin
        .from("professionals")
        .select("quality_score")
        .eq("is_published", true)
        .limit(2000),
    ]);

    const scores = (qualityRows ?? [])
      .map((r) => r.quality_score ?? 0)
      .filter((n) => n > 0);
    const avgScore =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    const completenessPct = Math.min(
      100,
      Math.round((avgScore / QUALITY_SCORE_MAX) * 100),
    );

    // Listings needing attention — pull bottom-quality published pros + the
    // signal that explains the score.
    const { data: weakRaw } = await supabaseAdmin
      .from("professionals")
      .select(
        "id, slug, city, specialisms, headline, bio, identity_status, bd_seed_thin, quality_score, updated_at",
      )
      .eq("is_published", true)
      .order("quality_score", { ascending: true, nullsFirst: true })
      .limit(20);

    const weakIds = (weakRaw ?? []).map((r) => r.id);

    const [{ data: weakProfiles }, { data: weakLocs }] = await Promise.all([
      weakIds.length
        ? supabaseAdmin
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", weakIds)
        : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; avatar_url: string | null }> }),
      weakIds.length
        ? supabaseAdmin
            .from("professional_locations")
            .select("professional_id")
            .in("professional_id", weakIds)
            .eq("is_primary", true)
        : Promise.resolve({ data: [] as Array<{ professional_id: string }> }),
    ]);

    const weakProfileById = new Map(
      (weakProfiles ?? []).map((p) => [p.id, p]),
    );
    const weakLocSet = new Set((weakLocs ?? []).map((l) => l.professional_id));

    const needs_attention = (weakRaw ?? []).slice(0, 8).map((r) => {
      const prof = weakProfileById.get(r.id);
      const issue = describeIssue({
        has_avatar: Boolean(prof?.avatar_url),
        has_bio: Boolean(r.bio && r.bio.trim().length > 0),
        has_headline: Boolean(r.headline && r.headline.trim().length > 0),
        has_location: weakLocSet.has(r.id),
        specialism_count: Array.isArray(r.specialisms) ? r.specialisms.length : 0,
        identity_status: r.identity_status,
        bd_seed_thin: r.bd_seed_thin,
      });
      return {
        id: r.id,
        slug: r.slug,
        name: prof?.full_name ?? "Unnamed pro",
        issue,
        completeness_pct: Math.min(
          100,
          Math.round(((r.quality_score ?? 0) / QUALITY_SCORE_MAX) * 100),
        ),
        last_edit: r.updated_at,
      };
    });

    // Geographic coverage
    const { data: cityRows } = await supabaseAdmin
      .from("professionals")
      .select("city")
      .eq("is_published", true)
      .not("city", "is", null)
      .limit(2000);

    const cityCounts = new Map<string, number>();
    for (const r of cityRows ?? []) {
      const c = (r.city ?? "").trim();
      if (!c) continue;
      cityCounts.set(c, (cityCounts.get(c) ?? 0) + 1);
    }
    const geographic_coverage = [...cityCounts.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Featured rotation — today's global rotation
    const { pool } = await fetchFeaturedPool("global", undefined);
    const rotation = dailyShuffle(pool, "global:").slice(0, 8);
    const paidTotal = pool.filter((p) => p.is_paid).length;

    return {
      kpis: {
        live_listings: liveCount ?? 0,
        completeness_pct: scores.length > 0 ? completenessPct : null,
        broken_links: null, // crawler not yet shipped
        featured_slots: { filled: Math.min(rotation.length, 8), capacity: 8 },
      },
      needs_attention: needs_attention.map((r) => ({
        ...r,
        last_edit: r.last_edit ? timeAgo(r.last_edit) : "—",
      })),
      geographic_coverage,
      featured_rotation: rotation.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.full_name,
        role: p.primary_profession ?? "Professional",
        city: p.city,
        tier: p.tier,
        is_paid: p.is_paid,
      })),
      backfill_active: paidTotal <= FEATURED_PAID_THRESHOLD,
      paid_total: paidTotal,
    };
  });
