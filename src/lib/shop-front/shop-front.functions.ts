// Server functions for shop-front (/c/$slug) + services management.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ShopFrontUpsertSchema = z.object({
  tagline: z.string().trim().max(200).nullable().optional(),
  about: z.string().trim().max(4000).nullable().optional(),
  hero_image_url: z.string().trim().url().max(500).nullable().optional(),
  accent_hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  layout_variant: z.enum(["lite", "full"]).optional(),
  is_published: z.boolean().optional(),
});

export type ShopFrontDTO = {
  professional_id: string;
  tagline: string | null;
  about: string | null;
  hero_image_url: string | null;
  accent_hex: string | null;
  layout_variant: "lite" | "full";
  is_published: boolean;
  published_at: string | null;
  // Embedded pro info for the public page
  slug: string | null;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  primary_profession: string | null;
  specialisms: string[];
  city: string | null;
  in_person_available: boolean;
  online_available: boolean;
  member_since: string | null;
  coaching_since_year: number | null;
  // Subscription tier of the pro (so callers can gate Pro-only surfaces).
  tier: "verified" | "pro" | "studio" | null;
  // Trust block (public-safe summary).
  trust: {
    isVerified: boolean;
    primaryTitleSlug: string | null;
    insuranceExpiry: string | null;
    activeCredentialsCount: number;
    lastCheckedAt: string | null;
    items: Array<{
      kind: "qualification" | "insurance";
      title: string;
      issuer: string;
      id: string | null;
      dateLabel: string | null;
    }>;
  };
};


// Helper: earliest year from approved verification submissions whose
// derived_title_slug matches the pro's primary_title_slug.
async function fetchCoachingSinceYear(
  supabaseAdmin: { from: (t: string) => any },
  professionalId: string,
  primaryTitleSlug: string | null,
): Promise<number | null> {
  if (!primaryTitleSlug) return null;
  const { data } = await supabaseAdmin
    .from("verification_submissions")
    .select("issue_date, year")
    .eq("professional_id", professionalId)
    .eq("status", "approved")
    .eq("derived_title_slug", primaryTitleSlug);
  if (!data || data.length === 0) return null;
  let earliest: number | null = null;
  for (const row of data as Array<{ issue_date: string | null; year: number | null }>) {
    let y: number | null = null;
    if (row.issue_date) {
      const parsed = new Date(row.issue_date);
      if (!isNaN(parsed.getTime())) y = parsed.getFullYear();
    }
    if (y == null && row.year != null) y = row.year;
    if (y != null && (earliest == null || y < earliest)) earliest = y;
  }
  return earliest;
}

// Helper: public-safe trust summary used by both shop-front readers.
async function fetchTrustSummary(
  supabaseAdmin: { from: (t: string) => any },
  professionalId: string,
  primaryTitleSlug: string | null,
): Promise<ShopFrontDTO["trust"]> {
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: pro }, { data: ins }, { data: subs }] = await Promise.all([
    supabaseAdmin
      .from("professionals")
      .select("identity_status, identity_verified_at")
      .eq("id", professionalId)
      .maybeSingle(),
    supabaseAdmin
      .from("insurance_policies")
      .select("status, expiry_date, provider, policy_number")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("verification_submissions")
      .select(
        "status, reviewed_at, qualification, awarding_body, certificate_number, issue_date, year",
      )
      .eq("professional_id", professionalId),
  ]);

  const allSubs = (subs ?? []) as Array<{
    status: string | null;
    reviewed_at: string | null;
    qualification: string | null;
    awarding_body: string | null;
    certificate_number: string | null;
    issue_date: string | null;
    year: number | null;
  }>;
  const approved = allSubs.filter((s) => s.status === "approved");
  const insRow = ins as {
    status: string | null;
    expiry_date: string | null;
    provider: string | null;
    policy_number: string | null;
  } | null;
  const insActive =
    insRow?.status === "active" && (!insRow.expiry_date || insRow.expiry_date >= today);
  const idApproved = (pro as { identity_status: string | null } | null)?.identity_status === "approved";
  const reviewedDates = [
    ...approved.map((s) => s.reviewed_at).filter((x): x is string => !!x),
    (pro as { identity_verified_at: string | null } | null)?.identity_verified_at ?? null,
  ].filter((x): x is string => !!x).sort();

  const fmtMonthYear = (iso: string | null): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  };

  const items: ShopFrontDTO["trust"]["items"] = [];
  for (const q of approved) {
    if (!q.qualification) continue;
    const dateLabel =
      fmtMonthYear(q.issue_date) ?? (q.year ? String(q.year) : null);
    items.push({
      kind: "qualification",
      title: q.qualification,
      issuer: q.awarding_body ?? "Awarding body",
      id: q.certificate_number ?? null,
      dateLabel,
    });
  }
  if (insActive && insRow) {
    items.push({
      kind: "insurance",
      title: "Professional Indemnity Insurance",
      issuer: insRow.provider ?? "Insurer",
      id: insRow.policy_number ?? null,
      dateLabel: insRow.expiry_date
        ? `Active until ${fmtMonthYear(insRow.expiry_date) ?? insRow.expiry_date}`
        : "Active",
    });
  }

  return {
    isVerified: idApproved && insActive && approved.length > 0,
    primaryTitleSlug,
    insuranceExpiry: insActive ? insRow?.expiry_date ?? null : null,
    activeCredentialsCount: approved.length,
    lastCheckedAt: reviewedDates.at(-1) ?? null,
    items,
  };
}

