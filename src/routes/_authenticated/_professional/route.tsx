import * as React from "react";
import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import {
  getPrimaryRole,
  landingPathForRole,
  userHasRole,
} from "@/lib/auth-redirect";
import { getImpersonationStatus } from "@/lib/admin/impersonation.functions";
import { getTrustState } from "@/lib/verification/trust.functions";
import { getProviderVerificationSummary } from "@/lib/verification/provider-verification.functions";
import { IdentityGateWall } from "@/components/dashboard/verification/IdentityGateWall";
import { VerificationPromptDialog } from "@/components/dashboard/verification/VerificationPromptDialog";
import { ProviderGateWall } from "@/components/dashboard/verification/ProviderGateWall";
import { ProviderVerificationPromptDialog } from "@/components/dashboard/verification/ProviderVerificationPromptDialog";

const LIVE_STATUSES = ["active", "trialing", "past_due", "unpaid"];
const PAID_TIERS = ["verified", "pro", "studio", "training_provider"];

// Routes that remain reachable while identity is not yet approved.
// Anything else under /dashboard/* is replaced by the IdentityGateWall.
const GATE_ALLOWLIST = [
  "/dashboard/verification",
  "/dashboard/settings",
  "/dashboard/support",
  "/dashboard/syncing",
];

function isAllowlisted(pathname: string) {
  return GATE_ALLOWLIST.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const Route = createFileRoute("/_authenticated/_professional")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    const user = data.user;

    const [isProfessional, isAdmin] = await Promise.all([
      userHasRole(user.id, "professional"),
      userHasRole(user.id, "admin"),
    ]);

    if (isAdmin) {
      try {
        const status = await getImpersonationStatus();
        if (status.active) {
          return {
            user,
            role: "professional" as const,
            trainerTier: status.tier,
            isImpersonating: true as const,
          };
        }
      } catch {
        // fall through to professional/role flow
      }
      if (!isProfessional) {
        throw redirect({ to: "/admin/members" });
      }
    }

    if (!isProfessional) {
      const role = await getPrimaryRole(user.id);
      throw redirect({ to: landingPathForRole(role) });
    }

    if (location.pathname.startsWith("/dashboard/syncing")) {
      return { user, role: "professional" as const, trainerTier: "verified" as const };
    }

    const [{ data: sub }, { data: pro }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("tier,status,payment_standing")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("professionals")
        .select("account_type")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    // Payment-standing suspension gate: a member with a live dispute or a
    // lost chargeback must not reach the dashboard, regardless of role.
    if (
      sub &&
      (sub.payment_standing === "payment_disputed" ||
        sub.payment_standing === "chargeback_lost")
    ) {
      throw redirect({ to: "/account/suspended" });
    }

    const subStatusLive =
      !!sub && LIVE_STATUSES.includes(sub.status as string);
    const subTierPaid =
      !!sub && PAID_TIERS.includes(sub.tier as string);

    // Training-provider intent lives on professionals.account_type (set at
    // admin invite time). If a provider's subscriptions row has drifted (e.g.
    // tier still 'free' because a webhook missed the lookup-key mapping),
    // account_type still routes them correctly — never fall through to Core.
    const isProviderByAccountType =
      (pro as { account_type?: string | null } | null)?.account_type ===
      "training_provider";

    const isPaid = subStatusLive && (subTierPaid || isProviderByAccountType);

    if (!isPaid) {
      throw redirect({ to: "/pricing" });
    }

    const trainerTier: "verified" | "pro" | "studio" | "training_provider" =
      isProviderByAccountType
        ? "training_provider"
        : (sub!.tier as "verified" | "pro" | "studio" | "training_provider");
    return { user, role: "professional" as const, trainerTier };
  },

  head: () => ({
    meta: [{ name: "robots", content: "noindex" }],
  }),
  component: ProfessionalLayout,
});

function ProfessionalLayout() {
  const ctx = Route.useRouteContext() as {
    user: { id: string };
    isImpersonating?: boolean;
    trainerTier?: string;
  };
  const location = useLocation();
  const isProvider = ctx.trainerTier === "training_provider";

  const fetchTrust = useServerFn(getTrustState);
  const trustQuery = useQuery({
    queryKey: ["trust-state", ctx.user.id],
    queryFn: () => fetchTrust(),
    enabled: !ctx.isImpersonating && !isProvider,
    staleTime: 30_000,
  });

  const fetchProviderSummary = useServerFn(getProviderVerificationSummary);
  const providerQuery = useQuery({
    queryKey: ["provider-verification-summary", ctx.user.id],
    queryFn: () => fetchProviderSummary(),
    enabled: !ctx.isImpersonating && isProvider,
    staleTime: 30_000,
  });

  // ---- Provider (training_provider) branch: 3-step lock-in gate. ----
  if (isProvider) {
    const summary = providerQuery.data;
    if (
      !ctx.isImpersonating &&
      summary &&
      summary.completedCount < 3 &&
      !isAllowlisted(location.pathname)
    ) {
      return <ProviderGateWall summary={summary} />;
    }
    return (
      <>
        <Outlet />
        {!ctx.isImpersonating &&
        summary &&
        summary.identity.done &&
        summary.completedCount < 3 ? (
          <ProviderVerificationPromptDialog
            summary={summary}
            userId={ctx.user.id}
          />
        ) : null}
      </>
    );
  }

  // ---- Individual trainer branch (unchanged). ----
  const trust = trustQuery.data;
  const identityStatus = trust?.identity.status ?? null;
  const identityApproved = identityStatus === "approved";

  if (
    !ctx.isImpersonating &&
    trust &&
    !identityApproved &&
    !isAllowlisted(location.pathname)
  ) {
    return <IdentityGateWall status={trust.identity.status} />;
  }

  return (
    <>
      <Outlet />
      {!ctx.isImpersonating && trust && identityApproved && trust.completedCount < 3 ? (
        <VerificationPromptDialog trust={trust} userId={ctx.user.id} />
      ) : null}
    </>
  );
}
