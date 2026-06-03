import { createFileRoute } from "@tanstack/react-router";

import { HeadToHeadPage } from "@/components/marketing/HeadToHead";
import ptDistinctionHero from "@/assets/compare/reps-vs-pt-distinction-hero.jpg";

const URL = "https://repsglobal.lovable.app/compare/reps-vs-pt-distinction";
const TITLE = "PT Distinction Alternative — REPs vs PT Distinction (2026)";
const DESC =
  "Honest comparison of REPs and PT Distinction for UK personal trainers. Pricing, per-client charges, feature density (AI Program Builder, Smart Meal Planner) and where each platform wins.";

export const Route = createFileRoute("/compare/reps-vs-pt-distinction")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:image", content: ptDistinctionHero },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: ptDistinctionHero },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: () => <HeadToHeadPage slug="pt-distinction" />,
});
