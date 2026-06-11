import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

const LIVE_STATUSES = ["active", "trialing", "past_due", "unpaid"];

export const Route = createFileRoute("/_authenticated/_professional/_pro")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("tier,status")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    const allowed =
      (subscription?.tier === "pro" || subscription?.tier === "studio") &&
      LIVE_STATUSES.includes(subscription.status);
    if (!allowed) {
      throw redirect({
        to: "/dashboard/start",
        search: { tier: "pro", period: "monthly" },
      });
    }
  },
  component: () => <Outlet />,
});