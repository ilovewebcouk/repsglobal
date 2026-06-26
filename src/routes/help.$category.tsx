import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { getCategory, HELP_CATEGORIES } from "@/content/help/categories";
import { getArticlesByCategory } from "@/content/help/registry";

export const Route = createFileRoute("/help/$category")({
  loader: ({ params }) => {
    const category = getCategory(params.category);
    if (!category) throw notFound();
    const articles = getArticlesByCategory(params.category);
    return { category, articles };
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.category.title} — REPS Help Centre`
      : "REPS Help Centre";
    const desc = loaderData?.category.description ?? "";
    const canonical = loaderData
      ? `https://repsglobal.lovable.app/help/${loaderData.category.slug}`
      : "https://repsglobal.lovable.app/help";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: HelpCategoryPage,
});

function HelpCategoryPage() {
  const { category, articles } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <PublicHeader />
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-[1080px] px-6 pb-12 pt-20 lg:px-10">
          <nav className="flex items-center gap-2 text-[12.5px] text-white/55">
            <Link to="/help" className="hover:text-white">Help</Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-white/85">{category.title}</span>
          </nav>
          <MarketingHeroEyebrow className="mt-6">REPS Help Centre</MarketingHeroEyebrow>
          <h1 className="font-display mt-3 text-balance text-[36px] font-semibold leading-tight tracking-tight text-white sm:text-[44px]">
            {category.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-white/70">
            {category.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-6 py-16 lg:px-10">
        {articles.length === 0 ? (
          <p className="text-white/60">No articles yet — we're writing them.</p>
        ) : (
          <ul className="grid gap-3">
            {articles.map((a) => (
              <li key={a.slug}>
                <Link
                  to="/help/$category/$slug"
                  params={{ category: category.slug, slug: a.slug }}
                  className="group flex items-start justify-between gap-4 rounded-[16px] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold text-white">{a.title}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-white/65">{a.summary}</p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-white/40 transition-colors group-hover:text-white" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-16 rounded-[18px] border border-white/10 bg-white/[0.03] p-6">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-white/55">
            Other topics
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {HELP_CATEGORIES.filter((c) => c.slug !== category.slug).map((c) => (
              <li key={c.slug}>
                <Link
                  to="/help/$category"
                  params={{ category: c.slug }}
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12.5px] font-medium text-white/85 transition-colors hover:bg-white/10"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
