import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useSessionUser } from "@/hooks/use-session-user";
import {
  getWebsiteBySlug,
  type ServiceDTO,
  type WebsiteDTO,
  type WebsiteClientResultDTO,
  type WebsiteFaqDTO,
  type WebsiteTransformationDTO,
} from "@/lib/website/website.functions";
import { DEFAULT_SERVICE_CARDS } from "@/lib/website/default-services";
import { listPublicReviewsBySlug } from "@/lib/reviews/reviews.functions";
import { getProSlugPublicStatus, type ProSlugStatus } from "@/lib/website/slug-status.functions";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  Check,
  Globe,
  Home,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Quote,
  Route as RouteIcon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,

  Star,
  Users,
  Youtube,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { SiteBanner } from "@/components/SiteBanner";

import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import coachJamesCoaching from "@/assets/coach-james-coaching.jpg";

/* ------------------------------------------------------------------ */
/* Mock data                                                          */
/* ------------------------------------------------------------------ */

type AccentKey = "orange" | "teal" | "indigo" | "plum" | "forest" | "slate";

type Tier = {
  slug: string;
  name: string;
  eyebrow: string;
  price: string;
  unit: string;
  blurb: string;
  includes: string[];
  highlight?: boolean;
  ctaLabel?: string | null;
};

function priceUnitLabel(u: string | null | undefined): string | null {
  switch (u) {
    case "per_session": return "/ session";
    case "per_month": return "/ month";
    case "per_week": return "/ week";
    case "per_block": return "/ block";
    case "per_hour": return "/ hour";
    case "total": return "total";
    case "from": return "from";
    case "custom": return "";
    default: return null;
  }
}


type Transformation = {
  image: string;
  client: string;
  meta: string;
  metric: string;
  quote: string;
};

type Testimonial = {
  initials: string;
  name: string;
  role: string;
  quote: string;
};

type Coach = {
  slug: string;
  name: string;
  firstName: string;
  role: string;
  city: string;
  region: string;
  promise: string;
  subhead: string;
  aboutHeadline: string;
  method: { name: string; intro?: string; pillars: { title: string; desc: string }[] };
  bio: string[];
  heroImage: string;
  aboutImage: string;
  rating: number;
  reviews: number;
  years: number;
  clients: string;
  verifiedSince: string;
  insuranceUntil: string;
  accent: AccentKey;
  modes: ("In-person" | "Online")[];
  specialisms: string[];
  tiers: Tier[];
  venues: {
    name: string;
    city: string;
    address?: string | null;
    googlePlaceId?: string | null;
    kind: "gym" | "home_studio" | "mobile";
  }[];
  cities: string[];
  transformations: Transformation[];
  testimonials: Testimonial[];
  clientResultsIntro?: string | null;
  qualifications: { title: string; issuer: string; id: string; issued: string }[];
  faqs: { q: string; a: string }[];
  socials: {
    kind: "instagram" | "tiktok" | "youtube" | "x" | "website" | "email";
    href: string;
    label: string;
  }[];
  trust?: {
    isVerified: boolean;
    primaryTitleSlug: string | null;
    insuranceExpiry: string | null;
    activeCredentialsCount: number;
    lastCheckedAt: string | null;
    identityVerifiedAt: string | null;
    qualifiedSinceYear: number | null;
    items: Array<{
      kind: "qualification" | "insurance";
      title: string;
      issuer: string;
      id: string | null;
      dateLabel: string | null;
    }>;
  };
  theme?: "dark" | "light";
  /** Currently coaching X of 20 available spaces. null = hide the strip; undefined = fixture default. */
  currentClients?: number | null;
};

const TITLE_SHORT_LABEL: Record<string, string> = {
  "personal-trainer": "Level 3 PT",
  "advanced-personal-trainer": "Level 4 PT",
  "fitness-instructor": "Level 2 FI",
  "group-fitness-instructor": "Level 2 GFI",
  "pilates-instructor": "Level 3 Pilates",
  "yoga-teacher": "Level 3 Yoga",
  "strength-coach": "Level 4 S&C", "nutrition-coach": "Level 4 Nutrition",
  "accredited-sc-coach": "ASCC",
  "registered-nutritionist": "Registered Nutritionist",
  "registered-dietitian": "Registered Dietitian",
};

