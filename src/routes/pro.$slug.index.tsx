import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useSessionUser } from "@/hooks/use-session-user";
import { BadgeCheck, Users } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import heroCoaching from "@/assets/hero-coaching-moment";
import { getPublicProfileBySlug } from "@/lib/profile/public-profile.functions";
import { listPublicReviewsBySlug, type ReviewDTO } from "@/lib/reviews/reviews.functions";
import {
  getProfessionLabel,
} from "@/lib/professions";
import { getTitleLabel } from "@/lib/cpd/titles-catalog";
import { getSpecialismLabel } from "@/lib/specialisms";
import { PremiumPublicProfilePage } from "@/components/profile/public/PremiumPublicProfilePage";



function formatReviewWhen(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
  if (days < 1) return "today";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/* ------------------------------------------------------------------ */
/* Static data (Phase 1)                                              */
/* ------------------------------------------------------------------ */

type Pro = {
  slug: string;
  name: string;
  firstName: string;
  role: string;
  professionSlug?: string | null;
  location: string;
  region: string;
  rating: number;
  reviews: number;
  modes: ("In-person" | "Online")[];
  blurb: string;
  image: string | null;
  years: number;
  clients: string;
  bio: string[];
  specialisms: string[];
  services: {
    title: string;
    desc: string;
    price: string;
    unit: string;
    image: string | null;
    icon: typeof BadgeCheck;
  }[];
  qualifications: {
    badge: string;
    title: string;
    issuer: string;
    id: string;
    issued: string;
    verified?: boolean;
    expires?: string | null;
  }[];
  gyms?: { label: string; branch: string }[];
  lat?: number | null;
  lng?: number | null;
  memberSince?: string | null;
  trust?: {
    verified: boolean;
    insuranceExpiry: string | null;
    cpd?: { done: number; total: number } | null;
    qualificationsCheckedAt?: string | null;
    identityVerifiedAt?: string | null;
  };
  gallery?: { id: string; url: string }[];
  faqs: { q: string; a: string; open?: boolean }[];
};

const PROS: Record<string, Pro> = {
  "james-carter": {
    slug: "james-carter",
    name: "James Carter",
    firstName: "James",
    role: "Personal Trainer",
    location: "London",
    region: "Greater London",
    rating: 5.0,
    reviews: 128,
    modes: ["In-person", "Online"],
    blurb: "Helping busy professionals build strength, move better and perform at their best.",
    image: proJames,
    years: 8,
    clients: "100+",
    bio: [
      "I'm a REPS Verified Personal Trainer with over 8 years of experience helping clients achieve real, lasting results. My approach is tailored, supportive and evidence-based, focusing on strength, performance and long-term wellbeing.",
      "Whether you're just starting out or looking to take your training to the next level, I'll create a plan that fits your goals, lifestyle and schedule.",
    ],
    specialisms: [
      "Strength Training",
      "Weight Loss",
      "Muscle Gain",
      "Functional Fitness",
      "Lifestyle Coaching",
      "Posture & Mobility",
      "Performance Training",
    ],
    services: [
      {
        title: "Personal Training",
        desc: "1-to-1 in-person sessions tailored to your goals.",
        price: "From £60",
        unit: "per session",
        image: heroCoaching,
        icon: Users,
      },
      {
        title: "Online Coaching",
        desc: "Custom plans, check-ins and ongoing support.",
        price: "From £120",
        unit: "per month",
        image: proDaniel,
        icon: Users,
      },
      {
        title: "Nutrition Plan",
        desc: "Personalised nutrition plans to fuel results.",
        price: "From £40",
        unit: "one-off plan",
        image: proSophie,
        icon: Users,
      },
    ],
    qualifications: [
      {
        badge: "REPS",
        title: "REPS Level 3 Personal Trainer",
        issuer: "The Register of Exercise Professionals",
        id: "REP1234567",
        issued: "May 2023",
      },
      {
        badge: "YMCA",
        title: "Level 3 Diploma in Personal Training",
        issuer: "YMCA Awards",
        id: "600/1234/8",
        issued: "May 2021",
      },
    ],
    faqs: [
      {
        q: "Do you offer online coaching?",
        a: "Yes! I offer fully personalised online coaching with custom training plans, check-ins, and ongoing support to keep you accountable and on track.",
        open: true,
      },
      { q: "Where do sessions take place?", a: "" },
      { q: "How do I get started?", a: "" },
      { q: "What should I expect in my first session?", a: "" },
      { q: "Do you offer nutrition guidance?", a: "" },
    ],
    trust: {
      verified: true,
      insuranceExpiry: "2026-12-12",
      qualificationsCheckedAt: "2026-06-15",
      identityVerifiedAt: "2026-06-15",
    },
  },
};

const RATING_DIST = [
  { stars: 5, count: 115 },
  { stars: 4, count: 10 },
  { stars: 3, count: 2 },
  { stars: 2, count: 1 },
  { stars: 1, count: 0 },
];


/* ------------------------------------------------------------------ */
/* Route                                                              */
/* ------------------------------------------------------------------ */

type DbPro = Awaited<ReturnType<typeof getPublicProfileBySlug>>;

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatIssued(issueDate: string | null, year: number | null): string {
  if (issueDate) {
    const d = new Date(issueDate);
    if (!Number.isNaN(d.getTime())) {
      return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    }
  }
  return year ? String(year) : "—";
}
function titleCaseQual(s: string): string {
  // Only Title-Case if the string is mostly uppercase, otherwise leave as authored.
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (!letters.length) return s;
  const upperRatio = (s.match(/[A-Z]/g)?.length ?? 0) / letters.length;
  if (upperRatio < 0.7) return s;
  const small = new Set(["a", "an", "and", "the", "of", "in", "for", "to", "on", "or"]);
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((tok, i) => {
      if (!tok.trim() || tok === "-") return tok;
      if (i > 0 && small.has(tok)) return tok;
      return tok.charAt(0).toUpperCase() + tok.slice(1);
    })
    .join("");
}
function badgeFor(awardingBody: string | null, slug: string | null): string {
  if (slug) {
    const s = slug.replace(/[^a-z0-9]/gi, "").toUpperCase();
    if (s.length) return s.slice(0, 4);
  }
  const body = (awardingBody ?? "").trim();
  if (!body) return "QUAL";
  const parts = body.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((p) => p[0]!.toUpperCase()).join("").slice(0, 4);
  }
  return body.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "QUAL";
}

