// Server functions for website (/c/$slug) + services management.
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";
import { z } from "zod";
import { DEFAULT_SERVICE_CARDS } from "@/lib/website/default-services";

const WebsiteUpsertSchema = z.object({
  tagline: z.string().trim().max(200).nullable().optional(),
  subtitle: z.string().trim().max(200).nullable().optional(),
  about_headline: z.string().trim().max(200).nullable().optional(),
  about: z.string().trim().max(4000).nullable().optional(),
  hero_image_url: z.string().trim().url().max(500).nullable().optional(),
  accent_hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  layout_variant: z.enum(["lite", "full"]).optional(),
  theme: z.enum(["dark", "light"]).optional(),
  current_clients: z.number().int().min(0).max(20).nullable().optional(),
});


export type WebsiteDTO = {
  professional_id: string;
  tagline: string | null;
  subtitle: string | null;
  about_headline: string | null;
  about: string | null;
  hero_image_url: string | null;
  accent_hex: string | null;
  method_name: string | null;
  method_intro: string | null;
  method_pillars: Array<{ title: string; body: string }>;
  venues: Array<{
    name: string;
    address?: string | null;
    googlePlaceId?: string | null;
    kind: "gym" | "home_studio" | "mobile";
  }>;
  coaching_reach: { cities: string[]; online_worldwide: boolean };
  client_results_intro: string | null;
  layout_variant: "lite" | "full";
  theme: "dark" | "light";
  /** Currently coaching X of 20 available spaces. null = hide the strip on the public page. */
  current_clients: number | null;
  // Embedded pro info for the public page
  slug: string | null;

  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  primary_profession: string | null;
  /** Display-ready professional titles in priority order, e.g. ["Personal Trainer", "Nutrition Coach"]. */
  titles: string[];
  specialisms: string[];
  city: string | null;
  address: string | null;
  in_person_available: boolean;
  online_available: boolean;
  member_since: string | null;
  coaching_since_year: number | null;
  /** Year the member's Stripe customer was first created — powers "Years established" on public pages. */
  stripe_customer_since_year: number | null;

  // Subscription tier of the pro (so callers can gate Pro-only surfaces).
  tier: "verified" | "pro" | "studio" | null;
  // Trust block (public-safe summary).
  trust: {
    isVerified: boolean;
    primaryTitleSlug: string | null;
    insuranceExpiry: string | null;
    activeCredentialsCount: number;
    lastCheckedAt: string | null;
    identityVerifiedAt: string | null;
    qualifiedSinceYear: number | null;
    items: Array<{
      kind: "qualification" | "insurance";
      title: string;
      issuer: string;
      id: string | null;
      dateLabel: string | null;
    }>;
  };
  // Public social links (derived from professionals.social_*).
  socials: Array<{
    kind: "instagram" | "tiktok" | "youtube" | "x" | "website" | "email";
    href: string;
    label: string;
  }>;
};

export type WebsiteTransformationDTO = {
  id: string;
  client_first_name: string | null;
  client_role: string | null;
  duration_label: string | null;
  metric: string | null;
  headline: string | null;
  quote: string | null;
  image_url: string | null;
  sort_order: number;
  is_published: boolean;
};

export type WebsiteFaqDTO = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  source: string;
};

export type WebsiteClientResultDTO = {
  id: string;
  headline: string | null;
  body: string | null;
  review_id: string | null;
  sort_order: number;
  is_published: boolean;
};

function asPillars(v: unknown): Array<{ title: string; body: string }> {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({
      title: String(p.title ?? "").trim(),
      body: String(p.body ?? "").trim(),
    }))
    .filter((p) => p.title || p.body)
    .slice(0, 6);
}

type VenueDTO = WebsiteDTO["venues"][number];

function asVenues(v: unknown): VenueDTO[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p): VenueDTO => ({
      name: String(p.name ?? "").trim(),
      address: p.address == null ? null : String(p.address).trim(),
      googlePlaceId: null,
      kind: "gym",
    }))
    .filter((p) => p.name)
    .slice(0, 8);
}

