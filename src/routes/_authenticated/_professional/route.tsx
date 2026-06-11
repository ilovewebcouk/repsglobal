import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { requireRole } from "@/lib/route-gates";

const LIVE_STATUSES = ["active", "trialing", "past_due", "unpaid"];
const PAID_TIERS = ["verified", "pro", "studio"];

export const Route = createFileRoute("/_authenticated/_professional")({
  ssr: false,
  beforeLoad: async (ctx) => {
    // 1) Ensure they're a signed-in professional
    const result = await requireRole(["professional"])(ctx);

    // 2) Allow the post-checkout sync screen through without a sub check —
    //    the webhook may not have landed yet. The screen itself polls and
    //    forwards to /dashboard once the subscription row appears.
    if (ctx.location.pathname.startsWith("/dashboard/syncing")) {
      return result;
    }

    // 3) Ensure they have an active paid subscription. Unpaid → /pricing.
    //    REPS is paid-only — there is no in-app plan picker. /pricing is the
    //    single entry to checkout for both new and orphaned signups.
    const userId = result.user.id;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("tier,status")
      .eq("user_id", userId)
      .maybeSingle();

    const isPaid =
      !!sub &&
      PAID_TIERS.includes(sub.tier as string) &&
      LIVE_STATUSES.includes(sub.status as string);

    if (!isPaid) {
      throw redirect({ to: "/pricing" });
    }

    return result;
  },
  head: () => ({
    meta: [{ name: "robots", content: "noindex" }],
  }),
  component: () => <Outlet />,
});
