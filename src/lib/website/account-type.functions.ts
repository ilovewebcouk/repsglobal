import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

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

/**
 * Current user's account_type. Used by the dashboard sidebar to unlock
 * organisation-only features (e.g. the training-provider website editor
 * is not gated behind the 3-pillar trust flow).
 */
export const getMyAccountType = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("professionals")
      .select("account_type")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return { accountType: (data?.account_type as string | null) ?? null };
  });

