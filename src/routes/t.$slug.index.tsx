import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  Bookmark,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  GraduationCap,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import {
  getWebsiteBySlug,
  type WebsiteDTO,
  type WebsiteFaqDTO,
} from "@/lib/website/website.functions";
import { listPublicReviewsBySlug } from "@/lib/reviews/reviews.functions";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import diverseLogo from "@/assets/diverse-logo.svg.asset.json";
import origymLogo from "@/assets/origym-logo.webp.asset.json";

const DEMO_PROVIDER_LOGOS: Record<string, string> = {
  "northline-fitness-academy": diverseLogo.url,
  "forge-strength-institute": origymLogo.url,
};

/* -------------------------------------------------------------------- */
/* Route                                                                */
/* -------------------------------------------------------------------- */

export const Route = createFileRoute("/t/$slug/")({
  validateSearch: (search: Record<string, unknown>) => ({
    preview: typeof search.preview === "string" ? search.preview : undefined,
  }),
  loaderDeps: ({ search }) => ({ preview: search.preview }),
  loader: async ({ params, deps }) => {
    const live = await getWebsiteBySlug({
      data: { slug: params.slug, preview: deps.preview },
    });
    if (!live) throw notFound();
    return { live };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-white p-8 text-center text-black/60">
      <div>
        <h1 className="font-display text-2xl font-bold text-black">Provider not found</h1>
        <p className="mt-2 text-sm">This training provider is not available.</p>
      </div>
    </div>
  ),
  head: ({ params, loaderData }) => {
    const sf = loaderData?.live?.website;
    const canonical = `https://repsuk.org/t/${params.slug}`;
    if (!sf) {
      return {
        meta: [
          { title: "Provider not found | REPS" },
          { name: "robots", content: "noindex,nofollow" },
        ],
        links: [{ rel: "canonical", href: canonical }],
      };
    }
    const name = sf.full_name?.trim() || "REPS Training Provider";
    const title = `${name} — REPS Verified Training Provider`;
    const description = (
      sf.tagline?.trim() ||
      sf.subtitle?.trim() ||
      `${name} — Ofqual-regulated training provider recognised on REPS.`
    ).slice(0, 160);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name,
            url: canonical,
            address: sf.city ?? undefined,
            logo: sf.avatar_url ?? undefined,
          }),
        },
      ],
    };
  },
  component: ProviderProfilePage,
});

/* -------------------------------------------------------------------- */
/* Page                                                                 */
/* -------------------------------------------------------------------- */

type Course = {
  id: string;
  title: string;
  blurb: string;
  price: string;
  format: "In-person" | "Online" | "Blended";
};

