import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { userHasRole, getPrimaryRole, landingPathForRole } from "@/lib/auth-redirect";
import { getImpersonationStatus } from "@/lib/admin/impersonation.functions";

const LIVE_STATUSES = ["active", "trialing", "past_due", "unpaid"];
const PAID_TIERS = ["verified", "pro", "studio"];

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

    // Admin path — if there's an active impersonation session, view-as the
    // target professional and skip the admin's own subscription check.
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
      // Admin not impersonating: send them to the admin console.
      if (!isProfessional) {
        throw redirect({ to: "/admin/professionals" });
      }
      // Admin who's also a real professional: fall through to normal flow.
    }

    if (!isProfessional) {
      const role = await getPrimaryRole(user.id);
      throw redirect({ to: landingPathForRole(role) });
    }

    // 2) Allow the post-checkout sync screen through without a sub check.
    if (location.pathname.startsWith("/dashboard/syncing")) {
      return { user, role: "professional" as const, trainerTier: "verified" as const };
    }

    // 3) Real professional must have an active paid subscription.
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("tier,status")
      .eq("user_id", user.id)
      .maybeSingle();

    const isPaid =
      !!sub &&
      PAID_TIERS.includes(sub.tier as string) &&
      LIVE_STATUSES.includes(sub.status as string);

    if (!isPaid) {
      throw redirect({ to: "/pricing" });
    }

    const trainerTier = sub!.tier as "verified" | "pro" | "studio";
    return { user, role: "professional" as const, trainerTier };
  },
  head: () => ({
    meta: [{ name: "robots", content: "noindex" }],
  }),
  component: () => <Outlet />,
});
