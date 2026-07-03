import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useSessionUser } from "@/hooks/use-session-user";
import {
  Award,
  BadgeCheck,
  Bookmark,
  Calendar,
  Check,
  ChevronDown,
  Compass,
  Dumbbell,
  GraduationCap,
  Home as HomeIcon,
  Image as ImageIcon,
  Info,
  Laptop,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Umbrella,
  UserPlus,
  Users,
} from "lucide-react";


import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import heroCoaching from "@/assets/hero-coaching-moment";
import { getPublicProfileBySlug } from "@/lib/profile/public-profile.functions";
import { listPublicReviewsBySlug, type ReviewDTO } from "@/lib/reviews/reviews.functions";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  getProfessionLabel,
  getProfessionPlural,
  getProfessionSlugFromLabel,
} from "@/lib/professions";
import { getSpecialismLabel } from "@/lib/specialisms";
import { getTitleLabel } from "@/lib/cpd/titles-catalog";
import { LocationMap } from "@/components/pro/LocationMap";
import { Monogram } from "@/components/directory/Monogram";


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
        icon: Laptop,
      },
      {
        title: "Nutrition Plan",
        desc: "Personalised nutrition plans to fuel results.",
        price: "From £40",
        unit: "one-off plan",
        image: proSophie,
        icon: Award,
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

const REVIEW_AVATARS = [proSophie, proDaniel, proLaura];
const REVIEWS = [
  {
    name: "Sophie L.",
    when: "2 weeks ago",
    body: "James has completely changed the way I train. His programmes are challenging but achievable and I've never felt stronger!",
  },
  {
    name: "Michael R.",
    when: "1 month ago",
    body: "Great coach and even better person. Really takes the time to understand your goals and builds a plan that actually works.",
  },
  {
    name: "Emily T.",
    when: "2 months ago",
    body: "I've seen more progress in 3 months with James than I did in a year training on my own. Highly recommend!",
  },
];

const WHO_I_HELP: { icon: typeof Dumbbell; label: string }[] = [
  { icon: Dumbbell, label: "Want to get stronger, leaner & healthier" },
  { icon: UserPlus, label: "Are new to training or returning after a break" },
  { icon: HomeIcon, label: "Prefer training in the comfort of home" },
  { icon: Compass, label: "Need support, structure and accountability" },
];



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

function proFromDb(row: NonNullable<DbPro>): Pro {
  const template = PROS["james-carter"];
  const primaryLabel =
    getTitleLabel((row as { primary_title_slug?: string | null }).primary_title_slug) ??
    getProfessionLabel(row.primary_profession) ??
    "Fitness Professional";
  const secondaryLabel = getTitleLabel((row as { secondary_title_slug?: string | null }).secondary_title_slug);
  const professionLabel = secondaryLabel && secondaryLabel !== primaryLabel
    ? `${primaryLabel} & ${secondaryLabel}`
    : primaryLabel;
  const memberSince = row.member_since ? new Date(row.member_since) : null;
  const years = memberSince
    ? Math.max(
        0,
        Math.floor((Date.now() - memberSince.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      )
    : 0;
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
      const live = (row as { services?: Array<{ title: string; description: string | null; price_pence: number | null; price_label: string | null; duration_minutes: number | null; mode: string; image_url?: string | null }> }).services ?? [];
      if (live.length) {
        return live.slice(0, 3).map((s) => ({
          title: s.title,
          desc: s.description ?? "",
          price:
            s.price_label?.trim() ||
            (s.price_pence ? `From £${(s.price_pence / 100).toFixed(0)}` : "Enquire"),
          unit:
            s.duration_minutes
              ? `${s.duration_minutes}-min · ${s.mode === "online" ? "Remote" : s.mode === "hybrid" ? "Hybrid" : "Hands-on"}`
              : s.mode === "online"
                ? "Remote"
                : s.mode === "hybrid"
                  ? "Hybrid"
                  : "Hands-on",
          image: s.image_url ?? null,
          icon: Users,
        }));
      }
      if (row.hourly_rate_pence) {
        return [
          {
            title: "1-to-1 session",
            desc: "Personalised coaching tailored to your goals.",
            price: `From £${(row.hourly_rate_pence / 100).toFixed(0)}`,
            unit: "per session",
            image: heroCoaching,
            icon: Users,
          },
        ];
      }
      return template.services;
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
    <div className="min-h-screen bg-reps-ivory">
      <PublicHeader variant="solid" />

      {/* ============ HERO (with breadcrumb) ============ */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 pt-6 lg:px-10">
          {(() => {
            const profSlug =
              pro.professionSlug ?? getProfessionSlugFromLabel(pro.role);
            const profPlural = profSlug
              ? getProfessionPlural(profSlug) ?? getProfessionLabel(profSlug)
              : null;
            return (
              <Breadcrumb
                items={[
                  { label: "Home", to: "/" },
                  { label: "Find a Professional", to: "/find-a-professional" },
                  ...(profSlug && profPlural
                    ? [
                        {
                          label: profPlural,
                          to: "/professions/$profession",
                          params: { profession: profSlug },
                        },
                      ]
                    : []),
                  { label: pro.name },
                ]}
              />
            );
          })()}
        </div>
        <div className="mx-auto max-w-[1320px] px-6 pb-8 pt-4 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)_320px] lg:gap-8">
            {/* Portrait with gallery pill */}
            <div className="relative block aspect-[4/5] overflow-hidden rounded-[18px] bg-reps-stone">
              {pro.image ? (
                <img
                  src={pro.image}
                  alt={`${pro.name} — ${pro.role}`}
                  className="h-full w-full object-cover"
                  width={600}
                  height={750}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Monogram name={pro.name} size={200} className="!rounded-[18px]" />
                </div>
              )}
              {(pro.gallery?.length ?? 0) > 0 ? (
                <button
                  type="button"
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-reps-charcoal/85 px-3 py-1.5 text-[12px] font-semibold text-reps-warm-white backdrop-blur-sm transition hover:bg-reps-charcoal"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  +{pro.gallery!.length} photos
                </button>
              ) : null}
            </div>

            {/* Middle info column */}
            <div className="flex min-w-0 flex-col">
              {pro.trust?.verified ? (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  <BadgeCheck className="h-3 w-3" />
                  REPs Verified
                </span>
              ) : (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-reps-muted-light">
                  Unverified
                </span>
              )}

              <h1 className="mt-3 font-display text-[40px] font-bold leading-[1.02] tracking-[-0.01em] text-reps-charcoal lg:text-[46px]">
                {pro.name}
              </h1>
              <div className="mt-1 text-[16px] text-reps-muted-light">{pro.role}</div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
                <span className="inline-flex items-center gap-1.5 text-reps-charcoal">
                  <MapPin className="h-4 w-4 text-reps-muted-light" />
                  {pro.location}
                </span>
                {reviewSummary.count > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-reps-orange text-reps-orange" />
                    <span className="font-semibold text-reps-charcoal">{reviewSummary.rating.toFixed(1)}</span>
                    <span className="text-reps-muted-light">
                      ({reviewSummary.count} {reviewSummary.count === 1 ? "review" : "reviews"})
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-reps-muted-light">
                    <Star className="h-4 w-4 text-reps-stone" />
                    No reviews yet
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {pro.modes.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[12px] font-medium text-reps-charcoal"
                  >
                    {m === "In-person" ? (
                      <Users className="h-3.5 w-3.5" />
                    ) : (
                      <Laptop className="h-3.5 w-3.5" />
                    )}
                    {m}
                  </span>
                ))}
              </div>

              <p className="mt-5 border-l-2 border-reps-orange pl-4 font-display text-[16px] italic leading-snug text-reps-charcoal">
                &ldquo;{pro.blurb}&rdquo;
              </p>

              {pro.services[0]?.price ? (
                <div className="mt-5 text-[13px] text-reps-muted-light">
                  <span className="font-semibold text-reps-charcoal">From {pro.services[0].price}</span>
                  {pro.services[0].unit ? ` ${pro.services[0].unit}` : null}
                </div>
              ) : null}
            </div>

            {/* Right sidebar — Get in touch card */}
            <aside className="lg:sticky lg:top-[92px] lg:self-start">
              <div className="rounded-[18px] border border-reps-stone bg-reps-warm-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                <div className="font-display text-[16px] font-bold text-reps-charcoal">
                  Get in touch
                </div>
                <div className="mt-1 text-[12.5px] text-reps-muted-light">
                  Free, no-obligation enquiry.
                </div>

                <ul className="mt-4 space-y-2 border-y border-reps-stone py-4 text-[12.5px] text-reps-charcoal">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-green" strokeWidth={3} />
                    Send a private enquiry
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-green" strokeWidth={3} />
                    No obligation to book
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-green" strokeWidth={3} />
                    Details shared only with {pro.firstName}
                  </li>
                </ul>

                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    to="/pro/$slug/enquire"
                    params={{ slug }}
                    onClick={() => {
                      void import("@/lib/analytics/track").then(({ track }) =>
                        track.profileCtaClick({ slug, cta: "enquire", professional_id: db?.id ?? null }),
                      );
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Send Enquiry
                  </Link>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] text-[13px] font-semibold text-reps-muted-light transition-colors hover:text-reps-charcoal"
                  >
                    <Bookmark className="h-4 w-4" />
                    Save profile
                  </button>
                </div>
              </div>
            </aside>

          </div>


          {/* Trust strip */}
          {(() => {
            const isVerified = !!pro.trust?.verified;
            const hasQuals = (pro.qualifications?.length ?? 0) > 0;
            const hasInsurance = !!pro.trust?.insuranceExpiry;
            const today = new Date().toISOString().slice(0, 10);
            const verifiedSub = isVerified
              ? hasInsurance
                ? "Qualified & insured"
                : "Qualified"
              : hasQuals
                ? "Qualifications pending review"
                : "Not yet qualified";
            return (
              <div className="mt-6 grid grid-cols-2 gap-4 rounded-[16px] border border-reps-stone bg-reps-warm-white p-4 sm:grid-cols-4 lg:p-5">
                <TrustItem
                  icon={ShieldCheck}
                  title={isVerified ? "REPS Verified" : "Not REPS Verified"}
                  sub={verifiedSub}
                />
                <TrustItem
                  icon={Award}
                  title={hasQuals ? "Qualifications Checked" : "No qualifications"}
                  sub={
                    !hasQuals
                      ? "Not yet qualified"
                      : pro.qualifications.some((q) => q.expires && q.expires < today)
                        ? "Renewal required"
                        : (() => {
                            const dateStr = pro.trust?.qualificationsCheckedAt || pro.memberSince;
                            if (dateStr) {
                              const d = new Date(dateStr);
                              if (!Number.isNaN(d.getTime())) {
                                return `Checked ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
                              }
                            }
                            return "On file";
                          })()
                  }
                />
                <TrustItem
                  icon={Umbrella}
                  title="Professional Indemnity"
                  sub={
                    pro.trust?.insuranceExpiry
                      ? (() => {
                          const d = new Date(pro.trust.insuranceExpiry);
                          if (!Number.isNaN(d.getTime())) {
                            const day = d.getUTCDate();
                            const month = MONTHS_SHORT[d.getUTCMonth()];
                            const year = d.getUTCFullYear();
                            return `Active until ${day} ${month} ${year}`;
                          }
                          return "Active";
                        })()
                      : "No active insurance"
                  }
                />
                <TrustItem
                  icon={GraduationCap}
                  title="CPD tracking"
                  sub="Coming soon"
                  info
                />
              </div>
            );
          })()}
        </div>
      </section>

      {/* ============ WHO I HELP ============ */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 pb-6 lg:px-10">
          <div className="grid gap-6 rounded-[22px] border border-reps-stone bg-reps-ivory p-6 lg:grid-cols-[220px_1fr] lg:items-center lg:gap-8 lg:p-7">
            <div>
              <h2 className="font-display text-[18px] font-bold leading-tight text-reps-charcoal">
                Who I help
              </h2>
              <p className="mt-1 text-[13px] text-reps-muted-light">
                I work best with people who:
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-6">
              {WHO_I_HELP.map((w) => (
                <li key={w.label} className="flex flex-col items-start gap-2 text-[12.5px] leading-snug text-reps-charcoal">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-reps-orange/25 bg-reps-orange-soft text-reps-orange">
                    <w.icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="font-semibold">{w.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>


      {/* ============ SPINE: main + sticky sidebar ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto grid max-w-[1320px] gap-8 px-6 py-10 lg:grid-cols-[1.7fr_1fr] lg:gap-10 lg:px-10 lg:py-12">

          {/* ===== MAIN COLUMN ===== */}
          <div className="flex min-w-0 flex-col gap-12">

            {/* About — no card */}
            <div id="about">
              <h2 className="font-display text-[24px] font-bold text-reps-charcoal">
                About {pro.firstName}
              </h2>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-reps-muted-light">
                {pro.bio.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              {(() => {
                const parts: React.ReactNode[] = [];
                if (pro.years > 0) {
                  parts.push(
                    <span key="years">
                      <strong className="font-semibold text-reps-charcoal">{pro.years}+</strong> years qualified
                    </span>,
                  );
                }
                if (pro.clients && pro.clients !== "—" && pro.clients !== "0") {
                  parts.push(
                    <span key="clients">
                      <strong className="font-semibold text-reps-charcoal">{pro.clients}</strong> clients helped
                    </span>,
                  );
                }
                if (pro.qualifications[0]?.issued && pro.qualifications[0].issued !== "—") {
                  parts.push(
                    <span key="verified">
                      Qualified since{" "}
                      <strong className="font-semibold text-reps-charcoal">
                        {pro.qualifications[0].issued.split(" ").pop()}
                      </strong>
                    </span>,
                  );
                }
                if (parts.length === 0) return null;
                return (
                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-reps-muted-light">
                    {parts.map((p, i) => (
                      <React.Fragment key={i}>
                        {i > 0 ? <span className="text-reps-stone" aria-hidden>·</span> : null}
                        {p}
                      </React.Fragment>
                    ))}
                  </div>
                );
              })()}
            </div>


            {/* Services — dark navy tiles, matches /c/$slug */}
            <div id="services">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-[20px] font-bold text-reps-charcoal">
                  Services &amp; Pricing
                </h2>
                <a
                  href={`/pro/${pro.slug}/services`}
                  className="text-[13px] font-semibold text-reps-orange hover:underline"
                >
                  View all →
                </a>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pro.services.slice(0, 3).map((s, i) => (
                  <article
                    key={s.title}
                    className="relative flex flex-col overflow-hidden rounded-[18px] border border-reps-charcoal/10 bg-reps-charcoal text-reps-warm-white shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                  >
                    {i === 1 ? (
                      <span className="absolute right-3 top-3 z-10 rounded-full bg-reps-orange px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-reps-warm-white">
                        Most popular
                      </span>
                    ) : null}
                    {s.image ? (
                      <div className="h-32 w-full overflow-hidden bg-reps-charcoal/60">
                        <img src={s.image} alt="" className="h-full w-full object-cover opacity-90" loading="lazy" />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="font-display text-[17px] font-bold leading-tight">
                        {s.title}
                      </div>
                      <div className="mt-2 line-clamp-3 text-[13px] leading-snug text-reps-warm-white/70">
                        {s.desc}
                      </div>
                      <div className="mt-4 flex items-end justify-between border-t border-reps-warm-white/10 pt-4">
                        <div>
                          <div className="font-display text-[20px] font-bold leading-none">
                            {s.price}
                          </div>
                          <div className="mt-1 text-[11px] text-reps-warm-white/60">{s.unit}</div>
                        </div>
                        <a
                          href={`/pro/${pro.slug}/services`}
                          className="rounded-full bg-reps-orange px-3.5 py-1.5 text-[12px] font-semibold text-reps-warm-white hover:brightness-110"
                        >
                          Enquire
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>


            {/* Specialisms — no card */}
            <div id="specialisms">
              <h2 className="font-display text-[20px] font-bold text-reps-charcoal">
                Specialisms
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {pro.specialisms.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1.5 text-[13px] font-medium text-reps-charcoal"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Qualifications — card */}
            <div id="qualifications" className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6 lg:p-7">
              <h2 className="font-display text-[20px] font-bold text-reps-charcoal">
                Qualifications &amp; Credentials
              </h2>
              {pro.qualifications.length === 0 ? (
                <p className="mt-5 text-[14px] text-reps-muted-light">
                  Verified qualifications will appear here once added.
                </p>
              ) : (
                <div className="mt-5 space-y-5">
                  {pro.qualifications.map((q) => (
                    <div
                      key={q.id}
                      className="grid grid-cols-[64px_1fr_auto_auto] items-center gap-4 border-b border-reps-stone/70 pb-5 last:border-0 last:pb-0"
                    >
                      <div className="flex h-12 w-16 items-center justify-center rounded-[10px] bg-reps-ivory text-[11px] font-bold text-reps-charcoal">
                        {q.badge}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-reps-charcoal">{q.title}</div>
                        <div className="text-[12px] text-reps-muted-light">{q.issuer}</div>
                        <div className="mt-0.5 text-[11px] text-reps-muted-light">ID: {q.id}</div>
                      </div>
                      <div className="text-right text-[12px] text-reps-muted-light">
                        <div>Issued: {q.issued}</div>
                        <div className="mt-1 text-[11px] font-medium text-reps-green">
                          {q.verified === false ? "Approved" : "Verified"}
                        </div>
                      </div>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-reps-green text-white">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews — card */}
            <div id="reviews" className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6 lg:p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[20px] font-bold text-reps-charcoal">
                  What clients say
                </h2>
                {reviewSummary.count > 0 ? (
                  <a className="text-[13px] font-medium text-reps-orange hover:underline" href="#reviews">
                    See all {reviewSummary.count} reviews
                  </a>
                ) : null}
              </div>

              <div className="mt-5 grid gap-6 sm:grid-cols-[220px_1fr]">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="font-display text-[42px] font-bold leading-none text-reps-charcoal">
                      {reviewSummary.rating.toFixed(1)}
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(reviewSummary.rating) ? "fill-reps-orange text-reps-orange" : "text-reps-stone"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 text-[12px] text-reps-muted-light">
                    Based on {reviewSummary.count} {reviewSummary.count === 1 ? "review" : "reviews"}
                  </div>
                  {reviewSummary.count >= 3 ? (
                    <div className="mt-4 space-y-2">
                      {reviewSummary.dist.map((d) => (
                        <div key={d.stars} className="grid grid-cols-[18px_12px_1fr_28px] items-center gap-2 text-[11px] text-reps-muted-light">
                          <span>{d.stars}</span>
                          <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                          <div className="h-1.5 overflow-hidden rounded-full bg-reps-stone">
                            <div
                              className="h-full rounded-full bg-reps-orange"
                              style={{ width: `${Math.min(100, (d.count / reviewSummary.maxCount) * 100)}%` }}
                            />
                          </div>
                          <span className="text-right text-reps-charcoal">{d.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                </div>

                <div className="space-y-5">
                  {hasRealReviews
                    ? realReviews.slice(0, 6).map((r) => (
                        <div key={r.id} className="grid grid-cols-[44px_1fr] gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-reps-orange/10 text-[13px] font-semibold text-reps-orange">
                            {r.client_name
                              .split(" ")
                              .map((p) => p[0])
                              .filter(Boolean)
                              .slice(0, 2)
                              .join("")
                              .toUpperCase() || "·"}
                          </span>
                          <div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-[13px] font-semibold text-reps-charcoal">
                                  {r.client_name}
                                </div>
                                <div className="text-[11px] text-reps-muted-light">
                                  {formatReviewWhen(r.published_at ?? r.created_at)}
                                </div>
                              </div>
                            </div>
                            <div className="mt-1 flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, k) => (
                                <Star
                                  key={k}
                                  className={`h-3 w-3 ${k < r.rating ? "fill-reps-orange text-reps-orange" : "text-reps-stone"}`}
                                />
                              ))}
                            </div>
                            {r.title ? (
                              <p className="mt-2 text-[13px] font-semibold text-reps-charcoal">
                                {r.title}
                              </p>
                            ) : null}
                            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-reps-muted-light">
                              &ldquo;{r.body}&rdquo;
                            </p>
                          </div>
                        </div>
                      ))
                    : (
                        <div className="rounded-[16px] border border-dashed border-reps-stone bg-reps-warm-white/60 p-6 text-center">
                          <p className="text-[13px] text-reps-muted-light">
                            No reviews yet. Verified client reviews will appear here once published.
                          </p>
                        </div>
                      )}
                </div>
              </div>
            </div>

            {/* FAQ — no card */}
            {pro.faqs.length > 0 ? (
              <div id="faq">
                <h2 className="font-display text-[20px] font-bold text-reps-charcoal">
                  Frequently asked questions
                </h2>
                <div className="mt-4 space-y-2">
                  {pro.faqs.map((f, i) => {
                    const open = f.open || i === 0;
                    return (
                      <div
                        key={f.q}
                        className={`rounded-[12px] border border-reps-stone ${open ? "bg-reps-warm-white" : "bg-transparent"}`}
                      >
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13px] font-semibold text-reps-charcoal"
                        >
                          {f.q}
                          <ChevronDown
                            className={`h-4 w-4 text-reps-muted-light transition-transform ${open ? "rotate-180" : ""}`}
                          />
                        </button>
                        {open && f.a ? (
                          <div className="px-4 pb-4 text-[12.5px] leading-relaxed text-reps-muted-light">
                            {f.a}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

              </div>
            ) : null}
          </div>

          {/* ===== STICKY SIDEBAR ===== */}
          <aside className="flex flex-col gap-5 lg:sticky lg:top-[130px] lg:self-start">
            {/* Quick Details — spec sheet */}
            {(() => {
              const rows: { label: string; value: React.ReactNode }[] = [];
              if (pro.specialisms.length > 0) {
                rows.push({ label: "Specialisms", value: pro.specialisms.slice(0, 4).join(", ") });
              }
              if (pro.modes.length > 0) {
                rows.push({ label: "Training modes", value: pro.modes.join(" · ") });
              }
              if (pro.services[0]?.price) {
                rows.push({
                  label: "From",
                  value: `${pro.services[0].price}${pro.services[0].unit ? " " + pro.services[0].unit : ""}`,
                });
              }
              if (pro.years > 0) {
                rows.push({ label: "Experience", value: `${pro.years}+ years qualified` });
              }
              if (rows.length === 0) return null;
              return (
                <div className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
                  <h3 className="font-display text-[16px] font-bold text-reps-charcoal">
                    Quick details
                  </h3>
                  <dl className="mt-4 divide-y divide-reps-stone/70 text-[13px]">
                    {rows.map((r) => (
                      <div key={r.label} className="grid grid-cols-[110px_1fr] gap-3 py-2.5">
                        <dt className="text-[12px] uppercase tracking-wide text-reps-muted-light">
                          {r.label}
                        </dt>
                        <dd className="text-reps-charcoal">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })()}

            {/* Location & Coverage */}
            <div id="location" className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
              <h3 className="font-display text-[16px] font-bold text-reps-charcoal">Location &amp; Coverage</h3>
              <div className="relative mt-3 aspect-[16/10] overflow-hidden rounded-[12px] bg-reps-stone ring-1 ring-inset ring-reps-charcoal/5">
                {pro.lat != null && pro.lng != null ? (
                  <LocationMap lat={pro.lat} lng={pro.lng} label={pro.location} radiusKm={15} />
                ) : (
                  <MapPlaceholder />
                )}
              </div>
              <div className="mt-3 text-[14px] font-semibold text-reps-charcoal">{pro.location}</div>
              {pro.region ? (
                <div className="text-[12px] text-reps-muted-light">{pro.region}</div>
              ) : null}
              <div className="mt-1 text-[12px] text-reps-muted-light">
                Covers a ~15 km radius from {pro.location.split(",")[0]}.
              </div>
              {pro.lat != null && pro.lng != null ? (
                <form
                  className="mt-4 flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const pc = String(fd.get("postcode") || "").trim();
                    if (!pc) return;
                    window.open(
                      `https://www.google.com/maps/dir/${encodeURIComponent(pc)}/${pro.lat},${pro.lng}`,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }}
                >
                  <input
                    name="postcode"
                    placeholder="Your postcode"
                    className="h-9 flex-1 rounded-[10px] border border-reps-stone bg-reps-ivory px-3 text-[12px] text-reps-charcoal placeholder:text-reps-muted-light focus:border-reps-orange focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-9 rounded-[10px] bg-reps-charcoal px-3 text-[12px] font-semibold text-reps-warm-white hover:brightness-110"
                  >
                    Check
                  </button>
                </form>
              ) : null}
            </div>


            {/* Trains at */}
            {(() => {
              const gyms = pro.gyms ?? [];
              if (gyms.length === 0) return null;
              return (
                <div className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
                  <h3 className="font-display text-[16px] font-bold text-reps-charcoal">Trains at</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {gyms.map((v) => (
                      <span
                        key={`${v.label}-${v.branch}`}
                        className="inline-flex items-center rounded-full border border-reps-stone bg-reps-ivory px-3 py-1 text-[12px] font-medium text-reps-charcoal"
                      >
                        {v.label}
                        {v.branch ? ` · ${v.branch}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Trust & Assurance — compact checklist */}
            <div className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
              <h3 className="font-display text-[16px] font-bold text-reps-charcoal">
                Trust &amp; Assurance
              </h3>
              {(() => {
                const isFixturePro = !!PROS[slug];
                const trust = pro.trust ?? { verified: false, insuranceExpiry: null };
                const insuranceLabel = trust.insuranceExpiry
                  ? `Active until ${new Date(trust.insuranceExpiry).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                  : "Not on file";
                // Only render CPD row when there is real data (or an admin-only fixture).
                const cpd = trust.cpd ?? null;
                const items = [
                  {
                    on: !!trust.identityVerifiedAt || (isFixturePro && trust.verified),
                    t: "Identity Verified",
                    s: trust.identityVerifiedAt
                      ? `Confirmed ${new Date(trust.identityVerifiedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                      : trust.verified
                        ? "Confirmed on file"
                        : "Not yet verified",
                  },
                  {
                    on: !!trust.qualificationsCheckedAt || (isFixturePro && trust.verified) || (pro.qualifications?.length ?? 0) > 0,
                    t: "Qualifications Approved",
                    s: trust.qualificationsCheckedAt
                      ? `Checked ${new Date(trust.qualificationsCheckedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                      : (pro.qualifications?.length ?? 0) > 0
                        ? "On file"
                        : "Awaiting review",
                  },
                  {
                    on: !!trust.insuranceExpiry,
                    t: "Professional Indemnity",
                    s: insuranceLabel,
                  },
                  ...(cpd
                    ? [{
                        on: cpd.done >= cpd.total * 0.5,
                        t: "CPD Compliant",
                        s: `${cpd.done} / ${cpd.total} points`,
                      }]
                    : []),
                ];
                return (
                  <ul className="mt-4 space-y-3 text-[12.5px]">
                    {items.map((i) => (
                      <li key={i.t} className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${i.on ? "bg-reps-green" : "bg-reps-stone"}`}
                        >
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold leading-tight text-reps-charcoal">{i.t}</div>
                          <div className="text-[11.5px] leading-tight text-reps-muted-light">{i.s}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </aside>
        </div>
      </section>


      {/* ============ CTA BAND ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 pb-10 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-5 rounded-[18px] border border-reps-stone bg-reps-warm-white p-4 md:flex-row md:items-center lg:p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-[18px] font-bold text-reps-charcoal">
                  Ready to work with {pro.firstName}?
                </h2>
                <p className="mt-1 max-w-[460px] text-[13px] text-reps-muted-light">
                  Send an enquiry or book a free consultation to discuss your goals and how {pro.firstName} can help you achieve them.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/pro/$slug/enquire"
                params={{ slug }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-dark"
              >
                <MessageCircle className="h-4 w-4" />
                Send Enquiry
              </Link>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-reps-stone bg-reps-warm-white px-6 text-[14px] font-semibold text-reps-charcoal transition-colors hover:bg-reps-ivory"
              >
                <Bookmark className="h-4 w-4" />
                Save Profile
              </button>
            </div>
          </div>
        </div>
      </section>


      <PublicFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function TrustItem({
  icon: Icon,
  title,
  sub,
  info,
}: {
  icon: typeof BadgeCheck;
  title: string;
  sub: string;
  info?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-reps-ivory text-reps-charcoal">
        <Icon className="h-4 w-4" strokeWidth={1.6} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-[13px] font-semibold text-reps-charcoal">
          {title}
          {info && <Info className="h-3 w-3 text-reps-muted-light" />}
        </div>
        <div className="text-[11.5px] text-reps-muted-light">{sub}</div>
      </div>
    </div>
  );
}

function MapPlaceholder() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(135deg,#E8E2D4_0%,#DCD4C3_50%,#CFC6B3_100%)]">
      {/* faint grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(40,30,20,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(40,30,20,0.06) 1px, transparent 1px)",
          backgroundSize: "25% 25%",
        }}
      />
      {/* centred pin */}
      <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 text-reps-charcoal">
        <MapPin className="h-6 w-6 fill-reps-charcoal" />
      </div>
      {/* area labels — corners only, truncated so they never collide */}
      <div className="absolute left-2 top-2 max-w-[44%] truncate text-[7.5px] font-semibold uppercase tracking-[0.08em] text-reps-charcoal/55">
        Clerkenwell
      </div>
      <div className="absolute right-2 top-2 max-w-[44%] truncate text-right text-[7.5px] font-semibold uppercase tracking-[0.08em] text-reps-charcoal/55">
        City of London
      </div>
      <div className="absolute bottom-2 left-2 max-w-[44%] truncate text-[7.5px] font-semibold uppercase tracking-[0.08em] text-reps-charcoal/55">
        Farringdon
      </div>
    </div>
  );
}
