import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Lightweight lookup of a professional's account_type by slug.
 * Used by /c/$slug and /t/$slug layouts to redirect to the correct
 * template (organisation -> /t, individual -> /c).
 */
export const getAccountTypeBySlug = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("professionals")
      .select("account_type")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    return { accountType: (row?.account_type as string | null) ?? null };
  });