function yearsFromApprovedQualifications(
  qualifications: Array<{ issue_date: string | null; year: number | null }> | null | undefined,
): number {
  const years = (qualifications ?? [])
    .map((q) => {
      if (q.issue_date) {
        const d = new Date(q.issue_date);
        if (!Number.isNaN(d.getTime())) return d.getUTCFullYear();
      }
      return q.year ?? null;
    })
    .filter((y): y is number => typeof y === "number" && y > 1900);
  if (!years.length) return 0;
  const earliest = Math.min(...years);
  return Math.max(0, new Date().getUTCFullYear() - earliest);
}

function servicePriceLabel(s: {
  price_label?: string | null;
  price_pence?: number | null;
}): string {
  const explicit = s.price_label?.trim();
  if (explicit) return explicit;
  if (s.price_pence && s.price_pence > 0) {
    return `From £${(s.price_pence / 100).toFixed(0)}`;
  }
  return "Enquire";
}

function serviceUnitLabel(s: {
  price_unit?: string | null;
  duration_minutes?: number | null;
  mode?: string | null;
}): string {
  const unit = s.price_unit?.trim();
  if (unit) return unit;
  const mode =
    s.mode === "online"
      ? "Online"
      : s.mode === "hybrid"
        ? "Hybrid"
        : s.mode === "in_person"
          ? "In person"
          : null;
  const duration = s.duration_minutes ? `${s.duration_minutes} min` : null;
  return [duration, mode].filter(Boolean).join(" · ");
}

