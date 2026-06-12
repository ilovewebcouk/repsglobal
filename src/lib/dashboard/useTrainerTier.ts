import { getRouteApi } from "@tanstack/react-router";

import type { Tier } from "@/components/dashboard/DashboardShell";

const professionalRouteApi = getRouteApi("/_authenticated/_professional");

/**
 * Returns the current trainer's tier, resolved server-side in the
 * `_professional` layout's beforeLoad from the user's active subscription.
 */
export function useTrainerTier(): Tier {
  const ctx = professionalRouteApi.useRouteContext();
  return (ctx.trainerTier ?? "verified") as Tier;
}
