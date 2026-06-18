/**
 * Single source of truth for the "Trust" block shown on Public Profile.
 *
 * Tier-blind — every paying member (Verified or Pro) runs the exact same
 * three-step flow (Identity → Insurance → Qualifications) and earns the
 * same three ticks. No `subscription.tier` checks in this file.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";
import { TITLES } from "@/lib/cpd/titles-catalog";

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
    titles: string[];
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
        .select("identity_verified_name, identity_verified_at, identity_status")
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
        .eq("professional_id", userId)
        .eq("status", "approved"),
      supabase
        .from("pro_titles")
        .select("title_slug, granted_at")
        .eq("professional_id", userId),
    ]);

    const proRow = pro as
      | { identity_verified_name: string | null; identity_verified_at: string | null; identity_status: string | null }
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
      insStatus = "pending";
    }
    const insTick = insStatus === "active";

    const approvedCount = (subs ?? []).length;
    const latestApprovedAt =
      (subs ?? [])
        .map((s) => (s as { reviewed_at: string | null }).reviewed_at)
        .filter((x): x is string => !!x)
        .sort()
        .at(-1) ?? null;

    const titleLabels = ((proTitles ?? []) as Array<{ title_slug: string }>)
      .map((r) => TITLES.find((t) => t.slug === r.title_slug)?.label)
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
        titles: titleLabels,
        latestApprovedAt,
      },
      ticks,
      completedCount,
    };
  });
