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
});

export type SearchProfessionalsInput = z.infer<typeof SearchSchema>;
export type SearchProfessionalsResult = {
  rows: SearchProfessionalRow[];
  total: number;
  page: number;
  pageSize: number;
};

const COLS =
  "id, slug, headline, bio, primary_profession, specialisms, city, country, hourly_rate_pence, verification, identity_status, in_person_available, online_available, bd_seed_thin, quality_score, updated_at";

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
  full_name: string | null;
  avatar_url: string | null;
  tier: "studio" | "pro" | "verified" | "free";
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

    // Server-side ranking: profile quality (photo / verification / completeness / tier),
    // tiebreak by recency. Pagination then uses this stable order.
    const { data: rows, error, count } = await qb
      .order("quality_score", { ascending: false })
      .order("updated_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    const total = count ?? 0;
    const list = (rows ?? []) as Array<
      Omit<SearchProfessionalRow, "full_name" | "avatar_url" | "tier" | "location"> & {
        specialisms: string[] | null;
      }
    >;
    const ids = list.map((r) => r.id);

    if (!ids.length) return { rows: [], total, page, pageSize };

    const [profilesRes, locsRes, subsRes] = await Promise.all([
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

    const decorated: SearchProfessionalRow[] = list.map((r) => {
      const prof = profileById.get(r.id);
      const loc = locById.get(r.id);
      return {
        ...r,
        specialisms: Array.isArray(r.specialisms) ? r.specialisms : [],
        full_name: prof?.full_name ?? null,
        avatar_url: prof?.avatar_url ?? null,
        tier: tierById.get(r.id) ?? "free",
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
