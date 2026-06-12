import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type PublicLocation = {
  postcode_outward: string | null;
  town: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
};

async function fetchPrimaryLocations(
  proIds: string[],
): Promise<Map<string, PublicLocation>> {
  const out = new Map<string, PublicLocation>();
  if (!proIds.length) return out;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("professional_locations")
    .select("professional_id, postcode_outward, town, region, latitude, longitude")
    .in("professional_id", proIds)
    .eq("is_primary", true)
    .eq("is_public", true);
  for (const r of data ?? []) {
    out.set(r.professional_id, {
      postcode_outward: r.postcode_outward,
      town: r.town,
      region: r.region,
      latitude: r.latitude,
      longitude: r.longitude,
    });
  }
  return out;
}

const PRO_PUBLIC_COLUMNS =
  "id, slug, headline, primary_profession, secondary_professions, bio, specialisms, city, country, online_available, in_person_available, hourly_rate_pence, verification_status, is_published";

const PRO_LIST_COLUMNS =
  "id, slug, headline, primary_profession, secondary_professions, specialisms, city, country, hourly_rate_pence, verification_status, in_person_available, online_available";

export const getPublicProfileBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("professionals")
      .select(PRO_PUBLIC_COLUMNS)
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (!row) return null;

    const r = row as unknown as Record<string, unknown> & { id: string };

    const [{ data: prof }, locMap] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", r.id)
        .maybeSingle(),
      fetchPrimaryLocations([r.id]),
    ]);
    const loc = locMap.get(r.id) ?? null;

    return {
      ...r,
      primary_profession: (r.primary_profession as string | null) ?? null,
      secondary_professions: Array.isArray(r.secondary_professions)
        ? (r.secondary_professions as string[])
        : [],
      full_name: prof?.full_name ?? null,
      avatar_url: prof?.avatar_url ?? null,
      location: loc,
    };
  });

export const listPublishedProfessionals = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("professionals")
      .select(PRO_LIST_COLUMNS)
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    const rows = (data ?? []) as unknown as Array<Record<string, unknown> & { id: string }>;
    const ids = rows.map((r) => r.id).filter(Boolean);

    let profileById = new Map<string, { full_name: string | null; avatar_url: string | null }>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", ids);
      profileById = new Map(
        (profs ?? []).map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }]),
      );
    }

    const locMap = await fetchPrimaryLocations(ids);

    return rows.map((r) => ({
      ...r,
      primary_profession: (r.primary_profession as string | null) ?? null,
      secondary_professions: Array.isArray(r.secondary_professions)
        ? (r.secondary_professions as string[])
        : [],
      full_name: profileById.get(r.id)?.full_name ?? null,
      avatar_url: profileById.get(r.id)?.avatar_url ?? null,
      location: locMap.get(r.id) ?? null,
    }));
  },
);
