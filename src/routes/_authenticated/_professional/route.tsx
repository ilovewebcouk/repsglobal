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
import { IdentityGateWall } from "@/components/dashboard/verification/IdentityGateWall";
import { VerificationPromptDialog } from "@/components/dashboard/verification/VerificationPromptDialog";

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

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("tier,status,payment_standing")
      .eq("user_id", user.id)
      .maybeSingle();

    // Payment-standing suspension gate: a member with a live dispute or a
    // lost chargeback must not reach the dashboard, regardless of role.
    if (
      sub &&
      (sub.payment_standing === "payment_disputed" ||
        sub.payment_standing === "chargeback_lost")
    ) {
      throw redirect({ to: "/account/suspended" });
    }

    const isPaid =
      !!sub &&
      PAID_TIERS.includes(sub.tier as string) &&
      LIVE_STATUSES.includes(sub.status as string);

    if (!isPaid) {
      throw redirect({ to: "/pricing" });
    }

    const trainerTier = sub!.tier as "verified" | "pro" | "studio" | "training_provider";
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
  };
  const location = useLocation();

  const fetchTrust = useServerFn(getTrustState);
  const trustQuery = useQuery({
    queryKey: ["trust-state", ctx.user.id],
    queryFn: () => fetchTrust(),
    enabled: !ctx.isImpersonating,
    staleTime: 30_000,
  });

  const trust = trustQuery.data;
  const identityStatus = trust?.identity.status ?? null;
  const identityApproved = identityStatus === "approved";

  // Hard-gate: identity not approved + route not allow-listed → show wall.
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
