import { createFileRoute } from "@tanstack/react-router";

import { FeatureGroupLayout } from "@/components/features/FeatureGroupLayout";
import heroVisibility from "@/assets/hero-visibility-bg.jpg.asset.json";

export const Route = createFileRoute("/features/visibility")({
  head: () => ({
    meta: [
      { title: "Visibility — Get found by the right clients · REPs" },
      {
        name: "description",
        content:
          "Verified profile, reviews and directory placement. REPs is the one place the public already searches for a trusted fitness professional.",
      },
      { property: "og:title", content: "Visibility — REPs for Professionals" },
      {
        property: "og:description",
        content: "Be found. Be trusted. Be booked. Your verified REPs profile.",
      },
      { property: "og:image", content: heroVisibility.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/visibility" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/visibility" }],
  }),
  component: () => (
    <FeatureGroupLayout
      groupKey="visibility"
      heroLead="Get found by"
      heroAccent="the right clients."
      heroImage={{
        src: heroVisibility.url,
        alt: "Verified REPs trainer standing outside a premium boutique studio at dusk",
      }}
    />
  ),
});
