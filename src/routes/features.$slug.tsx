import { createFileRoute, notFound } from "@tanstack/react-router";

import { FeaturePageLayout } from "@/components/features/FeaturePageLayout";
import { FEATURE_CONTENT } from "@/components/features/feature-content";
import { FEATURES, type FeatureLink } from "@/components/features/feature-config";

const VALID_SLUGS = new Set(FEATURES.map((f) => f.slug));

export const Route = createFileRoute("/features/$slug")({
  loader: ({ params }) => {
    if (!VALID_SLUGS.has(params.slug as FeatureLink["slug"])) {
      throw notFound();
    }
    const feature = FEATURES.find((f) => f.slug === params.slug)!;
    return { feature };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Features — REPs" }] };
    const f = loaderData.feature;
    const title = `${f.label} — REPs`;
    const desc = f.oneLiner;
    const url = `https://repsglobal.lovable.app/features/${f.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-reps-ink p-20 text-center text-white">
      <h1 className="font-display text-3xl">Feature not found</h1>
    </div>
  ),
  component: FeatureRoute,
});

function FeatureRoute() {
  const { feature } = Route.useLoaderData();
  const content = FEATURE_CONTENT[feature.slug];
  return <FeaturePageLayout slug={feature.slug} {...content} />;
}
