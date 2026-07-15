import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";
import { PROFESSION_SLUGS, type ProfessionSlug } from "@/lib/professions";
import {
  SPECIALISM_SLUGS,
  MAX_SPECIALISMS,
  isSpecialismValidForProfession,
  type SpecialismSlug,
} from "@/lib/specialisms";
import { MAX_LANGUAGES } from "@/lib/languages";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type DashboardProfile = {
  // identity (profiles)
  /** Public / trading name. Locked after identity approval. */
  full_name: string | null;
  avatar_url: string | null;
  /** Mirror of professionals.identity_status — drives the legal-name lock. */
  identity_status: "none" | "pending" | "approved" | "rejected" | "needs_more_info" | "expired";
  /** True when legal name is immutable from the dashboard. */
  legal_name_locked: boolean;

  // professional fields
  slug: string | null;
  headline: string | null; // "Tagline" in UI
  primary_profession: ProfessionSlug | null;
  specialisms: SpecialismSlug[];
  in_person_available: boolean;
  online_available: boolean;
  /** Trains clients at their own home / private studio (no address shown publicly). */
  trains_at_home_studio: boolean;
  /** Travels to the client's home (mobile PT). */
  trains_at_clients_home: boolean;
  city: string | null;
  /** Internal-only — never rendered on any public page. E.164 format. */
  contact_phone: string | null;
  /** DEPRECATED: legacy `professionals.bio`. Editors now write `websites.about`. */
  bio: string | null;
  /** Live public "About" copy from `websites.about`. Source of truth for completeness. */
  about: string | null;
  languages: string[];
  social_instagram: string | null;
  social_linkedin: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
  social_x: string | null;
  is_published: boolean;
  verification_status: string;
};

/* -------------------------------------------------------------------------- */
/* Read                                                                        */
/* -------------------------------------------------------------------------- */

export const getMyDashboardProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<DashboardProfile> => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: pro }, { data: site }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("professionals")
        .select(
          "slug, headline, primary_profession, in_person_available, online_available, trains_at_home_studio, trains_at_clients_home, city, contact_phone, bio, specialisms, languages, social_instagram, social_linkedin, social_youtube, social_tiktok, social_x, is_published, verification_status, identity_status",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("websites")
        .select("about")
        .eq("professional_id", userId)
        .maybeSingle(),
    ]);

    const proRow = (pro ?? {}) as Record<string, unknown>;
    const profRow = (profile ?? {}) as Record<string, unknown>;
    const primary = proRow.primary_profession;
    const specialismsRaw = proRow.specialisms;
    const idStatusRaw = (proRow.identity_status as string | null) ?? "none";
    const idStatus = (
      ["none", "pending", "approved", "rejected", "needs_more_info", "expired"].includes(idStatusRaw)
        ? idStatusRaw
        : "none"
    ) as DashboardProfile["identity_status"];

    return {
      full_name: (profRow.full_name as string | null) ?? null,
      avatar_url: (profRow.avatar_url as string | null) ?? null,
      identity_status: idStatus,
      legal_name_locked: idStatus === "approved",
      slug: (proRow.slug as string | null) ?? null,
      headline: (proRow.headline as string | null) ?? null,
      primary_profession:
        typeof primary === "string" && (PROFESSION_SLUGS as string[]).includes(primary)
          ? (primary as ProfessionSlug)
          : null,
      specialisms: Array.isArray(specialismsRaw)
        ? (specialismsRaw.filter(
            (s): s is SpecialismSlug =>
              typeof s === "string" && (SPECIALISM_SLUGS as string[]).includes(s),
          ) as SpecialismSlug[])
        : [],
      in_person_available: (proRow.in_person_available as boolean | null) ?? true,
      online_available: (proRow.online_available as boolean | null) ?? true,
      trains_at_home_studio: (proRow.trains_at_home_studio as boolean | null) ?? false,
      trains_at_clients_home: (proRow.trains_at_clients_home as boolean | null) ?? false,
      city: (proRow.city as string | null) ?? null,
      contact_phone: (proRow.contact_phone as string | null) ?? null,
      bio: (proRow.bio as string | null) ?? null,
      about: ((site as { about?: string | null } | null)?.about as string | null) ?? null,
      languages: (proRow.languages as string[] | null) ?? [],
      social_instagram: (proRow.social_instagram as string | null) ?? null,
      social_linkedin: (proRow.social_linkedin as string | null) ?? null,
      social_youtube: (proRow.social_youtube as string | null) ?? null,
      social_tiktok: (proRow.social_tiktok as string | null) ?? null,
      social_x: (proRow.social_x as string | null) ?? null,
      is_published: (proRow.is_published as boolean | null) ?? false,
      verification_status: (proRow.verification_status as string | null) ?? "pending",
    };
  });