function ProviderProfilePage() {
  const { slug } = Route.useParams();
  const { live } = Route.useLoaderData();
  const sf = live!.website;

  const fetchReviews = useServerFn(listPublicReviewsBySlug);
  const { data: reviewsData } = useQuery({
    queryKey: ["public-reviews", slug],
    queryFn: () => fetchReviews({ data: { slug, limit: 6 } }),
    staleTime: 60_000,
  });

  const reviews = reviewsData?.reviews ?? [];
  const ratingAvg = reviewsData?.average ?? 0;
  const ratingCount = reviewsData?.count ?? 0;

  const providerName = sf.full_name?.trim() || "Training Provider";
  const tagline = sf.tagline?.trim() || `${providerName} — REPS Verified Training Provider`;
  const city = sf.city ?? "Location coming soon";
  const logoUrl = DEMO_PROVIDER_LOGOS[slug] ?? sf.avatar_url ?? null;

  const yearFrom = sf.trust?.qualifiedSinceYear ?? sf.coaching_since_year ?? null;
  const yearsEstablished = yearFrom ? Math.max(1, new Date().getFullYear() - yearFrom) : null;
  const verifiedSince = (() => {
    const idAt = sf.trust?.identityVerifiedAt;
    if (idAt) {
      const d = new Date(idAt);
      if (!isNaN(d.getTime())) return String(d.getFullYear());
    }
    return new Date().getFullYear().toString();
  })();

  const deliveryModes: string[] = [];
  if (sf.in_person_available) deliveryModes.push("In-person");
  if (sf.online_available) deliveryModes.push("Online");
  const deliveryLabel = deliveryModes.length === 2 ? "Blended" : deliveryModes[0] ?? "In-person";

  // Provider-specific: mock courses (empty state safe)
  const courses: Course[] = [];

  const accreditations: Array<{ code: string; title: string; body: string; regulated: boolean }> = [];

  const verifiedProsLinked = 0;

  const faqs: WebsiteFaqDTO[] = [];

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-black antialiased">
      <PublicHeader variant="solid" mobileOpaque />

      <main id="main-content">
        {/* Breadcrumbs */}
        <div className="mx-auto max-w-[1180px] px-4 pt-6 lg:px-6">
          <nav aria-label="Breadcrumb" className="text-[13px] text-black/55">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link to="/" className="hover:text-black">Home</Link>
              </li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" strokeWidth={2} /></li>
              <li>
                <Link to="/find-a-professional" className="hover:text-black">Find a Professional</Link>
              </li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" strokeWidth={2} /></li>
              <li>
                <Link to="/find-a-professional" className="hover:text-black">Training Providers</Link>
              </li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" strokeWidth={2} /></li>
              <li aria-current="page" className="text-black font-medium">{providerName}</li>
            </ol>
          </nav>
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-[1180px] px-4 pt-6 lg:px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr] lg:gap-8">
            <div className="relative aspect-square w-full overflow-hidden rounded-[18px] border border-black/10 bg-white">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${providerName} logo`}
                  className="h-full w-full object-contain p-8"
                  loading="eager"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#f2f1ec]">
                  <Building2 className="h-16 w-16 text-black/25" strokeWidth={1.5} />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
                REPS Verified
              </span>
              <h1 className="mt-3 font-display text-[36px] font-bold leading-[1.05] tracking-[-0.01em] text-black lg:text-[46px]">
                {providerName}
              </h1>
              <p className="mt-2 text-[15px] text-black/60">Training Provider · Ofqual-regulated</p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-[14px] text-black/65">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" strokeWidth={2} />
                  {city}
                </span>
                {ratingCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-[#FF7A00] text-[#FF7A00]" />
                    <span className="font-semibold text-black">{ratingAvg.toFixed(1)}</span>
                    <span className="text-black/55">
                      ({ratingCount} {ratingCount === 1 ? "review" : "reviews"})
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-black/45">
                    <Star className="h-4 w-4" strokeWidth={2} />
                    No reviews yet
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/12 bg-white px-3 py-1 text-[12.5px] font-medium text-black/70">
                  <Users className="h-3.5 w-3.5" strokeWidth={2} />
                  {deliveryLabel}
                </span>
              </div>

              {sf.subtitle?.trim() ? (
                <blockquote className="mt-4 border-l-2 border-[#FF7A00] pl-3 text-[15px] italic text-black/70">
                  "{sf.subtitle.trim()}"
                </blockquote>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/t/$slug/enquire"
                  params={{ slug }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#FF7A00] px-5 text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-[#E96F00]"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2} />
                  Enquire Now
                </Link>
                <Link
                  to="/t/$slug/review"
                  params={{ slug }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-black/15 bg-white px-5 text-[14px] font-semibold text-black shadow-none transition-colors hover:border-black/30"
                >
                  <Star className="h-4 w-4" strokeWidth={2} />
                  Write a Review
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="mx-auto mt-6 max-w-[1180px] px-4 lg:px-6">
          <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-[16px] border border-black/10 bg-white sm:grid-cols-2 lg:grid-cols-4">
            <TrustTile
              icon={<ShieldCheck className="h-4 w-4" strokeWidth={2} />}
              title="REPS Verified"
              sub="Qualified & insured"
            />
            <TrustTile
              icon={<GraduationCap className="h-4 w-4" strokeWidth={2} />}
              title="Accreditations Checked"
              sub={`Checked ${monthYear(sf.trust?.lastCheckedAt) ?? "recently"}`}
            />
            <TrustTile
              icon={<BadgeCheck className="h-4 w-4" strokeWidth={2} />}
              title="Professional Indemnity"
              sub={
                sf.trust?.insuranceExpiry
                  ? `Active until ${monthYear(sf.trust.insuranceExpiry) ?? ""}`
                  : "On file"
              }
            />
            <TrustTile
              icon={<Sparkles className="h-4 w-4" strokeWidth={2} />}
              title="CPD tracking"
              sub="Coming soon"
              muted
            />
          </div>
        </section>

        {/* Sticky in-page nav */}
        <StickyNav />

        {/* Main grid */}
        <section className="mx-auto mt-8 max-w-[1180px] px-4 lg:px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_320px]">
            {/* About */}
            <article id="about" className="scroll-mt-28 rounded-[22px] border border-black/10 bg-white p-6">
              <h2 className="font-display text-[20px] font-bold text-black">
                About {providerName.split(/\s+/)[0]}
              </h2>
              {sf.tagline?.trim() ? (
                <blockquote className="mt-3 border-l-2 border-[#FF7A00] pl-3 text-[14px] italic text-black/70">
                  "{sf.tagline.trim()}"
                </blockquote>
              ) : null}
              <div className="mt-4 space-y-3 text-[14px] leading-[1.65] text-black/72">
                {(sf.about?.split(/\n\n+/).filter(Boolean) ?? [
                  `${providerName} is a REPS Verified training provider. Full provider profile — including course catalogue, tutors and accreditation — will appear here once the provider completes onboarding.`,
                ]).map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 rounded-[16px] border border-black/10 bg-[#f7f6f2] p-4">
                <StatTile
                  label="Years established"
                  value={yearsEstablished ? `${yearsEstablished}+` : "New"}
                />
                <StatTile label="Learners trained" value="—" />
                <StatTile label="Verified since" value={verifiedSince} accent />
              </div>
            </article>

            {/* Courses & Pricing */}
            <article id="courses" className="scroll-mt-28 rounded-[22px] border border-black/10 bg-white p-6">
              <header className="flex items-center justify-between">
                <h2 className="font-display text-[20px] font-bold text-black">Courses & Pricing</h2>
                <Link
                  to="/t/$slug/enquire"
                  params={{ slug }}
                  className="text-[13px] font-semibold text-[#FF7A00] hover:text-[#E96F00]"
                >
                  View all courses →
                </Link>
              </header>
              <div className="mt-4 space-y-3">
                {courses.length === 0 ? (
                  <EmptyBlock
                    icon={<GraduationCap className="h-6 w-6 text-black/30" strokeWidth={1.8} />}
                    title="No courses listed yet"
                    sub="Course catalogue will appear here once the provider adds them."
                  />
                ) : (
                  courses.map((c) => <CourseCard key={c.id} course={c} />)
                )}
              </div>
            </article>

            {/* Right column */}
            <aside className="space-y-4">
              <div
                id="verified-pros"
                className="scroll-mt-28 rounded-[22px] border border-black/10 bg-white p-5"
              >
                <h2 className="font-display text-[16px] font-bold text-black">
                  Verified Professionals Trained
                </h2>
                {verifiedProsLinked === 0 ? (
                  <p className="mt-2 text-[13px] text-black/55">
                    Verified pros trained by this provider will appear here once linked.
                  </p>
                ) : (
                  <p className="mt-2 text-[13px] text-black/60">
                    <span className="text-[22px] font-bold text-black">{verifiedProsLinked}</span>{" "}
                    verified professionals trained
                  </p>
                )}
                <Link
                  to="/find-a-professional"
                  className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#FF7A00] hover:text-[#E96F00]"
                >
                  Browse verified pros
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              </div>

              <div
                id="locations"
                className="scroll-mt-28 rounded-[22px] border border-black/10 bg-white p-5"
              >
                <h2 className="font-display text-[16px] font-bold text-black">
                  Locations & Delivery
                </h2>
                <div className="mt-3 flex items-start gap-3 rounded-[16px] border border-black/10 bg-[#f7f6f2] p-3">
                  <div className="mt-0.5 rounded-[10px] bg-[#FF7A00]/15 p-2 text-[#FF7A00]">
                    <MapPin className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-black">{city}</p>
                    <p className="text-[12.5px] text-black/55">
                      {sf.in_person_available ? "In-person training" : "Delivered online"}
                    </p>
                  </div>
                </div>
                {sf.online_available ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-black/60">
                    <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.4} />
                    Also delivers online
                  </p>
                ) : null}
              </div>
            </aside>
          </div>
        </section>

        {/* Accreditations + Trust */}
        <section className="mx-auto mt-6 max-w-[1180px] px-4 lg:px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article id="accreditations" className="scroll-mt-28 rounded-[22px] border border-black/10 bg-white p-6">
              <h2 className="font-display text-[20px] font-bold text-black">
                Accreditations & Recognition
              </h2>
              {accreditations.length === 0 ? (
                <EmptyBlock
                  className="mt-4"
                  icon={<BadgeCheck className="h-6 w-6 text-black/30" strokeWidth={1.8} />}
                  title="Accreditations will appear here"
                  sub="Awarding bodies and Ofqual-regulated qualifications the provider offers."
                />
              ) : (
                <ul className="mt-4 space-y-3">
                  {accreditations.map((a) => (
                    <li key={a.code} className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#f2f1ec] text-[11px] font-bold text-black/60">
                        {a.code}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-black">{a.title}</p>
                        <p className="text-[12.5px] text-black/55">{a.body}</p>
                        {a.regulated ? (
                          <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700">
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                            Ofqual-regulated
                          </span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="rounded-[22px] border border-black/10 bg-white p-6">
              <h2 className="font-display text-[20px] font-bold text-black">Trust & Assurance</h2>
              <ul className="mt-4 space-y-3">
                <TrustRow
                  icon={<Check className="h-4 w-4 text-emerald-600" strokeWidth={2.4} />}
                  title="Identity Verified"
                  sub={
                    sf.trust?.identityVerifiedAt
                      ? `Confirmed ${monthYear(sf.trust.identityVerifiedAt) ?? ""}`
                      : "On file"
                  }
                />
                <TrustRow
                  icon={<Check className="h-4 w-4 text-emerald-600" strokeWidth={2.4} />}
                  title="Accreditations Approved"
                  sub={`Checked ${monthYear(sf.trust?.lastCheckedAt) ?? "recently"}`}
                />
                <TrustRow
                  icon={<Check className="h-4 w-4 text-emerald-600" strokeWidth={2.4} />}
                  title="Professional Indemnity Insurance"
                  sub={
                    sf.trust?.insuranceExpiry
                      ? `Active until ${monthYear(sf.trust.insuranceExpiry) ?? ""}`
                      : "On file"
                  }
                />
              </ul>
              <Link
                to="/t/$slug/enquire"
                params={{ slug }}
                className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-[#FF7A00] hover:text-[#E96F00]"
              >
                View full verification
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </article>
          </div>
        </section>

        {/* Reviews + FAQs */}
        <section className="mx-auto mt-6 max-w-[1180px] px-4 lg:px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article id="reviews" className="scroll-mt-28 rounded-[22px] border border-black/10 bg-white p-6">
              <header className="flex items-center justify-between">
                <h2 className="font-display text-[20px] font-bold text-black">What Learners Say</h2>
                {reviews.length > 0 ? (
                  <button className="text-[13px] font-semibold text-[#FF7A00] hover:text-[#E96F00]">
                    See all {ratingCount} reviews
                  </button>
                ) : null}
              </header>
              {reviews.length === 0 ? (
                <EmptyBlock
                  className="mt-4"
                  icon={<Star className="h-6 w-6 text-black/30" strokeWidth={1.8} />}
                  title="No reviews yet"
                  sub="Verified learner reviews will appear here."
                />
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
                  <div>
                    <p className="font-display text-[36px] font-bold leading-none text-black">
                      {ratingAvg.toFixed(1)}
                    </p>
                    <div className="mt-1 flex gap-0.5" aria-hidden>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < Math.round(ratingAvg)
                              ? "h-4 w-4 fill-[#FF7A00] text-[#FF7A00]"
                              : "h-4 w-4 text-black/20"
                          }
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-[12px] text-black/55">
                      Based on {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {reviews.slice(0, 1).map((r) => (
                      <div key={r.id}>
                        <p className="text-[13px] font-semibold text-black">
                          {r.client_name ?? "Learner"}
                        </p>
                        <p className="mt-1 text-[13.5px] leading-[1.6] text-black/72">
                          "{r.body}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>

            <article id="faqs" className="scroll-mt-28 rounded-[22px] border border-black/10 bg-white p-6">
              <header className="flex items-center justify-between">
                <h2 className="font-display text-[20px] font-bold text-black">
                  Frequently Asked Questions
                </h2>
              </header>
              {faqs.length === 0 ? (
                <EmptyBlock
                  className="mt-4"
                  icon={<MessageCircle className="h-6 w-6 text-black/30" strokeWidth={1.8} />}
                  title="No FAQs added yet"
                  sub="Common learner questions will appear here."
                />
              ) : (
                <ul className="mt-4 space-y-2">
                  {faqs.slice(0, 5).map((f) => (
                    <li key={f.id} className="rounded-[16px] border border-black/10 bg-[#f7f6f2] p-3">
                      <p className="text-[13.5px] font-semibold text-black">{f.question}</p>
                      <p className="mt-1 text-[13px] text-black/65">{f.answer}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        </section>

        {/* CTA band */}
        <section className="mx-auto mt-8 max-w-[1180px] px-4 lg:px-6">
          <div className="flex flex-col items-start gap-4 rounded-[22px] border border-black/10 bg-white p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-[10px] bg-[#FF7A00]/15 p-2 text-[#FF7A00]">
                <Calendar className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="font-display text-[18px] font-bold text-black">
                  Ready to train with {providerName}?
                </p>
                <p className="text-[13.5px] text-black/60">
                  Send an enquiry to discuss courses, dates and pricing.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                to="/t/$slug/enquire"
                params={{ slug }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#FF7A00] px-5 text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-[#E96F00]"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
                Send Enquiry
              </Link>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-black/15 bg-white px-5 text-[14px] font-semibold text-black shadow-none transition-colors hover:border-black/30">
                <Bookmark className="h-4 w-4" strokeWidth={2} />
                Save profile
              </button>
            </div>
          </div>
        </section>

        {/* Global stats strip */}
        <section className="mx-auto mt-8 max-w-[1180px] px-4 pb-12 lg:px-6">
          <div className="grid grid-cols-2 gap-4 rounded-[22px] border border-black/10 bg-white p-6 md:grid-cols-5">
            <GlobalStat icon={<Users className="h-4 w-4" strokeWidth={2} />} value="25,000+" label="Verified Professionals" />
            <GlobalStat icon={<Star className="h-4 w-4" strokeWidth={2} />} value="50,000+" label="Client Reviews" />
            <GlobalStat icon={<MapPin className="h-4 w-4" strokeWidth={2} />} value="120+" label="Countries Worldwide" />
            <GlobalStat icon={<Calendar className="h-4 w-4" strokeWidth={2} />} value="1M+" label="Sessions Booked" />
            <GlobalStat icon={<ShieldCheck className="h-4 w-4" strokeWidth={2} />} value="100%" label="REPS Verified" />
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Sub-components                                                       */
/* -------------------------------------------------------------------- */

function StickyNav() {
  const items = [
    { id: "about", label: "About" },
    { id: "courses", label: "Courses" },
    { id: "verified-pros", label: "Verified Pros" },
    { id: "reviews", label: "Reviews" },
    { id: "accreditations", label: "Accreditations" },
    { id: "locations", label: "Locations" },
  ];
  return (
    <div className="sticky top-[64px] z-20 mt-6 border-b border-black/10 bg-[#f7f6f2]/90 backdrop-blur supports-[backdrop-filter]:bg-[#f7f6f2]/75">
      <div className="mx-auto max-w-[1180px] overflow-x-auto px-4 lg:px-6">
        <ul className="flex items-center gap-6 py-3 text-[14px]">
          {items.map((it, i) => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                className={
                  i === 0
                    ? "border-b-2 border-[#FF7A00] pb-1 font-semibold text-[#FF7A00]"
                    : "text-black/65 hover:text-black"
                }
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TrustTile({
  icon,
  title,
  sub,
  muted,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-black/10 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <span
        className={
          muted
            ? "inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#f2f1ec] text-black/40"
            : "inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-500/10 text-emerald-700"
        }
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-black">{title}</p>
        <p className="text-[12px] text-black/55">{sub}</p>
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className={accent ? "font-display text-[22px] font-bold text-[#FF7A00]" : "font-display text-[22px] font-bold text-black"}>
        {value}
      </p>
      <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-black/55">
        {label}
      </p>
    </div>
  );
}

function TrustRow({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
        {icon}
      </span>
      <div>
        <p className="text-[14px] font-semibold text-black">{title}</p>
        <p className="text-[12.5px] text-black/55">{sub}</p>
      </div>
    </li>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-black/10 bg-[#0a0a0a] p-4 text-white">
      <div className="min-w-0">
        <p className="font-display text-[15px] font-bold">{course.title}</p>
        <p className="mt-0.5 text-[12.5px] text-white/60">{course.blurb}</p>
      </div>
      <div className="text-right">
        <p className="font-display text-[16px] font-bold">{course.price}</p>
        <p className="text-[11.5px] text-white/55">{course.format}</p>
      </div>
    </div>
  );
}

function EmptyBlock({
  icon,
  title,
  sub,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-black/15 bg-[#f7f6f2] p-6 text-center ${className}`}
    >
      {icon}
      <p className="text-[13.5px] font-semibold text-black">{title}</p>
      <p className="text-[12.5px] text-black/55">{sub}</p>
    </div>
  );
}

function GlobalStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#f2f1ec] text-black/60">
        {icon}
      </span>
      <div>
        <p className="font-display text-[16px] font-bold text-black">{value}</p>
        <p className="text-[11.5px] text-black/55">{label}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Helpers                                                              */
/* -------------------------------------------------------------------- */

function monthYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}
