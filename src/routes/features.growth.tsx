import { createFileRoute } from "@tanstack/react-router";

import { FeatureGroupLayout } from "@/components/features/FeatureGroupLayout";
import heroGrowth from "@/assets/hero-growth-bg.jpg.asset.json";

export const Route = createFileRoute("/features/growth")({
  head: () => ({
    meta: [
      { title: "Growth — The single move to grow this month · REPs" },
      {
        name: "description",
        content:
          "Revenue, retention, churn risk and renewal forecasting — surfaced as a Monday-morning card, not a dashboard you have to read.",
      },
      { property: "og:title", content: "Growth — REPs for Professionals" },
      {
        property: "og:description",
        content: "The one move to grow this month — ranked by impact.",
      },
      { property: "og:image", content: heroGrowth.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/growth" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/growth" }],
  }),
  component: () => (
    <FeatureGroupLayout
      groupKey="growth"
      heroLead="Not just a dashboard."
      heroAccent="The single move to grow your business this month."
      heroImage={{
        src: heroGrowth.url,
        alt: "REPs-verified studio owner standing in the doorway of her boutique studio at dusk",
      }}
    />
  ),
});