/* -------------------------------------------------------------------------- */
/* Update                                                                      */
/* -------------------------------------------------------------------------- */

const ProfessionSlugSchema = z.enum(
  PROFESSION_SLUGS as [ProfessionSlug, ...ProfessionSlug[]],
);
const SpecialismSlugSchema = z.enum(
  SPECIALISM_SLUGS as [SpecialismSlug, ...SpecialismSlug[]],
);

/**
 * Normalise a social input down to a handle/slug.
 * Strips protocol, host, leading @, trailing slash, and surrounding whitespace.
 * Returns null for empty input so the column clears cleanly.
 */
function normaliseSocial(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let v = String(raw).trim();
  if (!v) return null;
  // Strip protocol + host (anything up to and including the first '/')
  v = v.replace(/^https?:\/\//i, "");
  // If a host slipped in (e.g. instagram.com/handle), drop it.
  if (v.includes("/")) {
    const parts = v.split("/").filter(Boolean);
    v = parts[parts.length - 1] ?? "";
  }
  v = v.replace(/^@+/, "").trim();
  return v || null;
}

const UpdateInput = z.object({
  full_name: z.string().trim().max(120).nullable().optional(),
  headline: z.string().trim().max(160).nullable().optional(),
  primary_profession: ProfessionSlugSchema.nullable().optional(),
  specialisms: z.array(SpecialismSlugSchema).max(MAX_SPECIALISMS).optional(),
  in_person_available: z.boolean().optional(),
  online_available: z.boolean().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  // E.164: leading + then 7–15 digits (first digit 1–9). Stored internally only.
  contact_phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "Enter a valid international phone number (e.g. +44 7911 123456).")
    .nullable()
    .or(z.literal(""))
    .optional(),
  bio: z.string().trim().max(4000).nullable().optional(),
  languages: z.array(z.string().trim().min(1).max(40)).max(MAX_LANGUAGES).optional(),
  social_instagram: z.string().trim().max(120).nullable().optional(),
  social_linkedin: z.string().trim().max(120).nullable().optional(),
  social_youtube: z.string().trim().max(120).nullable().optional(),
  social_tiktok: z.string().trim().max(120).nullable().optional(),
  social_x: z.string().trim().max(120).nullable().optional(),
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
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cleaned = emptyToNull(data);

    // Enforce at least one delivery mode when both are present.
    const inPerson = cleaned.in_person_available ?? true;
    const online = cleaned.online_available ?? true;
    if (!inPerson && !online) {
      throw new Error("Pick at least one delivery mode (in person or online).");
    }

    // Read current identity_status to decide whether full_name can change.
    // Also read account_type + slug so we defensively preserve organisation
    // (training-provider) identity on the generic professional dashboard save.
    // Provider name/slug changes must flow through the provider name-change
    // request pipeline (and admin renameProvider), never the coach dashboard.
    const { data: proCheck } = await supabase
      .from("professionals")
      .select("identity_status, account_type, slug")
      .eq("id", userId)
      .maybeSingle();
    const idStatus = (proCheck as { identity_status?: string | null } | null)?.identity_status ?? null;
    const legalLocked = idStatus === "approved";
    const existingAccountType =
      (proCheck as { account_type?: string | null } | null)?.account_type ?? null;
    const existingSlug =
      (proCheck as { slug?: string | null } | null)?.slug ?? null;
    const isOrganisation = existingAccountType === "training_provider";

    // Build profile patch. Skip full_name when locked (DB trigger would
    // throw, but we'd rather not even attempt the update — gives a clean UX).
    const profilePatch: Record<string, unknown> = { full_name: cleaned.full_name ?? null,  };
    // Organisations' full_name is the canonical provider name — do not
    // overwrite from this generic form. Renames go through admin/provider flow.
    if (!isOrganisation && !legalLocked) {
      profilePatch.full_name = cleaned.full_name ?? null;
    }

    const { error: pErr } = await supabase
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(profilePatch as any)
      .eq("id", userId);
    if (pErr) throw pErr;

    // Slug derivation from full_name. Organisations keep their existing
    // (provider) slug — never rederive here.
    let slug: string;
    if (isOrganisation && existingSlug) {
      slug = existingSlug;
    } else {
      const slugSource = (cleaned.full_name ?? "").trim() || "coach";

      const base = slugify(slugSource) || "coach";
      slug = base;
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
    }


    // Drop any specialism that isn't valid for the chosen profession.
    // The DB trigger only enforces the global allow-list; we enforce the
    // per-profession pairing in app code.
    const nextProfession = cleaned.primary_profession ?? null;
    const filteredSpecs = (cleaned.specialisms ?? []).filter((s) =>
      isSpecialismValidForProfession(s, nextProfession),
    );

    const upsertPayload = {
      id: userId,
      slug,
      headline: cleaned.headline ?? null,
      primary_profession: nextProfession,
      specialisms: filteredSpecs,
      in_person_available: inPerson,
      online_available: online,
      city: cleaned.city ?? null,
      contact_phone: cleaned.contact_phone ?? null,
      bio: cleaned.bio ?? null,
      languages: cleaned.languages ?? [],
      social_instagram: normaliseSocial(cleaned.social_instagram),
      social_linkedin: normaliseSocial(cleaned.social_linkedin),
      social_youtube: normaliseSocial(cleaned.social_youtube),
      social_tiktok: normaliseSocial(cleaned.social_tiktok),
      social_x: normaliseSocial(cleaned.social_x),
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
/* Training-base toggles (home / private studio, client's home)                */
/* -------------------------------------------------------------------------- */

export const updateMyTrainingBase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) =>
    z
      .object({
        trains_at_home_studio: z.boolean(),
        trains_at_clients_home: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("professionals")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        trains_at_home_studio: data.trains_at_home_studio,
        trains_at_clients_home: data.trains_at_clients_home,
      } as any)
      .eq("id", userId);
    if (error) throw error;
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
  .middleware([requireSupabaseAuthWithImpersonation])
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
    return { ok: true, url };
  });

// Upload a logo/avatar image server-side (base64 data URL). Uses service-role
// so it works both for the signed-in owner AND when an admin is impersonating
// a provider — client-side supabase.storage.upload trips storage RLS in the
// impersonation case because the browser JWT's auth.uid is the admin's, not
// the professional's. Mirrors uploadHeroFromBase64.
export const uploadAvatarFromBase64 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) =>
    z
      .object({
        dataUrl: z.string().min(20).max(10 * 1024 * 1024),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.exec(
      data.dataUrl,
    );
    if (!match) throw new Error("Invalid image data URL");
    const rawExt = match[1].toLowerCase();
    const ext = rawExt === "png" ? "png" : rawExt === "webp" ? "webp" : "jpg";
    const contentType =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 5 * 1024 * 1024) {
      throw new Error("Image is over 5 MB after encoding — try a smaller source");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const objectPath = `${userId}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(objectPath, bytes, {
        contentType,
        upsert: true,
        cacheControl: "31536000",
      });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
    return { path: objectPath };
  });

