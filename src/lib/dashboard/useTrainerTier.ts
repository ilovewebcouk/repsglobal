import { getRouteApi } from "@tanstack/react-router";

import type { Tier } from "@/components/dashboard/DashboardShell";

const professionalRouteApi = getRouteApi("/_authenticated/_professional");

/**
 * Returns the current trainer's tier ("verified" | "pro" | "studio") resolved
 * by the `_professional` layout's beforeLoad. Safe to call from any route
 * nested under `/_authenticated/_professional`.
 */
export function useTrainerTier(): Tier {
  const ctx = professionalRouteApi.useRouteContext();
  return (ctx.trainerTier ?? "verified") as Tier;
}
