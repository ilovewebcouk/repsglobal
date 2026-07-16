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
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import {
  getWebsiteBySlug,
} from "@/lib/website/website.functions";
import { listPublicReviewsBySlug } from "@/lib/reviews/reviews.functions";
import { listPublicProviderQualifications } from "@/lib/qualifications/qualifications.functions";
import { getPublicProviderIssuedCertificateCount } from "@/lib/providers/public-stats.functions";
import { listPublicProviderFaqs } from "@/lib/provider-faqs/provider-faqs.functions";
import { getPublicProviderVerification } from "@/lib/verification/provider-verification-public.functions";
import repsLogo from "@/assets/brand/logo-dark.svg";
import { AWARDING_BODIES, awardingBodyName, awardingBodyLogo } from "@/lib/cpd/awarding-bodies";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import {
  DEMO_PROVIDER_COVERS,
  DEMO_PROVIDER_LOGOS,
} from "@/lib/directory/demo-provider-assets";
import { useMeasuredHeight } from "@/hooks/use-measured-height";

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
          { name: "robots", content: "noindex, nofollow" },
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
            "@context": "https://schema.org", "@type": "EducationalOrganization",
            name,
            url: canonical,
            address: sf.address?.trim() || sf.city?.trim() || undefined,
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

  const fetchQuals = useServerFn(listPublicProviderQualifications);
  const { data: qualsData } = useQuery({
    queryKey: ["public-provider-quals", sf.professional_id],
    queryFn: () => fetchQuals({ data: { providerId: sf.professional_id } }),
    staleTime: 60_000,
    enabled: !!sf.professional_id,
  });

  const fetchCertCount = useServerFn(getPublicProviderIssuedCertificateCount);
  const { data: certCountData } = useQuery({
    queryKey: ["public-provider-cert-count", sf.professional_id],
    queryFn: () => fetchCertCount({ data: { providerId: sf.professional_id } }),
    staleTime: 60_000,
    enabled: !!sf.professional_id,
  });
  const certCount = certCountData?.count ?? 0;

  const fetchVerification = useServerFn(getPublicProviderVerification);
  const { data: verification } = useQuery({
    queryKey: ["public-provider-verification", sf.professional_id],
    queryFn: () =>
      fetchVerification({ data: { providerId: sf.professional_id } }),
    staleTime: 60_000,
    enabled: !!sf.professional_id,
  });
  const isVerified = verification?.completedCount === 3;
  const learnersTrained =
    certCount > 0
      ? certCount >= 1000
        ? `${(certCount / 1000).toFixed(certCount >= 10_000 ? 0 : 1)}k`
        : String(certCount)
      : "—";

  const reviews = reviewsData?.reviews ?? [];
  const ratingAvg = reviewsData?.average ?? 0;
  const ratingCount = reviewsData?.count ?? 0;

  const regulatedRows = qualsData?.regulated ?? [];
  const courseRows = qualsData?.courses ?? [];
  const repsMemberId = qualsData?.reps_member_id ?? null;

  const providerName = sf.full_name?.trim() || "Training Provider";
  const tagline = sf.tagline?.trim() || `${providerName} — REPS Verified Training Provider`;
  const city = sf.city ?? "Location coming soon";
  const location = sf.address?.trim() || sf.city?.trim() || "Location coming soon";
  const logoUrl = sf.avatar_url ?? DEMO_PROVIDER_LOGOS[slug] ?? null;

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

  // Approved regulated qualifications grouped by awarding body for the
  // "Accreditations & Recognition" block. Prefer the live Ofqual snapshot
  // over the historic catalogue link.
  const accreditationsByBody = React.useMemo(() => {
    const groups = new Map<
      string,
      {
        slug: string;
        name: string;
        logo: string | null;
        items: Array<{ id: string; title: string; level: string | null; ofqual_ref: string | null; reps_ref: string | null }>;
      }
    >();
    for (const row of regulatedRows) {
      const snap = row.ofqual_snapshot;
      const legacy = row.qualification;
      const title = snap?.title ?? legacy?.title ?? null;
      if (!title) continue;

      // Match the awarding body from the snapshot back to our slug map for a
      // logo; fall back to the legacy catalogue slug for historic rows.
      const snapshotOrg = snap?.awardingOrganisation ?? null;
      const legacySlug = legacy?.awarding_body_slug ?? null;
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
      let matchedSlug: string | null = legacySlug;
      if (snapshotOrg) {
        const q = norm(snapshotOrg);
        // best-effort fuzzy match against known bodies via awardingBodyName lookups
        // — we iterate our known slugs by trying substrings.
        for (const body of AWARDING_BODIES) {
          if (body.slug === "other") continue;
          const candidate = body.slug;
          const nm = awardingBodyName(candidate);
          if (!nm) continue;
          const n = norm(nm);
          if (n === q || n.includes(q) || q.includes(n)) {
            matchedSlug = candidate;
            break;
          }
        }
      }

      const groupKey = matchedSlug ?? snapshotOrg ?? "unknown";
      const displayName =
        (matchedSlug ? awardingBodyName(matchedSlug) : null) ?? snapshotOrg ?? "Awarding body";
      const logo = matchedSlug ? awardingBodyLogo(matchedSlug) : null;

      const existing = groups.get(groupKey) ?? {
        slug: groupKey,
        name: displayName,
        logo,
        items: [],
      };
      existing.items.push({
        id: row.id,
        title,
        level: snap?.level ?? (legacy?.level != null ? `L${legacy.level}` : null),
        ofqual_ref: row.ofqual_number ?? legacy?.ofqual_ref ?? null,
        reps_ref: row.reps_qualification_number ?? null,
      });
      groups.set(groupKey, existing);
    }
    return Array.from(groups.values());
  }, [regulatedRows]);

  const verifiedProsLinked = 0;

  const fetchFaqs = useServerFn(listPublicProviderFaqs);
  const { data: faqData } = useQuery({
    queryKey: ["public-provider-faqs", slug],
    queryFn: () => fetchFaqs({ data: { slug } }),
    staleTime: 60_000,
  });
  const faqs = faqData?.faqs ?? [];

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
                <Link to="/find-a-training-provider" className="hover:text-black">Training Providers</Link>
              </li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" strokeWidth={2} /></li>
              <li aria-current="page" className="text-black font-medium">{providerName}</li>
            </ol>
          </nav>
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-[1180px] px-4 pt-6 lg:px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr] lg:gap-8">
            <div className="relative aspect-square w-full overflow-hidden rounded-[18px] border border-black/10 bg-gradient-to-br from-reps-warm-white to-[#efece4]">
              {(() => {
                const coverUrl = sf.hero_image_url ?? DEMO_PROVIDER_COVERS[slug] ?? null;
                if (coverUrl) {
                  return (
                    <>
                      <img
                        src={coverUrl}
                        alt={`${providerName} cover`}
                        className="h-full w-full object-cover"
                        loading="eager"
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
                    </>
                  );
                }
                if (logoUrl) {
                  return (
                    <img
                      src={logoUrl}
                      alt={`${providerName} logo`}
                      className="h-full w-full object-contain p-10"
                      loading="eager"
                    />
                  );
                }
                return (
                  <div className="flex h-full w-full items-center justify-center">
                    <Building2 className="h-16 w-16 text-black/25" strokeWidth={1.5} />
                  </div>
                );
              })()}
              {logoUrl && (sf.hero_image_url || DEMO_PROVIDER_COVERS[slug]) && (
                <div className="absolute bottom-3 left-3 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[14px] bg-white ring-1 ring-black/5 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.35)]">
                  <img
                    src={logoUrl}
                    alt={`${providerName} logo`}
                    className="h-full w-full object-contain"
                    loading="eager"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2">
                {isVerified ? (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
                    REPS Verified
                  </span>
                ) : (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-black/15 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/60">
                    <Shield className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Unverified
                  </span>
                )}
                {repsMemberId ? (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-black/15 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/70">
                    <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
                    {repsMemberId}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2 font-display text-[36px] font-bold leading-[1.05] tracking-[-0.01em] text-black lg:text-[46px]">
                {providerName}
              </h1>
              <p className="mt-1.5 text-[15px] text-black/60">Training Provider · Ofqual-regulated</p>

              <div className="mt-4 flex flex-col gap-2 text-[14px] text-black/65">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" strokeWidth={2} />
                  {location}
                </span>
                <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="flex gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          ratingCount > 0 && i < Math.round(ratingAvg)
                            ? "h-4 w-4 fill-[#FF7A00] text-[#FF7A00]"
                            : "h-4 w-4 text-black/25"
                        }
                        strokeWidth={1.6}
                      />
                    ))}
                  </span>
                  {ratingCount > 0 ? (
                    <>
                      <span className="font-semibold text-black">{ratingAvg.toFixed(1)}</span>
                      <span className="text-black/55">
                        · Based on {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
                      </span>
                    </>
                  ) : (
                    <span className="text-black/55">Based on 0 reviews</span>
                  )}
                </span>
              </div>


              <div className="mt-4 flex flex-wrap gap-2">
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
              title="Course tracking"
              sub="Coming soon"
              muted
            />
          </div>
        </section>

        {/* Sticky in-page nav */}
        <StickyNav />

        {/* Two-column body: main content (left) + sticky review rail (right) */}
        <section className="mx-auto mt-8 max-w-[1180px] px-4 lg:px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
            {/* LEFT — main content stack */}
            <div className="min-w-0 space-y-6">
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
                  <StatTile label="Learners trained" value={learnersTrained} />
                  <StatTile label="Verified since" value={verifiedSince} accent />
                </div>
              </article>

              {/* Qualifications & Courses — unified list, sorted by level DESC */}
              <article id="accreditations" className="scroll-mt-28 rounded-[22px] border border-black/10 bg-white p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-[20px] font-bold text-black">
                      Qualifications & Courses
                    </h2>
                    <p className="mt-1 text-[12.5px] text-black/55">
                      Regulated qualifications this provider is approved to deliver and courses REPS has independently accredited. Each carries its own verifiable ID number.
                    </p>
                  </div>
                  {accreditationsByBody.length > 0 ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-emerald-700">
                      <BadgeCheck className="h-3 w-3" strokeWidth={2.4} />
                      Approved centre
                    </span>
                  ) : null}
                </div>

                {(() => {
                  const parseLevel = (v: string | number | null | undefined): number | null => {
                    if (v == null) return null;
                    const m = String(v).match(/\d+/);
                    return m ? parseInt(m[0], 10) : null;
                  };

                  type UnifiedItem = {
                    key: string;
                    kind: "ofqual" | "reps";
                    bodyName: string;
                    logo: string | null;
                    title: string;
                    levelLabel: string | null;
                    levelNum: number | null;
                    ofqual_ref: string | null;
                    reps_ref: string | null;
                  };

                  const items: UnifiedItem[] = [];
                  for (const group of accreditationsByBody) {
                    for (const it of group.items) {
                      items.push({
                        key: `o:${it.id}`,
                        kind: "ofqual",
                        bodyName: group.name,
                        logo: group.logo,
                        title: it.title,
                        levelLabel: it.level,
                        levelNum: parseLevel(it.level),
                        ofqual_ref: it.ofqual_ref,
                        reps_ref: it.reps_ref,
                      });
                    }
                  }
                  for (const c of courseRows) {
                    items.push({
                      key: `r:${c.id}`,
                      kind: "reps",
                      bodyName: "REPS",
                      logo: repsLogo,
                      title: c.official_title ?? "REPS-accredited course",
                      levelLabel: c.official_level != null ? `Level ${c.official_level}` : null,
                      levelNum: c.official_level ?? null,
                      ofqual_ref: null,
                      reps_ref: c.reps_qual_number,
                    });
                  }
                  items.sort((a, b) => {
                    const al = a.levelNum;
                    const bl = b.levelNum;
                    if (al == null && bl == null) return a.title.localeCompare(b.title);
                    if (al == null) return 1;
                    if (bl == null) return -1;
                    if (bl !== al) return bl - al;
                    return a.title.localeCompare(b.title);
                  });

                  if (items.length === 0) {
                    return (
                      <EmptyBlock
                        className="mt-5"
                        icon={<BadgeCheck className="h-6 w-6 text-black/30" strokeWidth={1.8} />}
                        title="No qualifications or courses yet"
                        sub="Once REPS verifies this provider's qualifications and courses, they'll appear here."
                      />
                    );
                  }

                  return (
                    <div className="mt-5 space-y-4">
                      {items.map((it) => (
                        <div key={it.key} className="flex items-start gap-3">
                          <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-black/10 bg-white">
                            {it.logo ? (
                              <img
                                src={it.logo}
                                alt={it.bodyName}
                                className="max-h-9 max-w-14 object-contain"
                              />
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wide text-black/50">
                                {it.bodyName.slice(0, 3)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-[13.5px] font-semibold leading-tight text-black">{it.bodyName}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-black/75">
                              {it.levelLabel ? (
                                <span className="inline-flex h-5 items-center rounded-full bg-[#f2f1ec] px-2 text-[11px] font-bold text-black/60">
                                  {it.levelLabel}
                                </span>
                              ) : null}
                              <span className="text-[13.5px] font-semibold text-black">{it.title}</span>
                              {it.ofqual_ref ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-800">
                                  <span className="text-[9.5px] font-sans font-semibold uppercase tracking-wide text-emerald-700">
                                    Ofqual
                                  </span>
                                  {it.ofqual_ref}
                                </span>
                              ) : null}
                              {it.reps_ref ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-800">
                                  <span className="text-[9.5px] font-sans font-semibold uppercase tracking-wide text-emerald-700">
                                    REPS
                                  </span>
                                  {it.reps_ref}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </article>
              {/* Verified Professionals Trained */}
              <article
                id="verified-pros"
                className="scroll-mt-28 rounded-[22px] border border-black/10 bg-white p-6"
              >
                <h2 className="font-display text-[20px] font-bold text-black">
                  Verified Professionals Trained
                </h2>
                {verifiedProsLinked === 0 ? (
                  <p className="mt-3 text-[14px] text-black/60">
                    Verified pros trained by this provider will appear here once linked.
                  </p>
                ) : (
                  <p className="mt-3 text-[14px] text-black/60">
                    <span className="text-[24px] font-bold text-black">{verifiedProsLinked}</span>{""}
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
              </article>

              {/* Locations & Delivery */}
              <article
                id="locations"
                className="scroll-mt-28 rounded-[22px] border border-black/10 bg-white p-6"
              >
                <h2 className="font-display text-[20px] font-bold text-black">
                  Locations & Delivery
                </h2>
                <div className="mt-4 flex items-start gap-3 rounded-[16px] border border-black/10 bg-[#f7f6f2] p-3">
                  <div className="mt-0.5 rounded-[10px] bg-[#FF7A00]/15 p-2 text-[#FF7A00]">
                    <MapPin className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-black">{city}</p>
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
              </article>


              {/* Trust & Assurance */}
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

              {/* FAQs */}
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

            {/* RIGHT — sticky review rail */}
            <aside className="space-y-6 self-start lg:sticky lg:top-[calc(var(--public-header-h,72px)+var(--provider-subnav-h,52px)+12px)]">
              <article id="reviews" className="scroll-mt-28 rounded-[22px] border border-black/10 bg-white p-6">
                <header className="flex items-center justify-between">
                  <h2 className="font-display text-[18px] font-bold text-black">What Learners Say</h2>
                  {reviews.length > 0 ? (
                    <button className="text-[12.5px] font-semibold text-[#FF7A00] hover:text-[#E96F00]">
                      See all {ratingCount}
                    </button>
                  ) : null}
                </header>

                <div className="mt-4 flex items-center gap-3">
                  <p className="font-display text-[40px] font-bold leading-none text-black">
                    {ratingAvg.toFixed(1)}
                  </p>
                  <div className="flex gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          ratingCount > 0 && i < Math.round(ratingAvg)
                            ? "h-4 w-4 fill-[#FF7A00] text-[#FF7A00]"
                            : "h-4 w-4 text-black/25"
                        }
                        strokeWidth={1.6}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-[12.5px] text-black/55">
                  Based on {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
                </p>

                <div className="mt-4 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const c = reviews.filter((r) => r.rating === stars).length;
                    const pct = ratingCount === 0 ? 0 : Math.round((c / ratingCount) * 100);
                    return (
                      <div
                        key={stars}
                        className="grid grid-cols-[14px_18px_1fr_24px] items-center gap-2 text-[12.5px] text-black/60"
                      >
                        <span className="text-black/55">{stars}</span>
                        <Star
                          className="h-3.5 w-3.5 fill-[#FF7A00] text-[#FF7A00]"
                          strokeWidth={0}
                        />
                        <div className="h-2 overflow-hidden rounded-full bg-black/[0.08]">
                          <div
                            className="h-full rounded-full bg-[#FF7A00]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-right tabular-nums text-black/55">{c}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5">
                  {reviews.length === 0 ? (
                    <div className="flex min-h-[120px] items-center justify-center rounded-[16px] border border-dashed border-black/15 bg-white px-4 text-center">
                      <p className="text-[13px] text-black/55">
                        No reviews yet. Verified learner reviews will appear here once published.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-[16px] border border-black/10 bg-[#f7f6f2] p-4">
                      {reviews.slice(0, 1).map((r) => (
                        <div key={r.id}>
                          <div className="flex gap-0.5" aria-hidden>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={
                                  i < r.rating
                                    ? "h-3 w-3 fill-[#FF7A00] text-[#FF7A00]"
                                    : "h-3 w-3 text-black/20"
                                }
                                strokeWidth={0}
                              />
                            ))}
                          </div>
                          <p className="mt-2 text-[13px] font-semibold text-black">
                            {r.client_name ?? "Learner"}
                          </p>
                          <p className="mt-1 text-[13px] leading-[1.55] text-black/70">
                            "{r.body}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  to="/t/$slug/review"
                  params={{ slug }}
                  className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-primary bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-reps-orange-hover"
                >
                  <Star className="h-3.5 w-3.5" strokeWidth={2} />
                  Write a review
                </Link>
              </article>
            </aside>
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
    { id: "accreditations", label: "Qualifications & Courses" },
    { id: "verified-pros", label: "Verified Pros" },
    { id: "reviews", label: "Reviews" },
    { id: "locations", label: "Locations" },
  ];
  const navRef = React.useRef<HTMLDivElement | null>(null);
  useMeasuredHeight(navRef, "--provider-subnav-h");
  return (
    <div
      ref={navRef}
      className="sticky top-[var(--public-header-h,72px)] z-20 mt-6 border-b border-black/10 bg-[#f7f6f2]/90 backdrop-blur supports-[backdrop-filter]:bg-[#f7f6f2]/75"
    >
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
