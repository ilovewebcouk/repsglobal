import { createFileRoute, redirect } from "@tanstack/react-router";

import { ProviderWebsitePage } from "@/components/dashboard/organisation/ProviderWebsitePage";

export const Route = createFileRoute(
  "/_authenticated/_professional/dashboard_/provider-website",
)({
  beforeLoad: ({ context }) => {
    const tier = (context as { trainerTier?: string }).trainerTier;
    if (tier && tier !== "training_provider") {
      throw redirect({ to: "/dashboard/website" });
    }
  },
  head: () => ({ meta: [{ title: "Provider website — REPS" }] }),
  component: ProviderWebsitePage,
});
