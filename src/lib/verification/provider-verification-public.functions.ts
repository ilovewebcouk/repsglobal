/**
 * Public read-only view of a training provider's 3-step verification.
 *
 * Steps (all three required for "REPS Verified"):
 *   01 Identity        — professionals.identity_status = 'approved'
 *   02 Provider name   — profiles.full_name locked (non-empty)
 *   03 Provider domain — latest provider_domain_verifications.status = 'approved'
 *
 * Returns only safe, display-oriented fields — no emails, no rejection
 * reasons, no admin-workflow internals.
 */

import { createServerFn } from "@tanstack/react-start";

export type PublicProviderVerification = {
  identity: { done: boolean; verifiedAt: string | null };
  name: { done: boolean; value: string | null };
  domain: { done: boolean; value: string | null; approvedAt: string | null };
  completedCount: 0 | 1 | 2 | 3;
  verifiedAt: string | null;
};

export const getPublicProviderVerification = createServerFn({ method: "GET" })
  .inputValidator((input: { providerId: string }) => input)
  .handler(async ({ data }): Promise<PublicProviderVerification> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const sb = supabaseAdmin as any;

    const [{ data: pro }, { data: profile }, { data: dom }] = await Promise.all([
      sb
        .from("professionals")
        .select("identity_status, identity_verified_at")
        .eq("id", data.providerId)
        .maybeSingle(),
      sb
        .from("profiles")
        .select("full_name")
        .eq("id", data.providerId)
        .maybeSingle(),
      sb
        .from("provider_domain_verifications")
        .select("status, domain, admin_reviewed_at")
        .eq("professional_id", data.providerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const identityDone = (pro?.identity_status ?? "none") === "approved";
    const identityVerifiedAt = (pro?.identity_verified_at as string | null) ?? null;

    const providerName: string | null =
      typeof profile?.full_name === "string" && profile.full_name.trim().length > 0
        ? profile.full_name.trim()
        : null;
    const nameDone = !!providerName;

    const domainDone = (dom?.status ?? "unstarted") === "approved";
    const domainValue = (dom?.domain as string | null) ?? null;
    const domainApprovedAt = (dom?.admin_reviewed_at as string | null) ?? null;

    const completedCount = (Number(identityDone) +
      Number(nameDone) +
      Number(domainDone)) as 0 | 1 | 2 | 3;

    // Overall "verified since" — latest of the completion timestamps we can see.
    let verifiedAt: string | null = null;
    if (completedCount === 3) {
      const candidates = [identityVerifiedAt, domainApprovedAt].filter(
        (v): v is string => typeof v === "string" && v.length > 0,
      );
      if (candidates.length > 0) {
        verifiedAt = candidates.sort().at(-1) ?? null;
      }
    }

    return {
      identity: { done: identityDone, verifiedAt: identityVerifiedAt },
      name: { done: nameDone, value: nameDone ? providerName : null },
      domain: {
        done: domainDone,
        value: domainDone ? domainValue : null,
        approvedAt: domainApprovedAt,
      },
      completedCount,
      verifiedAt,
    };
  });