/**
 * Load the coach's gym list (source of truth = professional_gyms + gyms).
 * Returns [] if none — callers should fall back to legacy websites.venues.
 */
async function loadProfessionalGymVenues(
  supabaseAdmin: { from: (t: string) => any },
  proId: string,
): Promise<VenueDTO[]> {
  const { data: rows } = await supabaseAdmin
    .from("professional_gyms")
    .select("position, gyms ( name, chain_name, area, city, postcode, google_place_id )")
    .eq("professional_id", proId)
    .order("position", { ascending: true });
  return (rows ?? [])
    .map((row: any): VenueDTO | null => {
      const g = row?.gyms as {
        name?: string | null;
        chain_name?: string | null;
        area?: string | null;
        city?: string | null;
        postcode?: string | null;
        google_place_id?: string | null;
      } | null;
      if (!g) return null;
      const name = (g.chain_name?.trim() || g.name?.trim() || "").slice(0, 120);
      if (!name) return null;
      const parts = [g.area?.trim(), g.city?.trim(), g.postcode?.trim()].filter(
        (s): s is string => !!s,
      );
      const address = parts.length ? parts.join(", ") : null;
      return {
        name,
        address,
        googlePlaceId: g.google_place_id ?? null,
        kind: "gym",
      };
    })
    .filter((v: VenueDTO | null): v is VenueDTO => v !== null)
    .slice(0, 8);
}

function buildTrainingBaseVenues(
  homeStudio: boolean,
  clientsHome: boolean,
): VenueDTO[] {
  const out: VenueDTO[] = [];
  if (homeStudio) {
    out.push({ name: "Home / private studio", address: null, googlePlaceId: null, kind: "home_studio" });
  }
  if (clientsHome) {
    out.push({ name: "Client's home / mobile", address: null, googlePlaceId: null, kind: "mobile" });
  }
  return out;
}

function asReach(v: unknown): { cities: string[]; online_worldwide: boolean } {
  if (!v || typeof v !== "object") return { cities: [], online_worldwide: false };
  const obj = v as { cities?: unknown; online_worldwide?: unknown };
  const cities = Array.isArray(obj.cities)
    ? obj.cities.map((c) => String(c).trim()).filter(Boolean).slice(0, 12)
    : [];
  return { cities, online_worldwide: !!obj.online_worldwide };
}

function buildSocials(row: {
  social_instagram?: string | null;
  social_tiktok?: string | null;
  social_youtube?: string | null;
  social_x?: string | null;
  social_linkedin?: string | null;
}): WebsiteDTO["socials"] {
  const out: WebsiteDTO["socials"] = [];
  const ig = (row.social_instagram ?? "").trim();
  const tt = (row.social_tiktok ?? "").trim();
  const yt = (row.social_youtube ?? "").trim();
  const xh = (row.social_x ?? "").trim();
  const li = (row.social_linkedin ?? "").trim();
  const toUrl = (h: string, base: string) =>
    /^https?:\/\//i.test(h) ? h : `${base}${h.replace(/^@/, "")}`;
  if (ig) out.push({ kind: "instagram", href: toUrl(ig, "https://instagram.com/"), label: "Instagram" });
  if (tt) out.push({ kind: "tiktok", href: toUrl(tt, "https://tiktok.com/@"), label: "TikTok" });
  if (yt) out.push({ kind: "youtube", href: toUrl(yt, "https://youtube.com/@"), label: "YouTube" });
  if (xh) out.push({ kind: "x", href: toUrl(xh, "https://x.com/"), label: "X" });
  if (li) out.push({ kind: "website", href: toUrl(li, "https://linkedin.com/in/"), label: "LinkedIn" });
  return out;
}

import { getTitle } from "@/lib/cpd/titles-catalog";

/**
 * Resolve display-ready title labels for a pro, in priority order
 * (primary, then secondary if different). Falls back to an empty list
 * if neither slug maps to a known title.
 */
