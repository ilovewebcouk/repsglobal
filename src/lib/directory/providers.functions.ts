// Public list of REPS-verified training providers (organisation accounts).
// Reads from the same public-visibility gate used by /find-a-professional so
// only published, paid, non-demo providers appear.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ProviderCard = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  tagline: string | null;
  avatar_url: string | null;
  in_person_available: boolean;
  online_available: boolean;
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
        "id, slug, full_name, city, tagline, avatar_url, in_person_available, online_available, account_type",
        { count: "exact" },
      )
      .in("id", visibleIds)
      .eq("account_type", "organisation");

    if (data.q) qb = qb.ilike("full_name", `%${data.q}%`);
    if (data.city) qb = qb.ilike("city", `%${data.city}%`);
    if (data.mode === "in_person") qb = qb.eq("in_person_available", true);
    if (data.mode === "online") qb = qb.eq("online_available", true);
    if (data.mode === "blended")
      qb = qb.eq("in_person_available", true).eq("online_available", true);

    qb = qb.order("full_name", { ascending: true }).limit(data.limit ?? 40);

    const { data: rows, error, count } = await qb;
    if (error) throw new Error(error.message);

    const mapped: ProviderCard[] = (rows ?? []).map((r) => ({
      id: r.id as string,
      slug: r.slug as string,
      name: (r.full_name as string | null)?.trim() || "Training Provider",
      city: (r.city as string | null) ?? null,
      tagline: (r.tagline as string | null) ?? null,
      avatar_url: (r.avatar_url as string | null) ?? null,
      in_person_available: Boolean(r.in_person_available),
      online_available: Boolean(r.online_available),
    }));

    return { rows: mapped, total: count ?? mapped.length };
  });
