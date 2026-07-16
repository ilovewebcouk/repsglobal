// Draft + Publish server functions.
//
// The public /c/$slug page reads `websites.published_snapshot` when present.
// Editor mutations write straight to live content rows (via existing
// upsert server fns) and the dirty-tracking triggers on those tables flip
// `websites.has_unpublished_changes` to true. Clicking "Publish website"
// calls `publishMyWebsite`, which builds a snapshot of the current live
// content set and stores it on the websites row. From then on `/c/$slug`
// serves the snapshot until the trainer publishes again.
//
// Preview (phase 2): the editor's iframe loads `/c/$slug?preview=<token>`
// where <token> is a short-lived, HMAC-signed token minted by
// `getMyPreviewToken` for the logged-in owner. `getWebsiteBySlug` verifies
// the token: mismatch or expiry → snapshot (safe default). Un-signed
// `preview=1` no longer bypasses the snapshot.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

/* -------------------------------------------------------------------------- */
/* Signed preview token — helpers live in preview-token.server.ts so the      */
/* client bundle never imports node:crypto. Re-exported here for callers that */
/* only run on the server (verify path in website.functions.ts is switched to */
/* import from the .server file directly).                                    */
/* -------------------------------------------------------------------------- */

const PREVIEW_TTL_SECONDS = 60 * 60 * 4; // 4 hours


/** Owner-only server fn that mints a preview token for their own slug. */
export const getMyPreviewToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<{ token: string | null; slug: string | null; expires_at: string }> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pro } = await supabaseAdmin
      .from("professionals")
      .select("slug")
      .eq("id", userId)
      .maybeSingle();
    const slug = (pro?.slug ?? null) as string | null;
    if (!slug) return { token: null, slug: null, expires_at: new Date().toISOString() };
    const { signPreviewToken } = await import("./preview-token.server");
    const token = signPreviewToken(slug);
    return {
      token,
      slug,
      expires_at: new Date(Date.now() + PREVIEW_TTL_SECONDS * 1000).toISOString(),
    };
  });

/* -------------------------------------------------------------------------- */
/* Publish                                                                     */
/* -------------------------------------------------------------------------- */

export const publishMyWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<{ published_at: string }> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getWebsiteBySlug } = await import("./website.functions");

    const { data: pro } = await supabaseAdmin
      .from("professionals")
      .select("id, slug")
      .eq("id", userId)
      .maybeSingle();
    if (!pro?.slug) {
      throw new Error("Your public URL isn't ready yet — finish onboarding first.");
    }

    // Force live read: pass an owner token so getWebsiteBySlug bypasses
    // any existing snapshot and returns the current draft.
    const { signPreviewToken } = await import("./preview-token.server");
    const previewToken = signPreviewToken(pro.slug, 60);
    const live = await getWebsiteBySlug({
      data: { slug: pro.slug, preview: previewToken },
    });
    if (!live) {
      throw new Error("Nothing to publish yet — add some content and try again.");
    }

    const now = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("websites")
      .update({
        published_snapshot: JSON.parse(JSON.stringify(live)),
        published_at: now,
        has_unpublished_changes: false,
      })
      .eq("professional_id", userId);
    if (error) throw error;

    return { published_at: now };
  });

export type PublishState = {
  has_unpublished_changes: boolean;
  published_at: string | null;
  ever_published: boolean;
};

export const getMyPublishState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<PublishState> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data } = await supabaseAdmin
      .from("websites")
      .select("has_unpublished_changes, published_at, published_snapshot")
      .eq("professional_id", userId)
      .maybeSingle();

    return {
      has_unpublished_changes: !!(data?.has_unpublished_changes ?? true),
      published_at: (data?.published_at as string | null) ?? null,
      ever_published: !!data?.published_snapshot,
    };
  });

/* -------------------------------------------------------------------------- */
/* Section-level diff (live vs published snapshot)                             */
/* -------------------------------------------------------------------------- */

/** Sections the editor tracks for per-section dirty dots + discard. */
export type DiffSection =
  | "basics"
  | "method"
  | "plans"
  | "results"
  | "faqs"
  | "specialisms"
  | "location"
  | "profile"
  | "contact";

export type SectionDiff = {
  dirty: Record<DiffSection, boolean>;
  /** Human-readable one-liners per dirty section, for the confirm dialog. */
  summary: Partial<Record<DiffSection, string>>;
  ever_published: boolean;
  has_unpublished_changes: boolean;
};