function buildTitleLabels(
  primarySlug: string | null | undefined,
  secondarySlug: string | null | undefined,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const slug of [primarySlug, secondarySlug]) {
    if (!slug) continue;
    const entry = getTitle(slug as never);
    if (!entry) continue;
    if (seen.has(entry.slug)) continue;
    seen.add(entry.slug);
    out.push(entry.label);
  }
  return out;
}




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

// Helper: public-safe trust summary used by both website readers.
// `includeSensitiveIds` should ONLY be true for the owner-side reader
// (getMyWebsite). The public reader must never expose real cert / policy
// numbers via items[].id.
async function fetchTrustSummary(
  supabaseAdmin: { from: (t: string) => any },
  professionalId: string,
  primaryTitleSlug: string | null,
  includeSensitiveIds: boolean = false,
): Promise<WebsiteDTO["trust"]> {
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
        "status, reviewed_at, qualification, awarding_body, certificate_number, qualification_number, issue_date, year",
      )
      .eq("professional_id", professionalId),
  ]);

  const allSubs = (subs ?? []) as Array<{
    status: string | null;
    reviewed_at: string | null;
    qualification: string | null;
    awarding_body: string | null;
    certificate_number: string | null;
    qualification_number: string | null;
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

  const items: WebsiteDTO["trust"]["items"] = [];
  for (const q of approved) {
    if (!q.qualification) continue;
    const dateLabel =
      fmtMonthYear(q.issue_date) ?? (q.year ? String(q.year) : null);
    items.push({
      kind: "qualification",
      title: q.qualification,
      issuer: q.awarding_body ?? "Awarding body",
      id: q.qualification_number ?? (includeSensitiveIds ? (q.certificate_number ?? null) : null),
      dateLabel,
    });
  }
  if (insActive && insRow) {
    items.push({
      kind: "insurance",
      title: "Professional Indemnity Insurance",
      issuer: insRow.provider ?? "Insurer",
      id: includeSensitiveIds ? (insRow.policy_number ?? null) : null,
      dateLabel: insRow.expiry_date
        ? `Active until ${fmtMonthYear(insRow.expiry_date) ?? insRow.expiry_date}`
        : "Active",
    });
  }

  const qualifiedYears = approved
    .map((s) => {
      if (s.issue_date) {
        const d = new Date(s.issue_date);
        if (!isNaN(d.getTime())) return d.getFullYear();
      }
      return s.year ?? null;
    })
    .filter((y): y is number => typeof y === "number" && y > 1900);
  const qualifiedSinceYear = qualifiedYears.length ? Math.min(...qualifiedYears) : null;

  return {
    isVerified: idApproved && insActive && approved.length > 0,
    primaryTitleSlug,
    insuranceExpiry: insActive ? insRow?.expiry_date ?? null : null,
    activeCredentialsCount: approved.length,
    lastCheckedAt: reviewedDates.at(-1) ?? null,
    identityVerifiedAt: (pro as { identity_verified_at: string | null } | null)?.identity_verified_at ?? null,
    qualifiedSinceYear,
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
  price_unit: string | null;
  duration_minutes: number | null;
  mode: string;
  sort_order: number;
  is_published: boolean;
  is_featured: boolean;
  bullets: string[];
  cta_label: string | null;
  image_url: string | null;
};

type ServiceRow = ServiceDTO;

async function ensureDefaultServices(
  supabaseAdmin: { from: (table: string) => any },
  professionalId: string,
  existingRows: ServiceRow[] | null | undefined,
): Promise<ServiceRow[]> {
  const existing = [...(existingRows ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const legacyBadDefaults = existing.filter((row) => {
    const title = row.title.trim().toLowerCase();
    const description = (row.description ?? "").trim().toLowerCase();
    return (
      title === "personal training at home" &&
      (description.includes("sessions a week") || description.includes("per 4 week block") || ["£28.33", "£32.50", "£38"].includes(row.price_label ?? ""))
    );
  });

  for (const legacyBadDefault of legacyBadDefaults) {
    const slot = Math.max(0, Math.min(DEFAULT_SERVICE_CARDS.length - 1, legacyBadDefault.sort_order ?? 0));
    const card = DEFAULT_SERVICE_CARDS[slot];
    const { error } = await supabaseAdmin
      .from("services")
      .update({
        title: card.title,
        description: card.description,
        price_pence: null,
        price_label: card.price_label,
        price_unit: card.price_unit,
        duration_minutes: null,
        mode: card.mode,
        sort_order: card.sort_order,
        is_published: true,
        is_featured: card.is_featured,
        bullets: card.bullets,
        cta_label: card.cta_label,
        image_url: null,
      })
      .eq("id", legacyBadDefault.id)
      .eq("professional_id", professionalId);
    if (error) throw error;
    legacyBadDefault.title = card.title;
    legacyBadDefault.description = card.description;
    legacyBadDefault.price_pence = null;
    legacyBadDefault.price_label = card.price_label;
    legacyBadDefault.price_unit = card.price_unit;
    legacyBadDefault.duration_minutes = null;
    legacyBadDefault.mode = card.mode;
    legacyBadDefault.sort_order = card.sort_order;
    legacyBadDefault.is_published = true;
    legacyBadDefault.is_featured = card.is_featured;
    legacyBadDefault.bullets = card.bullets;
    legacyBadDefault.cta_label = card.cta_label;
    legacyBadDefault.image_url = null;
  }

  if (existing.length >= DEFAULT_SERVICE_CARDS.length) return existing.slice(0, DEFAULT_SERVICE_CARDS.length);

  const existingTitles = new Set(existing.map((row) => row.title.trim().toLowerCase()));
  const existingOrders = new Set(existing.map((row) => row.sort_order));
  const inserts = DEFAULT_SERVICE_CARDS
    .filter((card, index) => !existingTitles.has(card.title.toLowerCase()) && !existingOrders.has(index))
    .map((card) => ({
      professional_id: professionalId,
      title: card.title,
      description: card.description,
      price_pence: null,
      price_label: card.price_label,
      price_unit: card.price_unit,
      duration_minutes: null,
      mode: card.mode,
      sort_order: card.sort_order,
      is_published: true,
      is_featured: card.is_featured,
      bullets: card.bullets,
      cta_label: card.cta_label,
      image_url: null,
    }));

  if (inserts.length > 0) {
    const { error } = await supabaseAdmin.from("services").insert(inserts);
    if (error) throw error;
  }

  const { data, error } = await supabaseAdmin
    .from("services")
    .select(
      "id, professional_id, title, description, price_pence, price_label, price_unit, duration_minutes, mode, sort_order, is_published, is_featured, bullets, cta_label, image_url",
    )
    .eq("professional_id", professionalId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ServiceRow[];
}


/* ---------------- Public reads ---------------- */

export const getWebsiteBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        slug: z.string().min(1).max(120),
        // Signed preview token minted by getMyPreviewToken. Legacy boolean
        // input is accepted but ignored — un-signed callers always get the
        // published snapshot (safe default).
        preview: z.union([z.string().min(1).max(400), z.boolean()]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{
    website: WebsiteDTO;
    services: ServiceDTO[];
    transformations: WebsiteTransformationDTO[];
    clientResults: WebsiteClientResultDTO[];
    faqs: WebsiteFaqDTO[];
    meta: {
      isPlaceholderContent: boolean;
      hasPublishedSnapshot: boolean;
      completion: { total: number; done: number };
    };
  } | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pro } = await supabaseAdmin
      .from("professionals")
      .select(
        "id, slug, headline, primary_profession, primary_title_slug, secondary_title_slug, specialisms, city, address, in_person_available, online_available, trains_at_home_studio, trains_at_clients_home, member_since, social_instagram, social_tiktok, social_youtube, social_x, social_linkedin",

      )
      .eq("slug", data.slug)
      .eq("is_published", true)
      .is("suspended_at", null)
      .maybeSingle();
    if (!pro) return null;

    // Phase 5 public-visibility gate: hide websites for pros with no active sub.
    const { isProPubliclyVisible } = await import(
      "@/lib/visibility/public-gate.server"
    );
    if (!(await isProPubliclyVisible(pro.id))) return null;

    const previewOk = await (async () => {
      if (typeof data.preview !== "string") return false;
      const { verifyPreviewToken } = await import("./preview-token.server");
      return verifyPreviewToken(data.preview, data.slug);
    })();

    // Always check whether a snapshot exists so we can accurately flag
    // placeholder content — even when serving live drafts as fallback.
    const { data: snapRow } = await supabaseAdmin
      .from("websites")
      .select("published_snapshot, has_unpublished_changes")
      .eq("professional_id", pro.id)
      .maybeSingle();
    const snap = (snapRow?.published_snapshot ?? null) as
      | { website: WebsiteDTO; services: ServiceDTO[]; transformations: WebsiteTransformationDTO[]; clientResults: WebsiteClientResultDTO[]; faqs: WebsiteFaqDTO[] }
      | null;
    const hasPublishedSnapshot = !!(snap && snap.website);
    const hasUnpublishedChanges = !!snapRow?.has_unpublished_changes;

    let payload: {
      website: WebsiteDTO;
      services: ServiceDTO[];
      transformations: WebsiteTransformationDTO[];
      clientResults: WebsiteClientResultDTO[];
      faqs: WebsiteFaqDTO[];
    };

    if (!previewOk && hasPublishedSnapshot) {
      const [liveTrust, liveCoachingSinceYear, liveStripeSinceYear] = await Promise.all([
        fetchTrustSummary(supabaseAdmin, pro.id, pro.primary_title_slug ?? null),
        fetchCoachingSinceYear(supabaseAdmin, pro.id, pro.primary_title_slug ?? null),
        fetchStripeCustomerSinceYear(supabaseAdmin, pro.id),
      ]);
      payload = {
        ...snap!,
        website: {
          ...snap!.website,
          trust: liveTrust,
          coaching_since_year: liveCoachingSinceYear ?? snap!.website.coaching_since_year,
          stripe_customer_since_year:
            liveStripeSinceYear ?? snap!.website.stripe_customer_since_year ?? null,
        },
      };

    } else {
      const [{ data: sf }, { data: prof }, { data: services }, { data: subRow }, { data: transformations }, { data: clientResults }, { data: faqs }, coachingSinceYear, trust, gymVenues] = await Promise.all([
        supabaseAdmin
          .from("websites")
          .select(
            "professional_id, tagline, subtitle, about_headline, about, hero_image_url, accent_hex, method_name, method_intro, method_pillars, venues, coaching_reach, client_results_intro, layout_variant, theme, current_clients",
          )
          .eq("professional_id", pro.id)
          .maybeSingle(),
        supabaseAdmin.from("profiles").select("full_name, avatar_url").eq("id", pro.id).maybeSingle(),
        supabaseAdmin
          .from("services")
          .select(
            "id, professional_id, title, description, price_pence, price_label, price_unit, duration_minutes, mode, sort_order, is_published, is_featured, bullets, cta_label, image_url",
          )
          .eq("professional_id", pro.id)
          .eq("is_published", true)
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("subscriptions")
          .select("tier, status")
          .eq("user_id", pro.id)
          .maybeSingle(),
        supabaseAdmin
          .from("website_transformations")
          .select("id, client_first_name, client_role, duration_label, metric, headline, quote, image_url, sort_order, is_published")
          .eq("user_id", pro.id)
          .eq("is_published", true)
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("website_client_results")
          .select("id, headline, body, review_id, sort_order, is_published")
          .eq("user_id", pro.id)
          .eq("is_published", true)
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("website_faqs")
          .select("id, question, answer, sort_order, source, is_published")
          .eq("user_id", pro.id)
          .eq("is_published", true)
          .order("sort_order", { ascending: true }),
        fetchCoachingSinceYear(supabaseAdmin, pro.id, pro.primary_title_slug ?? null),
        fetchTrustSummary(supabaseAdmin, pro.id, pro.primary_title_slug ?? null),
        loadProfessionalGymVenues(supabaseAdmin, pro.id),
      ]);

      const sfRow = sf ?? {
        professional_id: pro.id,
        tagline: null,
        subtitle: null,
        about_headline: null,
        about: null,
        hero_image_url: null,
        accent_hex: null,
        method_name: null,
        method_intro: null,
        method_pillars: null,
        venues: null,
        coaching_reach: null,
        client_results_intro: null,
        layout_variant: "full" as const,
        theme: "dark" as const,
        current_clients: null,
      };

      const tier =
        subRow && ["verified", "pro", "studio"].includes(subRow.tier as string)
          ? (subRow.tier as "verified" | "pro" | "studio")
          : null;

      payload = {
        website: {
          professional_id: pro.id,
          tagline: sfRow.tagline,
          subtitle: sfRow.subtitle ?? null,
          about_headline: (sfRow as { about_headline?: string | null }).about_headline ?? null,
          about: sfRow.about,
          hero_image_url: sfRow.hero_image_url,
          accent_hex: sfRow.accent_hex,
          method_name: sfRow.method_name ?? null,
          method_intro: sfRow.method_intro ?? null,
          method_pillars: asPillars(sfRow.method_pillars),
          venues: [
            ...(gymVenues.length ? gymVenues : asVenues(sfRow.venues)),
            ...buildTrainingBaseVenues(
              !!(pro as { trains_at_home_studio?: boolean | null }).trains_at_home_studio,
              !!(pro as { trains_at_clients_home?: boolean | null }).trains_at_clients_home,
            ),
          ],
          coaching_reach: asReach(sfRow.coaching_reach),
          client_results_intro: sfRow.client_results_intro ?? null,
          layout_variant: (sfRow.layout_variant as "lite" | "full") ?? "lite",
          theme: (sfRow.theme as "dark" | "light") ?? "dark",
          current_clients: (sfRow as { current_clients?: number | null }).current_clients ?? null,
          slug: pro.slug,
          full_name: ((prof as { full_name?: string | null } | null)?.full_name?.trim()) || prof?.full_name || null,
          avatar_url: prof?.avatar_url ?? null,
          headline: pro.headline,
          primary_profession: pro.primary_profession,
          titles: buildTitleLabels(pro.primary_title_slug, (pro as { secondary_title_slug?: string | null }).secondary_title_slug ?? null),
          specialisms: Array.isArray(pro.specialisms) ? pro.specialisms : [],
          city: pro.city,
          address: (pro as { address?: string | null }).address ?? null,
          in_person_available: !!pro.in_person_available,
          online_available: !!pro.online_available,
          member_since: pro.member_since ?? null,
          coaching_since_year: coachingSinceYear,
          tier,
          trust,
          socials: buildSocials(pro as any),
        },
        services: (services ?? []) as ServiceDTO[],
        transformations: (transformations ?? []) as WebsiteTransformationDTO[],
        clientResults: (clientResults ?? []) as WebsiteClientResultDTO[],
        faqs: (faqs ?? []) as WebsiteFaqDTO[],
      };
    }

    // Placeholder detection: a page is "placeholder" if the trainer hasn't
    // finished authoring the essentials. Rules:
    //  - no published snapshot yet → placeholder
    //  - trainer has unpublished edits that change published copy → placeholder
    //  - core content sparse (tagline/about/hero missing, or < 3 services, or
    //    no specialisms) → placeholder
    const w = payload.website;
    const trimmed = (s: string | null | undefined) => (s ?? "").trim();
    const coreEssentials = [trimmed(w.tagline), trimmed(w.about), trimmed(w.hero_image_url)];
    const coreDone = coreEssentials.every(Boolean);
    const enoughServices = (payload.services?.length ?? 0) >= 3;
    const hasSpecialisms = (w.specialisms?.length ?? 0) > 0;
    const isPlaceholderContent =
      !hasPublishedSnapshot ||
      hasUnpublishedChanges ||
      !coreDone ||
      !enoughServices ||
      !hasSpecialisms;

    // Very rough completion score for the DTO (0..5).
    const doneCount =
      (hasPublishedSnapshot ? 1 : 0) +
      (coreDone ? 1 : 0) +
      (enoughServices ? 1 : 0) +
      (hasSpecialisms ? 1 : 0) +
      (!hasUnpublishedChanges ? 1 : 0);

    return {
      ...payload,
      meta: {
        isPlaceholderContent,
        hasPublishedSnapshot,
        completion: { total: 5, done: doneCount },
      },
    };
  });


/* ---------------- Pro-side reads / writes ---------------- */

export const getMyWebsite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<{ website: WebsiteDTO | null; services: ServiceDTO[] }> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: pro }, { data: prof }, { data: sf }, { data: services }, { data: subRow }] =
      await Promise.all([
        supabaseAdmin
          .from("professionals")
      .select(
        "id, slug, headline, primary_profession, primary_title_slug, secondary_title_slug, specialisms, city, in_person_available, online_available, trains_at_home_studio, trains_at_clients_home, member_since, social_instagram, social_tiktok, social_youtube, social_x, social_linkedin",
      )
          .eq("id", userId)
          .maybeSingle(),
        supabaseAdmin.from("profiles").select("full_name, avatar_url").eq("id", userId).maybeSingle(),
        supabaseAdmin
          .from("websites")
          .select(
            "professional_id, tagline, subtitle, about_headline, about, hero_image_url, accent_hex, method_name, method_intro, method_pillars, venues, coaching_reach, client_results_intro, layout_variant, theme, current_clients",
          )
          .eq("professional_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("services")
          .select(
            "id, professional_id, title, description, price_pence, price_label, price_unit, duration_minutes, mode, sort_order, is_published, is_featured, bullets, cta_label, image_url",
          )
          .eq("professional_id", userId)
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("subscriptions")
          .select("tier, status")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    if (!pro) return { website: null, services: [] };

    const [coachingSinceYear, trust, gymVenues] = await Promise.all([
      fetchCoachingSinceYear(supabaseAdmin, userId, pro.primary_title_slug ?? null),
      fetchTrustSummary(supabaseAdmin, userId, pro.primary_title_slug ?? null, true),
      loadProfessionalGymVenues(supabaseAdmin, userId),
    ]);

    const tier =
      subRow && ["verified", "pro", "studio"].includes(subRow.tier as string)
        ? (subRow.tier as "verified" | "pro" | "studio")
        : null;

    const resolvedSf = sf ?? (trust.isVerified
      ? await (async () => {
          const layoutVariant = tier === "pro" || tier === "studio" ? "full" : "lite";
          const { data: created, error } = await supabaseAdmin
            .from("websites")
            .upsert(
              { professional_id: userId, layout_variant: layoutVariant },
              { onConflict: "professional_id" },
            )
            .select(
              "professional_id, tagline, subtitle, about_headline, about, hero_image_url, accent_hex, method_name, method_intro, method_pillars, venues, coaching_reach, client_results_intro, layout_variant, theme, current_clients",
            )
            .single();
          if (error) throw error;
          return created;
        })()
      : null);

    const website: WebsiteDTO | null = resolvedSf
      ? {
          professional_id: userId,
          tagline: resolvedSf.tagline,
          subtitle: resolvedSf.subtitle ?? null,
          about_headline: (resolvedSf as { about_headline?: string | null }).about_headline ?? null,
          about: resolvedSf.about,
          hero_image_url: resolvedSf.hero_image_url,
          accent_hex: resolvedSf.accent_hex,
          method_name: resolvedSf.method_name ?? null,
          method_intro: resolvedSf.method_intro ?? null,
          method_pillars: asPillars(resolvedSf.method_pillars),
          venues: [
            ...(gymVenues.length ? gymVenues : asVenues(resolvedSf.venues)),
            ...buildTrainingBaseVenues(
              !!(pro as { trains_at_home_studio?: boolean | null }).trains_at_home_studio,
              !!(pro as { trains_at_clients_home?: boolean | null }).trains_at_clients_home,
            ),
          ],
          coaching_reach: asReach(resolvedSf.coaching_reach),
          client_results_intro: resolvedSf.client_results_intro ?? null,
          layout_variant: (resolvedSf.layout_variant as "lite" | "full") ?? "lite",
          theme: ((resolvedSf as { theme?: string | null }).theme as "dark" | "light") ?? "dark",
          current_clients: (resolvedSf as { current_clients?: number | null }).current_clients ?? null,
          slug: pro.slug,
          full_name: ((prof as { full_name?: string | null } | null)?.full_name?.trim()) || prof?.full_name || null,
          avatar_url: prof?.avatar_url ?? null,
          headline: pro.headline,
          primary_profession: pro.primary_profession,
          titles: buildTitleLabels(pro.primary_title_slug, (pro as { secondary_title_slug?: string | null }).secondary_title_slug ?? null),
          specialisms: Array.isArray(pro.specialisms) ? pro.specialisms : [],
          city: pro.city,
          address: (pro as { address?: string | null }).address ?? null,
          in_person_available: !!pro.in_person_available,
          online_available: !!pro.online_available,
          member_since: pro.member_since ?? null,
          coaching_since_year: coachingSinceYear,
          tier,
          trust,
          socials: buildSocials(pro as any),
        }

      : null;

    const resolvedServices = await ensureDefaultServices(
      supabaseAdmin,
      userId,
      (services ?? []) as ServiceDTO[],
    );

    return { website, services: resolvedServices };

  });

export const upsertMyWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => WebsiteUpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { assertCallerHasProfessionalRow } = await import("@/lib/verification/guards.server");
    await assertCallerHasProfessionalRow(context.supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch = { ...data, professional_id: userId };

    const { data: row, error } = await supabaseAdmin
      .from("websites")
      .upsert(patch, { onConflict: "professional_id" })
      .select()
      .single();
    if (error) throw error;
    return row;
  });