function proFromDb(row: NonNullable<DbPro>): Pro {
  const primaryLabel =
    getTitleLabel((row as { primary_title_slug?: string | null }).primary_title_slug) ??
    getProfessionLabel(row.primary_profession) ??
    "Fitness Professional";
  const secondaryLabel = getTitleLabel((row as { secondary_title_slug?: string | null }).secondary_title_slug);
  const professionLabel = secondaryLabel && secondaryLabel !== primaryLabel
    ? `${primaryLabel} & ${secondaryLabel}`
    : primaryLabel;
  const years = yearsFromApprovedQualifications(row.qualifications);
  return {
    slug: row.slug ?? "",
    name: row.full_name ?? "REPS Professional",
    firstName: (row.full_name ?? "").split(" ")[0] || "Coach",
    role: professionLabel,
    professionSlug: row.primary_profession ?? null,
    location: row.location?.town ?? row.location?.postcode_outward ?? row.city ?? "Online",
    region: row.location?.region ?? row.country ?? "",
    rating: 0,
    reviews: 0,
    modes: [
      ...(row.in_person_available ? (["In-person"] as const) : []),
      ...(row.online_available ? (["Online"] as const) : []),
    ] as Pro["modes"],
    blurb: row.headline ?? "",
    image: row.avatar_url || null,
    years,
    clients: "—",
    bio: row.bio ? row.bio.split(/\n\n+/).filter(Boolean) : [],
    specialisms: (row.specialisms ?? [])
      .map((s) => getSpecialismLabel(s) ?? s)
      .filter(Boolean),
    services: (() => {
      const live = (row as {
        services?: Array<{
          title: string;
          description: string | null;
          price_pence: number | null;
          price_label: string | null;
          price_unit?: string | null;
          duration_minutes: number | null;
          mode: string;
          image_url?: string | null;
          bullets?: string[] | null;
          cta_label?: string | null;
          is_featured?: boolean;
        }>;
      }).services ?? [];

      if (live.length) {
        return live.slice(0, 3).map((s) => ({
          title: s.title,
          desc: s.description ?? "",
          price: servicePriceLabel(s),
          unit: serviceUnitLabel(s),
          image: s.image_url ?? null,
          icon: Users,
          mode: s.mode,
          priceUnit: s.price_unit ?? null,
          bullets: Array.isArray(s.bullets)
            ? s.bullets.map((b) => b.trim()).filter(Boolean).slice(0, 5)
            : [],
          ctaLabel: s.cta_label?.trim() || "Enquire",
          isFeatured: !!s.is_featured,
        }));
      }

      if (row.hourly_rate_pence) {
        return [
          {
            title: "1-to-1 session",
            desc: "Personalised coaching tailored to your goals.",
            price: `From £${(row.hourly_rate_pence / 100).toFixed(0)}`,
            unit: "per session",
            image: null,
            icon: Users,
            mode: row.in_person_available ? "in_person" : row.online_available ? "online" : null,
            priceUnit: "per session",
            bullets: [],
            ctaLabel: "Enquire",
            isFeatured: false,
          },
        ];
      }

      return [];
    })(),

    qualifications: (row.qualifications ?? []).map((q) => ({
      badge: badgeFor(q.awarding_body, q.awarding_body_slug),
      title: titleCaseQual(q.qualification ?? "Qualification"),
      issuer: q.awarding_body ?? "Awarding body",
      id: q.qualification_number?.trim() || q.id.slice(0, 8),
      issued: formatIssued(q.issue_date, q.year),
      verified: !!q.regulator_verified,
      expires: q.expiry_date ?? null,
    })),
    gyms: row.gyms ?? [],
    lat: row.location?.latitude ?? null,
    lng: row.location?.longitude ?? null,
    memberSince: row.member_since,
    trust: {
      verified: !!row.trust?.verified,
      insuranceExpiry: row.trust?.insurance_expiry ?? null,
      cpd: null,
      qualificationsCheckedAt: row.trust?.qualifications_checked_at ?? null,
      identityVerifiedAt: row.trust?.identity_verified_at ?? null,
    },
    gallery: (row as { gallery?: { id: string; url: string }[] }).gallery ?? [],
    faqs: [],
  };
}

