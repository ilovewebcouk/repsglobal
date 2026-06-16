// Server function for /find-a-professional directory search.
// NEVER select `contact_phone` — phone numbers are internal only.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  profession: z.string().trim().max(60).optional(),
  specialism: z.string().trim().max(60).optional(),
  online: z.boolean().optional(),
  in_person: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).max(10000).optional(),
  page: z.number().int().min(1).max(1000).optional(),
  // When provided, server sorts by haversine distance from this point and
  // returns only the page slice of nearest-first IDs.
  viewer_lat: z.number().min(-90).max(90).optional(),
  viewer_lng: z.number().min(-180).max(180).optional(),
  sort_by_nearest: z.boolean().optional(),
});

function haversineMi(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type SearchProfessionalsInput = z.infer<typeof SearchSchema>;
export type SearchProfessionalsResult = {
  rows: SearchProfessionalRow[];
  total: number;
  page: number;
  pageSize: number;
};

const COLS =
  "id, slug, headline, bio, primary_profession, specialisms, city, country, hourly_rate_pence, verification, identity_status, in_person_available, online_available, bd_seed_thin, quality_score, created_at, updated_at";

export type ProGymPill = {
  /** Stable id for React keys. */
  id: string;
  /** Display name — chain name preferred, falls back to gym name. */
  name: string;
  /** Branch/area label, e.g. "Barbican". May be null on chains w/o area. */
  branch: string | null;
};

export type SearchProfessionalRow = {
  id: string;
  slug: string | null;
  headline: string | null;
  bio: string | null;
  primary_profession: string | null;
  specialisms: string[];
  city: string | null;
  country: string | null;
  hourly_rate_pence: number | null;
  verification: string | null;
  identity_status: string | null;
  in_person_available: boolean | null;
  online_available: boolean | null;
  bd_seed_thin: boolean | null;
  quality_score: number | null;
  created_at: string | null;
  full_name: string | null;
  avatar_url: string | null;
  tier: "studio" | "pro" | "verified" | "free";
  /** Lowest published service price in pence — null when no priced service. */
  from_price_pence: number | null;
  /** Aggregated published-review stats. */
  review_count: number;
  rating_avg: number | null;
  /** Up to 3 gym pills, ordered by position ASC. Empty when online-only. */
  gyms: ProGymPill[];
  location: {
    postcode_outward: string | null;
    town: string | null;
    region: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
};

export const searchProfessionals = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => SearchSchema.parse(d ?? {}))
  .handler(async ({ data }): Promise<SearchProfessionalsResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const pageSize = data.limit ?? 24;
    const page = data.page ?? (data.offset != null ? Math.floor(data.offset / pageSize) + 1 : 1);
    const offset = data.offset ?? (page - 1) * pageSize;
    const nearestMode =
      data.sort_by_nearest === true &&
      typeof data.viewer_lat === "number" &&
      typeof data.viewer_lng === "number";

    let qb = supabaseAdmin
      .from("professionals")
      .select(COLS, { count: "exact" })
      .eq("is_published", true);

    if (data.city) qb = qb.ilike("city", `%${data.city}%`);
    if (data.profession) qb = qb.eq("primary_profession", data.profession);
    if (data.specialism) qb = qb.contains("specialisms", [data.specialism]);
    if (data.online === true) qb = qb.eq("online_available", true);
    if (data.in_person === true) qb = qb.eq("in_person_available", true);
    if (data.q) {
      const term = data.q.replace(/[%_]/g, "\\$&");
      qb = qb.or(`headline.ilike.%${term}%,slug.ilike.%${term}%`);
    }

    let rows: Array<Record<string, unknown>>;
    let total: number;

    if (nearestMode) {
      // Pull ALL matching pros (cap 1000), join coords, sort by distance,
      // paginate. This makes "Nearest" truly nearest, not "nearest within
      // whatever quality-ranked page happened to load".
      const { data: allRows, error, count } = await qb
        .order("updated_at", { ascending: false })
        .range(0, 999);
      if (error) throw error;
      total = count ?? (allRows?.length ?? 0);
      const allIds = (allRows ?? []).map((r) => (r as { id: string }).id);

      const { data: locs } = await supabaseAdmin
        .from("professional_locations")
        .select("professional_id, latitude, longitude")
        .in("professional_id", allIds)
        .eq("is_primary", true)
        .eq("is_public", true);

      const coordById = new Map<string, { lat: number; lng: number }>();
      for (const l of locs ?? []) {
        if (l.latitude != null && l.longitude != null) {
          coordById.set(l.professional_id, { lat: l.latitude, lng: l.longitude });
        }
      }

      const origin = { lat: data.viewer_lat!, lng: data.viewer_lng! };
      const decoratedAll = (allRows ?? []).map((r) => {
        const c = coordById.get((r as { id: string }).id);
        const d = c ? haversineMi(origin, c) : Number.POSITIVE_INFINITY;
        return { row: r, d };
      });
      decoratedAll.sort((a, b) => a.d - b.d);
      rows = decoratedAll.slice(offset, offset + pageSize).map((x) => x.row);
    } else {
      // Server-side ranking: profile quality, tiebreak by recency.
      const { data: pagedRows, error, count } = await qb
        .order("quality_score", { ascending: false })
        .order("updated_at", { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      total = count ?? 0;
      rows = pagedRows ?? [];
    }

    const list = rows as Array<
      Omit<
        SearchProfessionalRow,
        "full_name" | "avatar_url" | "tier" | "location" | "from_price_pence" | "review_count" | "rating_avg" | "gyms"
      > & {
        specialisms: string[] | null;
      }
    >;
    const ids = list.map((r) => r.id);

    if (!ids.length) return { rows: [], total, page, pageSize };

    const [profilesRes, locsRes, subsRes, servicesRes, reviewsRes, proGymsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, avatar_url").in("id", ids),
      supabaseAdmin
        .from("professional_locations")
        .select("professional_id, postcode_outward, town, region, latitude, longitude")
        .in("professional_id", ids)
        .eq("is_primary", true)
        .eq("is_public", true),
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, tier, status")
        .in("user_id", ids)
        .in("status", ["active", "trialing", "past_due"]),
      supabaseAdmin
        .from("services")
        .select("professional_id, price_pence, is_published")
        .in("professional_id", ids)
        .eq("is_published", true),
      supabaseAdmin
        .from("reviews")
        .select("professional_id, rating, status")
        .in("professional_id", ids)
        .eq("status", "published"),
      supabaseAdmin
        .from("professional_gyms")
        .select("id, professional_id, position, gym:gyms ( id, name, chain_name, area )")
        .in("professional_id", ids)
        .order("position", { ascending: true }),
    ]);

    const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    const locById = new Map((locsRes.data ?? []).map((l) => [l.professional_id, l]));
    const tierById = new Map<string, "studio" | "pro" | "verified" | "free">();
    for (const s of subsRes.data ?? []) {
      const t = s.tier as "studio" | "pro" | "verified" | "free" | null;
      if (!t || t === "free") continue;
      const prev = tierById.get(s.user_id);
      const rank = (x: string) => (x === "studio" ? 3 : x === "pro" ? 2 : x === "verified" ? 1 : 0);
      if (!prev || rank(t) > rank(prev)) tierById.set(s.user_id, t);
    }

    // Aggregate min price.
    const priceById = new Map<string, number>();
    for (const s of servicesRes.data ?? []) {
      if (s.price_pence == null) continue;
      const prev = priceById.get(s.professional_id);
      if (prev == null || s.price_pence < prev) priceById.set(s.professional_id, s.price_pence);
    }

    // Aggregate review count + avg.
    const reviewAggById = new Map<string, { count: number; sum: number }>();
    for (const r of reviewsRes.data ?? []) {
      const prev = reviewAggById.get(r.professional_id) ?? { count: 0, sum: 0 };
      prev.count += 1;
      prev.sum += Number(r.rating) || 0;
      reviewAggById.set(r.professional_id, prev);
    }

    // Group gym pills (max 3 per pro, already ordered by position).
    const gymsById = new Map<string, ProGymPill[]>();
    for (const pg of proGymsRes.data ?? []) {
      const list = gymsById.get(pg.professional_id) ?? [];
      if (list.length >= 3) continue;
      const g = (pg as { gym?: { id: string; name: string; chain_name: string | null; area: string | null } | null }).gym;
      if (!g) continue;
      list.push({
        id: pg.id,
        name: g.chain_name?.trim() || g.name,
        branch: g.area?.trim() || null,
      });
      gymsById.set(pg.professional_id, list);
    }

    const decorated: SearchProfessionalRow[] = list.map((r) => {
      const prof = profileById.get(r.id);
      const loc = locById.get(r.id);
      const agg = reviewAggById.get(r.id);
      return {
        ...r,
        specialisms: Array.isArray(r.specialisms) ? r.specialisms : [],
        full_name: prof?.full_name ?? null,
        avatar_url: prof?.avatar_url ?? null,
        tier: tierById.get(r.id) ?? "free",
        from_price_pence: priceById.get(r.id) ?? null,
        review_count: agg?.count ?? 0,
        rating_avg: agg && agg.count > 0 ? agg.sum / agg.count : null,
        gyms: gymsById.get(r.id) ?? [],
        location: loc
          ? {
              postcode_outward: loc.postcode_outward,
              town: loc.town,
              region: loc.region,
              latitude: loc.latitude,
              longitude: loc.longitude,
            }
          : null,
      };
    });

    return { rows: decorated, total, page, pageSize };
  });
