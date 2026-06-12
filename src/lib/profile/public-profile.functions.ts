import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPublicProfileBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("professionals")
      .select(
        "slug, trading_name, headline, bio, specialisms, city, country, online_available, in_person_available, hourly_rate_pence, verification_status, is_published",
      )
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    return row;
  });

export const listPublishedProfessionals = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("professionals")
      .select(
        "id, slug, trading_name, headline, specialisms, city, country, hourly_rate_pence, verification_status, in_person_available, online_available",
      )
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    const rows = data ?? [];
    const ids = rows.map((r) => r.id).filter(Boolean) as string[];
    let avatarById = new Map<string, string | null>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, avatar_url")
        .in("id", ids);
      avatarById = new Map((profs ?? []).map((p) => [p.id, p.avatar_url]));
    }
    return rows.map((r) => ({ ...r, avatar_url: avatarById.get(r.id) ?? null }));
  },
);
