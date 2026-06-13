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
  source?: "curated" | "google_places" | "user_submission";
  coach_count?: number;
};

export type ExternalGymOption = {
  placeId: string;
  name: string;
  formattedAddress: string;
  area: string | null;
  city: string | null;
};

export type SearchResults = {
  local: GymOption[];
  external: ExternalGymOption[];
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
  .handler(async ({ data }): Promise<SearchResults> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("gyms")
      .select("id, slug, name, chain_slug, chain_name, area, city, status, source")
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
    const local = (rows ?? []) as GymOption[];

    // Density counts for any local results (powers "· N trainers here" hint).
    let withCounts: GymOption[] = local;
    if (local.length > 0) {
      const ids = local.map((g) => g.id);
      const { data: counts } = await supabaseAdmin
        .from("professional_gyms")
        .select("gym_id")
        .in("gym_id", ids);
      const tally = new Map<string, number>();
      for (const r of (counts ?? []) as Array<{ gym_id: string }>) {
        tally.set(r.gym_id, (tally.get(r.gym_id) ?? 0) + 1);
      }
      withCounts = local.map((g) => ({ ...g, coach_count: tally.get(g.id) ?? 0 }));
    }

    // Google fallback when local results are sparse.
    let external: ExternalGymOption[] = [];
    if (term.length >= 3 && local.length < 5) {
      try {
        const { placesTextSearch } = await import("./google-places.server");
        const hits = await placesTextSearch(term, { maxResults: 8 });
        // De-dupe against already-imported Google rows in local set.
        const { data: known } = await supabaseAdmin
          .from("gyms")
          .select("google_place_id")
          .in(
            "google_place_id",
            hits.map((h) => h.placeId),
          );
        const knownIds = new Set(
          ((known ?? []) as Array<{ google_place_id: string | null }>)
            .map((r) => r.google_place_id)
            .filter(Boolean) as string[],
        );
        external = hits
          .filter((h) => !knownIds.has(h.placeId))
          .slice(0, 5)
          .map((h) => ({
            placeId: h.placeId,
            name: h.name,
            formattedAddress: h.formattedAddress,
            area: h.area,
            city: h.locality,
          }));
      } catch (e) {
        // Soft-fail external search — local results are still useful.
        console.warn("[searchGyms] external fallback failed:", e instanceof Error ? e.message : e);
      }
    }

    return { local: withCounts, external };
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
        "id, slug, name, chain_slug, chain_name, area, city, status, source, lat, created_by, created_at",
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

/* ----------------------------- Google Places import ----------------------------- */

const importInput = z.object({ placeId: z.string().min(5).max(200) });

export const importGoogleGym = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => importInput.parse(d))
  .handler(async ({ data, context }) => {
    // Rate limit: max 10 Google imports per pro per hour.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count: recent } = await supabaseAdmin
      .from("gyms")
      .select("id", { count: "exact", head: true })
      .eq("created_by", context.userId)
      .eq("source", "google_places")
      .gt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if ((recent ?? 0) >= 10) {
      throw new Error("Hourly limit reached for new gym imports. Try again in a bit.");
    }

    // Check existing first.
    const { data: existing } = await supabaseAdmin
      .from("gyms")
      .select("id, slug, name, chain_slug, chain_name, area, city, status, source")
      .eq("google_place_id", data.placeId)
      .maybeSingle();

    let gym = existing as GymOption | null;
    if (!gym) {
      const { placeDetails, matchChain } = await import("./google-places.server");
      const d = await placeDetails(data.placeId);
      if (!d) throw new Error("That place isn't an operational gym.");
      const chain = matchChain(d.name);
      const baseSlug = slugify(`${d.name}-${d.area || d.locality || ""}`);
      let slug = baseSlug || `gym-${data.placeId.slice(0, 8)}`;
      // Slug collision handler
      for (let n = 1; n < 8; n++) {
        const { data: clash } = await supabaseAdmin
          .from("gyms")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!clash) break;
        slug = `${baseSlug}-${n + 1}`;
      }
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from("gyms")
        .insert({
          slug,
          name: d.name,
          area: d.area,
          city: d.locality,
          postcode: d.postcode,
          lat: d.lat,
          lng: d.lng,
          chain_slug: chain.chain_slug,
          chain_name: chain.chain_name,
          google_place_id: d.placeId,
          source: "google_places",
          business_status: d.businessStatus,
          status: "active",
          claim_status: "unclaimed",
          created_by: context.userId,
        })
        .select("id, slug, name, chain_slug, chain_name, area, city, status, source")
        .single();
      if (insErr) {
        // Race-condition: another pro imported simultaneously. Re-fetch.
        if (insErr.code === "23505") {
          const { data: again } = await supabaseAdmin
            .from("gyms")
            .select("id, slug, name, chain_slug, chain_name, area, city, status, source")
            .eq("google_place_id", data.placeId)
            .maybeSingle();
          if (!again) throw new Error(insErr.message);
          gym = again as GymOption;
        } else {
          throw new Error(insErr.message);
        }
      } else {
        gym = inserted as GymOption;
      }
    }
    if (!gym) throw new Error("Couldn't import gym.");

    // Attach to caller.
    const { data: mine } = await context.supabase
      .from("professional_gyms")
      .select("position")
      .eq("professional_id", context.userId);
    const used = new Set((mine ?? []).map((r) => r.position));
    let pos = -1;
    for (let i = 0; i < 3; i++) {
      if (!used.has(i)) { pos = i; break; }
    }
    if (pos === -1) throw new Error("You can list up to 3 gyms.");
    const { error: linkErr } = await context.supabase.from("professional_gyms").insert({
      professional_id: context.userId,
      gym_id: gym.id,
      position: pos,
    });
    if (linkErr) {
      if (linkErr.code === "23505") throw new Error("This gym is already on your profile.");
      throw new Error(linkErr.message);
    }
    return { ok: true as const, gym };
  });

