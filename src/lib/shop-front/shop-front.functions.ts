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
};

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
        "id, slug, headline, primary_profession, specialisms, city, in_person_available, online_available, member_since",
      )
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!pro) return null;

    const [{ data: sf }, { data: prof }, { data: services }] = await Promise.all([
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
    ]);

    if (!sf) return null;

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

    const [{ data: pro }, { data: prof }, { data: sf }, { data: services }] = await Promise.all([
      supabaseAdmin
        .from("professionals")
        .select(
          "id, slug, headline, primary_profession, specialisms, city, in_person_available, online_available",
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
    ]);

    if (!pro) return { shopFront: null, services: [] };

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
