import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PROFESSION_SLUGS, type ProfessionSlug } from "@/lib/professions";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type DashboardProfile = {
  // identity (profiles)
  full_name: string;
  avatar_url: string | null;
  // professional fields
  headline: string | null; // "Tagline" in UI
  primary_profession: ProfessionSlug | null;
  secondary_professions: ProfessionSlug[];
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
          "headline, primary_profession, secondary_professions, city, public_phone, public_email, website, bio, specialisms, languages, social_instagram, social_linkedin, social_youtube, is_published, verification_status",
        )
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const proRow = (pro ?? {}) as Record<string, unknown>;
    const primary = proRow.primary_profession;
    const secondaryRaw = proRow.secondary_professions;

    return {
      full_name: profile?.full_name ?? "",
      avatar_url: profile?.avatar_url ?? null,
      headline: (proRow.headline as string | null) ?? null,
      primary_profession:
        typeof primary === "string" && (PROFESSION_SLUGS as string[]).includes(primary)
          ? (primary as ProfessionSlug)
          : null,
      secondary_professions: Array.isArray(secondaryRaw)
        ? (secondaryRaw.filter(
            (s): s is ProfessionSlug =>
              typeof s === "string" && (PROFESSION_SLUGS as string[]).includes(s),
          ) as ProfessionSlug[])
        : [],
      city: (proRow.city as string | null) ?? null,
      public_phone: (proRow.public_phone as string | null) ?? null,
      public_email: (proRow.public_email as string | null) ?? null,
      website: (proRow.website as string | null) ?? null,
      bio: (proRow.bio as string | null) ?? null,
      specialisms: (proRow.specialisms as string[] | null) ?? [],
      languages: (proRow.languages as string[] | null) ?? [],
      social_instagram: (proRow.social_instagram as string | null) ?? null,
      social_linkedin: (proRow.social_linkedin as string | null) ?? null,
      social_youtube: (proRow.social_youtube as string | null) ?? null,
      is_published: (proRow.is_published as boolean | null) ?? false,
      verification_status: (proRow.verification_status as string | null) ?? "pending",
    };
  });

/* -------------------------------------------------------------------------- */
/* Update                                                                      */
/* -------------------------------------------------------------------------- */

const ProfessionSlugSchema = z.enum(PROFESSION_SLUGS as [ProfessionSlug, ...ProfessionSlug[]]);

const UpdateInput = z.object({
  full_name: z.string().trim().min(1).max(120),
  headline: z.string().trim().max(160).nullable().optional(),
  primary_profession: ProfessionSlugSchema.nullable().optional(),
  secondary_professions: z.array(ProfessionSlugSchema).max(2).optional(),
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

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export const updateMyDashboardProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cleaned = emptyToNull(data);

    // De-dupe secondary against primary defensively (trigger also enforces).
    const secondary = (cleaned.secondary_professions ?? []).filter(
      (s) => s !== cleaned.primary_profession,
    );

    // Update profiles.full_name
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ full_name: cleaned.full_name })
      .eq("id", userId);
    if (pErr) throw pErr;

    // Derive slug from full name (with numeric suffix on collision)
    const base = slugify(cleaned.full_name) || "coach";
    let slug = base;
    for (let i = 2; i < 50; i++) {
      const { data: clash } = await supabase
        .from("professionals")
        .select("id")
        .eq("slug", slug)
        .neq("id", userId)
        .maybeSingle();
      if (!clash) break;
      slug = `${base}-${i}`;
    }

    const upsertPayload = {
      id: userId,
      slug,
      headline: cleaned.headline ?? null,
      primary_profession: cleaned.primary_profession ?? null,
      secondary_professions: secondary,
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
    } as unknown as Record<string, unknown>;

    // Upsert professionals row
    const { error: proErr } = await supabase
      .from("professionals")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(upsertPayload as any, { onConflict: "id" });
    if (proErr) throw proErr;

    return { ok: true, slug };
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
