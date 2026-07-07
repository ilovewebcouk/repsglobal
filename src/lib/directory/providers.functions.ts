// Public list of REPS-verified training providers (organisation accounts).
// Reads from the same public-visibility gate used by /find-a-professional so
// only published, paid, non-demo providers appear.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  DEMO_PROVIDER_COVERS,
  DEMO_PROVIDER_LOGOS,
} from "@/lib/directory/demo-provider-assets";

export type ProviderCard = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  tagline: string | null;
  avatar_url: string | null;
  hero_image_url: string | null;
  in_person_available: boolean;
  online_available: boolean;
  rating_avg: number | null;
  review_count: number;
};

const InputSchema = z.object({
  q: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  mode: z.enum(["any", "in_person", "online", "blended"]).optional(),
  limit: z.number().int().min(1).max(60).optional(),
});

export const listPublicProviders = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => InputSchema.parse(d ?? {}))
  .handler(async ({ data }): Promise<{ rows: ProviderCard[]; total: number }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getPubliclyVisibleProIds } = await import(
      "@/lib/visibility/public-gate.server"
    );

    const visibleIds = Array.from(await getPubliclyVisibleProIds());
    if (visibleIds.length === 0) return { rows: [], total: 0 };

    let qb = supabaseAdmin
      .from("professionals")
      .select(
        "id, slug, city, headline, in_person_available, online_available",
        { count: "exact" },
      )
      .in("id", visibleIds)
      .eq("account_type", "organisation");

    if (data.city) qb = qb.ilike("city", `%${data.city}%`);
    if (data.mode === "in_person") qb = qb.eq("in_person_available", true);
    if (data.mode === "online") qb = qb.eq("online_available", true);
    if (data.mode === "blended")
      qb = qb.eq("in_person_available", true).eq("online_available", true);

    qb = qb.limit(data.limit ?? 60);

    const { data: proRows, error, count } = await qb;
    if (error) throw new Error(error.message);

    const ids = (proRows ?? []).map((r) => r.id as string);
    let profilesById: Record<string, { name: string | null; avatar: string | null }> = {};
    if (ids.length > 0) {
      const { data: profRows } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, business_name, display_name, avatar_url")
        .in("id", ids);
      for (const p of profRows ?? []) {
        profilesById[p.id as string] = {
          name:
            ((p as { business_name?: string | null }).business_name ?? null) ||
            ((p as { display_name?: string | null }).display_name ?? null) ||
            ((p as { full_name?: string | null }).full_name ?? null),
          avatar: (p as { avatar_url?: string | null }).avatar_url ?? null,
        };
      }
    }

    const heroById: Record<string, string | null> = {};
    if (ids.length > 0) {
      const { data: siteRows } = await supabaseAdmin
        .from("websites")
        .select("professional_id, hero_image_url")
        .in("professional_id", ids);
      for (const s of siteRows ?? []) {
        const pid = (s as { professional_id?: string | null }).professional_id;
        if (pid) {
          heroById[pid] =
            (s as { hero_image_url?: string | null }).hero_image_url ?? null;
        }
      }
    }

    let rows: ProviderCard[] = (proRows ?? []).map((r) => {
      const prof = profilesById[r.id as string] ?? { name: null, avatar: null };
      const slug = (r.slug as string | null) ?? "";
      return {
        id: r.id as string,
        slug,
        name: prof.name?.trim() || "Training Provider",
        city: (r.city as string | null) ?? null,
        tagline: (r.headline as string | null) ?? null,
        avatar_url: prof.avatar ?? DEMO_PROVIDER_LOGOS[slug] ?? null,
        hero_image_url:
          heroById[r.id as string] ?? DEMO_PROVIDER_COVERS[slug] ?? null,
        in_person_available: Boolean(r.in_person_available),
        online_available: Boolean(r.online_available),
      };
    }).filter((r) => r.slug);

    if (data.q) {
      const needle = data.q.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(needle));
    }

    rows.sort((a, b) => a.name.localeCompare(b.name));

    return { rows, total: count ?? rows.length };
  });
