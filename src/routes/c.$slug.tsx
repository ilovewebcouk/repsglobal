import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getShopFrontBySlug, type ServiceDTO, type ShopFrontDTO } from "@/lib/shop-front/shop-front.functions";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  Check,
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Quote,
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
};

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
  method: { name: string; pillars: { title: string; desc: string }[] };
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
  venues: { name: string; city: string }[];
  cities: string[];
  transformations: Transformation[];
  testimonials: Testimonial[];
  qualifications: { title: string; issuer: string; id: string; issued: string }[];
  faqs: { q: string; a: string }[];
  socials: {
    kind: "instagram" | "tiktok" | "youtube" | "x" | "website" | "email";
    href: string;
    label: string;
  }[];
};

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
      "I'm a REPS Verified Personal Trainer with eight years coaching clients from total beginners to competitive athletes. Most come to me stuck — stalled progress, no time, fed up of training without a clear plan. We fix that in the first two weeks.",
      "I don't take on every enquiry. I work with around 20 people at a time, in person and online, so every client gets a programme written for them — not a template with their name on the front.",
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
          "Fully bespoke programme in-app",
          "Weekly written check-in & adjustments",
          "Unlimited messaging (Mon–Fri)",
          "Video form reviews",
          "Quarterly strategy call",
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
          "2× in-person sessions per month",
          "Movement screen & progress reviews",
          "Body composition tracking",
          "Priority response time",
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
          "60-minute sessions at Third Space or BXR",
          "Bespoke programme outside sessions",
          "Nutrition & recovery rails",
          "Direct messaging access",
          "Block discount available (10+ sessions)",
        ],
      },
    ],
    venues: [
      { name: "Third Space Soho", city: "London" },
      { name: "BXR White City", city: "London" },
      { name: "Equinox St James's", city: "London" },
      { name: "Home / private studio", city: "London" },
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

export const Route = createFileRoute("/c/$slug")({
  head: ({ params }) => {
    const coach = COACHES[params.slug] ?? COACHES["james-wilson"];
    const title = `${coach.name} — ${coach.role} | REPS`;
    const description = `${coach.promise} ${coach.subhead}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex,nofollow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CoachShopFrontPage,
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

function CoachShopFrontPage() {
  const { slug } = Route.useParams();
  const coach = COACHES[slug] ?? COACHES["james-wilson"];
  const accent = `var(--coach-accent-${coach.accent})`;

  const accentStyle = {
    ["--accent-color" as string]: accent,
  } as React.CSSProperties;

  const enquireHref = "/pro/$slug/enquire" as const;

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text" style={accentStyle}>
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
  enquireHref: "/pro/$slug/enquire";
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
              <Badge
                variant="secondary"
                className="rounded-full bg-reps-green/15 text-reps-green ring-1 ring-reps-green/30"
              >
                <BadgeCheck className="h-3 w-3" />
                REPS Verified · Insured
              </Badge>
              <span className="inline-flex items-center gap-1.5 text-[13px] text-reps-muted">
                <MapPin className="h-3.5 w-3.5" />
                {coach.city}, {coach.region}
              </span>
            </div>

            <div className="mt-6 text-[12px] font-semibold uppercase tracking-[0.22em] text-reps-muted">
              {coach.name} — {coach.role}
            </div>

            <h1 className="mt-3 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.015em] text-reps-text lg:text-[64px]">
              {coach.promise}
            </h1>

            <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-reps-text-soft">
              {coach.subhead}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-reps-orange text-reps-orange" />
                <span className="font-semibold text-reps-text">
                  {coach.rating.toFixed(1)}
                </span>
                <span className="text-reps-muted">({coach.reviews} reviews)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-reps-muted">
                <Users className="h-3.5 w-3.5" /> In-person · London
              </span>
              <span className="inline-flex items-center gap-1.5 text-reps-muted">
                <Globe className="h-3.5 w-3.5" /> Online · worldwide
              </span>
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

            <div className="mt-8 flex items-center gap-3 text-[12.5px] text-reps-muted">
              <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--accent-color)" }} />
              <span>
                Currently coaching <strong className="font-semibold text-reps-text-soft">3 of 20</strong> available spaces
              </span>
            </div>
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
            <div className="absolute -bottom-5 left-5 right-5 hidden rounded-[16px] border border-reps-border bg-reps-panel/95 p-4 shadow-[var(--reps-shadow-card)] backdrop-blur sm:left-6 sm:right-auto sm:block sm:max-w-[280px]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-reps-green">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified by REPS
              </div>
              <div className="mt-2 text-[13.5px] font-semibold text-reps-text">
                Level 3 PT · Insured to Dec 2026
              </div>
              <div className="mt-1 text-[12px] text-reps-muted">
                4 active credentials · Last checked Jun 2026
              </div>
            </div>
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
  const items = [
    { label: "Years coaching", value: `${coach.years}+`, icon: Calendar },
    { label: "Clients trained", value: coach.clients, icon: Users },
    { label: "Verified since", value: coach.verifiedSince, icon: ShieldCheck },
    { label: "Insurance valid", value: coach.insuranceUntil, icon: BadgeCheck },
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
  enquireHref: "/pro/$slug/enquire";
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
  enquireHref: "/pro/$slug/enquire";
}) {
  const isHighlight = !!tier.highlight;
  return (
    <article
      className={[
        "relative flex flex-col rounded-[18px] border p-6 lg:p-7",
        isHighlight
          ? "border-transparent bg-reps-panel"
          : "border-reps-border bg-reps-midnight",
      ].join(" ")}
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
        ].join(" ")}
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
          ].join(" ")}
          style={isHighlight ? { backgroundColor: "var(--accent-color)" } : undefined}
        >
          {isHighlight ? "Start with Hybrid" : `Enquire about ${tier.name}`}
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
              A three-phase system I've refined over 100+ clients. Same shape every time, written from scratch for every person.
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

function VenuesSection({ coach }: { coach: Coach }) {
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
                <li
                  key={v.name}
                  className="flex items-center justify-between rounded-[16px] border border-reps-border bg-reps-ink px-4 py-3"
                >
                  <div>
                    <div className="text-[15px] font-semibold text-reps-text">{v.name}</div>
                    <div className="text-[12px] text-reps-muted">{v.city}</div>
                  </div>
                  <MapPin className="h-4 w-4 text-reps-muted" />
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
              {coach.cities.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full border border-reps-border bg-reps-ink px-3 py-1.5 text-[13px] font-medium text-reps-text-soft"
                >
                  {c === "Online (worldwide)" ? (
                    <Globe className="h-3.5 w-3.5" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" />
                  )}
                  {c}
                </span>
              ))}
            </div>
            <p className="mt-6 text-[14px] leading-relaxed text-reps-muted">
              Train with me in person across central London, or work together fully remote from anywhere in the world.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
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
            Every metric below is from a current or past client. Names and photos used with permission.
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
                  <div className="text-[12px] text-reps-muted">{t.meta}</div>
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
            {coach.qualifications.map((q) => (
              <li
                key={q.title}
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
                  <span>ID: {q.id}</span>
                  <span>{q.issued}</span>
                </div>
              </li>
            ))}
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
  enquireHref: "/pro/$slug/enquire";
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
    <footer className="border-t border-reps-border bg-reps-ink">
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
  enquireHref: "/pro/$slug/enquire";
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