function normText(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function pillarsEqual(a: unknown, b: unknown): boolean {
  const A = Array.isArray(a) ? a : [];
  const B = Array.isArray(b) ? b : [];
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) {
    const ai = A[i] as { title?: unknown; body?: unknown } | null | undefined;
    const bi = B[i] as { title?: unknown; body?: unknown } | null | undefined;
    if (normText(ai?.title) !== normText(bi?.title)) return false;
    if (normText(ai?.body) !== normText(bi?.body)) return false;
  }
  return true;
}

function servicesEqual(a: unknown, b: unknown): boolean {
  const A = Array.isArray(a) ? a : [];
  const B = Array.isArray(b) ? b : [];
  if (A.length !== B.length) return false;
  const key = (s: any) => JSON.stringify({
    t: normText(s?.title),
    d: normText(s?.description),
    pp: s?.price_pence ?? null,
    pl: normText(s?.price_label),
    pu: normText(s?.price_unit),
    dur: s?.duration_minutes ?? null,
    m: normText(s?.mode),
    so: s?.sort_order ?? 0,
    ip: !!s?.is_published,
    ft: !!s?.is_featured,
    b: Array.isArray(s?.bullets) ? s.bullets.map((x: any) => normText(x)) : [],
    c: normText(s?.cta_label),
    im: normText(s?.image_url),
  });
  const As = A.map(key).sort();
  const Bs = B.map(key).sort();
  return As.every((v, i) => v === Bs[i]);
}

function transformationsEqual(a: unknown, b: unknown): boolean {
  const A = Array.isArray(a) ? a : [];
  const B = Array.isArray(b) ? b : [];
  if (A.length !== B.length) return false;
  const key = (t: any) => JSON.stringify({
    n: normText(t?.client_first_name),
    r: normText(t?.client_role),
    d: normText(t?.duration_label),
    me: normText(t?.metric),
    h: normText(t?.headline),
    q: normText(t?.quote),
    im: normText(t?.image_url),
    so: t?.sort_order ?? 0,
    ip: !!t?.is_published,
  });
  const As = A.map(key).sort();
  const Bs = B.map(key).sort();
  return As.every((v, i) => v === Bs[i]);
}

function faqsEqual(a: unknown, b: unknown): boolean {
  const A = Array.isArray(a) ? a : [];
  const B = Array.isArray(b) ? b : [];
  if (A.length !== B.length) return false;
  const key = (f: any) => JSON.stringify({
    q: normText(f?.question),
    a: normText(f?.answer),
    so: f?.sort_order ?? 0,
  });
  return A.map(key).sort().every((v, i) => v === B.map(key).sort()[i]);
}

function specialismsEqual(a: unknown, b: unknown): boolean {
  const A = Array.isArray(a) ? [...a].map(String).sort() : [];
  const B = Array.isArray(b) ? [...b].map(String).sort() : [];
  if (A.length !== B.length) return false;
  return A.every((v, i) => v === B[i]);
}

function reachEqual(a: unknown, b: unknown): boolean {
  const A = (a ?? {}) as { cities?: unknown; online_worldwide?: unknown };
  const B = (b ?? {}) as { cities?: unknown; online_worldwide?: unknown };
  const ac = (Array.isArray(A.cities) ? A.cities.map(String) : []).sort();
  const bc = (Array.isArray(B.cities) ? B.cities.map(String) : []).sort();
  if (ac.length !== bc.length) return false;
  if (!ac.every((v, i) => v === bc[i])) return false;
  return !!A.online_worldwide === !!B.online_worldwide;
}

function venuesEqual(a: unknown, b: unknown): boolean {
  const A = Array.isArray(a) ? a : [];
  const B = Array.isArray(b) ? b : [];
  if (A.length !== B.length) return false;
  const key = (v: any) => JSON.stringify({
    n: normText(v?.name),
    a: normText(v?.address),
    k: normText(v?.kind),
  });
  return A.map(key).sort().every((v, i) => v === B.map(key).sort()[i]);
}

