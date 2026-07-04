/**
 * Trainer "readiness" — the single source of truth for the dashboard's
 * Readiness card (formerly "Profile completeness") and Needs-your-attention
 * list. Rolls up three pillars:
 *
 *   • Website      (50%) — all 9 editor sections done + site has been
 *                          published at least once with no unpublished
 *                          changes.
 *   • Verification (30%) — 3 REPS ticks: identity, insurance, qualifications.
 *   • Education    (20%) — at least one qualification certificate uploaded.
 *
 * Uses the same `computeWebsiteSections` helper the Website editor sidebar
 * uses, so the sidebar's "6/9 IN PROGRESS" pill and the dashboard's roll-up
 * always agree.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

import {
  computeWebsiteSections,
  countSectionsDone,
  type WebsiteSection,
  type WebsiteSectionId,
} from "./website-sections";

export type ReadinessPillar = {
  pct: number;
  done: number;
  total: number;
};

export type ReadinessResult = {
  /** Weighted overall (Website 50 / Verification 30 / Education 20). */
  pct: number;
  website: ReadinessPillar & {
    sections: WebsiteSection[];
    everPublished: boolean;
    hasUnpublishedChanges: boolean;
  };
  verification: ReadinessPillar & {
    ticks: { identity: boolean; insurance: boolean; qualifications: boolean };
    missing: Array<"identity" | "insurance" | "qualifications">;
  };
  education: ReadinessPillar & {
    hasCert: boolean;
    certUploadedAt: string | null;
  };
};

export const WEIGHTS = { website: 50, verification: 30, education: 20 } as const;