/* ---------------- Services CRUD ---------------- */

const ServiceUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(28),
  description: z.string().trim().max(2000).nullable().optional(),
  price_pence: z.number().int().min(0).max(10_000_00).nullable().optional(),
  price_label: z.string().trim().max(16).nullable().optional(),
  price_unit: z
    .enum(["per_session", "per_month", "per_week", "per_block", "per_hour", "total", "from", "custom"])
    .nullable()
    .optional(),
  duration_minutes: z.number().int().min(0).max(600).nullable().optional(),
  mode: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  sort_order: z.number().int().min(0).max(99).default(0),
  is_published: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  bullets: z.array(z.string().trim().max(60)).max(5).default([]),
  cta_label: z.string().trim().max(40).nullable().optional(),
  image_url: z.string().trim().url().max(500).nullable().optional(),
});


export const upsertMyService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => ServiceUpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { assertCallerHasProfessionalRow } = await import("@/lib/verification/guards.server");
    await assertCallerHasProfessionalRow(context.supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Ownership pre-check: if the caller supplied an id, verify the existing
    // row belongs to them before upsert. Prevents cross-tenant hijack via
    // client-supplied primary key.
    if (data.id) {
      const { data: existing } = await supabaseAdmin
        .from("services")
        .select("professional_id")
        .eq("id", data.id)
        .maybeSingle();
      if (existing && (existing as { professional_id: string }).professional_id !== userId) {
        throw new Error("Not found");
      }
    }
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
  .middleware([requireSupabaseAuthWithImpersonation])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { assertCallerHasProfessionalRow } = await import("@/lib/verification/guards.server");
    await assertCallerHasProfessionalRow(context.supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("services")
      .delete()
      .eq("id", data.id)
      .eq("professional_id", userId);
    if (error) throw error;
    return { ok: true };
  });
