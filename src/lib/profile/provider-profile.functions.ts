/**
 * Training-provider Profile editor server functions.
 *
 * Loads / saves the provider's public identity + contact + company + socials.
 * Data is spread across three tables:
 *   - profiles         : full_name (public name), avatar_url (logo)
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
  address: string | null;


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
        .select("full_name, full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("professionals")
        .select(
          "slug, contact_phone, contact_email, website_url, address, social_instagram, social_linkedin, social_youtube, social_tiktok, social_x",
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
        (pr.full_name as string | null) ??
        (pr.full_name as string | null) ??
        "",
      slug: (p.slug as string | null) ?? null,
      logo_url: (pr.avatar_url as string | null) ?? null,
      hero_image_url: (s.hero_image_url as string | null) ?? null,
      tagline: (s.tagline as string | null) ?? null,
      about: (s.about as string | null) ?? null,
      website_url: (p.website_url as string | null) ?? null,
      contact_email: (p.contact_email as string | null) ?? null,
      contact_phone: (p.contact_phone as string | null) ?? null,
      address: (p.address as string | null) ?? null,


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
  address: z.string().trim().max(500).nullable().optional(),


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

/**
 * Save profile changes.
 *
 * NOTE: as of the provider approval overhaul, EVERY public-facing field is
 * routed through `provider_change_requests` and admin approval — nothing is
 * written directly to `professionals` / `websites`. The `name` field goes
 * through `provider_name_requests` via `submitProviderNameChange` on the
 * client. `contact_email` and `website_url` are locked once the domain has
 * been verified (client-side guard).
 */
export const updateMyProviderProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; submitted: number }> => {
    const { supabase, userId } = context;
    const sb = supabase as any;
    const c = emptyToNull(data);

    // Load current values so we only enqueue actual diffs.
    const [{ data: pro }, { data: site }] = await Promise.all([
      sb
        .from("professionals")
        .select(
          "contact_phone, contact_email, website_url, address, social_instagram, social_linkedin, social_youtube, social_tiktok, social_x",
        )
        .eq("id", userId)
        .maybeSingle(),
      sb
        .from("websites")
        .select("tagline, about")
        .eq("professional_id", userId)
        .maybeSingle(),
    ]);
    const p = (pro ?? {}) as Record<string, unknown>;
    const s = (site ?? {}) as Record<string, unknown>;

    type Row = {
      field_group: "identity" | "about" | "contact" | "company" | "social";
      field_key: string;
      proposed: string | null;
      current: string | null;
    };

    const toStr = (v: unknown): string | null =>
      v == null || v === "" ? null : String(v);

    const rows: Row[] = [
      { field_group: "about",   field_key: "tagline",            proposed: toStr(c.tagline),            current: toStr(s.tagline) },
      { field_group: "about",   field_key: "about",              proposed: toStr(c.about),              current: toStr(s.about) },
      { field_group: "contact", field_key: "website_url",        proposed: toStr(c.website_url),        current: toStr(p.website_url) },
      { field_group: "contact", field_key: "contact_email",      proposed: toStr(c.contact_email),      current: toStr(p.contact_email) },
      { field_group: "contact", field_key: "contact_phone",      proposed: toStr(c.contact_phone),      current: toStr(p.contact_phone) },
      { field_group: "contact", field_key: "address",            proposed: toStr(c.address),            current: toStr(p.address) },


      { field_group: "social",  field_key: "social_instagram",   proposed: normaliseSocial(c.social_instagram), current: toStr(p.social_instagram) },
      { field_group: "social",  field_key: "social_linkedin",    proposed: normaliseSocial(c.social_linkedin),  current: toStr(p.social_linkedin) },
      { field_group: "social",  field_key: "social_youtube",     proposed: normaliseSocial(c.social_youtube),   current: toStr(p.social_youtube) },
      { field_group: "social",  field_key: "social_tiktok",      proposed: normaliseSocial(c.social_tiktok),    current: toStr(p.social_tiktok) },
      { field_group: "social",  field_key: "social_x",           proposed: normaliseSocial(c.social_x),         current: toStr(p.social_x) },
    ];

    // Only submit a value the caller actually provided (undefined → skip).
    const provided = new Set(
      Object.entries(c)
        .filter(([, v]) => v !== undefined)
        .map(([k]) => k),
    );

    const toInsert = rows
      .filter((r) => provided.has(r.field_key))
      .filter((r) => (r.proposed ?? null) !== (r.current ?? null))
      .map((r) => ({
        provider_id: userId,
        field_group: r.field_group,
        field_key: r.field_key,
        proposed_value: { value: r.proposed },
        current_value: { value: r.current },
        status: "pending" as const,
      }));

    if (toInsert.length === 0) return { ok: true, submitted: 0 };

    const { error } = await sb
      .from("provider_change_requests")
      .insert(toInsert);
    if (error) throw new Error(error.message);

    return { ok: true, submitted: toInsert.length };
  });