export type ServiceDTO = {
  id: string;
  professional_id: string;
  title: string;
  description: string | null;
  price_pence: number | null;
  price_label: string | null;
  duration_minutes: number | null;
  mode: string;
  sort_order: number;
  is_published: boolean;
  is_featured: boolean;
};

/* ---------------- Public reads ---------------- */

export const getShopFrontBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<{ shopFront: ShopFrontDTO; services: ServiceDTO[] } | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pro } = await supabaseAdmin
      .from("professionals")
      .select(
        "id, slug, headline, primary_profession, primary_title_slug, specialisms, city, in_person_available, online_available, member_since",
      )
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!pro) return null;

    // Phase 5 public-visibility gate: hide shop-fronts for pros with no active sub.
    const { isProPubliclyVisible } = await import(
      "@/lib/visibility/public-gate.server"
    );
    if (!(await isProPubliclyVisible(pro.id))) return null;

    const [{ data: sf }, { data: prof }, { data: services }, { data: subRow }, coachingSinceYear, trust] = await Promise.all([
      supabaseAdmin
        .from("shop_fronts")
        .select(
          "professional_id, tagline, about, hero_image_url, accent_hex, layout_variant, is_published, published_at",
        )
        .eq("professional_id", pro.id)
        .eq("is_published", true)
        .maybeSingle(),
      supabaseAdmin.from("profiles").select("full_name, avatar_url").eq("id", pro.id).maybeSingle(),
      supabaseAdmin
        .from("services")
        .select(
          "id, professional_id, title, description, price_pence, price_label, duration_minutes, mode, sort_order, is_published, is_featured",
        )
        .eq("professional_id", pro.id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("subscriptions")
        .select("tier, status")
        .eq("user_id", pro.id)
        .maybeSingle(),
      fetchCoachingSinceYear(supabaseAdmin, pro.id, pro.primary_title_slug ?? null),
      fetchTrustSummary(supabaseAdmin, pro.id, pro.primary_title_slug ?? null),
    ]);

    if (!sf) return null;

    const tier =
      subRow && ["verified", "pro", "studio"].includes(subRow.tier as string)
        ? (subRow.tier as "verified" | "pro" | "studio")
        : null;


    return {
      shopFront: {
        professional_id: pro.id,
        tagline: sf.tagline,
        about: sf.about,
        hero_image_url: sf.hero_image_url,
        accent_hex: sf.accent_hex,
        layout_variant: (sf.layout_variant as "lite" | "full") ?? "lite",
        is_published: sf.is_published,
        published_at: sf.published_at,
        slug: pro.slug,
        full_name: prof?.full_name ?? null,
        avatar_url: prof?.avatar_url ?? null,
        headline: pro.headline,
        primary_profession: pro.primary_profession,
        specialisms: Array.isArray(pro.specialisms) ? pro.specialisms : [],
        city: pro.city,
        in_person_available: !!pro.in_person_available,
        online_available: !!pro.online_available,
        member_since: pro.member_since ?? null,
        coaching_since_year: coachingSinceYear,
        tier,
        trust,
      },
      services: (services ?? []) as ServiceDTO[],
    };
  });

