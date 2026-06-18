import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type PopularGym = {
  id: string;
  slug: string;
  name: string;
  chain_name: string | null;
  area: string | null;
  pro_count: number;
};

export type GymDetail = {
  id: string;
  slug: string;
  name: string;
  chain_name: string | null;
  area: string | null;
  city: string | null;
  postcode: string | null;
  tagline: string | null;
  logo_url: string | null;
};

/* ------------------------------------------------------------------ */
/* Popular gyms for a city                                             */
/* ------------------------------------------------------------------ */

const CityPopularGymsSchema = z.object({
  city: z.string().trim().min(1).max(120),
  limit: z.number().int().min(1).max(24).default(6),
});

export const getCityPopularGyms = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => CityPopularGymsSchema.parse(raw))
  .handler(async ({ data }): Promise<PopularGym[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Step 1: candidate gyms in the city, alphabetical fallback order.
    const { data: gymRows, error } = await supabaseAdmin
      .from("gyms")
      .select("id, slug, name, chain_name, area")
      .ilike("city", `%${data.city}%`)
      .in("status", ["active", "approved"])
      .order("name", { ascending: true })
      .limit(48);
    if (error) throw error;
    const gyms = gymRows ?? [];
    if (gyms.length === 0) return [];

    // Step 2: count trainers per gym (active links only).
    const ids = gyms.map((g) => g.id);
    const { data: linkRows } = await supabaseAdmin
      .from("professional_gyms")
      .select("gym_id")
      .in("gym_id", ids);

    const counts = new Map<string, number>();
    for (const row of linkRows ?? []) {
      const k = (row as { gym_id: string }).gym_id;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }

    const enriched: PopularGym[] = gyms.map((g) => ({
      id: g.id,
      slug: g.slug,
      name: g.name,
      chain_name: g.chain_name,
      area: g.area,
      pro_count: counts.get(g.id) ?? 0,
    }));

    enriched.sort((a, b) => {
      if (b.pro_count !== a.pro_count) return b.pro_count - a.pro_count;
      return a.name.localeCompare(b.name);
    });

    return enriched.slice(0, data.limit);
  });

/* ------------------------------------------------------------------ */
/* Single gym by slug (placeholder gym page)                           */
/* ------------------------------------------------------------------ */

const GymBySlugSchema = z.object({
  slug: z.string().trim().min(1).max(160),
});

export const getGymBySlug = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => GymBySlugSchema.parse(raw))
  .handler(async ({ data }): Promise<GymDetail | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("gyms")
      .select("id, slug, name, chain_name, area, city, postcode, tagline, logo_url")
      .eq("slug", data.slug)
      .in("status", ["active", "approved"])
      .maybeSingle();
    if (error) throw error;
    if (!row) return null;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      chain_name: row.chain_name,
      area: row.area,
      city: row.city,
      postcode: row.postcode,
      tagline: row.tagline,
      logo_url: row.logo_url,
    };
  });
