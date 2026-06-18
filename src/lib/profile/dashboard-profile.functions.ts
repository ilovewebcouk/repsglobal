import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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
  // identity (profiles) — THREE-NAMES MODEL
  /** Legal name — must match ID + certs. Locked after identity approval. */
  full_name: string;
  /** Public-facing name (directory, shop-front). Defaults to full_name. */
  display_name: string | null;
  /** Trading / business name (invoices, shop-front header). Optional. */
  business_name: string | null;
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
  city: string | null;
  /** Internal-only — never rendered on any public page. E.164 format. */
  contact_phone: string | null;
  bio: string | null;
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
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardProfile> => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: pro }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, display_name, business_name, avatar_url")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("professionals")
        .select(
          "slug, headline, primary_profession, in_person_available, online_available, city, contact_phone, bio, specialisms, languages, social_instagram, social_linkedin, social_youtube, social_tiktok, social_x, is_published, verification_status, identity_status",
        )
        .eq("id", userId)
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
      full_name: (profRow.full_name as string | null) ?? "",
      display_name: (profRow.display_name as string | null) ?? null,
      business_name: (profRow.business_name as string | null) ?? null,
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
      city: (proRow.city as string | null) ?? null,
      contact_phone: (proRow.contact_phone as string | null) ?? null,
      bio: (proRow.bio as string | null) ?? null,
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
  full_name: z.string().trim().min(1).max(120),
  display_name: z.string().trim().max(120).nullable().optional(),
  business_name: z.string().trim().max(120).nullable().optional(),
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
  .middleware([requireSupabaseAuth])
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
    const { data: proCheck } = await supabase
      .from("professionals")
      .select("identity_status")
      .eq("id", userId)
      .maybeSingle();
    const idStatus = (proCheck as { identity_status?: string | null } | null)?.identity_status ?? null;
    const legalLocked = idStatus === "approved";

    // Build profile patch. Skip full_name when locked (DB trigger would
    // throw, but we'd rather not even attempt the update — gives a clean UX).
    const profilePatch: Record<string, unknown> = {
      display_name: cleaned.display_name ?? null,
      business_name: cleaned.business_name ?? null,
    };
    if (!legalLocked) {
      profilePatch.full_name = cleaned.full_name;
    }

    const { error: pErr } = await supabase
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(profilePatch as any)
      .eq("id", userId);
    if (pErr) throw pErr;

    // Slug derivation: display_name first (public-facing), fall back to full_name.
    const slugSource = (cleaned.display_name && cleaned.display_name.trim()) || cleaned.full_name;
    const base = slugify(slugSource) || "coach";
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
    return { ok: true, url };
  });