/* ---------------- Pro-side reads / writes ---------------- */

export const getMyShopFront = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ shopFront: ShopFrontDTO | null; services: ServiceDTO[] }> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: pro }, { data: prof }, { data: sf }, { data: services }, { data: subRow }] =
      await Promise.all([
        supabaseAdmin
          .from("professionals")
          .select(
            "id, slug, headline, primary_profession, primary_title_slug, specialisms, city, in_person_available, online_available, member_since",
          )
          .eq("id", userId)
          .maybeSingle(),
        supabaseAdmin.from("profiles").select("full_name, avatar_url").eq("id", userId).maybeSingle(),
        supabaseAdmin
          .from("shop_fronts")
          .select(
            "professional_id, tagline, about, hero_image_url, accent_hex, layout_variant, is_published, published_at",
          )
          .eq("professional_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("services")
          .select(
            "id, professional_id, title, description, price_pence, price_label, duration_minutes, mode, sort_order, is_published, is_featured",
          )
          .eq("professional_id", userId)
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("subscriptions")
          .select("tier, status")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    if (!pro) return { shopFront: null, services: [] };

    const [coachingSinceYear, trust] = await Promise.all([
      fetchCoachingSinceYear(supabaseAdmin, userId, pro.primary_title_slug ?? null),
      fetchTrustSummary(supabaseAdmin, userId, pro.primary_title_slug ?? null),
    ]);

    const tier =
      subRow && ["verified", "pro", "studio"].includes(subRow.tier as string)
        ? (subRow.tier as "verified" | "pro" | "studio")
        : null;

    const shopFront: ShopFrontDTO | null = sf
      ? {
          professional_id: userId,
          tagline: sf.tagline,
          about: sf.about,
          hero_image_url: sf.hero_image_url,
          accent_hex: sf.accent_hex,
          layout_variant: (sf.layout_variant as "lite" | "full") ?? "lite",
          is_published: sf.is_published,
          published_at: sf.published_at,
          slug: pro.slug,
          full_name: prof?.full_name ?? null,
          avatar_url: prof?.avatar_url ?? null,
          headline: pro.headline,
          primary_profession: pro.primary_profession,
          specialisms: Array.isArray(pro.specialisms) ? pro.specialisms : [],
          city: pro.city,
          in_person_available: !!pro.in_person_available,
          online_available: !!pro.online_available,
          member_since: pro.member_since ?? null,
          coaching_since_year: coachingSinceYear,
          tier,
          trust,
        }
      : null;

    return { shopFront, services: (services ?? []) as ServiceDTO[] };

  });

export const upsertMyShopFront = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ShopFrontUpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch = { ...data, professional_id: userId } as {
      professional_id: string;
      published_at?: string;
    } & z.infer<typeof ShopFrontUpsertSchema>;
    if (data.is_published === true) patch.published_at = new Date().toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("shop_fronts")
      .upsert(patch, { onConflict: "professional_id" })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

/* ---------------- Services CRUD ---------------- */

const ServiceUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  price_pence: z.number().int().min(0).max(10_000_00).nullable().optional(),
  price_label: z.string().trim().max(60).nullable().optional(),
  duration_minutes: z.number().int().min(0).max(600).nullable().optional(),
  mode: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  sort_order: z.number().int().min(0).max(99).default(0),
  is_published: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

export const upsertMyService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ServiceUpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = { ...data, professional_id: userId } as z.infer<typeof ServiceUpsertSchema> & {
      professional_id: string;
    };
    const { data: row, error } = await supabaseAdmin
      .from("services")
      .upsert(patch)
      .select()
      .single();
    if (error) throw error;
    return row as ServiceDTO;
  });

export const deleteMyService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("services")
      .delete()
      .eq("id", data.id)
      .eq("professional_id", userId);
    if (error) throw error;
    return { ok: true };
  });
