import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPublicProfileBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("professionals")
      .select(
        "id, slug, headline, bio, specialisms, city, country, online_available, in_person_available, hourly_rate_pence, verification_status, is_published",
      )
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (!row) return null;
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", row.id)
      .maybeSingle();
    return {
      ...row,
      full_name: prof?.full_name ?? null,
      avatar_url: prof?.avatar_url ?? null,
    };
  });

export const listPublishedProfessionals = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("professionals")
      .select(
        "id, slug, headline, specialisms, city, country, hourly_rate_pence, verification_status, in_person_available, online_available",
      )
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    const rows = data ?? [];
    const ids = rows.map((r) => r.id).filter(Boolean) as string[];
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
    return rows.map((r) => ({
      ...r,
      full_name: profileById.get(r.id)?.full_name ?? null,
      avatar_url: profileById.get(r.id)?.avatar_url ?? null,
    }));
  },
);
