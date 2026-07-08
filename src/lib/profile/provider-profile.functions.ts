/**
 * Training-provider Profile editor server functions.
 *
 * Loads / saves the provider's public identity + contact + company + socials.
 * Data is spread across three tables:
 *   - profiles         : business_name (public name), avatar_url (logo)
 *   - professionals    : contact_phone, contact_email, website_url,
 *                        year_established, company_number, social_*
 *   - websites         : hero_image_url, about, tagline
 *
 * Uses the impersonation-aware auth middleware so admins can edit on behalf of
 * a provider from the admin console.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

export type ProviderProfile = {
  name: string;
  slug: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  tagline: string | null;
  about: string | null;
  website_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  year_established: number | null;
  company_number: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
  social_x: string | null;
};

export const getMyProviderProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<ProviderProfile> => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: pro }, { data: site }] = await Promise.all([
      supabase
        .from("profiles")
        .select("business_name, full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("professionals")
        .select(
          "contact_phone, contact_email, website_url, year_established, company_number, social_instagram, social_linkedin, social_youtube, social_tiktok, social_x",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("websites")
        .select("hero_image_url, about, tagline")
        .eq("professional_id", userId)
        .maybeSingle(),
    ]);

    const pr = (profile ?? {}) as Record<string, unknown>;
    const p = (pro ?? {}) as Record<string, unknown>;
    const s = (site ?? {}) as Record<string, unknown>;

    return {
      name:
        (pr.business_name as string | null) ??
        (pr.full_name as string | null) ??
        "",
      logo_url: (pr.avatar_url as string | null) ?? null,
      hero_image_url: (s.hero_image_url as string | null) ?? null,
      tagline: (s.tagline as string | null) ?? null,
      about: (s.about as string | null) ?? null,
      website_url: (p.website_url as string | null) ?? null,
      contact_email: (p.contact_email as string | null) ?? null,
      contact_phone: (p.contact_phone as string | null) ?? null,
      year_established: (p.year_established as number | null) ?? null,
      company_number: (p.company_number as string | null) ?? null,
      social_instagram: (p.social_instagram as string | null) ?? null,
      social_linkedin: (p.social_linkedin as string | null) ?? null,
      social_youtube: (p.social_youtube as string | null) ?? null,
      social_tiktok: (p.social_tiktok as string | null) ?? null,
      social_x: (p.social_x as string | null) ?? null,
    };
  });

/**
 * Normalise a social input down to a handle/slug.
 * Strips protocol, host, leading @, trailing slash, surrounding whitespace.
 */
function normaliseSocial(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let v = String(raw).trim();
  if (!v) return null;
  v = v.replace(/^https?:\/\//i, "");
  if (v.includes("/")) {
    const parts = v.split("/").filter(Boolean);
    v = parts[parts.length - 1] ?? "";
  }
  v = v.replace(/^@+/, "").trim();
  return v || null;
}

const currentYear = new Date().getFullYear();

const UpdateInput = z.object({
  // `name` is accepted for backwards compatibility but ignored — name
  // changes go through the admin approval queue.
  name: z.string().trim().max(120).optional(),

  tagline: z.string().trim().max(160).nullable().optional(),
  about: z.string().trim().max(800).nullable().optional(),
  website_url: z
    .string()
    .trim()
    .max(500)
    .regex(/^https?:\/\/.+/i, "Website URL must start with http:// or https://")
    .nullable()
    .or(z.literal(""))
    .optional(),
  contact_email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(254)
    .nullable()
    .or(z.literal(""))
    .optional(),
  contact_phone: z
    .string()
    .trim()
    .regex(
      /^\+[1-9]\d{6,14}$/,
      "Enter a valid international phone number (e.g. +44 7911 123456).",
    )
    .nullable()
    .or(z.literal(""))
    .optional(),
  year_established: z
    .number()
    .int()
    .min(1800)
    .max(currentYear)
    .nullable()
    .optional(),
  company_number: z.string().trim().max(40).nullable().optional(),
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

export const updateMyProviderProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const c = emptyToNull(data);

    // NOTE: `name` (profiles.business_name) is NOT written here. Name
    // changes go through the admin approval queue via
    // `submitProviderNameChange` in provider-name.functions.ts. The `name`
    // field on this input is accepted for backwards compatibility but
    // ignored — the client submits name changes separately.


    // professionals: contact + company + socials.
    const proPatch = {
      contact_phone: c.contact_phone ?? null,
      contact_email: c.contact_email ?? null,
      website_url: c.website_url ?? null,
      year_established: c.year_established ?? null,
      company_number: c.company_number ?? null,
      social_instagram: normaliseSocial(c.social_instagram),
      social_linkedin: normaliseSocial(c.social_linkedin),
      social_youtube: normaliseSocial(c.social_youtube),
      social_tiktok: normaliseSocial(c.social_tiktok),
      social_x: normaliseSocial(c.social_x),
    } as Record<string, unknown>;
    const { error: proErr } = await supabase
      .from("professionals")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(proPatch as any)
      .eq("id", userId);
    if (proErr) throw proErr;

    // websites: about + tagline (upsert so first-time providers work).
    const { error: sErr } = await supabase
      .from("websites")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(
        {
          professional_id: userId,
          about: c.about ?? null,
          tagline: c.tagline ?? null,
        } as any,
        { onConflict: "professional_id" },
      );
    if (sErr) throw sErr;

    return { ok: true };
  });
