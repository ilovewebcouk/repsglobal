import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  BadgeCheck,
  ExternalLink,
  GraduationCap,
  Globe,
  Mail,
  MapPin,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicProvider } from "@/lib/training-providers.functions";

export const Route = createFileRoute("/providers/$slug/")({
  loader: async ({ params }) => {
    const res = await getPublicProvider({ data: { slug: params.slug } });
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Provider not found — REPs" }, { name: "robots", content: "noindex" }] };
    }
    const { org, review_avg, review_count, courses } = loaderData;
    const title = `${org.name} — REPs-accredited training provider`;
    const desc =
      `Verified REPs training provider${org.city ? ` in ${org.city}` : ""}. ` +
      `${courses.length} accredited course${courses.length === 1 ? "" : "s"}` +
      (review_count ? ` · ${review_avg?.toFixed(1)}★ from ${review_count} reviews.` : ".");
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/providers/${org.slug}` }],
    };
  },
  errorComponent: () => (
    <div className="min-h-screen bg-reps-bg text-white grid place-items-center p-8">
      <div className="text-center">
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="text-white/60 mt-2">We couldn't load this provider.</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-reps-bg text-white grid place-items-center p-8">
      <div className="text-center max-w-md">
        <h1 className="font-display text-3xl">Provider not found</h1>
        <p className="text-white/60 mt-2">
          This training provider doesn't have a REPs page — or their membership
          isn't active yet.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-[10px] bg-reps-orange px-4 py-2 text-white hover:bg-reps-orange-hover"
        >
          Return home
        </Link>
      </div>
    </div>
  ),
  component: ProviderWebsitePage,
});

function ProviderWebsitePage() {
  const { org, courses, reviews, review_avg, review_count } =
    Route.useLoaderData();

  const location = [org.city, org.country].filter(Boolean).join(", ");
  const verifiedReviews = reviews.filter(
    (r: any) => r.verification_source === "verified",
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: org.name,
    url: `https://repsuk.org/providers/${org.slug}`,
    ...(org.website_url ? { sameAs: [org.website_url] } : {}),
    ...(org.logo_url ? { logo: org.logo_url } : {}),
    ...(review_count && review_avg
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: review_avg.toFixed(1),
            reviewCount: review_count,
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen bg-reps-bg text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Sticky sub-nav */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-reps-bg/85 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-white/70 text-sm hover:text-reps-orange">
            ← REPs Global
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#courses" className="hover:text-reps-orange">Courses</a>
            <a href="#reviews" className="hover:text-reps-orange">Reviews</a>
            <a href="#about" className="hover:text-reps-orange">About</a>
            <a href="#verify" className="hover:text-reps-orange">Verify</a>
          </nav>
          {org.website_url && (
            <a
              href={org.website_url}
              target="_blank"
              rel="noopener nofollow"
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 py-1.5 text-sm text-white hover:bg-reps-orange-hover"
            >
              Provider site <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-reps-orange/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 lg:py-24 grid gap-10 lg:grid-cols-[1fr_auto] items-start">
          <div className="max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                <BadgeCheck className="mr-1 h-3.5 w-3.5" /> REPs-accredited
              </Badge>
              {org.membership_number && (
                <Badge className="rounded-full border-white/15 bg-white/5 text-white/70">
                  Membership #{org.membership_number}
                </Badge>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 text-sm text-white/60">
                  <MapPin className="h-3.5 w-3.5" /> {location}
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl lg:text-6xl text-white">
              {org.name}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl">
              A REPs-accredited training provider. Every course listed here has
              been reviewed and accredited by REPs — check the badge and course
              id on each one.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#courses"
                className="rounded-[10px] bg-reps-orange px-4 py-2 text-white hover:bg-reps-orange-hover"
              >
                See accredited courses
              </a>
              {org.website_url && (
                <a
                  href={org.website_url}
                  target="_blank"
                  rel="noopener nofollow"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
                >
                  <Globe className="h-4 w-4" /> Visit provider website
                </a>
              )}
            </div>
          </div>

          {/* Verified card */}
          <div className="w-full lg:w-[280px] rounded-[22px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-3">
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt=""
                  className="h-14 w-14 rounded-[14px] border border-white/10 object-cover bg-white"
                />
              ) : (
                <div className="h-14 w-14 rounded-[14px] border border-white/10 bg-white/5 grid place-items-center">
                  <GraduationCap className="h-6 w-6 text-white/60" />
                </div>
              )}
              <div>
                <div className="text-xs uppercase tracking-wide text-white/50">
                  Verified provider
                </div>
                <div className="text-white font-medium">{org.name}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <Row
                k="Accredited courses"
                v={<span className="text-white">{courses.length}</span>}
              />
              <Row
                k="Reviews"
                v={
                  review_count ? (
                    <span className="inline-flex items-center gap-1 text-white">
                      <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
                      {review_avg?.toFixed(1)} · {review_count}
                    </span>
                  ) : (
                    <span className="text-white/50">Not yet</span>
                  )
                }
              />
              <Row
                k="Verified since"
                v={
                  <span className="text-white/70">
                    {org.verified_at
                      ? new Date(org.verified_at).toLocaleDateString(undefined, {
                          month: "short",
                          year: "numeric",
                        })
                      : new Date(org.published_at!).toLocaleDateString(
                          undefined,
                          { month: "short", year: "numeric" },
                        )}
                  </span>
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="border-b border-white/10 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 max-w-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-reps-orange">
              Accredited courses
            </div>
            <h2 className="mt-2 font-display text-3xl lg:text-5xl text-white">
              Courses accredited by REPs
            </h2>
            <p className="mt-3 text-white/60">
              Each course has been reviewed against REPs standards. The badge
              and course id below prove it's the real thing.
            </p>
          </div>
          {courses.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-white/15 p-10 text-center text-white/50">
              No accredited courses listed yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((c: any) => (
                <article
                  key={c.id}
                  className="group flex flex-col rounded-[18px] border border-white/10 bg-white/[0.03] p-5 hover:border-reps-orange/40 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Badge className="rounded-full border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                      <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Accredited
                    </Badge>
                    {c.level && (
                      <span className="text-xs text-white/50">
                        Level {c.level}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-display text-xl text-white">
                    {c.title}
                  </h3>
                  {c.summary && (
                    <p className="mt-1.5 text-sm text-white/60 line-clamp-3">
                      {c.summary}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                    {c.duration_hours && <span>{c.duration_hours} hours</span>}
                    {c.delivery_mode && (
                      <span className="capitalize">
                        {String(c.delivery_mode).replace("_", " ")}
                      </span>
                    )}
                    {c.price_from && <span>from £{c.price_from}</span>}
                  </div>
                  {c.reps_course_id && (
                    <div className="mt-4 rounded-[12px] border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/60">
                      REPs course id{" "}
                      <code className="text-white">{c.reps_course_id}</code>
                    </div>
                  )}
                  {c.external_url && (
                    <a
                      href={`${c.external_url}${c.external_url.includes("?") ? "&" : "?"}utm_source=repsuk&utm_medium=provider_page&utm_campaign=course`}
                      target="_blank"
                      rel="noopener nofollow"
                      className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-reps-orange px-3 py-2 text-sm text-white hover:bg-reps-orange-hover"
                    >
                      Enquire on provider site{" "}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section
        id="reviews"
        className="border-b border-white/10 bg-reps-panel/20 py-20 lg:py-28"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-reps-orange">
                Reviews
              </div>
              <h2 className="mt-2 font-display text-3xl lg:text-5xl text-white">
                What learners say
              </h2>
              <p className="mt-3 text-white/60 max-w-2xl">
                Reviews are open to anyone. Reviews from learners we've been
                able to verify carry a Verified badge.
              </p>
            </div>
            {review_count > 0 && (
              <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-5 py-4 text-right">
                <div className="flex items-center gap-1 justify-end">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(review_avg ?? 0)
                          ? "fill-reps-orange text-reps-orange"
                          : "text-white/20"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-1 text-white font-display text-2xl">
                  {review_avg?.toFixed(1)} <span className="text-white/50 text-base">/ 5</span>
                </div>
                <div className="text-xs text-white/50">
                  {review_count} review{review_count === 1 ? "" : "s"} ·{" "}
                  {verifiedReviews.length} verified
                </div>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-white/15 p-10 text-center text-white/50">
              No reviews yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((r: any) => (
                <article
                  key={r.id}
                  className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < r.rating
                              ? "fill-reps-orange text-reps-orange"
                              : "text-white/20"
                          }`}
                        />
                      ))}
                    </div>
                    {r.verification_source === "verified" && (
                      <Badge className="rounded-full border-emerald-400/30 bg-emerald-500/15 text-emerald-300 text-[10px]">
                        <BadgeCheck className="mr-1 h-3 w-3" /> Verified learner
                      </Badge>
                    )}
                    {r.status !== "published" && (
                      <Badge className="rounded-full border-amber-400/30 bg-amber-500/15 text-amber-300 text-[10px]">
                        Under review
                      </Badge>
                    )}
                  </div>
                  {r.title && (
                    <h4 className="mt-3 font-medium text-white">{r.title}</h4>
                  )}
                  <p className="mt-1.5 text-sm text-white/70 whitespace-pre-line">
                    {r.body}
                  </p>
                  <div className="mt-3 text-xs text-white/50">
                    {r.author_display_name} ·{" "}
                    {new Date(r.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-8">
            <Link
              to="/providers/$slug/review"
              params={{ slug: org.slug }}
              className="inline-flex items-center gap-2 rounded-[10px] bg-reps-orange hover:bg-reps-orange-hover text-white px-4 py-2 text-sm font-medium"
            >
              <Star className="h-4 w-4" /> Write a review
            </Link>
          </div>

        </div>
      </section>

      {/* About */}
      <section id="about" className="border-b border-white/10 py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-xs uppercase tracking-[0.2em] text-reps-orange">
            About
          </div>
          <h2 className="mt-2 font-display text-3xl lg:text-5xl text-white">
            About {org.name}
          </h2>
          <div className="mt-6 text-white/70 whitespace-pre-line leading-relaxed">
            {org.about_md || "This provider hasn't added an about section yet."}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {org.contact_email && (
              <a
                href={`mailto:${org.contact_email}`}
                className="inline-flex items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white/80 hover:border-reps-orange/40"
              >
                <Mail className="h-4 w-4 text-reps-orange" /> {org.contact_email}
              </a>
            )}
            {org.website_url && (
              <a
                href={org.website_url}
                target="_blank"
                rel="noopener nofollow"
                className="inline-flex items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white/80 hover:border-reps-orange/40"
              >
                <Globe className="h-4 w-4 text-reps-orange" /> {org.website_url}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Verify */}
      <section id="verify" className="py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Badge className="rounded-full border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
            <BadgeCheck className="mr-1 h-3.5 w-3.5" /> REPs verification
          </Badge>
          <h2 className="mt-4 font-display text-3xl lg:text-5xl text-white">
            Verify this membership
          </h2>
          <p className="mt-3 text-white/60">
            Membership number{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-white">
              {org.membership_number ?? "—"}
            </code>{" "}
            — check the live REPs record.
          </p>
          {org.membership_number && (
            <Link
              to="/verify/provider/$membershipId"
              params={{ membershipId: org.membership_number }}
              className="mt-6 inline-flex rounded-[10px] bg-reps-orange px-5 py-2.5 text-white hover:bg-reps-orange-hover"
            >
              Open verification page
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/50">{k}</span>
      {v}
    </div>
  );
}