export const getMySectionDiff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<SectionDiff> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getWebsiteBySlug } = await import("./website.functions");

    const empty: SectionDiff = {
      dirty: {
        basics: false,
        method: false,
        plans: false,
        results: false,
        faqs: false,
        specialisms: false,
        location: false,
        profile: false,
        contact: false,
      },
      summary: {},
      ever_published: false,
      has_unpublished_changes: false,
    };

    const { data: pro } = await supabaseAdmin
      .from("professionals")
      .select("slug")
      .eq("id", userId)
      .maybeSingle();
    if (!pro?.slug) return empty;

    const { data: siteRow } = await supabaseAdmin
      .from("websites")
      .select("published_snapshot, has_unpublished_changes")
      .eq("professional_id", userId)
      .maybeSingle();

    const snap = (siteRow?.published_snapshot ?? null) as
      | { website: any; services: any[]; transformations: any[]; faqs: any[] }
      | null;

    if (!snap) {
      // Nothing published yet: everything is "dirty" only if there IS content.
      // Keep quiet — dashboard "Draft never published" pill handles the empty case.
      return {
        ...empty,
        has_unpublished_changes: !!siteRow?.has_unpublished_changes,
      };
    }

    // Owner short-token to force live read.
    const { signPreviewToken } = await import("./preview-token.server");
    const previewToken = signPreviewToken(pro.slug, 60);
    const live = await getWebsiteBySlug({ data: { slug: pro.slug, preview: previewToken } });
    if (!live) return { ...empty, ever_published: true };

    const lw = live.website as any;
    const sw = snap.website as any;

    const basicsDirty =
      normText(lw?.tagline) !== normText(sw?.tagline) ||
      normText(lw?.subtitle) !== normText(sw?.subtitle) ||
      normText(lw?.about_headline) !== normText(sw?.about_headline) ||
      normText(lw?.about) !== normText(sw?.about) ||
      normText(lw?.hero_image_url) !== normText(sw?.hero_image_url) ||
      (lw?.current_clients ?? null) !== (sw?.current_clients ?? null);

    const methodDirty =
      normText(lw?.method_name) !== normText(sw?.method_name) ||
      normText(lw?.method_intro) !== normText(sw?.method_intro) ||
      !pillarsEqual(lw?.method_pillars, sw?.method_pillars);

    const plansDirty = !servicesEqual(live.services, snap.services);
    const resultsDirty = !transformationsEqual(live.transformations, snap.transformations);
    const faqsDirty = !faqsEqual(live.faqs, snap.faqs);
    const specialismsDirty = !specialismsEqual(lw?.specialisms, sw?.specialisms);
    const locationDirty =
      !reachEqual(lw?.coaching_reach, sw?.coaching_reach) || !venuesEqual(lw?.venues, sw?.venues);
    const profileDirty = normText(lw?.avatar_url) !== normText(sw?.avatar_url);
    const socialKinds = (arr: any) =>
      (Array.isArray(arr) ? arr : [])
        .map((s: any) => `${normText(s?.kind)}|${normText(s?.href)}`)
        .sort()
        .join(",");
    const langsKey = (arr: any) =>
      (Array.isArray(arr) ? [...arr].map(String).sort() : []).join(",");
    const contactDirty =
      socialKinds(lw?.socials) !== socialKinds(sw?.socials) ||
      langsKey(lw?.languages) !== langsKey(sw?.languages);

    const summary: SectionDiff["summary"] = {};
    if (basicsDirty) summary.basics = "Tagline, About, hero image or currently-coaching count changed";
    if (methodDirty) summary.method = "Method name, intro or pillars changed";
    if (plansDirty) {
      const d = (live.services?.length ?? 0) - (snap.services?.length ?? 0);
      summary.plans =
        d === 0
          ? "Coaching plans edited"
          : d > 0
            ? `${d} coaching plan${d === 1 ? "" : "s"} added or edited`
            : `${Math.abs(d)} coaching plan${Math.abs(d) === 1 ? "" : "s"} removed`;
    }
    if (resultsDirty) {
      const d = (live.transformations?.length ?? 0) - (snap.transformations?.length ?? 0);
      summary.results =
        d === 0
          ? "Client results edited"
          : d > 0
            ? `${d} new client result${d === 1 ? "" : "s"}`
            : `${Math.abs(d)} client result${Math.abs(d) === 1 ? "" : "s"} removed`;
    }
    if (faqsDirty) {
      const d = (live.faqs?.length ?? 0) - (snap.faqs?.length ?? 0);
      summary.faqs =
        d === 0
          ? "FAQ answers edited"
          : d > 0
            ? `${d} new FAQ${d === 1 ? "" : "s"}`
            : `${Math.abs(d)} FAQ${Math.abs(d) === 1 ? "" : "s"} removed`;
    }
    if (specialismsDirty) summary.specialisms = "Specialisms changed";
    if (locationDirty) summary.location = "Where you train changed";
    if (profileDirty) summary.profile = "Profile photo changed";
    if (contactDirty) summary.contact = "Languages or social links changed";

    return {
      dirty: {
        basics: basicsDirty,
        method: methodDirty,
        plans: plansDirty,
        results: resultsDirty,
        faqs: faqsDirty,
        specialisms: specialismsDirty,
        location: locationDirty,
        profile: profileDirty,
        contact: contactDirty,
      },
      summary,
      ever_published: true,
      has_unpublished_changes: !!siteRow?.has_unpublished_changes,
    };
  });

