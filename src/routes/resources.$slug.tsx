import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { getArticle, getRelated, type ResourceArticle } from "@/lib/resources";

export const Route = createFileRoute("/resources/$slug")({
  loader: ({ params }) => {
    const article = getArticle(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ params, loaderData }) => {
    const article = loaderData?.article;
    if (!article) return { meta: [{ title: "Resource not found — REPs" }] };
    const url = `https://repsglobal.lovable.app/resources/${params.slug}`;
    return {
      meta: [
        { title: `${article.title} — REPs Resources` },
        { name: "description", content: article.excerpt },
        { property: "og:title", content: article.title },
        { property: "og:description", content: article.excerpt },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { property: "og:image", content: article.cover },
        { property: "article:published_time", content: article.date },
        { property: "article:author", content: article.author },
        { property: "article:section", content: article.category },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.excerpt,
            image: article.cover,
            datePublished: article.date,
            author: { "@type": "Person", name: article.author },
            articleSection: article.category,
          }),
        },
      ],
    };
  },
  notFoundComponent: NotFoundArticle,
  errorComponent: ({ reset }) => (
    <div className="min-h-screen bg-reps-ink text-white">
      <PublicHeader variant="solid" />
      <div className="mx-auto max-w-[720px] px-6 py-24 text-center">
        <h1 className="font-display text-[32px] font-bold">Something went wrong</h1>
        <p className="mt-3 text-white/70">We couldn't load this article. Please try again.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
        >
          Retry
        </button>
      </div>
      <PublicFooter />
    </div>
  ),
  component: ArticlePage,
});

function NotFoundArticle() {
  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <PublicHeader variant="solid" />
      <div className="mx-auto max-w-[720px] px-6 py-24 text-center">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
          404
        </span>
        <h1 className="mt-3 font-display text-[36px] font-bold">Article not found</h1>
        <p className="mt-3 text-white/70">
          This resource doesn't exist or has been moved. Browse the full library to find what you
          were looking for.
        </p>
        <Link
          to="/resources"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Resources
        </Link>
      </div>
      <PublicFooter />
    </div>
  );
}

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const related = getRelated(article.slug, article.category);

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* Breadcrumb */}
      <nav className="border-b border-reps-border">
        <div className="mx-auto flex max-w-[880px] items-center gap-2 px-6 py-4 text-[12px] text-white/55 lg:px-10">
          <Link to="/resources" className="hover:text-white">
            Resources
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-reps-orange">{article.category}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-white/70">{article.title}</span>
        </div>
      </nav>

      {/* Article header */}
      <article>
        <header className="mx-auto max-w-[820px] px-6 pt-12 lg:px-10 lg:pt-16">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
            {article.category}
          </span>
          <h1 className="mt-4 font-display text-[36px] font-bold leading-tight text-white lg:text-[48px]">
            {article.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-[13px] text-white/55">
            <span className="text-white/80">{article.author}</span>
            <span>·</span>
            <span>{article.dateLabel}</span>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>
        </header>

        {/* Hero image */}
        <div className="mx-auto mt-10 max-w-[1080px] px-6 lg:px-10">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-[24px] border border-reps-border bg-reps-panel">
            <img src={article.cover} alt="" className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Body */}
        <div className="mx-auto max-w-[760px] px-6 py-14 lg:px-10 lg:py-16">
          <ArticleBody blocks={article.body} />
        </div>

        {/* Author bio */}
        <div className="mx-auto max-w-[760px] px-6 pb-16 lg:px-10">
          <div className="rounded-[16px] border border-reps-border bg-reps-panel p-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
              Written by
            </span>
            <h3 className="mt-2 font-display text-[18px] font-bold text-white">{article.author}</h3>
            <p className="text-[13px] text-white/55">{article.authorRole}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-white/70">{article.authorBio}</p>
          </div>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-reps-border bg-reps-panel/30">
          <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
            <h2 className="font-display text-[24px] font-bold text-white lg:text-[28px]">
              Related articles
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <Link
                  key={a.slug}
                  to="/resources/$slug"
                  params={{ slug: a.slug }}
                  className="group flex flex-col overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel transition-colors hover:border-reps-orange"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-reps-ink">
                    <img
                      src={a.cover}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                      {a.category}
                    </span>
                    <h3 className="mt-3 font-display text-[17px] font-bold leading-snug text-white">
                      {a.title}
                    </h3>
                    <div className="mt-auto flex items-center gap-2 pt-5 text-[12px] text-white/50">
                      <span>{a.readTime}</span>
                      <span>·</span>
                      <span>{a.dateLabel}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA strip */}
      <section className="bg-reps-orange">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <h2 className="font-display text-[26px] font-bold leading-tight text-white lg:text-[30px]">
              Looking for a verified professional?
            </h2>
            <p className="mt-2 text-[15px] text-white/85">
              Browse REPs-verified personal trainers, coaches and instructors in your area.
            </p>
          </div>
          <Link
            to="/find-a-professional"
            className="inline-flex h-12 items-center gap-2 self-start rounded-[10px] bg-white px-6 text-[14px] font-semibold text-reps-orange hover:bg-white/90 lg:self-auto"
          >
            Find a professional <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function ArticleBody({ blocks }: { blocks: ResourceArticle["body"] }) {
  return (
    <div className="space-y-6">
      {blocks.map((b, i) => {
        if (b.type === "h2") {
          return (
            <h2
              key={i}
              className="pt-4 font-display text-[24px] font-bold leading-tight text-white lg:text-[28px]"
            >
              {b.text}
            </h2>
          );
        }
        if (b.type === "p") {
          return (
            <p key={i} className="text-[16px] leading-relaxed text-white/80">
              {b.text}
            </p>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={i} className="space-y-3 pl-1">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-white/80">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-reps-orange" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === "quote") {
          return (
            <blockquote
              key={i}
              className="rounded-[16px] border-l-4 border-reps-orange bg-reps-panel p-6"
            >
              <p className="font-display text-[20px] leading-snug text-white">"{b.text}"</p>
              {b.cite && (
                <footer className="mt-3 text-[12px] uppercase tracking-wider text-white/55">
                  — {b.cite}
                </footer>
              )}
            </blockquote>
          );
        }
        return null;
      })}
    </div>
  );
}
