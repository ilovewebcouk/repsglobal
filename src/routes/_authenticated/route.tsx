import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import {
  DashboardToaster,
  DashboardTooltipProvider,
} from "@/components/dashboard/ui";

/**
 * Managed auth gate for Phase 2.0.
 *
 * SSR is disabled because Supabase stores the session in localStorage —
 * the server cannot read it. Any redirect-on-the-server gate loops on hard
 * refresh and flashes the auth page for signed-in users.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
    return { user: data.user };
  },
  component: () => (
    <DashboardTooltipProvider delayDuration={200}>
      <Outlet />
      <DashboardToaster />
    </DashboardTooltipProvider>
  ),
});