function formatMonthYear(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

const COACHES: Record<string, Coach> = {
  "james-wilson": {
    slug: "james-wilson",
    name: "James Wilson",
    firstName: "James",
    role: "Personal Trainer & Strength Coach",
    city: "London",
    region: "Greater London",
    promise: "Get visibly stronger in 12 weeks.",
    subhead:
      "1-to-1 strength coaching in central London and online worldwide. For people who are done guessing and want a plan that actually works.",
    aboutHeadline: "I take 20 clients. I write 20 programmes.",
    method: {
      name: "The Foundation Method",
      pillars: [
        {
          title: "Build the base",
          desc: "Two weeks fixing technique on the four lifts that matter. No ego, no fluff.",
        },
        {
          title: "Train the plan",
          desc: "Eight weeks of progressive, measurable work — written around your schedule, not a template.",
        },
        {
          title: "Make it stick",
          desc: "Habits, nutrition rails and recovery so the result still holds 12 months later.",
        },
      ],
    },
    bio: [
      "I'm a REPS Verified Personal Trainer with eight years coaching clients from total beginners to competitive athletes. Most come to me stuck — stalled progress, no time, fed up of training without a clear plan. We fix that in the first two weeks.", "I don't take on every enquiry. I work with around 20 people at a time, in person and online, so every client gets a programme written for them — not a template with their name on the front.",
    ],
    heroImage: coachJamesCoaching,
    aboutImage: proJames,
    rating: 5.0,
    reviews: 128,
    years: 8,
    clients: "100+",
    verifiedSince: "2023",
    insuranceUntil: "12 Dec 2026",
    accent: "orange",
    modes: ["In-person", "Online"],
    specialisms: [
      "Strength Training",
      "Fat Loss",
      "Muscle Gain",
      "Mobility",
      "Performance",
      "Habit Coaching",
    ],
    tiers: [
      {
        slug: "online",
        name: "Online Coaching",
        eyebrow: "Remote",
        price: "£160",
        unit: "/ month",
        blurb: "For people who train themselves but want a coach in their corner.",
        includes: [
          "Fully bespoke programme in-app", "Weekly written check-in & adjustments", "Unlimited messaging (Mon–Fri)", "Video form reviews", "Quarterly strategy call",
        ],
      },
      {
        slug: "hybrid",
        name: "Hybrid Coaching",
        eyebrow: "Most popular",
        price: "£240",
        unit: "/ month",
        blurb: "The full programme — two in-person sessions a month, online the rest.",
        includes: [
          "Everything in Online Coaching",
          "2× in-person sessions per month", "Movement screen & progress reviews", "Body composition tracking", "Priority response time",
        ],
        highlight: true,
      },
      {
        slug: "in-person",
        name: "1-to-1 In Person",
        eyebrow: "Hands-on",
        price: "From £75",
        unit: "/ session",
        blurb: "Train with me in central London. Programming, coaching and accountability in one room.",
        includes: [
          "60-minute sessions at Third Space or BXR", "Bespoke programme outside sessions", "Nutrition & recovery rails", "Direct messaging access", "Block discount available (10+ sessions)",
        ],
      },
    ],
    venues: [
      { name: "Third Space Soho", city: "London", address: "67 Brewer St, Soho, London W1F 9US", kind: "gym", googlePlaceId: null },
      { name: "BXR White City", city: "London", address: "White City Place, Wood Ln, London W12 7RU", kind: "gym", googlePlaceId: null },
      { name: "Equinox St James's", city: "London", address: "12 St James's, London SW1Y 4AH", kind: "gym", googlePlaceId: null },
      { name: "Home / private studio", city: "London", kind: "home_studio" },
    ],
    cities: ["Central London", "Soho", "Marylebone", "Shoreditch", "Online (worldwide)"],
    transformations: [
      {
        image: proSophie,
        client: "Sophie L.",
        meta: "Marketing Director · 12 weeks",
        metric: "−8kg · first unassisted pull-up",
        quote:
          "I'd tried four PTs before James. He's the first one who actually wrote a plan around my life instead of fighting it.",
      },
      {
        image: proDaniel,
        client: "Daniel R.",
        meta: "Founder · 16 weeks",
        metric: "+22kg deadlift · pain-free running",
        quote:
          "Back hadn't felt right in two years. We fixed it in six weeks and I added more strength than the previous two years combined.",
      },
      {
        image: proLaura,
        client: "Laura T.",
        meta: "Doctor · 6 months postnatal",
        metric: "Full return to strength · 3× / wk",
        quote:
          "Postnatal coaching that didn't talk down to me. Felt like a strength programme, not rehab.",
      },
    ],
    testimonials: [
      {
        initials: "MC",
        name: "Mark C.",
        role: "Lawyer, Mayfair",
        quote:
          "The first coach who actually pushed back on my goals and made me set better ones. Three months in, every number is up.",
      },
      {
        initials: "EP",
        name: "Emma P.",
        role: "Founder, ClientCo",
        quote:
          "Programmed, measured, adjusted weekly. It feels like having a head of training rather than a PT.",
      },
      {
        initials: "RH",
        name: "Raj H.",
        role: "Engineer, Shoreditch",
        quote:
          "Eight months in, still motivated, still progressing. The habits are what made it stick — not the sessions.",
      },
    ],
    qualifications: [
      {
        title: "REPS Level 3 Personal Trainer",
        issuer: "Register of Exercise Professionals",
        id: "REP1234567",
        issued: "May 2023",
      },
      {
        title: "Level 3 Diploma in Personal Training",
        issuer: "YMCA Awards",
        id: "600/1234/8",
        issued: "May 2021",
      },
      {
        title: "Professional Indemnity Insurance",
        issuer: "Insure4Sport",
        id: "PI-883201",
        issued: "Active until Dec 2026",
      },
      {
        title: "First Aid & CPR",
        issuer: "St John Ambulance",
        id: "SJA-44218",
        issued: "Renewed Jan 2026",
      },
    ],
    faqs: [
      {
        q: "Where do in-person sessions take place?",
        a: "Mostly Third Space Soho and BXR White City. I can also coach at your home gym or a private studio in central London on request.",
      },
      {
        q: "How does online coaching work?",
        a: "You get a fully personalised programme in an app, weekly written check-ins, video form reviews and unlimited messaging. Most online clients see real changes inside the first month.",
      },
      {
        q: "I've never trained before — is this for me?",
        a: "Yes. About half of my clients start from zero. We build slowly, focus on technique, and make sure you actually enjoy training.",
      },
      {
        q: "What happens if I need to cancel a session?",
        a: "24 hours notice and we reschedule, no charge. Inside 24 hours the session is forfeited so we can keep slots fair for everyone.",
      },
      {
        q: "Do you offer nutrition coaching?",
        a: "Yes — built into every plan. I work to evidence-based principles, not fad diets, and I tailor it to how you actually want to eat.",
      },
    ],
    socials: [
      { kind: "instagram", href: "#", label: "Instagram" },
      { kind: "tiktok", href: "#", label: "TikTok" },
      { kind: "youtube", href: "#", label: "YouTube" },
      { kind: "website", href: "#", label: "Website" },
      { kind: "email", href: "mailto:hello@example.com", label: "Email" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Route                                                              */
/* ------------------------------------------------------------------ */

function mergeLiveIntoCoach(
  base: Coach,
  sf: WebsiteDTO,
  services: ServiceDTO[],
  transformations: WebsiteTransformationDTO[] = [],
  clientResults: WebsiteClientResultDTO[] = [],
  faqs: WebsiteFaqDTO[] = [],
): Coach {
  const liveTiers: Tier[] = services.length === 0
    ? DEFAULT_SERVICE_CARDS.map((card) => ({
        slug: `default-${card.sort_order}`,
        name: card.title,
        eyebrow: card.is_featured ? "Most popular" : card.mode === "online" ? "Remote" : card.mode === "hybrid" ? "Hybrid" : "Hands-on",
        price: card.price_label,
        unit: priceUnitLabel(card.price_unit) ?? "",
        blurb: card.description,
        includes: card.bullets,
        highlight: card.is_featured,
        ctaLabel: card.cta_label,
      }))
    : services.map((s, i) => ({
        slug: s.id,
        name: s.title,
        eyebrow: s.is_featured ? "Most popular" : s.mode === "online" ? "Remote" : s.mode === "hybrid" ? "Hybrid" : "Hands-on",
        price: s.price_label ?? (s.price_pence != null ? `£${(s.price_pence / 100).toFixed(0)}` : "On enquiry"),
        unit: priceUnitLabel(s.price_unit) ?? (s.duration_minutes ? `${s.duration_minutes} min` : "per session"),
        blurb: s.description ?? "",
        includes: Array.isArray(s.bullets) ? s.bullets.filter((b) => b && b.trim()) : [],
        highlight: s.is_featured || (services.every((x) => !x.is_featured) && i === 1),
        ctaLabel: s.cta_label ?? null,
      }));


  const memberSinceDate = sf.member_since ? new Date(sf.member_since) : null;
  const memberYear = memberSinceDate && !isNaN(memberSinceDate.getTime())
    ? memberSinceDate.getFullYear()
    : null;
  const qualSinceYear = sf.trust?.qualifiedSinceYear ?? sf.coaching_since_year ?? null;
  const yearsCoaching = qualSinceYear
    ? Math.max(1, new Date().getFullYear() - qualSinceYear)
    : base.years;
  const liveModes: ("In-person" | "Online")[] = [];
  if (sf.in_person_available) liveModes.push("In-person");
  if (sf.online_available) liveModes.push("Online");
  const liveVenues = sf.venues.map((venue) => ({
    name: venue.name,
    city: venue.address || sf.city || base.city,
    address: venue.address ?? null,
    googlePlaceId: venue.googlePlaceId ?? null,
    kind: venue.kind,
  }));
  const liveCities = [
    ...sf.coaching_reach.cities,
    ...(sf.online_available ? ["Online (worldwide)"] : []),
  ];
  const liveTransformations: Transformation[] = transformations
    .filter((t) => t.is_published)
    .map((t, i) => {
      const metaParts = [t.client_role, t.duration_label].filter((s): s is string => !!s && s.trim().length > 0);
      const clientLabel = t.client_first_name?.trim()
        ? t.client_first_name.trim()
        : `Client ${i + 1}`;
      return {
        image: t.image_url ?? base.transformations[i % Math.max(base.transformations.length, 1)]?.image ?? base.heroImage,
        client: clientLabel,
        meta: metaParts.length ? metaParts.join(" · ") : "",
        metric: t.metric ?? t.headline ?? "Client progress",
        quote: t.quote ?? t.headline ?? "Great progress from consistent coaching.",
      };
    });
  const liveFaqs = faqs.map((f) => ({ q: f.question, a: f.answer }));
  const liveTestimonials = clientResults
    .filter((r) => r.is_published && (r.headline || r.body))
    .map((r, i) => ({
      initials: `C${i + 1}`,
      name: r.headline ?? `Client ${i + 1}`,
      role: "Verified client result",
      quote: r.body ?? r.headline ?? "",
    }));
  const firstName = sf.full_name?.trim().split(/\s+/)[0] ?? base.firstName;
  const cityLabel = sf.city ?? base.city;
  const professionLabel = sf.titles.length
    ? sf.titles.join(" & ")
    : (sf.primary_profession ?? base.role);
  const modeLabel = sf.in_person_available && sf.online_available
    ? "in person and online"
    : sf.online_available
      ? "online"
      : "in person";
  const fallbackTagline = `${firstName} — ${professionLabel} in ${cityLabel}`;
  const fallbackAbout = `I'm ${firstName}, a ${professionLabel} based in ${cityLabel}, working with clients ${modeLabel}. Get in touch to talk about what you're working towards and how I can help.`;
  return {
    ...base,
    name: sf.full_name ?? base.name,
    firstName,
    role: professionLabel,
    promise: sf.tagline?.trim() || fallbackTagline,
    subhead: sf.subtitle ?? base.subhead,
    aboutHeadline: (sf as { about_headline?: string | null }).about_headline?.trim() || base.aboutHeadline,
    bio: sf.about?.trim()
      ? sf.about.split(/\n\n+/).filter(Boolean)
      : [fallbackAbout],
    heroImage: sf.hero_image_url ?? base.heroImage,
    aboutImage: sf.avatar_url ?? sf.hero_image_url ?? base.aboutImage,
    city: sf.city ?? base.city,
    modes: liveModes.length ? liveModes : base.modes,
    specialisms: sf.specialisms.length ? sf.specialisms : base.specialisms,
    tiers: liveTiers.length ? liveTiers : base.tiers,
    method: {
      name: sf.method_name ?? base.method.name,
      intro: sf.method_intro ?? base.method.intro,
      pillars: sf.method_pillars.length
        ? sf.method_pillars.map((p) => ({ title: p.title, desc: p.body }))
        : base.method.pillars,
    },
    venues: liveVenues.length ? liveVenues : base.venues,
    cities: liveCities.length ? liveCities : base.cities,
    transformations: liveTransformations.length ? liveTransformations : base.transformations,
    testimonials: liveTestimonials.length ? liveTestimonials : base.testimonials,
    clientResultsIntro: sf.client_results_intro ?? base.clientResultsIntro ?? null,
    faqs: liveFaqs.length ? liveFaqs : base.faqs,
    years: yearsCoaching,
    verifiedSince: (() => {
      const idAt = sf.trust?.identityVerifiedAt;
      if (idAt) {
        const d = new Date(idAt);
        if (!isNaN(d.getTime())) return String(d.getFullYear());
      }
      return memberYear ? String(memberYear) : base.verifiedSince;
    })(),
    trust: sf.trust,
    theme: (sf as { theme?: "dark" | "light" }).theme ?? "dark",
    socials: sf.socials.length ? sf.socials : base.socials,
    currentClients: sf.current_clients,
  };

}


export const Route = createFileRoute("/c/$slug/")({
  validateSearch: (search: Record<string, unknown>) => ({
    preview: typeof search.preview === "string" ? search.preview : undefined,
  }),
  loaderDeps: ({ search }) => ({ preview: search.preview }),
  loader: async ({ params, deps }) => {
    // Fixture coaches (mock-up slugs) always render — no gating.
    if (COACHES[params.slug]) return { gated: false as const, live: null, unverified: null };
    // `?preview=<signed-token>` bypasses the published snapshot and reads
    // live draft content, so the editor's iframe shows unpublished edits.
    const live = await getWebsiteBySlug({
      data: { slug: params.slug, preview: deps.preview },
    });
    if (live) return { gated: false as const, live, unverified: null };

    // No published website found. Distinguish "not verified yet" from "no such member".
    const status = await getProSlugPublicStatus({ data: { slug: params.slug } });
    if (status.exists && !status.isSuspended) {
      return { gated: true as const, live: null, unverified: status };
    }
    throw notFound();
  },


  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-reps-ink p-8 text-center text-white/70">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm">This website is not available.</p>
      </div>
    </div>
  ),
  head: ({ params, loaderData }) => {
    const coach = COACHES[params.slug];
    // Fixture (mock-up) coaches stay noindex — they're admin-only reference pages.
    if (coach) {
      const title = `${coach.name} — ${coach.role} | REPS`;
      const description = `${coach.promise} ${coach.subhead}`;
      return {
        meta: [
          { title },
          { name: "description", content: description },
          { name: "robots", content: "noindex, nofollow" },
          { property: "og:title", content: title },
          { property: "og:description", content: description },
        ],
      };
    }

    const canonical = `https://repsuk.org/c/${params.slug}`;

    // Unverified gate page — always noindex, generic copy, no PII in title.
    if (loaderData?.gated) {
      const first = loaderData.unverified?.firstName ?? "This member";
      return {
        meta: [
          { title: `${first} — Not yet verified on REPS` },
          { name: "description", content: `${first} has not completed REPs verification yet. Members only appear publicly once their ID, insurance and qualifications are independently verified.` },
          { name: "robots", content: "noindex, nofollow" },
        ],
        links: [{ rel: "canonical", href: canonical }],
      };
    }

    const sf = loaderData?.live?.website;
    if (!sf) {
      return {
        meta: [
          { title: "Profile not found | REPS" },
          { name: "robots", content: "noindex, nofollow" },
        ],
        links: [{ rel: "canonical", href: canonical }],
      };
    }

    const name = sf.full_name?.trim() || "REPS Professional";
    const titleLabel = sf.titles?.length
      ? sf.titles.join(" & ")
      : sf.primary_profession || "Personal Trainer";
    const cityPart = sf.city ? ` in ${sf.city}` : "";
    const pageTitle = `${name} — ${titleLabel}${cityPart} | REPS`;

    const bioSnippet = (sf.tagline || sf.subtitle || sf.about || "")
      .replace(/\s+/g, "")
      .trim()
      .slice(0, 110);
    const description = bioSnippet
      ? `Book ${name}, a verified ${titleLabel.toLowerCase()}${cityPart}. ${bioSnippet}${bioSnippet.length === 110 ? "…" : ""} Verified on the REPS register.`
      : `Book ${name}, a verified ${titleLabel.toLowerCase()}${cityPart}. Verified on the REPS register.`;

    const ogImage = sf.hero_image_url || sf.avatar_url || undefined;

    const meta: Array<Record<string, string>> = [
      { title: pageTitle },
      { name: "description", content: description.slice(0, 300) },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: description.slice(0, 300) },
      { property: "og:url", content: canonical },
      { property: "og:type", content: "profile" },
      { name: "twitter:title", content: pageTitle },
      { name: "twitter:description", content: description.slice(0, 200) },
    ];
    if (ogImage) {
      meta.push({ property: "og:image", content: ogImage });
      meta.push({ name: "twitter:image", content: ogImage });
    }

    const personJsonLd: Record<string, unknown> = {
      "@context": "https://schema.org", "@type": "Person",
      name,
      url: canonical,
      jobTitle: titleLabel,
      ...(ogImage ? { image: ogImage } : {}),
      ...(sf.city ? { address: { "@type": "PostalAddress", addressLocality: sf.city } } : {}),
      ...(sf.tagline ? { description: sf.tagline } : {}),
    };

    return {
      meta,
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(personJsonLd) },
      ],
    };
  },
  component: CoachWebsitePage,
});


const NAV_ITEMS = [
  { id: "services", label: "Services" },
  { id: "method", label: "Method" },
  { id: "results", label: "Results" },
  { id: "reviews", label: "Reviews" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

function CoachWebsitePage() {
  const { slug } = Route.useParams();
  const { preview: previewToken } = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const fetchWebsite = useServerFn(getWebsiteBySlug);
  const fetchReviews = useServerFn(listPublicReviewsBySlug);
  const isFixture = !!COACHES[slug];

  // Fixture coach pages (james-wilson) are admin-only mock-up references —
  // gated client-side so SSR always renders a neutral skeleton.
  const { user, isAdmin, isLoading: authLoading } = useSessionUser();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: live } = useQuery({
    queryKey: ["website", slug],
    queryFn: () => fetchWebsite({ data: { slug } }),
    staleTime: 60_000,
    enabled: !isFixture,
    initialData: loaderData?.live ?? undefined,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["website-reviews", slug],
    queryFn: () => fetchReviews({ data: { slug } }),
    staleTime: 60_000,
    enabled: !isFixture,
  });
  // Unverified gate — pro exists but hasn't completed REPs verification.
  if (loaderData?.gated && loaderData.unverified?.exists) {
    return <UnverifiedGate status={loaderData.unverified} />;
  }


  if (isFixture) {
    if (!mounted || authLoading) {
      return <div className="min-h-screen bg-reps-ink" aria-hidden />;
    }
    if (!isAdmin) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-reps-ink p-8 text-center text-white/70">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Page not found</h1>
            <p className="mt-2 text-sm">This website is not available.</p>
          </div>
        </div>
      );
    }
  }

  const baseCoach = COACHES[slug];
  if (!baseCoach && !live) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-reps-ink p-8 text-center text-white/70">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Page not found</h1>
          <p className="mt-2 text-sm">This website is not available.</p>
        </div>
      </div>
    );
  }
  let coach = live
    ? mergeLiveIntoCoach(
        baseCoach ?? COACHES["james-wilson"],
        live.website,
        live.services,
        live.transformations,
        live.clientResults,
        live.faqs,
      )
    : baseCoach!;
  if (!isFixture && reviewsData) {
    coach = {
      ...coach,
      rating: reviewsData.count > 0 ? reviewsData.average : 0,
      reviews: reviewsData.count,
    };
  }
  const accent = `var(--coach-accent-${coach.accent})`;

  const accentStyle = {
    ["--accent-color" as string]: accent,
  } as React.CSSProperties;

  const enquireHref = "/c/$slug/enquire" as const;

  const isOwnerViewing =
    !!user && !!live?.website?.professional_id && user.id === live.website.professional_id;
  const showPlaceholderBanner =
    !isFixture && !previewToken && !coach.trust?.isVerified && !!live?.meta?.isPlaceholderContent;

  return (
    <div data-coach-theme={coach.theme ?? "dark"} className="min-h-screen bg-reps-ink text-reps-text" style={accentStyle}>
      {showPlaceholderBanner ? (
        <TemplateContentBanner
          firstName={(coach.name ?? "").split(" ")[0] || "This professional"}
          isOwnerViewing={isOwnerViewing}
        />
      ) : null}
      <ChromeBar coach={coach} />

      <SectionNav />

      <HeroSection coach={coach} enquireHref={enquireHref} slug={slug} />
      <TrustStrip coach={coach} />
      <ServicesSection coach={coach} slug={slug} enquireHref={enquireHref} />
      <MethodSection coach={coach} />
      <AboutSection coach={coach} />
      <VenuesSection coach={coach} />
      <TransformationsSection coach={coach} />
      <TestimonialsSection coach={coach} />
      <QualificationsSection coach={coach} />
      <FaqSection coach={coach} />
      <ContactSection coach={coach} slug={slug} enquireHref={enquireHref} />
      <FooterMark />

      <StickyMobileBar coach={coach} slug={slug} enquireHref={enquireHref} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Template-content banner                                            */
/* ------------------------------------------------------------------ */

function TemplateContentBanner({
  firstName,
  isOwnerViewing,
}: {
  firstName: string;
  isOwnerViewing: boolean;
}) {
  return (
    <div className="border-b border-amber-400/25 bg-amber-500/10 text-amber-100">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:px-10">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-[2px] h-4 w-4 shrink-0 text-amber-300" aria-hidden />
          <div className="leading-snug">
            <div className="text-[13px] font-semibold text-amber-50">
              Not yet verified by REPS
            </div>
            <div className="mt-0.5 text-[12.5px] text-amber-100/80">
              {firstName} is still completing their profile — some content on this page is placeholder.
            </div>
          </div>
        </div>
        {isOwnerViewing ? (
          <Link
            to="/dashboard/website"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] bg-amber-400 px-3 py-1.5 text-[12.5px] font-semibold text-amber-950 transition-colors hover:bg-amber-300"
          >
            Finish your website
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* Chrome                                                             */
/* ------------------------------------------------------------------ */

function ChromeBar({ coach }: { coach: Coach }) {
  return (
    <header className="sticky top-0 z-40 bg-reps-ink/85 backdrop-blur supports-[backdrop-filter]:bg-reps-ink/70 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)]">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-4 px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3 text-reps-text">
          <RepsWordmark className="h-4 w-auto text-reps-text" />
          <Separator orientation="vertical" className="h-4 bg-reps-border" />
          <span className="text-[13px] font-semibold text-reps-text">{coach.name}</span>
        </Link>
        <div className="hidden items-center gap-4 md:flex">
          {coach.trust?.isVerified ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-green/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
                  <BadgeCheck className="h-3 w-3" />
                  Verified on REPS
                </span>
              </TooltipTrigger>
              <TooltipContent>
                ID, insurance and qualifications independently verified by REPS.
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-reps-muted ring-1 ring-white/12">
                  <Shield className="h-3 w-3" />
                  Unverified
                </span>
              </TooltipTrigger>
              <TooltipContent>
                ID, insurance and qualifications not yet independently verified by REPS.
              </TooltipContent>
            </Tooltip>
          )}
          <Link
            to="/auth"
            className="text-[13px] font-medium text-reps-muted transition-colors hover:text-reps-text"
          >
            Client login
          </Link>
        </div>

      </div>
    </header>
  );
}

function SectionNav() {
  return (
    <nav
      aria-label="On this page"
      className="sticky top-14 z-30 hidden bg-reps-ink/80 backdrop-blur shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)] md:block"
    >
      <div className="mx-auto flex h-12 max-w-[1320px] items-center gap-1 overflow-x-auto px-6 lg:px-10">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-reps-muted transition-colors hover:bg-reps-panel-soft hover:text-reps-text"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                               */
/* ------------------------------------------------------------------ */

function HeroSection({
  coach,
  enquireHref,
  slug,
}: {
  coach: Coach;
  enquireHref: "/c/$slug/enquire";
  slug: string;
}) {
  return (
    <section className="relative overflow-hidden bg-reps-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(60% 80% at 12% 0%, color-mix(in oklab, var(--accent-color) 22%, transparent), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[1320px] px-6 pb-12 pt-10 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          {/* Copy */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              {coach.trust?.isVerified ? (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-reps-green/15 text-reps-green ring-1 ring-reps-green/30 hover:bg-reps-green/15"
                >
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  REPS Verified · Insured
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-white/[0.06] text-reps-muted ring-1 ring-white/12 hover:bg-white/[0.06]"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Unverified
                </Badge>
              )}
              <span className="inline-flex items-center gap-1.5 text-[13px] text-reps-muted">
                <MapPin className="h-3.5 w-3.5" />
                {coach.city}
              </span>
            </div>


            <div className="mt-6 text-[12px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
              {coach.name} — {coach.trust?.isVerified ? coach.role : "Fitness Professional"}
            </div>

            <h1 className="mt-3 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.015em] text-reps-text lg:text-[64px]">
              {coach.promise}
            </h1>

            <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-reps-text-soft">
              {coach.subhead}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
              <span className="inline-flex items-center gap-1.5">
                <Star
                  className={`h-4 w-4 ${coach.reviews > 0 ? "fill-reps-orange text-reps-orange" : "text-reps-muted"}`}
                />
                <span className={`font-semibold ${coach.reviews > 0 ? "text-reps-text" : "text-reps-muted"}`}>
                  {coach.rating.toFixed(1)}
                </span>
                <span className="text-reps-muted">
                  ({coach.reviews})
                </span>
              </span>

              {coach.modes.includes("In-person") && (
                <span className="inline-flex items-center gap-1.5 text-reps-muted">
                  <Users className="h-3.5 w-3.5" /> In-person · {coach.city}
                </span>
              )}
              {coach.modes.includes("Online") && (
                <span className="inline-flex items-center gap-1.5 text-reps-muted">
                  <Globe className="h-3.5 w-3.5" /> Online · worldwide
                </span>
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={enquireHref}
                params={{ slug }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] px-7 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                <MessageCircle className="h-4 w-4" />
                Enquire now
              </Link>
              <a
                href="#services"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel/40 px-6 text-[14px] font-semibold text-reps-text transition-colors hover:bg-reps-panel"
              >
                See plans & pricing
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {(() => {
              // undefined = fixture (show default 3); null = owner hid it; number = owner set
              const shown = coach.currentClients === undefined ? 3 : coach.currentClients;
              if (shown === null) return null;
              return (
                <div className="mt-8 flex items-center gap-3 text-[12.5px] text-reps-muted">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--accent-color)" }} />
                  <span>
                    Currently coaching <strong className="font-semibold text-reps-text-soft">{shown} of 20</strong> available spaces
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[24px] bg-reps-panel-soft">
              <img
                src={coach.heroImage}
                alt={`${coach.firstName} coaching a client in the gym`}
                className="aspect-[4/5] h-full w-full object-cover"
                width={1080}
                height={1350}
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 40%, rgba(11,13,16,0.55) 100%)",
                }}
              />
            </div>

            {/* Floating credential card */}
            {(() => {
              const t = coach.trust;
              const verified = !!t?.isVerified;
              const shortTitle = t?.primaryTitleSlug ? TITLE_SHORT_LABEL[t.primaryTitleSlug] ?? null : null;
              const insuredUntil = formatMonthYear(t?.insuranceExpiry ?? null);
              const lastChecked = formatMonthYear(t?.lastCheckedAt ?? null);
              const credCount = t?.activeCredentialsCount ?? 0;
              const headline =
                verified
                  ? [shortTitle, insuredUntil ? `Insured to ${insuredUntil}` : null].filter(Boolean).join(" · ") ||
                    "Verification in progress"
                  : "Verification pending";
              const sub = verified
                ? `${credCount} active ${credCount === 1 ? "qualification" : "qualifications"}${lastChecked ? ` · Last checked ${lastChecked}` : ""}`
                : "Identity, insurance and qualifications not yet confirmed";
              return (
                <div className="absolute -bottom-5 left-5 right-5 hidden rounded-[16px] border border-reps-border bg-reps-panel/95 p-4 shadow-[var(--reps-shadow-card)] backdrop-blur sm:left-6 sm:right-auto sm:block sm:max-w-[280px]">
                  <div
                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${verified ? "text-reps-green" : "text-reps-muted"}`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {verified ? "Verified by REPS" : "Unverified"}
                  </div>
                  <div className="mt-2 text-[13.5px] font-semibold text-reps-text">{headline}</div>
                  <div className="mt-1 text-[12px] text-reps-muted">{sub}</div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust strip                                                        */
/* ------------------------------------------------------------------ */

function TrustStrip({ coach }: { coach: Coach }) {
  const insExpiry = coach.trust?.insuranceExpiry ?? null;
  let insuranceValue = coach.insuranceUntil;
  let insuranceLabel = "Insurance valid";
  if (coach.trust) {
    if (insExpiry) {
      const d = new Date(insExpiry);
      if (!isNaN(d.getTime())) {
        insuranceValue = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        insuranceLabel = d.getTime() < Date.now() ? "Insurance expired" : "Insurance valid";
      }
    } else {
      insuranceValue = "Not on file";
      insuranceLabel = "Insurance";
    }
  }
  const items = [
    { label: "Years coaching", value: coach.years <= 1 ? `${coach.years}` : `${coach.years}+`, icon: Calendar },
    { label: "Clients trained", value: coach.clients, icon: Users },
    { label: "Verified since", value: coach.verifiedSince, icon: ShieldCheck },
    { label: insuranceLabel, value: insuranceValue, icon: BadgeCheck },
  ];

  return (
    <section className="bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 pb-2 pt-10 lg:px-10 lg:pt-12">
        <div className="grid grid-cols-2 gap-3 rounded-[18px] border border-reps-border bg-reps-midnight p-4 sm:grid-cols-4 lg:p-5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                  style={{
                    backgroundColor:
                      "color-mix(in oklab, var(--accent-color) 18%, transparent)",
                    color: "var(--accent-color)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-display text-[18px] font-bold leading-none text-reps-text">
                    {item.value}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-reps-muted">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Services — 3 tier cards                                            */
/* ------------------------------------------------------------------ */

function ServicesSection({
  coach,
  slug,
  enquireHref,
}: {
  coach: Coach;
  slug: string;
  enquireHref: "/c/$slug/enquire";
}) {
  return (
    <section id="services" className="scroll-mt-28 bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-24">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
              Coaching plans
            </span>
            <h2 className="mt-2 font-display text-[34px] font-bold leading-tight text-reps-text lg:text-[44px]">
              Pick how we work together
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-reps-text-soft">
              Same coaching, same programming, same standards. The format changes — the work doesn't.
            </p>
          </div>
          <div className="text-[13px] text-reps-muted">
            Every plan includes nutrition rails, progress tracking and direct messaging.
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {coach.tiers.map((tier) => (
            <TierCard key={tier.slug} tier={tier} slug={slug} enquireHref={enquireHref} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TierCard({
  tier,
  slug,
  enquireHref,
}: {
  tier: Tier;
  slug: string;
  enquireHref: "/c/$slug/enquire";
}) {
  const isHighlight = !!tier.highlight;
  return (
    <article
      className={[
        "relative flex flex-col rounded-[18px] border p-6 lg:p-7",
        isHighlight
          ? "border-transparent bg-reps-panel"
          : "border-reps-border bg-reps-midnight",
      ].join("")}
      style={
        isHighlight
          ? {
              borderColor: "color-mix(in oklab, var(--accent-color) 55%, transparent)",
              boxShadow:
                "0 0 0 1px color-mix(in oklab, var(--accent-color) 22%, transparent), 0 24px 60px -20px color-mix(in oklab, var(--accent-color) 30%, transparent)",
            }
          : undefined
      }
    >
      {isHighlight && (
        <span
          className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: "var(--accent-color)" }}
        >
          <Sparkles className="h-3 w-3" />
          {tier.eyebrow}
        </span>
      )}
      {!isHighlight && (
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-reps-muted">
          {tier.eyebrow}
        </span>
      )}

      <h3
        className={[
          "font-display text-[24px] font-bold text-reps-text",
          isHighlight ? "mt-3" : "mt-2",
        ].join("")}
      >
        {tier.name}
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-reps-muted">{tier.blurb}</p>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="font-display text-[34px] font-bold text-reps-text">{tier.price}</span>
        <span className="text-[13px] text-reps-muted">{tier.unit}</span>
      </div>

      <Separator className="my-5 bg-reps-border" />

      <ul className="flex flex-col gap-2.5">
        {tier.includes.map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-[14px] text-reps-text-soft">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: "var(--accent-color)" }}
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7">
        <Link
          to={enquireHref}
          params={{ slug }}
          search={{ service: tier.slug } as never}
          className={[
            "inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] px-5 text-[13.5px] font-semibold transition-opacity hover:opacity-90",
            isHighlight ? "text-white" : "border border-reps-border bg-reps-ink text-reps-text hover:bg-reps-panel-soft",
          ].join("")}
          style={isHighlight ? { backgroundColor: "var(--accent-color)" } : undefined}
        >
          {tier.ctaLabel || (isHighlight ? `Start with ${tier.name}` : `Enquire about ${tier.name}`)}
          <ArrowRight className="h-4 w-4" />
        </Link>

      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Method                                                             */
/* ------------------------------------------------------------------ */

function MethodSection({ coach }: { coach: Coach }) {
  return (
    <section id="method" className="scroll-mt-28 bg-reps-midnight">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-14">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
              How I coach
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-reps-text lg:text-[40px]">
              {coach.method.name}
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-reps-text-soft">
              {coach.method.intro ??
                "A three-phase system I've refined over 100+ clients. Same shape every time, written from scratch for every person."}
            </p>
          </div>
          <ol className="grid gap-4">
            {coach.method.pillars.map((p, i) => (
              <li
                key={p.title}
                className="grid grid-cols-[auto_1fr] items-start gap-5 rounded-[16px] border border-reps-border bg-reps-ink p-5"
              >
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] font-display text-[15px] font-bold"
                  style={{
                    backgroundColor:
                      "color-mix(in oklab, var(--accent-color) 18%, transparent)",
                    color: "var(--accent-color)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="font-display text-[18px] font-bold text-reps-text">
                    {p.title}
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-reps-text-soft">
                    {p.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* About                                                              */
/* ------------------------------------------------------------------ */

function AboutSection({ coach }: { coach: Coach }) {
  return (
    <section id="about" className="scroll-mt-28 bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start lg:gap-14">
          <div className="overflow-hidden rounded-[22px] bg-reps-panel-soft">
            <img
              src={coach.aboutImage}
              alt={`About ${coach.firstName}`}
              width={1080}
              height={1350}
              className="aspect-[4/5] h-full w-full object-cover"
            />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
              About {coach.firstName}
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-reps-text lg:text-[40px]">
              I take 20 clients. I write 20 programmes.
            </h2>
            <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-reps-text-soft">
              {coach.bio.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <div className="mt-7">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
                Specialisms
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {coach.specialisms.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="rounded-full border-reps-border bg-reps-midnight px-3 py-1 text-[12px] font-medium text-reps-text-soft"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Venues                                                             */
/* ------------------------------------------------------------------ */

type CoachVenue = Coach["venues"][number];

function venueIcon(kind: CoachVenue["kind"]) {
  if (kind === "home_studio") return Home;
  if (kind === "mobile") return RouteIcon;
  return MapPin;
}

function venueSubtitle(v: CoachVenue) {
  if (v.kind === "home_studio") return "Private space · address on enquiry";
  if (v.kind === "mobile") return "I travel to your home or preferred spot";
  return v.address || v.city;
}

function VenueCard({ v }: { v: CoachVenue }) {
  const Icon = venueIcon(v.kind);
  const href =
    v.kind === "gym" && v.googlePlaceId
      ? `https://www.google.com/maps/place/?q=place_id:${v.googlePlaceId}`
      : null;

  const body = (
    <>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold text-reps-text">
          {v.name}
          {href ? (
            <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 -translate-y-0.5 text-reps-muted transition-colors group-hover:text-reps-orange" />
          ) : null}
        </div>
        <div className="mt-0.5 truncate text-[12px] text-reps-muted">
          {venueSubtitle(v)}
        </div>
      </div>
      <Icon className="h-4 w-4 shrink-0 text-reps-orange" />
    </>
  );

  const shared =
    "group flex items-center justify-between gap-3 rounded-[16px] border border-reps-border bg-reps-ink px-4 py-3";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${v.name} on Google Maps`}
        className={`${shared} transition-colors hover:border-reps-orange-border`}
      >
        {body}
      </a>
    );
  }
  return <div className={shared}>{body}</div>;
}

function VenuesSection({ coach }: { coach: Coach }) {
  const isOnline = coach.modes.includes("Online");
  const isInPerson = coach.modes.includes("In-person");
  const hasVenues = isInPerson && coach.venues.length > 0;

  // Cities excluding the "Online (worldwide)" chip — that's implied by mode.
  const placeCities = coach.cities.filter((c) => c !== "Online (worldwide)");

  // Nothing meaningful to show
  if (!hasVenues && placeCities.length === 0 && !isOnline) return null;

  // Online-only (or in-person with no venues added): single full-width column
  if (!hasVenues) {
    const eyebrow = isOnline && !isInPerson ? "How we work" : "Where I train";
    const heading =
      isOnline && !isInPerson
        ? "Fully online coaching"
        : placeCities.length
          ? "Coaching reach"
          : "Where I train";
    const lede =
      isOnline && !isInPerson
        ? placeCities.length
          ? `Remote programmes and check-ins from anywhere in the world — with clients in ${formatList(placeCities)}.`
          : "Remote programmes and check-ins — work with me from anywhere in the world."
        : placeCities.length
          ? `Covering ${formatList(placeCities)}.`
          : "";

    return (
      <section className="bg-reps-midnight">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
              {eyebrow}
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-reps-text lg:text-[34px]">
              {heading}
            </h2>
            {(placeCities.length > 0 || isOnline) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {isOnline && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-border bg-reps-ink px-3 py-1.5 text-[13px] font-medium text-reps-text-soft">
                    <Globe className="h-3.5 w-3.5 text-reps-orange" />
                    Online (worldwide)
                  </span>
                )}
                {placeCities.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full border border-reps-border bg-reps-ink px-3 py-1.5 text-[13px] font-medium text-reps-text-soft"
                  >
                    <MapPin className="h-3.5 w-3.5 text-reps-orange" />
                    {c}
                  </span>
                ))}
              </div>
            )}
            {lede && (
              <p className="mt-6 text-[14px] leading-relaxed text-reps-muted">{lede}</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  // In-person only (no cities, no online): single full-width venues column
  if (!isOnline && placeCities.length === 0) {
    return (
      <section className="bg-reps-midnight">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
              Where I train
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-reps-text lg:text-[34px]">
              In-person venues
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {coach.venues.map((v) => (
                <li key={v.name}>
                  <VenueCard v={v} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  // Both: original 50/50 layout with derived lede
  const lede = isOnline
    ? placeCities.length
      ? `Train with me in person at the venues above, or work together fully remote from anywhere in the world — with clients in ${formatList(placeCities)}.`
      : "Train with me in person at the venues above, or work together fully remote from anywhere in the world."
    : placeCities.length
      ? `Train with me in person at the venues above — covering ${formatList(placeCities)}.`
      : "";

  return (
    <section className="bg-reps-midnight">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
              Where I train
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-reps-text lg:text-[34px]">
              In-person venues
            </h2>
            <ul className="mt-5 space-y-3">
              {coach.venues.map((v) => (
                <li key={v.name}>
                  <VenueCard v={v} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
              Cities & online
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-reps-text lg:text-[34px]">
              Coaching reach
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {placeCities.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full border border-reps-border bg-reps-ink px-3 py-1.5 text-[13px] font-medium text-reps-text-soft"
                >
                  <MapPin className="h-3.5 w-3.5 text-reps-orange" />
                  {c}
                </span>
              ))}
              {isOnline && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-border bg-reps-ink px-3 py-1.5 text-[13px] font-medium text-reps-text-soft">
                  <Globe className="h-3.5 w-3.5 text-reps-orange" />
                  Online (worldwide)
                </span>
              )}
            </div>
            {lede && (
              <p className="mt-6 text-[14px] leading-relaxed text-reps-muted">{lede}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/* ------------------------------------------------------------------ */
/* Transformations — proof cards with metric + quote                  */
/* ------------------------------------------------------------------ */

function TransformationsSection({ coach }: { coach: Coach }) {
  return (
    <section id="results" className="scroll-mt-28 bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
            Client results
          </span>
          <h2 className="mt-2 font-display text-[34px] font-bold leading-tight text-reps-text lg:text-[44px]">
            Real numbers from real people
          </h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-reps-text-soft">
            {coach.clientResultsIntro ??
              "Every metric below is from a current or past client. Names and photos used with permission."}
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {coach.transformations.map((t) => (
            <article
              key={t.client}
              className="group overflow-hidden rounded-[18px] border border-reps-border bg-reps-midnight"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-reps-panel-soft">
                <img
                  src={t.image}
                  alt={`${t.client} client result`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 50%, rgba(11,13,16,0.85) 100%)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: "var(--accent-color)" }}
                  >
                    Result
                  </div>
                  <div className="mt-2 font-display text-[18px] font-bold leading-tight text-white">
                    {t.metric}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <Quote className="h-5 w-5" style={{ color: "var(--accent-color)" }} />
                <p className="mt-2 text-[14.5px] leading-relaxed text-reps-text-soft">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 border-t border-reps-border pt-3">
                  <div className="text-[13.5px] font-semibold text-reps-text">{t.client}</div>
                  {t.meta ? <div className="text-[12px] text-reps-muted">{t.meta}</div> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Testimonials — initials only, no face duplication                  */
/* ------------------------------------------------------------------ */

function TestimonialsSection({ coach }: { coach: Coach }) {
  return (
    <section id="reviews" className="scroll-mt-28 bg-reps-midnight">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-24">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
              Reviews
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-reps-text lg:text-[40px]">
              In their words
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[13.5px] text-reps-text-soft">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-reps-orange text-reps-orange" />
              ))}
            </div>
            <span className="font-semibold text-reps-text">
              {coach.rating.toFixed(1)}
            </span>
            <span className="text-reps-muted">
              from {coach.reviews} verified reviews
            </span>
          </div>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {coach.testimonials.map((t) => (
            <article
              key={t.name}
              className="flex flex-col rounded-[18px] border border-reps-border bg-reps-ink p-6"
            >
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
                ))}
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-reps-text-soft">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span
                  className="inline-flex size-10 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{
                    backgroundColor:
                      "color-mix(in oklab, var(--accent-color) 18%, transparent)",
                    color: "var(--accent-color)",
                  }}
                >
                  {t.initials}
                </span>
                <div>
                  <div className="text-[13.5px] font-semibold text-reps-text">{t.name}</div>
                  <div className="text-[12px] text-reps-muted">{t.role}</div>
                </div>
                <BadgeCheck
                  className="ml-auto h-4 w-4 text-reps-green"
                  aria-label="Verified review"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Qualifications                                                     */
/* ------------------------------------------------------------------ */

function QualificationsSection({ coach }: { coach: Coach }) {
  return (
    <section className="bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-14">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
              Credentials
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-reps-text lg:text-[40px]">
              Verified by REPS
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-reps-text-soft">
              Every qualification, insurance certificate and first-aid renewal is independently verified by REPS and kept current.
            </p>
            <Link
              to="/standards"
              className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-reps-text hover:underline"
            >
              How REPS verifies professionals
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {(() => {
              const live = coach.trust?.items ?? [];
              const rows = live.map((it) => ({
                key: `${it.kind}-${it.title}-${it.id ?? ""}`,
                title: it.title,
                issuer: it.issuer,
                id: it.id ?? "—",
                issued: it.dateLabel ?? "",
              }));
              if (rows.length === 0) {
                return (
                  <li className="flex flex-col rounded-[16px] border border-reps-border bg-reps-midnight p-4 text-[13px] text-reps-muted sm:col-span-2">
                    No verified credentials uploaded yet. This professional hasn't submitted qualifications, insurance or first-aid documents for verification.
                  </li>
                );
              }

              return rows.map((q) => (
                <li
                  key={q.key}
                  className="flex flex-col rounded-[16px] border border-reps-border bg-reps-midnight p-4"
                >
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-reps-green" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-reps-green">
                      Verified
                    </span>
                  </div>
                  <div className="mt-2 text-[14.5px] font-semibold text-reps-text">
                    {q.title}
                  </div>
                  <div className="mt-1 text-[12px] text-reps-muted">{q.issuer}</div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-reps-muted">
                    {q.id && q.id !== "—" ? <span>ID: {q.id}</span> : <span />}
                    <span>{q.issued}</span>
                  </div>
                </li>
              ));
            })()}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                */
/* ------------------------------------------------------------------ */

function FaqSection({ coach }: { coach: Coach }) {
  return (
    <section id="faq" className="scroll-mt-28 bg-reps-midnight">
      <div className="mx-auto max-w-[920px] px-6 py-16 lg:px-10 lg:py-24">
        <div className="text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
            FAQ
          </span>
          <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-reps-text lg:text-[40px]">
            Common questions
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-8 w-full">
          {coach.faqs.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`item-${i}`}
              className="border-reps-border"
            >
              <AccordionTrigger className="text-left text-[15.5px] font-semibold text-reps-text hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[14.5px] leading-relaxed text-reps-text-soft">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Contact                                                            */
/* ------------------------------------------------------------------ */

function ContactSection({
  coach,
  slug,
  enquireHref,
}: {
  coach: Coach;
  slug: string;
  enquireHref: "/c/$slug/enquire";
}) {
  return (
    <section id="contact" className="scroll-mt-28 bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-24">
        <div
          className="relative overflow-hidden rounded-[24px] border bg-reps-midnight p-8 lg:p-14"
          style={{
            borderColor: "color-mix(in oklab, var(--accent-color) 35%, transparent)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(60% 100% at 100% 0%, color-mix(in oklab, var(--accent-color) 18%, transparent), transparent 70%)",
            }}
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-center lg:gap-14">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
                Get in touch
              </span>
              <h2 className="mt-2 font-display text-[34px] font-bold leading-tight text-reps-text lg:text-[44px]">
                Ready when you are
              </h2>
              <p className="mt-4 max-w-[520px] text-[15.5px] leading-relaxed text-reps-text-soft">
                Send an enquiry through REPS and I'll reply within one working day with a clear quote, available times, and next steps. No middleman, no booking fees.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to={enquireHref}
                  params={{ slug }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] px-7 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--accent-color)" }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Send enquiry
                </Link>
                <span className="text-[12.5px] text-reps-muted">
                  Replies within 1 working day
                </span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
                Follow my work
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {coach.socials.map((s) => (
                  <a
                    key={s.kind}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-reps-border bg-reps-ink text-reps-text-soft transition-colors hover:border-reps-border-soft hover:text-reps-text"
                  >
                    <SocialIcon kind={s.kind} />
                  </a>
                ))}
              </div>
              <Link
                to="/auth"
                className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-reps-muted transition-colors hover:text-reps-text"
              >
                Existing client? Log in to your portal
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialIcon({ kind }: { kind: Coach["socials"][number]["kind"] }) {
  const className = "h-4 w-4";
  switch (kind) {
    case "instagram":
      return <Instagram className={className} />;
    case "youtube":
      return <Youtube className={className} />;
    case "tiktok":
      return <TikTokGlyph className={className} />;
    case "x":
      return <XGlyph className={className} />;
    case "website":
      return <Globe className={className} />;
    case "email":
      return <Mail className={className} />;
    default:
      return <Globe className={className} />;
  }
}

function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.5 3a5.5 5.5 0 0 0 4.5 4.5v3a8.5 8.5 0 0 1-4.5-1.4v6.1a6.1 6.1 0 1 1-6.1-6.1c.3 0 .7 0 1 .1v3.1a3 3 0 1 0 2 2.9V3h3.1z" />
    </svg>
  );
}

function XGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.84l-4.36-5.94L5.7 22H3l7-8L2 2h6.94l3.94 5.43L18.244 2zm-2.39 18h1.65L8.23 4H6.5l9.354 16z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Footer + sticky mobile bar                                         */
/* ------------------------------------------------------------------ */

function FooterMark() {
  return (
    <footer className="border-t border-reps-border bg-reps-ink pb-[88px] lg:pb-0">
      <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-3 px-6 py-6 text-[12.5px] text-reps-muted sm:flex-row lg:px-10">
        <Link to="/" className="inline-flex items-center gap-2 text-reps-text-soft">
          <RepsWordmark className="h-3.5 w-auto text-reps-text-soft" />
          <span>·</span>
          <span className="font-medium">Powered by REPS</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/standards" className="hover:text-reps-text">
            How we verify
          </Link>
          <Link to="/privacy" className="hover:text-reps-text">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-reps-text">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

function StickyMobileBar({
  coach,
  slug,
  enquireHref,
}: {
  coach: Coach;
  slug: string;
  enquireHref: "/c/$slug/enquire";
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-reps-border bg-reps-ink/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-[640px] items-center gap-3">
        <img
          src={coach.heroImage}
          alt=""
          className="size-10 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-reps-text">
            {coach.name}
          </div>
          <div className="truncate text-[11px] text-reps-muted">{coach.role}</div>
        </div>
        <Link
          to={enquireHref}
          params={{ slug }}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[10px] px-4 text-[13px] font-semibold text-white"
          style={{ backgroundColor: "var(--accent-color)" }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Enquire
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Unverified gate                                                    */
/* ------------------------------------------------------------------ */

function UnverifiedGate({ status }: { status: Extract<ProSlugStatus, { exists: true }> }) {
  const first = status.firstName ?? "This member";
  return (
    <div className="flex min-h-screen flex-col bg-reps-ink text-reps-text">
      <SiteBanner />
      <header className="border-b border-reps-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="inline-flex items-center gap-2">
            <RepsWordmark className="h-5 text-white" />
          </Link>
          <Link
            to="/find-a-professional"
            className="rounded-[10px] border border-reps-border bg-white/5 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-reps-panel-soft"
          >
            Browse verified members
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl rounded-[22px] border border-reps-border bg-reps-panel/40 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h1 className="mt-6 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
            {first} isn't verified on REPs yet
          </h1>

          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
            Members only appear publicly once REPs has independently verified their ID,
            insurance and qualifications. Until then, this page isn't available.
          </p>

          <div className="mt-6 rounded-[14px] border border-reps-border bg-reps-ink/60 px-5 py-4 text-left text-[13px] text-white/65">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              What REPs verifies
            </div>
            <ul className="mt-3 space-y-1.5">
              <li>· Government-issued photo ID</li>
              <li>· In-force public liability insurance</li>
              <li>· Recognised qualifications (Ofqual / awarding body)</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/find-a-professional"
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Find a verified professional
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-reps-border bg-white/5 px-5 text-[14px] font-medium text-white/85 hover:bg-reps-panel-soft"
            >
              How verification works
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