export const getMyReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<ReadinessResult> => {
    const { supabase, userId } = context;

    const today = new Date().toISOString().slice(0, 10);

    const [
      { data: profile },
      { data: pro },
      { data: website },
      { count: serviceCount },
      { count: transformationCount },
      { count: faqCount },
      { data: location },
      { data: insurance },
      { data: verSubs },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("professionals")
        .select(
          "specialisms, languages, contact_phone, in_person_available, online_available, social_instagram, social_linkedin, social_youtube, social_tiktok, social_x, identity_status, cert_uploaded_at",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("websites")
        .select(
          "tagline, subtitle, about, hero_image_url, method_name, method_pillars, has_unpublished_changes, published_at, published_snapshot",
        )
        .eq("professional_id", userId)
        .maybeSingle(),
      supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("professional_id", userId)
        .eq("is_published", true),
      supabase
        .from("website_transformations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_published", true),
      supabase
        .from("website_faqs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("professional_locations")
        .select("postcode")
        .eq("professional_id", userId)
        .order("is_primary", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("insurance_policies")
        .select("status, expiry_date")
        .eq("professional_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("verification_submissions")
        .select("status")
        .eq("professional_id", userId),
    ]);

    /* --------------------------- Website sections --------------------------- */

    const proRow = pro as {
      specialisms?: unknown;
      languages?: unknown;
      contact_phone?: string | null;
      in_person_available?: boolean | null;
      online_available?: boolean | null;
      social_instagram?: string | null;
      social_linkedin?: string | null;
      social_youtube?: string | null;
      social_tiktok?: string | null;
      social_x?: string | null;
      identity_status?: string | null;
      cert_uploaded_at?: string | null;
    } | null;

    const siteRow = website as {
      tagline?: string | null;
      subtitle?: string | null;
      about?: string | null;
      hero_image_url?: string | null;
      method_name?: string | null;
      method_pillars?: unknown;
      has_unpublished_changes?: boolean | null;
      published_at?: string | null;
      published_snapshot?: unknown;
    } | null;

    const locRow = location as { postcode?: string | null } | null;
    const profRow = profile as { avatar_url?: string | null } | null;

    const specialismCount = Array.isArray(proRow?.specialisms) ? proRow!.specialisms.length : 0;
    const languageCount = Array.isArray(proRow?.languages) ? proRow!.languages.length : 0;
    const socialCount = [
      proRow?.social_instagram,
      proRow?.social_linkedin,
      proRow?.social_youtube,
      proRow?.social_tiktok,
      proRow?.social_x,
    ].filter((v) => !!v && String(v).trim() !== "").length;

    const methodPillarCount = Array.isArray(siteRow?.method_pillars)
      ? (siteRow!.method_pillars as unknown[]).filter((p) => {
          const o = p as { title?: unknown; body?: unknown } | null;
          return (
            !!o &&
            typeof o === "object" &&
            String(o.title ?? "").trim() !== "" &&
            String(o.body ?? "").trim() !== ""
          );
        }).length
      : 0;

    const sections = computeWebsiteSections({
      hasAvatar: !!profRow?.avatar_url,
      tagline: siteRow?.tagline ?? null,
      subtitle: siteRow?.subtitle ?? null,
      about: siteRow?.about ?? null,
      heroImageUrl: siteRow?.hero_image_url ?? null,
      specialismCount,
      hasPostcode: !!(locRow?.postcode && String(locRow.postcode).trim()),
      hasDelivery: !!(proRow?.in_person_available || proRow?.online_available),
      serviceCount: serviceCount ?? 0,
      hasWebsiteRow: !!siteRow,
      methodName: siteRow?.method_name ?? null,
      methodPillarCount,
      transformationCount: transformationCount ?? 0,
      faqCount: faqCount ?? 0,
      languageCount,
      socialCount,
      hasPhone: !!(proRow?.contact_phone && String(proRow.contact_phone).trim()),
    });

    const websiteDone = countSectionsDone(sections);
    const websiteTotal = sections.length;
    const everPublished = !!siteRow?.published_snapshot;
    const hasUnpublishedChanges = !!(siteRow?.has_unpublished_changes ?? true);

    // Include "site is live" as an implicit 10th step so 100% is only reached
    // when the trainer's page is actually serving to the public.
    const websitePctRaw =
      (websiteDone + (everPublished && !hasUnpublishedChanges ? 1 : 0)) /
      (websiteTotal + 1);
    const websitePct = Math.round(websitePctRaw * 100);

    /* ----------------------------- Verification ----------------------------- */

    const idApproved = (proRow?.identity_status ?? "none") === "approved";

    const insRow = insurance as
      | { status?: string | null; expiry_date?: string | null }
      | null;
    const insActive =
      insRow?.status === "active" &&
      (!insRow?.expiry_date || insRow.expiry_date >= today);

    const approvedSubs = ((verSubs ?? []) as Array<{ status: string | null }>).filter(
      (s) => s.status === "approved",
    );
    const qualTick = approvedSubs.length > 0;

    const ticks = { identity: idApproved, insurance: insActive, qualifications: qualTick };
    const missing: Array<"identity" | "insurance" | "qualifications"> = [];
    if (!ticks.identity) missing.push("identity");
    if (!ticks.insurance) missing.push("insurance");
    if (!ticks.qualifications) missing.push("qualifications");

    const verificationDone = 3 - missing.length;
    const verificationPct = Math.round((verificationDone / 3) * 100);

    /* ------------------------------- Education ------------------------------ */

    const hasCert = !!proRow?.cert_uploaded_at;
    const educationPct = hasCert ? 100 : 0;

    /* --------------------------- Weighted overall --------------------------- */

    const overall = Math.round(
      (websitePct * WEIGHTS.website +
        verificationPct * WEIGHTS.verification +
        educationPct * WEIGHTS.education) /
        (WEIGHTS.website + WEIGHTS.verification + WEIGHTS.education),
    );

    return {
      pct: overall,
      website: {
        pct: websitePct,
        done: websiteDone,
        total: websiteTotal,
        sections,
        everPublished,
        hasUnpublishedChanges,
      },
      verification: {
        pct: verificationPct,
        done: verificationDone,
        total: 3,
        ticks,
        missing,
      },
      education: {
        pct: educationPct,
        done: hasCert ? 1 : 0,
        total: 1,
        hasCert,
        certUploadedAt: proRow?.cert_uploaded_at ?? null,
      },
    };
  });

/** Human-friendly one-liner for the verification pillar row on the card. */
export function verificationSummary(v: ReadinessResult["verification"]): string {
  if (v.missing.length === 0) return "Identity, insurance and qualifications verified";
  const labels: Record<(typeof v.missing)[number], string> = {
    identity: "identity",
    insurance: "insurance",
    qualifications: "qualifications",
  };
  const names = v.missing.map((m) => labels[m]);
  if (names.length === 3) return "Complete your 3 REPS Verified steps";
  if (names.length === 2) return `Add ${names[0]} and ${names[1]}`;
  return `Add ${names[0]}`;
}
