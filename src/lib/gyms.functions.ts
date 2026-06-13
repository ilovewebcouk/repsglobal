/**
 * Gym + professional_gyms server functions.
 *
 * Phase 1 of the "Trains at" / gyms feature. Backs:
 * - GymPicker in the dashboard profile editor
 * - Admin moderation queue
 * - Static "Where I train" chips on public profiles
 * - getGymDensity for Phase 2 shop-front consumption (computed live)
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ----------------------------- shapes ----------------------------- */

export type GymOption = {
  id: string;
  slug: string;
  name: string;
  chain_slug: string | null;
  chain_name: string | null;
  area: string | null;
  city: string | null;
  status: "active" | "pending_review" | "rejected";
};

export type ProGym = {
  id: string;
  gym_id: string;
  position: number;
  verified_by_gym: boolean;
  gym: GymOption;
};

/* ----------------------------- search ----------------------------- */

const searchInput = z.object({
  q: z.string().trim().max(80).default(""),
  limit: z.number().int().min(1).max(20).default(8),
});

export const searchGyms = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => searchInput.parse(d))
  .handler(async ({ data }): Promise<GymOption[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("gyms")
      .select("id, slug, name, chain_slug, chain_name, area, city, status")
      .eq("status", "active")
      .order("name", { ascending: true })
      .limit(data.limit);
    const term = data.q.trim();
    if (term.length > 0) {
      const pat = `%${term}%`;
      q = q.or(`name.ilike.${pat},area.ilike.${pat},city.ilike.${pat}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as GymOption[];
  });

/* ----------------------------- my gyms ----------------------------- */

export const getMyGyms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProGym[]> => {
    const { data, error } = await context.supabase
      .from("professional_gyms")
      .select(
        "id, gym_id, position, verified_by_gym, gym:gyms(id, slug, name, chain_slug, chain_name, area, city, status)",
      )
      .eq("professional_id", context.userId)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown) as ProGym[];
  });

/* ----------------------------- mutations ----------------------------- */

const addInput = z.object({ gym_id: z.string().uuid() });

export const addMyGym = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => addInput.parse(d))
  .handler(async ({ data, context }) => {
    // Find lowest free position 0..2.
    const { data: existing, error: exErr } = await context.supabase
      .from("professional_gyms")
      .select("position")
      .eq("professional_id", context.userId);
    if (exErr) throw new Error(exErr.message);
    const used = new Set((existing ?? []).map((r) => r.position));
    let pos = -1;
    for (let i = 0; i < 3; i++) {
      if (!used.has(i)) {
        pos = i;
        break;
      }
    }
    if (pos === -1) {
      throw new Error("You can list up to 3 gyms.");
    }
    const { error } = await context.supabase.from("professional_gyms").insert({
      professional_id: context.userId,
      gym_id: data.gym_id,
      position: pos,
    });
    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        throw new Error("This gym is already on your profile.");
      }
      throw new Error(error.message);
    }
    return { ok: true as const };
  });

const removeInput = z.object({ id: z.string().uuid() });

export const removeMyGym = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => removeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("professional_gyms")
      .delete()
      .eq("id", data.id)
      .eq("professional_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ----------------------------- request new gym ----------------------------- */

const requestInput = z.object({
  name: z.string().trim().min(2).max(80),
  area: z.string().trim().max(60).optional().default(""),
  city: z.string().trim().min(2).max(60),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const requestNewGym = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => requestInput.parse(d))
  .handler(async ({ data, context }) => {
    const base = slugify(`${data.name}-${data.area || data.city}`);
    let slug = base;
    let n = 1;
    // Check up to ~5 collisions; throttle trigger will block abuse anyway.
    while (n < 6) {
      const { data: existing } = await context.supabase
        .from("gyms")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      n += 1;
      slug = `${base}-${n}`;
    }
    const { data: row, error } = await context.supabase
      .from("gyms")
      .insert({
        slug,
        name: data.name,
        area: data.area || null,
        city: data.city,
        status: "pending_review",
        claim_status: "unclaimed",
        created_by: context.userId,
      })
      .select("id, slug, name, chain_slug, chain_name, area, city, status")
      .single();
    if (error) {
      // Surface human-readable throttle messages
      throw new Error(error.message);
    }
    // Attach immediately so the chip appears with a "pending review" marker.
    const { data: existing } = await context.supabase
      .from("professional_gyms")
      .select("position")
      .eq("professional_id", context.userId);
    const used = new Set((existing ?? []).map((r) => r.position));
    let pos = -1;
    for (let i = 0; i < 3; i++) {
      if (!used.has(i)) {
        pos = i;
        break;
      }
    }
    if (pos !== -1 && row) {
      await context.supabase.from("professional_gyms").insert({
        professional_id: context.userId,
        gym_id: row.id,
        position: pos,
      });
    }
    return { ok: true as const, gym: row as GymOption };
  });

/* ----------------------------- density (Phase 2 prep) ----------------------------- */

export type GymDensity = {
  gym_id: string;
  coach_count: number;
  top_specialisms: Array<{ slug: string; count: number }>;
};

const densityInput = z.object({ slug: z.string().min(1).max(80) });

export const getGymDensity = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => densityInput.parse(d))
  .handler(async ({ data }): Promise<GymDensity | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: gym } = await supabaseAdmin
      .from("gyms")
      .select("id")
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();
    if (!gym) return null;
    // Pull all linked pros + their specialisms in one round trip.
    const { data: links, error } = await supabaseAdmin
      .from("professional_gyms")
      .select("professional_id, professionals!inner(specialisms, is_published)")
      .eq("gym_id", gym.id);
    if (error) throw new Error(error.message);
    type Row = { professionals: { specialisms: string[] | null; is_published: boolean } | null };
    const published = ((links ?? []) as unknown as Row[]).filter(
      (r) => r.professionals?.is_published,
    );
    const counts = new Map<string, number>();
    for (const r of published) {
      for (const s of r.professionals?.specialisms ?? []) {
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
    }
    const top = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slug, count]) => ({ slug, count }));
    return {
      gym_id: gym.id,
      coach_count: published.length,
      top_specialisms: top,
    };
  });

/* ----------------------------- admin ----------------------------- */

export const adminListGyms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z.enum(["all", "pending_review", "active", "rejected"]).default("pending_review"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: roleOk } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!roleOk) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("gyms")
      .select(
        "id, slug, name, chain_slug, chain_name, area, city, status, created_by, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const adminUpdateInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "pending_review", "rejected"]).optional(),
  name: z.string().trim().min(2).max(80).optional(),
  area: z.string().trim().max(60).nullable().optional(),
  city: z.string().trim().min(2).max(60).optional(),
  chain_slug: z.string().trim().max(60).nullable().optional(),
  chain_name: z.string().trim().max(80).nullable().optional(),
});

export const adminUpdateGym = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => adminUpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: roleOk } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!roleOk) throw new Error("Forbidden");
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("gyms").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
