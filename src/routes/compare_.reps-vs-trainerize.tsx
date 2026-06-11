import { createFileRoute } from "@tanstack/react-router";

import { HeadToHeadPage } from "@/components/marketing/HeadToHead";
import trainerizeHero from "@/assets/compare/reps-vs-trainerize-hero.jpg";

const URL = "https://repsglobal.lovable.app/compare/reps-vs-trainerize";
const TITLE = "Trainerize Alternative for Personal Trainers — REPS vs Trainerize (2026)";
const DESC =
  "Honest comparison of REPS and Trainerize for personal trainers. Pricing, client limits, hidden add-ons (Stripe Payments, nutrition, branded app) and feature parity, side-by-side.";

export const Route = createFileRoute("/compare_/reps-vs-trainerize")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:image", content: trainerizeHero },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: trainerizeHero },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: () => <HeadToHeadPage slug="trainerize" />,
});
