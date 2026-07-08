import { createFileRoute, redirect } from "@tanstack/react-router";

import { ProviderProfilePage } from "@/components/dashboard/organisation/ProviderProfilePage";

export const Route = createFileRoute(
  "/_authenticated/_professional/dashboard_/profile",
)({
  beforeLoad: ({ context }) => {
    const tier = (context as { trainerTier?: string }).trainerTier;
    if (tier && tier !== "training_provider") {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Provider profile — REPS" }] }),
  component: ProviderProfilePage,
});
