import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type DashboardProfile = {
  // identity (profiles)
  full_name: string;
  avatar_url: string | null;
  // professional fields
  cover_url: string | null;
  headline: string | null; // "Professional title"
  trading_name: string | null; // "Business / gym name"
  city: string | null;
  public_phone: string | null;
  public_email: string | null;
  website: string | null;
  bio: string | null;
  specialisms: string[];
  languages: string[];
  social_instagram: string | null;
  social_linkedin: string | null;
  social_youtube: string | null;
  is_published: boolean;
  verification_status: string;
};

/* -------------------------------------------------------------------------- */
/* Read                                                                        */
/* -------------------------------------------------------------------------- */

export const getMyDashboardProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardProfile> => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: pro }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("professionals")
        .select(
          "cover_url, headline, trading_name, city, public_phone, public_email, website, bio, specialisms, languages, social_instagram, social_linkedin, social_youtube, is_published, verification_status",
        )
        .eq("id", userId)
        .maybeSingle(),
    ]);

    return {
      full_name: profile?.full_name ?? "",
      avatar_url: profile?.avatar_url ?? null,
      cover_url: pro?.cover_url ?? null,
      headline: pro?.headline ?? null,
      trading_name: pro?.trading_name ?? null,
      city: pro?.city ?? null,
      public_phone: pro?.public_phone ?? null,
      public_email: pro?.public_email ?? null,
      website: pro?.website ?? null,
      bio: pro?.bio ?? null,
      specialisms: pro?.specialisms ?? [],
      languages: pro?.languages ?? [],
      social_instagram: pro?.social_instagram ?? null,
      social_linkedin: pro?.social_linkedin ?? null,
      social_youtube: pro?.social_youtube ?? null,
      is_published: pro?.is_published ?? false,
      verification_status: pro?.verification_status ?? "pending",
    };
  });

/* -------------------------------------------------------------------------- */
/* Update                                                                      */
/* -------------------------------------------------------------------------- */

const UpdateInput = z.object({
  full_name: z.string().trim().min(1).max(120),
  headline: z.string().trim().max(160).nullable().optional(),
  trading_name: z.string().trim().max(160).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  public_phone: z.string().trim().max(40).nullable().optional(),
  public_email: z.string().trim().email().max(255).nullable().or(z.literal("")).optional(),
  website: z.string().trim().max(255).nullable().optional(),
  bio: z.string().trim().max(4000).nullable().optional(),
  specialisms: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  languages: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  social_instagram: z.string().trim().max(120).nullable().optional(),
  social_linkedin: z.string().trim().max(120).nullable().optional(),
  social_youtube: z.string().trim().max(120).nullable().optional(),
});

function emptyToNull<T extends Record<string, unknown>>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    out[k] = typeof v === "string" && v.trim() === "" ? null : v;
  }
  return out as T;
}

export const updateMyDashboardProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cleaned = emptyToNull(data);

    // Update profiles.full_name
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ full_name: cleaned.full_name })
      .eq("id", userId);
    if (pErr) throw pErr;

    // Upsert professionals row
    const { error: proErr } = await supabase.from("professionals").upsert(
      {
        id: userId,
        headline: cleaned.headline ?? null,
        trading_name: cleaned.trading_name ?? null,
        city: cleaned.city ?? null,
        public_phone: cleaned.public_phone ?? null,
        public_email: cleaned.public_email ?? null,
        website: cleaned.website ?? null,
        bio: cleaned.bio ?? null,
        specialisms: cleaned.specialisms ?? [],
        languages: cleaned.languages ?? [],
        social_instagram: cleaned.social_instagram ?? null,
        social_linkedin: cleaned.social_linkedin ?? null,
        social_youtube: cleaned.social_youtube ?? null,
      },
      { onConflict: "id" },
    );
    if (proErr) throw proErr;

    return { ok: true };
  });

/* -------------------------------------------------------------------------- */
/* Avatar + Cover                                                              */
/*                                                                             */
/* Client uploads the file directly to the `avatars` bucket using the          */
/* signed-in supabase client (RLS lets the user write into their own folder).  */
/* Then it calls these server fns with the storage path; the server signs a    */
/* long-lived URL (1 year) and writes the URL to profiles / professionals.     */
/* -------------------------------------------------------------------------- */

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

async function signOneYearUrl(path: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from("avatars")
    .createSignedUrl(path, ONE_YEAR_SECONDS);
  if (error || !data?.signedUrl) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}

export const updateMyAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ path: z.string().min(1).max(500).nullable() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const url = data.path ? await signOneYearUrl(data.path) : null;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", userId);
    if (error) throw error;
    return { url };
  });

export const updateMyCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ path: z.string().min(1).max(500).nullable() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const url = data.path ? await signOneYearUrl(data.path) : null;
    const { error } = await supabase
      .from("professionals")
      .upsert({ id: userId, cover_url: url }, { onConflict: "id" });
    if (error) throw error;
    return { url };
  });
