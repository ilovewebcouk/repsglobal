import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, Calendar, User as UserIcon } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Prose } from "@/components/help/Prose";
import { HelpfulVote } from "@/components/help/HelpfulVote";
import { RelatedArticles } from "@/components/help/RelatedArticles";
import { getArticle, getRelated } from "@/content/help/registry";
import { getCategory } from "@/content/help/categories";

export const Route = createFileRoute("/help/$category/$slug")({
  loader: ({ params }) => {
    const article = getArticle(params.category, params.slug);
    if (!article) throw notFound();
    const category = getCategory(params.category);
    if (!category) throw notFound();
    return { category: params.category, slug: params.slug };
  },
  head: ({ params }) => {
    const article = getArticle(params.category, params.slug);
    if (!article) return { meta: [] };
    const canonical = `https://repsuk.org/help/${article.category}/${article.slug}`;
    const title = `${article.title} — REPS Help`;
    const desc = article.summary;
    const ld: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.summary,
        author: { "@type": "Organization", name: article.author },
        dateModified: article.lastReviewed,
        mainEntityOfPage: canonical,
      },
    ];
    if (article.faqs?.length) {
      ld.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faqs.map((f: {q: string; a: string}) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    }
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: ld.map((d) => ({
        type: "application/ld+json",
        children: JSON.stringify(d),
      })),
    };
  },
  component: HelpArticlePage,
});

function HelpArticlePage() {
  const { category: categorySlug, slug } = Route.useLoaderData();
  const article = getArticle(categorySlug, slug)!;
  const category = getCategory(categorySlug)!;
  const related = getRelated(article);
  const Body = article.Body;
  const reviewedHuman = new Date(article.lastReviewed).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <PublicHeader />

      <article className="mx-auto max-w-[760px] px-6 py-16 lg:px-0">
        <nav className="flex items-center gap-2 text-[12.5px] text-white/55">
          <Link to="/help" className="hover:text-white">Help</Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <Link
            to="/help/$category"
            params={{ category: category.slug }}
            className="hover:text-white"
          >
            {category.title}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="truncate text-white/85">{article.title}</span>
        </nav>

        <h1 className="font-display mt-6 text-balance text-[36px] font-semibold leading-tight tracking-tight text-white sm:text-[44px]">
          {article.title}
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-white/75">{article.summary}</p>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-[12.5px] text-white/55">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" aria-hidden /> Last reviewed {reviewedHuman}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserIcon className="size-3.5" aria-hidden /> {article.author}
          </span>
          {article.tags.slice(0, 3).map((t: string) => (
            <span
              key={t}
              className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/70"
            >
              {t}
            </span>
          ))}
        </div>

        <hr className="my-10 border-white/10" />

        <Prose>
          <Body />
        </Prose>

        {article.faqs?.length ? (
          <section className="mt-14">
            <h2 className="font-display text-[24px] font-semibold tracking-tight text-white">
              FAQ
            </h2>
            <dl className="mt-6 space-y-5">
              {article.faqs.map((f: {q: string; a: string}) => (
                <div
                  key={f.q}
                  className="rounded-[14px] border border-white/10 bg-white/[0.03] p-5"
                >
                  <dt className="text-[15px] font-semibold text-white">{f.q}</dt>
                  <dd className="mt-2 text-[14.5px] leading-relaxed text-white/75">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <HelpfulVote articleSlug={`${article.category}/${article.slug}`} />

        <RelatedArticles items={related} />
      </article>

      <PublicFooter />
    </div>
  );
}
