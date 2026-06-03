import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { ArrowRight, Search, Sparkles, X } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { RESOURCE_ARTICLES, RESOURCE_CATEGORIES, type ResourceCategory } from "@/lib/resources";

type SortMode = "newest" | "oldest" | "az";
type Filter = "All" | ResourceCategory;

const FILTER_VALUES = ["All", ...RESOURCE_CATEGORIES] as const;

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  category: fallback(z.enum(FILTER_VALUES), "All").default("All"),
  sort: fallback(z.enum(["newest", "oldest", "az"]), "newest").default("newest"),
});

export const Route = createFileRoute("/resources/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Resources — Personal Trainer & Fitness Coach Guides UK | REPs" },
      {
        name: "description",
        content:
          "Practical UK guides for hiring personal trainers, fitness coaches and Pilates instructors — plus business, CPD and standards advice from the REPs editorial team.",
      },
      { property: "og:title", content: "Resources — Personal Trainer & Fitness Coach Guides UK | REPs" },
      {
        property: "og:description",
        content:
          "Practical UK guides for hiring personal trainers, fitness coaches and Pilates instructors — plus business, CPD and standards advice from the REPs editorial team.",
      },
      { property: "og:url", content: "https://staging.repsuk.org/resources" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://staging.repsuk.org/resources" }],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const navigate = useNavigate({ from: "/resources" });
  const { q: query, category: filter, sort } = Route.useSearch();

  const setFilter = (next: Filter) =>
    navigate({
      search: (prev) => ({ ...prev, category: next === "All" ? undefined : next }),
      replace: true,
    });
  const setQuery = (next: string) =>
    navigate({
      search: (prev) => ({ ...prev, q: next ? next : undefined }),
      replace: true,
    });
  const setSort = (next: SortMode) =>
    navigate({
      search: (prev) => ({ ...prev, sort: next === "newest" ? undefined : next }),
      replace: true,
    });
  const clearFilters = () => navigate({ search: () => ({}), replace: true });

  const featured = RESOURCE_ARTICLES.find((a) => a.featured) ?? RESOURCE_ARTICLES[0];
  const isFiltering = filter !== "All" || query.trim().length > 0;

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: RESOURCE_ARTICLES.length };
    for (const cat of RESOURCE_CATEGORIES) c[cat] = 0;
    for (const a of RESOURCE_ARTICLES) c[a.category] = (c[a.category] ?? 0) + 1;
    return c;
  }, []);

  const visible = useMemo(() => {
    const pool = isFiltering ? RESOURCE_ARTICLES : RESOURCE_ARTICLES.filter((a) => a.slug !== featured.slug);
    const q = query.trim().toLowerCase();
    const filtered = pool.filter((a) => {
      if (filter !== "All" && a.category !== filter) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered];
    if (sort === "newest") sorted.sort((a, b) => b.date.localeCompare(a.date));
    else if (sort === "oldest") sorted.sort((a, b) => a.date.localeCompare(b.date));
    else sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
  }, [filter, query, sort, isFiltering, featured.slug]);

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Resources
          </span>
          <h1 className="mt-5 max-w-[820px] font-display text-[44px] font-bold leading-tight text-white lg:text-[56px]">
            Resources
          </h1>
          <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-white/70">
            Guidance, standards and industry insight for fitness professionals and the people who hire them.
          </p>

          <div className="relative mt-8 max-w-[520px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, topic or author"
              className="h-12 w-full rounded-[12px] border border-reps-border bg-reps-panel pl-11 pr-11 text-[14px] text-white placeholder:text-white/40 focus:border-reps-orange focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/60 hover:bg-reps-panel hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category filter pills + sort */}
      <section className="border-b border-reps-border">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex flex-nowrap gap-2 overflow-x-auto lg:flex-wrap">
            {(["All", ...RESOURCE_CATEGORIES] as Filter[]).map((c) => {
              const active = filter === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilter(c)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                    active
                      ? "border-reps-orange bg-reps-orange text-white"
                      : "border-reps-border bg-reps-panel text-white/70 hover:text-white"
                  }`}
                >
                  {c}
                  <span className={`ml-2 text-[11px] ${active ? "text-white/80" : "text-white/45"}`}>
                    {counts[c] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 lg:shrink-0">
            <label htmlFor="resources-sort" className="text-[12px] font-semibold uppercase tracking-wider text-white/55">
              Sort
            </label>
            <select
              id="resources-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="h-9 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[13px] font-semibold text-white focus:border-reps-orange focus:outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">A–Z</option>
            </select>
          </div>
        </div>
      </section>


      {/* Featured article */}
      {!isFiltering && (
        <section className="border-b border-reps-border">
          <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Featured
            </span>
            <Link
              to="/resources/$slug"
              params={{ slug: featured.slug }}
              className="mt-4 grid overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel transition-colors hover:border-reps-orange lg:grid-cols-2"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-reps-ink lg:aspect-auto">
                <img src={featured.cover} alt={featured.title} loading="eager" decoding="async" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col justify-center p-8 lg:p-10">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
                  {featured.category}
                </span>
                <h2 className="mt-3 font-display text-[28px] font-bold leading-tight text-white lg:text-[34px]">
                  {featured.title}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-white/70">{featured.excerpt}</p>
                <div className="mt-5 flex items-center gap-3 text-[12px] text-white/55">
                  <span>{featured.author}</span>
                  <span>·</span>
                  <span>{featured.readTime}</span>
                  <span>·</span>
                  <span>{featured.dateLabel}</span>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-reps-orange">
                  Read article <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Article grid */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
          <div className="mb-6 flex items-center justify-between text-[13px] text-white/60">
            <span>
              {visible.length} {visible.length === 1 ? "article" : "articles"}
              {filter !== "All" && (
                <>
                  {" in "}
                  <span className="text-white">{filter}</span>
                </>
              )}
              {query.trim() && (
                <>
                  {" matching \u201C"}
                  <span className="text-white">{query.trim()}</span>
                  {"\u201D"}
                </>
              )}
            </span>
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setFilter("All");
                  setQuery("");
                }}
                className="text-[13px] font-semibold text-reps-orange hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
          {visible.length === 0 ? (
            <p className="text-[14px] text-white/60">No articles match this filter yet.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((a) => (
                <Link
                  key={a.slug}
                  to="/resources/$slug"
                  params={{ slug: a.slug }}
                  className="group flex flex-col overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel transition-colors hover:border-reps-orange"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-reps-ink">
                    <img
                      src={a.cover}
                      alt={a.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                      {a.category}
                    </span>
                    <h3 className="mt-3 font-display text-[18px] font-bold leading-snug text-white">
                      {a.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-white/65">
                      {a.excerpt}
                    </p>
                    <div className="mt-auto flex items-center gap-2 pt-5 text-[12px] text-white/50">
                      <span>{a.readTime}</span>
                      <span>·</span>
                      <span>{a.dateLabel}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

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
