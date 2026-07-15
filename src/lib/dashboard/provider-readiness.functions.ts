/**
 * Provider readiness — training-provider variant of the trainer
 * `getMyReadiness`. Rolls up four pillars, purpose-built for the signals
 * the provider dashboard's "Needs your attention" + "Your REPS readiness"
 * cards care about:
 *
 *   • Verification (35%)             — identity + provider name lock-in +
 *                                       domain approval (3 steps).
 *   • Branding & listing (30%)       — logo, cover image, certificate logo
 *                                       (160×60), tagline, public bio.
 *   • Provider page (20%)            — has been published AND no
 *                                       unpublished changes.
 *   • Endorsement & certificates (15%) — ≥1 REPs-endorsed course +
 *                                        ≥1 issued certificate.
 *
 * Insurance and qualification-certificate uploads are intentionally NOT
 * part of this rollup — those are trainer-only.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

export type ProviderVerificationSnapshot = {
  identityDone: boolean;
  identityStatus:
    | "none"
    | "pending"
    | "approved"
    | "rejected"
    | "needs_more_info"
    | "expired";
  nameLocked: boolean;
  providerName: string | null;
  domainDone: boolean;
  domainStatus:
    | "unstarted"
    | "email_sent"
    | "email_confirmed"
    | "pending_admin_review"
    | "approved"
    | "rejected";
  domain: string | null;
  websiteUrl: string | null;
};

export type ProviderReadinessPillar = {
  pct: number;
  done: number;
  total: number;
};

export type ProviderReadinessResult = {
  /** Weighted overall (Verification 35 / Branding 30 / Provider page 20 /
   *  Endorsement+certs 15). */
  pct: number;
  verification: ProviderReadinessPillar & ProviderVerificationSnapshot;
  branding: ProviderReadinessPillar & {
    hasLogo: boolean;
    hasCover: boolean;
    hasCertLogo: boolean;
    hasTagline: boolean;
    hasBio: boolean;
  };
  providerPage: ProviderReadinessPillar & {
    everPublished: boolean;
    hasUnpublishedChanges: boolean;
    slug: string | null;
  };
  adoption: ProviderReadinessPillar & {
    accreditedCourseCount: number;
    issuedCertificateCount: number;
  };
};

const WEIGHTS = {
  verification: 35,
  branding: 30,
  providerPage: 20,
  adoption: 15,
} as const;

export const getProviderReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<ProviderReadinessResult | null> => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { userId } = context;
    const sb = context.supabase as any;

    // Bail if this isn't a provider account — trainer readiness handles them.
    const { data: pro } = await sb
      .from("professionals")
      .select("id, account_type, identity_status, website_url, slug")
      .eq("id", userId)
      .maybeSingle();
    if (!pro || pro.account_type !== "training_provider") return null;

    const [
      { data: profile },
      { data: website },
      { data: dom },
      { count: accreditedCount },
      { count: issuedCount },
    ] = await Promise.all([
      sb
        .from("profiles")
        .select("full_name, avatar_url, certificate_logo_url")
        .eq("id", userId)
        .maybeSingle(),
      sb
        .from("websites")
        .select(
          "tagline, about, hero_image_url, has_unpublished_changes, published_at, published_snapshot",
        )
        .eq("professional_id", userId)
        .maybeSingle(),
      sb
        .from("provider_domain_verifications")
        .select("status, domain")
        .eq("professional_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      sb
        .from("reps_courses")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", userId)
        .eq("status", "approved"),
      sb
        .from("certificate_registrations")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", userId)
        .not("issued_at", "is", null),
    ]);

    /* ---------------------------- Verification ---------------------------- */

    const identityStatus =
      (pro.identity_status ?? "none") as ProviderVerificationSnapshot["identityStatus"];
    const identityDone = identityStatus === "approved";
    const providerName: string | null =
      typeof profile?.full_name === "string" && profile.full_name.trim().length > 0
        ? profile.full_name
        : null;
    const nameLocked = !!providerName;
    const domainStatus =
      (dom?.status ?? "unstarted") as ProviderVerificationSnapshot["domainStatus"];
    const domainDone = domainStatus === "approved";
    const verDone =
      Number(identityDone) + Number(nameLocked) + Number(domainDone);
    const verPct = Math.round((verDone / 3) * 100);

    /* ---------------------------- Branding -------------------------------- */

    const hasLogo = !!(profile?.avatar_url && String(profile.avatar_url).trim());
    const hasCover = !!(
      website?.hero_image_url && String(website.hero_image_url).trim()
    );
    const hasCertLogo = !!(
      profile?.certificate_logo_url && String(profile.certificate_logo_url).trim()
    );
    const hasTagline = !!(website?.tagline && String(website.tagline).trim());
    const hasBio = !!(website?.about && String(website.about).trim());
    const brandingDone =
      Number(hasLogo) +
      Number(hasCover) +
      Number(hasCertLogo) +
      Number(hasTagline) +
      Number(hasBio);
    const brandingPct = Math.round((brandingDone / 5) * 100);

    /* -------------------------- Provider page ----------------------------- */

    const everPublished = !!website?.published_snapshot;
    const hasUnpublishedChanges = !!(website?.has_unpublished_changes ?? true);
    const pageDone =
      Number(everPublished) + Number(everPublished && !hasUnpublishedChanges);
    const pagePct = Math.round((pageDone / 2) * 100);

    /* --------------------------- Adoption --------------------------------- */

    const accCount = Number(accreditedCount ?? 0);
    const issCount = Number(issuedCount ?? 0);
    const adoptionDone = Number(accCount > 0) + Number(issCount > 0);
    const adoptionPct = Math.round((adoptionDone / 2) * 100);

    /* --------------------------- Weighted overall ------------------------- */

    const overall = Math.round(
      (verPct * WEIGHTS.verification +
        brandingPct * WEIGHTS.branding +
        pagePct * WEIGHTS.providerPage +
        adoptionPct * WEIGHTS.adoption) /
        (WEIGHTS.verification +
          WEIGHTS.branding +
          WEIGHTS.providerPage +
          WEIGHTS.adoption),
    );

    return {
      pct: overall,
      verification: {
        pct: verPct,
        done: verDone,
        total: 3,
        identityDone,
        identityStatus,
        nameLocked,
        providerName,
        domainDone,
        domainStatus,
        domain: (dom?.domain as string | null) ?? null,
        websiteUrl: (pro.website_url as string | null) ?? null,
      },
      branding: {
        pct: brandingPct,
        done: brandingDone,
        total: 5,
        hasLogo,
        hasCover,
        hasCertLogo,
        hasTagline,
        hasBio,
      },
      providerPage: {
        pct: pagePct,
        done: pageDone,
        total: 2,
        everPublished,
        hasUnpublishedChanges,
        slug: (pro.slug as string | null) ?? null,
      },
      adoption: {
        pct: adoptionPct,
        done: adoptionDone,
        total: 2,
        accreditedCourseCount: accCount,
        issuedCertificateCount: issCount,
      },
    };
  });
