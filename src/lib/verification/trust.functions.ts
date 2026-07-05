/**
 * Single source of truth for the "Trust" block shown on Public Profile.
 *
 * Tier-blind — every paying member (Core or Pro) runs the exact same
 * three-step flow (Identity → Insurance → Qualifications) and earns the
 * same three ticks. No `subscription.tier` checks in this file.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";
import { TITLES, filterVisibleTitles, isTitleSlug } from "@/lib/cpd/titles-catalog";

export type TrustState = {
  identity: {
    status: "none" | "pending" | "approved" | "rejected" | "needs_more_info" | "expired";
    verifiedName: string | null;
    verifiedAt: string | null;
  };
  insurance: {
    status: "none" | "pending" | "active" | "expired" | "rejected";
    provider: string | null;
    coverGbp: number | null;
    expiryDate: string | null;
  };
  qualifications: {
    count: number;
    pendingCount: number;
    changesRequestedCount: number;
    rejectedCount: number;
    /** Visible (post-supersession) title labels, primary first then secondary. */
    titles: string[];
    /** The pro's chosen primary title label (falls back to highest-tier visible). */
    primaryTitle: string | null;
    /** Optional second title shown alongside primary, when the pro picked one. */
    secondaryTitle: string | null;
    /** Joined "Primary & Secondary" — convenient for badge subtitles. */
    professionLabel: string | null;
    latestApprovedAt: string | null;
  };

  ticks: { identity: boolean; insurance: boolean; qualifications: boolean };
  completedCount: 0 | 1 | 2 | 3;
};

export const getTrustState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<TrustState> => {
    const { supabase, userId } = context;

    const today = new Date().toISOString().slice(0, 10);

    const [{ data: pro }, { data: ins }, { data: subs }, { data: proTitles }] = await Promise.all([
      supabase
        .from("professionals")
        .select("identity_verified_name, identity_verified_at, identity_status, primary_title_slug, secondary_title_slug")
        .eq("id", userId)
        .maybeSingle(),

      supabase
        .from("insurance_policies")
        .select("status, provider, cover_amount_gbp, expiry_date")
        .eq("professional_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("verification_submissions")
        .select("status, reviewed_at")
        .eq("professional_id", userId),
      supabase
        .from("pro_titles")
        .select("title_slug, granted_at")
        .eq("professional_id", userId),
    ]);

    const proRow = pro as
      | {
          identity_verified_name: string | null;
          identity_verified_at: string | null;
          identity_status: string | null;
          primary_title_slug: string | null;
          secondary_title_slug: string | null;
        }
      | null;

    const insRow = ins as
      | { status: string | null; provider: string | null; cover_amount_gbp: number | null; expiry_date: string | null }
      | null;

    const idStatusRaw = (proRow?.identity_status ?? "none") as TrustState["identity"]["status"];
    const idApproved = idStatusRaw === "approved";

    let insStatus: TrustState["insurance"]["status"] = "none";
    if (insRow?.status === "active") {
      insStatus = insRow.expiry_date && insRow.expiry_date < today ? "expired" : "active";
    } else if (insRow?.status === "rejected") {
      insStatus = "rejected";
    } else if (insRow?.status === "pending") {
      // Pending in DB, but if cert has already expired surface that more
      // honestly — the trainer needs to know they have to re-upload.
      insStatus = insRow.expiry_date && insRow.expiry_date < today ? "expired" : "pending";
    } else if (insRow?.status === "expired") {
      insStatus = "expired";
    }
    const insTick = insStatus === "active";

    const allSubs = (subs ?? []) as Array<{ status: string | null; reviewed_at: string | null }>;
    const approvedSubs = allSubs.filter((s) => s.status === "approved");
    const approvedCount = approvedSubs.length;
    const pendingCount = allSubs.filter((s) => s.status === "submitted").length;
    const changesRequestedCount = allSubs.filter((s) => s.status === "changes_requested").length;
    const rejectedCount = allSubs.filter((s) => s.status === "rejected").length;
    const latestApprovedAt =
      approvedSubs
        .map((s) => s.reviewed_at)
        .filter((x): x is string => !!x)
        .sort()
        .at(-1) ?? null;

    const approvedTitleRows = (proTitles ?? []) as Array<{ title_slug: string }>;
    const grantedSlugs = approvedTitleRows.map((r) => r.title_slug);
    const visibleSlugs = filterVisibleTitles(grantedSlugs);
    const labelFor = (slug: string | null): string | null =>
      slug ? TITLES.find((t) => t.slug === slug)?.label ?? null : null;

    // Primary: pro's chosen slug if still earned + visible, else highest-tier
    // visible title (first item — filterVisibleTitles preserves insertion order
    // but we sort visibleSlugs by tier for the fallback).
    const visibleByTier = [...visibleSlugs].sort((a, b) => {
      const ta = TITLES.find((t) => t.slug === a)?.tier ?? 3;
      const tb = TITLES.find((t) => t.slug === b)?.tier ?? 3;
      return ta - tb;
    });

    const storedPrimary = proRow?.primary_title_slug ?? null;
    const storedSecondary = proRow?.secondary_title_slug ?? null;

    const primarySlug =
      storedPrimary && isTitleSlug(storedPrimary) && visibleSlugs.includes(storedPrimary)
        ? storedPrimary
        : visibleByTier[0] ?? null;
    const secondarySlug =
      storedSecondary && isTitleSlug(storedSecondary) && visibleSlugs.includes(storedSecondary) && storedSecondary !== primarySlug
        ? storedSecondary
        : null;

    const primaryTitle = labelFor(primarySlug);
    const secondaryTitle = labelFor(secondarySlug);
    const professionLabel = [primaryTitle, secondaryTitle].filter(Boolean).join(" & ") || null;

    // Visible titles, primary first, then secondary, then the rest.
    const orderedVisible = [
      ...(primarySlug ? [primarySlug] : []),
      ...(secondarySlug ? [secondarySlug] : []),
      ...visibleSlugs.filter((s) => s !== primarySlug && s !== secondarySlug),
    ];
    const titleLabels = orderedVisible
      .map((s) => labelFor(s))
      .filter((x): x is string => !!x);

    const qualTick = approvedCount > 0;

    const ticks = { identity: idApproved, insurance: insTick, qualifications: qualTick };
    const completedCount = (Number(idApproved) + Number(insTick) + Number(qualTick)) as 0 | 1 | 2 | 3;

    return {
      identity: {
        status: idStatusRaw,
        verifiedName: proRow?.identity_verified_name ?? null,
        verifiedAt: proRow?.identity_verified_at ?? null,
      },
      insurance: {
        status: insStatus,
        provider: insRow?.provider ?? null,
        coverGbp: insRow?.cover_amount_gbp ?? null,
        expiryDate: insRow?.expiry_date ?? null,
      },
      qualifications: {
        count: approvedCount,
        pendingCount,
        changesRequestedCount,
        rejectedCount,
        titles: titleLabels,
        primaryTitle,
        secondaryTitle,
        professionLabel,
        latestApprovedAt,
      },
      ticks,
      completedCount,
    };
  });