/* -------------------------------------------------------------------------- */
/* Per-section discard (revert live rows to last-published snapshot)          */
/* -------------------------------------------------------------------------- */

const DiscardableSection = z.enum(["basics", "method", "plans", "results", "faqs"]);

export const discardMySectionChanges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => z.object({ section: DiscardableSection }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: siteRow } = await supabaseAdmin
      .from("websites")
      .select("published_snapshot")
      .eq("professional_id", userId)
      .maybeSingle();
    const snap = (siteRow?.published_snapshot ?? null) as
      | { website: any; services: any[]; transformations: any[]; faqs: any[] }
      | null;
    if (!snap) throw new Error("Nothing to discard — you haven't published a version yet.");

    if (data.section === "basics") {
      const w = snap.website ?? {};
      const { error } = await supabaseAdmin
        .from("websites")
        .update({
          tagline: w.tagline ?? null,
          subtitle: w.subtitle ?? null,
          about: w.about ?? null,
          hero_image_url: w.hero_image_url ?? null,
          current_clients: w.current_clients ?? null,
        })
        .eq("professional_id", userId);
      if (error) throw error;
    } else if (data.section === "method") {
      const w = snap.website ?? {};
      const { error } = await supabaseAdmin
        .from("websites")
        .update({
          method_name: w.method_name ?? null,
          method_intro: w.method_intro ?? null,
          method_pillars: Array.isArray(w.method_pillars) ? w.method_pillars : [],
        })
        .eq("professional_id", userId);
      if (error) throw error;
    } else if (data.section === "plans") {
      const del = await supabaseAdmin.from("services").delete().eq("professional_id", userId);
      if (del.error) throw del.error;
      const rows = (snap.services ?? []).map((s: any) => ({
        professional_id: userId,
        title: s.title,
        description: s.description ?? null,
        price_pence: s.price_pence ?? null,
        price_label: s.price_label ?? null,
        price_unit: s.price_unit ?? null,
        duration_minutes: s.duration_minutes ?? null,
        mode: s.mode ?? "in_person",
        sort_order: s.sort_order ?? 0,
        is_published: s.is_published ?? true,
        is_featured: !!s.is_featured,
        bullets: Array.isArray(s.bullets) ? s.bullets : [],
        cta_label: s.cta_label ?? null,
        image_url: s.image_url ?? null,
      }));
      if (rows.length) {
        const { error } = await supabaseAdmin.from("services").insert(rows);
        if (error) throw error;
      }
    } else if (data.section === "results") {
      const del = await supabaseAdmin
        .from("website_transformations")
        .delete()
        .eq("user_id", userId);
      if (del.error) throw del.error;
      const rows = (snap.transformations ?? []).map((t: any) => ({
        user_id: userId,
        client_first_name: t.client_first_name ?? null,
        client_role: t.client_role ?? null,
        duration_label: t.duration_label ?? null,
        metric: t.metric ?? null,
        headline: t.headline ?? null,
        quote: t.quote ?? null,
        image_url: t.image_url ?? null,
        sort_order: t.sort_order ?? 0,
        is_published: t.is_published ?? true,
      }));
      if (rows.length) {
        const { error } = await supabaseAdmin.from("website_transformations").insert(rows);
        if (error) throw error;
      }
    } else if (data.section === "faqs") {
      const del = await supabaseAdmin.from("website_faqs").delete().eq("user_id", userId);
      if (del.error) throw del.error;
      const rows = (snap.faqs ?? []).map((f: any) => ({
        user_id: userId,
        question: f.question,
        answer: f.answer,
        sort_order: f.sort_order ?? 0,
        source: f.source ?? "manual",
      }));
      if (rows.length) {
        const { error } = await supabaseAdmin.from("website_faqs").insert(rows);
        if (error) throw error;
      }
    }

    // Re-sync the dirty flag: if nothing is dirty anymore, clear it. Cheapest
    // way is to trust the section triggers; but discarding matches snapshot,
    // so the section triggers on the writes above will fire and mark dirty.
    // Explicitly recompute by comparing full state.
    // For simplicity, leave `has_unpublished_changes` alone — the getMySectionDiff
    // re-fetch will show the section clean; if all sections are clean the
    // trainer can just publish again to sync the flag.
    return { ok: true };
  });
