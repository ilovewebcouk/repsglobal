import { createFileRoute } from "@tanstack/react-router";

import { FeatureGroupLayout } from "@/components/features/FeatureGroupLayout";
import heroCoaching from "@/assets/hero-coaching-bg.jpg.asset.json";

export const Route = createFileRoute("/features/coaching")({
  head: () => ({
    meta: [
      { title: "Coaching delivery — Programmes, nutrition, check-ins · REPs" },
      {
        name: "description",
        content:
          "The Trainerize-class coaching stack — programmes, nutrition and check-ins — wired into the same client record as your bookings, payments and messages.",
      },
      { property: "og:title", content: "Coaching — REPs for Professionals" },
      {
        property: "og:description",
        content: "Programmes, nutrition and check-ins, built for coaches.",
      },
      { property: "og:image", content: heroCoaching.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/coaching" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/coaching" }],
  }),
  component: () => (
    <FeatureGroupLayout
      groupKey="coaching"
      heroLead="Not just programmes."
      heroAccent="The coaching stack your clients actually stick to."
      heroImage={{
        src: heroCoaching.url,
        alt: "REPs-verified coach cueing a kettlebell squat with a client at a premium boutique gym at dusk",
      }}
    />
  ),
});
