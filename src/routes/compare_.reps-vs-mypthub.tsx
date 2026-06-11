import { createFileRoute } from "@tanstack/react-router";

import { HeadToHeadPage } from "@/components/marketing/HeadToHead";
import mypthubHero from "@/assets/compare/reps-vs-mypthub-hero.jpg";

const URL = "https://repsglobal.lovable.app/compare/reps-vs-mypthub";
const TITLE = "MyPTHub Alternative — REPS vs MyPTHub for Personal Trainers (2026)";
const DESC =
  "Honest comparison of REPS and MyPTHub for personal trainers. Pricing, client limits, hidden add-ons (branded app, Check-Ins AI, extra trainers) and full feature parity.";

export const Route = createFileRoute("/compare_/reps-vs-mypthub")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:image", content: mypthubHero },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: mypthubHero },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: () => <HeadToHeadPage slug="mypthub" />,
});
