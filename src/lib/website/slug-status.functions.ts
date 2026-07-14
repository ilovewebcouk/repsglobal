/**
 * Public — lightweight lookup of a pro's slug status.
 *
 * Used by `/c/$slug` to distinguish "no such member" from
 * "member exists but is not yet verified on REPS". Returns the minimum
 * info needed to render the "not yet verified" gate page. No auth needed.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ProSlugStatus =
  | { exists: false }
  | {
      exists: true;
      verified: boolean;
      isPublished: boolean;
      isSuspended: boolean;
      displayName: string | null;
      city: string | null;
      firstName: string | null;
    };

export const getProSlugPublicStatus = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ slug: z.string().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data }): Promise<ProSlugStatus> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: pro } = await supabaseAdmin
      .from("professionals")
      .select("id, verification, is_published, suspended_at, city")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!pro) return { exists: false };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", pro.id)
      .maybeSingle();

    const fullName = profile?.full_name?.trim() ?? null;
    const firstName = fullName ? fullName.split(/\s+/)[0] : null;

    return {
      exists: true,
      verified: pro.verification === "verified",
      isPublished: !!pro.is_published,
      isSuspended: pro.suspended_at != null,
      displayName: fullName,
      city: pro.city ?? null,
      firstName,
    };
  });
