/**
 * Provider verification summary — the single source for the 3-step
 * training-provider verification lock-in flow.
 *
 * The three steps (any order to complete, permanent once locked):
 *   01 Identity          — Stripe Identity (professionals.identity_status)
 *   02 Provider name     — first-time free-text lock-in → profiles.full_name
 *   03 Provider domain   — email-on-domain confirm → admin approves domain
 *
 * All three must be complete before the provider's /dashboard/* unlocks.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuthWithImpersonation } from "@/integrations/supabase/auth-middleware-impersonation";

export type ProviderVerificationSummary = {
  identity: {
    done: boolean;
    status:
      | "none"
      | "pending"
      | "approved"
      | "rejected"
      | "needs_more_info"
      | "expired";
    verifiedName: string | null;
    verifiedAt: string | null;
  };
  name: {
    locked: boolean;
    providerName: string | null;
    pendingName: string | null;
  };
  domain: {
    done: boolean;
    status:
      | "unstarted"
      | "email_sent"
      | "email_confirmed"
      | "pending_admin_review"
      | "approved"
      | "rejected";
    domain: string | null;
    email: string | null;
    website: string | null;
  };
  completedCount: 0 | 1 | 2 | 3;
};

export const getProviderVerificationSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuthWithImpersonation])
  .handler(async ({ context }): Promise<ProviderVerificationSummary> => {
    const { supabase, userId } = context;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const sb = supabase as any;

    const [
      { data: pro },
      { data: profile },
      { data: pendingName },
      { data: dom },
    ] = await Promise.all([
      sb
        .from("professionals")
        .select(
          "identity_status, identity_verified_name, identity_verified_at, website_url",
        )
        .eq("id", userId)
        .maybeSingle(),
      sb.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
      sb
        .from("provider_name_requests")
        .select("requested_name")
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle(),
      sb
        .from("provider_domain_verifications")
        .select("status, domain, email, admin_reviewed_at")
        .eq("professional_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const idStatus =
      ((pro?.identity_status ?? "none") as ProviderVerificationSummary["identity"]["status"]);
    const identityDone = idStatus === "approved";

    const providerName: string | null =
      typeof profile?.full_name === "string" && profile.full_name.trim().length > 0
        ? profile.full_name
        : null;
    // "Locked" once the provider has submitted their trading name.
    // First-time submission writes to profiles.full_name immediately.
    const nameLocked = !!providerName;

    const domStatus =
      ((dom?.status ?? "unstarted") as ProviderVerificationSummary["domain"]["status"]);
    const domainDone = domStatus === "approved";

    const done = (Number(identityDone) + Number(nameLocked) + Number(domainDone)) as
      | 0
      | 1
      | 2
      | 3;

    return {
      identity: {
        done: identityDone,
        status: idStatus,
        verifiedName: (pro?.identity_verified_name as string | null) ?? null,
        verifiedAt: (pro?.identity_verified_at as string | null) ?? null,
      },
      name: {
        locked: nameLocked,
        providerName,
        pendingName: (pendingName?.requested_name as string | null) ?? null,
      },
      domain: {
        done: domainDone,
        status: domStatus,
        domain: (dom?.expected_domain as string | null) ?? null,
        email: (dom?.email as string | null) ?? null,
        website: (pro?.website_url as string | null) ?? null,
      },
      completedCount: done,
    };
  });
