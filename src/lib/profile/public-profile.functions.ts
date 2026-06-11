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
        "slug, trading_name, headline, specialisms, city, country, hourly_rate_pence, verification_status",
      )
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    return data ?? [];
  },
);