/* ----------------------------- admin: promote google → curated ----------------------------- */

const promoteInput = z.object({
  id: z.string().uuid(),
  logo_url: z.string().url().optional().nullable(),
  tagline: z.string().trim().max(140).optional().nullable(),
  chain_slug: z.string().trim().max(60).optional().nullable(),
  chain_name: z.string().trim().max(80).optional().nullable(),
});

export const adminPromoteGym = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => promoteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: roleOk } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "admin",
    });
    if (!roleOk) throw new Error("Forbidden");
    const patch: {
      source: "curated";
      logo_url?: string | null;
      tagline?: string | null;
      chain_slug?: string | null;
      chain_name?: string | null;
    } = { source: "curated" };
    if (data.logo_url !== undefined) patch.logo_url = data.logo_url;
    if (data.tagline !== undefined) patch.tagline = data.tagline;
    if (data.chain_slug !== undefined) patch.chain_slug = data.chain_slug;
    if (data.chain_name !== undefined) patch.chain_name = data.chain_name;
    const { error } = await context.supabase.from("gyms").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ----------------------------- admin: geocode backfill ----------------------------- */

export const adminGeocodeBackfill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleOk } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "admin",
    });
    if (!roleOk) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { geocodeAddress } = await import("./google-places.server");
    const { data: rows, error } = await supabaseAdmin
      .from("gyms")
      .select("id, name, area, city, postcode")
      .is("lat", null)
      .eq("status", "active")
      .limit(60);
    if (error) throw new Error(error.message);
    let done = 0;
    let failed = 0;
    for (const g of (rows ?? []) as Array<{ id: string; name: string; area: string | null; city: string | null; postcode: string | null }>) {
      const addr = [g.name, g.area, g.city, g.postcode, "UK"].filter(Boolean).join(", ");
      try {
        const geo = await geocodeAddress(addr);
        if (!geo) { failed++; continue; }
        await supabaseAdmin
          .from("gyms")
          .update({ lat: geo.lat, lng: geo.lng, postcode: g.postcode ?? geo.postcode })
          .eq("id", g.id);
        done++;
      } catch {
        failed++;
      }
    }
    return { done, failed, total: rows?.length ?? 0 };
  });