export const Route = createFileRoute("/pro/$slug/")({
  loader: async ({ params }) => {
    if (PROS[params.slug]) return { source: "fixture" as const, db: null };
    const db = await getPublicProfileBySlug({ data: { slug: params.slug } });
    if (!db) throw notFound();
    return { source: "db" as const, db };
  },
  head: ({ params, loaderData }) => {
    const fixture = PROS[params.slug];
    const dbPro = loaderData?.db ? proFromDb(loaderData.db) : null;
    const pro = fixture ?? dbPro;
    if (!pro) {
      return {
        meta: [
          { title: "Not found | REPS" },
          { name: "robots", content: "noindex,nofollow" },
        ],
      };
    }
    const title = `${pro.name} — ${pro.role} | REPS`;
    const description = `${pro.name}, REPS Verified ${pro.role}${pro.location ? ` in ${pro.location}` : ""}. ${pro.blurb}`;
    const noindex = !!fixture;
    const url = `https://repsuk.org/pro/${pro.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(noindex ? [{ name: "robots", content: "noindex,nofollow" }] : []),
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        ...(pro.image ? [{ property: "og:image", content: pro.image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: noindex
        ? []
        : [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Person",
                name: pro.name,
                jobTitle: pro.role,
                url,
                ...(pro.image ? { image: pro.image } : {}),
                ...(pro.location
                  ? { address: { "@type": "PostalAddress", addressLocality: pro.location } }
                  : {}),
                description: pro.blurb,
              }),
            },
            ...(pro.faqs && pro.faqs.length > 0
              ? [
                  {
                    type: "application/ld+json",
                    children: JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "FAQPage",
                      mainEntity: pro.faqs.map((f) => ({
                        "@type": "Question",
                        name: f.q,
                        acceptedAnswer: { "@type": "Answer", text: f.a },
                      })),
                    }),
                  },
                ]
              : []),
          ],
    };

  },
  notFoundComponent: ProNotFound,
  component: ProProfilePage,
});

function ProNotFound() {
  return (
    <div className="min-h-screen bg-reps-ivory">
      <PublicHeader variant="solid" />
      <div className="mx-auto flex max-w-[640px] flex-col items-center px-6 py-32 text-center">
        <h1 className="font-display text-[40px] font-bold leading-tight text-reps-charcoal">
          Profile not found
        </h1>
        <p className="mt-3 text-[15px] text-reps-muted-light">
          This professional profile is not available.
        </p>
        <Link
          to="/find-a-professional"
          className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-reps-orange px-5 py-2.5 text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange/90"
        >
          Browse professionals
        </Link>
      </div>
      <PublicFooter />
    </div>
  );
}

function ProProfilePage() {
  const { slug } = Route.useParams();
  const { db } = Route.useLoaderData();
  const isFixture = !!PROS[slug];

  // Fixture pages (james-carter) are admin-only mock-up references — gated
  // client-side so SSR always renders a neutral skeleton (no leak via SEO).
  const { isAdmin, isLoading: authLoading } = useSessionUser();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (isFixture) {
    if (!mounted || authLoading) {
      return <div className="min-h-screen bg-reps-ivory" aria-hidden />;
    }
    if (!isAdmin) return <ProNotFound />;
  }

  const pro = PROS[slug] ?? (db ? proFromDb(db) : null);

  // Public analytics — fire once per slug per session. Must run before any
  // early return to keep hook order stable.
  React.useEffect(() => {
    if (!pro || isFixture) return;
    void import("@/lib/analytics/track").then(({ track }) =>
      track.profileView({ slug, professional_id: db?.id ?? null }),
    );
  }, [slug, db?.id, isFixture, pro]);

  if (!pro) return <ProNotFound />;



  // Real reviews — only used to override fixtures when the DB has any.
  const { data: liveReviews } = useQuery({
    queryKey: ["public-reviews", slug],
    queryFn: () => listPublicReviewsBySlug({ data: { slug } }),
    staleTime: 60_000,
  });
  const realReviews: ReviewDTO[] = liveReviews?.reviews ?? [];
  const hasRealReviews = realReviews.length > 0;

  // For DB-backed pros (no fixture), derive rating summary + distribution
  // from real reviews so the "What Clients Say" panel reflects reality.
  const isDbPro = !PROS[slug];
  const reviewSummary = (() => {
    if (!isDbPro) {
      return {
        rating: pro.rating,
        count: pro.reviews,
        dist: RATING_DIST,
        maxCount: 128,
      };
    }
    const count = realReviews.length;
    const sum = realReviews.reduce((a, r) => a + (r.rating || 0), 0);
    const rating = count > 0 ? sum / count : 0;
    const dist = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: realReviews.filter((r) => Math.round(r.rating) === stars).length,
    }));
    const maxCount = Math.max(1, ...dist.map((d) => d.count));
    return { rating, count, dist, maxCount };
  })();

  return (
    <PremiumPublicProfilePage
      pro={pro}
      slug={slug}
      professionalId={db?.id ?? null}
      reviewSummary={reviewSummary}
      reviews={realReviews}
      formatReviewWhen={formatReviewWhen}
      onTrackCta={(cta) => {
        void import("@/lib/analytics/track").then(({ track }) =>
          track.profileCtaClick({
            slug,
            cta,
            professional_id: db?.id ?? null,
          }),
        );
      }}
    />
  );
}

