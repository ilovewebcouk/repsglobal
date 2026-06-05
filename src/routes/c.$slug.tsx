import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  ChevronDown,
  Globe,
  Instagram,
  Laptop,
  Mail,
  MapPin,
  MessageCircle,
  Quote,
  ShieldCheck,
  Star,
  Users,
  Youtube,
} from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RepsWordmark } from "@/components/brand/RepsWordmark";

import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import heroCoaching from "@/assets/hero-coaching-moment";

/* ------------------------------------------------------------------ */
/* Mock data (Phase 1 — wired to profile in Phase 2)                  */
/* ------------------------------------------------------------------ */

type AccentKey = "orange" | "teal" | "indigo" | "plum" | "forest" | "slate";

type Coach = {
  slug: string;
  name: string;
  firstName: string;
  role: string;
  city: string;
  region: string;
  tagline: string;
  bio: string[];
  heroImage: string;
  portraitImage: string;
  rating: number;
  reviews: number;
  years: number;
  clients: string;
  verifiedSince: string;
  insuranceUntil: string;
  accent: AccentKey;
  modes: ("In-person" | "Online")[];
  specialisms: string[];
  services: { slug: string; title: string; desc: string; price: string; unit: string; image: string }[];
  venues: { name: string; city: string }[];
  cities: string[];
  transformations: { image: string; caption: string }[];
  testimonials: { name: string; role: string; quote: string; rating: number; avatar: string }[];
  qualifications: { title: string; issuer: string; id: string; issued: string }[];
  faqs: { q: string; a: string }[];
  socials: { kind: "instagram" | "tiktok" | "youtube" | "x" | "website" | "email"; href: string; label: string }[];
};

const COACHES: Record<string, Coach> = {
  "james-wilson": {
    slug: "james-wilson",
    name: "James Wilson",
    firstName: "James",
    role: "Personal Trainer & Strength Coach",
    city: "London",
    region: "Greater London",
    tagline:
      "Building strength, confidence and lasting results for busy professionals — in person across London and online worldwide.",
    bio: [
      "I'm a REPs Verified Personal Trainer with 8+ years coaching clients from total beginners to competitive athletes. My method is simple: a plan built around your life, not a template, and the accountability to actually follow through.",
      "Most of my clients come to me stuck — stalled progress, no time, fed up of training without a clear plan. We fix that in the first two weeks.",
    ],
    heroImage: proJames,
    portraitImage: proJames,
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
    services: [
      {
        slug: "1to1-pt",
        title: "1-to-1 Personal Training",
        desc: "In-person sessions in central London. Programming, coaching and accountability.",
        price: "From £75",
        unit: "per session",
        image: heroCoaching,
      },
      {
        slug: "online-coaching",
        title: "Online Coaching",
        desc: "Custom programme, weekly check-ins, video form reviews, unlimited messaging.",
        price: "From £160",
        unit: "per month",
        image: proDaniel,
      },
      {
        slug: "kickstart",
        title: "8-Week Kickstart",
        desc: "Build the base. Strength, structure and habits to actually stick with training.",
        price: "£480",
        unit: "fixed price",
        image: proSophie,
      },
      {
        slug: "nutrition",
        title: "Nutrition Blueprint",
        desc: "One-off personalised nutrition plan to support your training and recovery.",
        price: "From £60",
        unit: "one-off",
        image: proLaura,
      },
      {
        slug: "small-group",
        title: "Small Group Sessions",
        desc: "Train with 2–4 friends. Same coaching, lower price per head.",
        price: "From £40",
        unit: "per person",
        image: heroCoaching,
      },
      {
        slug: "hybrid",
        title: "Hybrid Coaching",
        desc: "Two in-person sessions a month plus full online programming.",
        price: "From £240",
        unit: "per month",
        image: proJames,
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
      { image: proSophie, caption: "Sophie — 12 weeks, down 8kg, first unassisted pull-up." },
      { image: proDaniel, caption: "Daniel — 16 weeks, +22kg deadlift, back to running pain-free." },
      { image: proLaura, caption: "Laura — 6 months, postnatal return to strength, hybrid coaching." },
    ],
    testimonials: [
      {
        name: "Sophie L.",
        role: "Marketing Director",
        quote:
          "James has completely changed the way I train. The programmes are challenging but achievable and I've never felt stronger.",
        rating: 5,
        avatar: proSophie,
      },
      {
        name: "Michael R.",
        role: "Founder",
        quote:
          "Great coach and even better person. He actually takes the time to understand your goals and builds a plan that works around real life.",
        rating: 5,
        avatar: proDaniel,
      },
      {
        name: "Emily T.",
        role: "Doctor",
        quote:
          "More progress in 3 months with James than the previous year on my own. The accountability is what made it stick.",
        rating: 5,
        avatar: proLaura,
      },
    ],
    qualifications: [
      { title: "REPs Level 3 Personal Trainer", issuer: "Register of Exercise Professionals", id: "REP1234567", issued: "May 2023" },
      { title: "Level 3 Diploma in Personal Training", issuer: "YMCA Awards", id: "600/1234/8", issued: "May 2021" },
      { title: "Professional Indemnity Insurance", issuer: "Insure4Sport", id: "PI-883201", issued: "Active until Dec 2026" },
      { title: "First Aid & CPR", issuer: "St John Ambulance", id: "SJA-44218", issued: "Renewed Jan 2026" },
    ],
    faqs: [
      {
        q: "Where do in-person sessions take place?",
        a: "Mostly Third Space Soho and BXR White City. I can also coach at your home gym or a private studio in central London on request.",
      },
      {
        q: "How does online coaching work?",
        a: "You get a fully personalised programme in an app, weekly written check-ins, video form reviews, and unlimited messaging. Most online clients see real changes inside the first month.",
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
        a: "Yes — either as part of online coaching or as a one-off Nutrition Blueprint. I work to evidence-based principles, not fad diets.",
      },
    ],
    socials: [
      { kind: "instagram", href: "#", label: "@jameswilson.coach" },
      { kind: "tiktok", href: "#", label: "@jameswilson.coach" },
      { kind: "youtube", href: "#", label: "James Wilson Coaching" },
      { kind: "website", href: "#", label: "jameswilsoncoach.com" },
      { kind: "email", href: "mailto:hello@example.com", label: "hello@jameswilsoncoach.com" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Route                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/c/$slug")({
  head: ({ params }) => {
    const coach = COACHES[params.slug] ?? COACHES["james-wilson"];
    const title = `${coach.name} — ${coach.role} | REPs`;
    const description = coach.tagline;
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

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

function CoachShopFrontPage() {
  const { slug } = Route.useParams();
  const coach = COACHES[slug] ?? COACHES["james-wilson"];
  const accent = `var(--coach-accent-${coach.accent})`;

  // Accent CSS custom properties scoped to the page surface only.
  const accentStyle = {
    ["--accent-color" as string]: accent,
  } as React.CSSProperties;

  const enquireHref = "/pro/$slug/enquire" as const;

  return (
    <div className="min-h-screen bg-reps-ivory" style={accentStyle}>
      {/* ============ Slim REPs chrome bar ============ */}
      <ChromeBar coach={coach} />

      {/* ============ HERO ============ */}
      <HeroSection coach={coach} enquireHref={enquireHref} slug={slug} />

      {/* ============ TRUST STRIP ============ */}
      <TrustStrip coach={coach} />

      {/* ============ SERVICES ============ */}
      <ServicesSection coach={coach} slug={slug} enquireHref={enquireHref} />

      {/* ============ ABOUT ============ */}
      <AboutSection coach={coach} />

      {/* ============ WHERE I TRAIN ============ */}
      <VenuesSection coach={coach} />

      {/* ============ TRANSFORMATIONS ============ */}
      <TransformationsSection coach={coach} />

      {/* ============ TESTIMONIALS ============ */}
      <TestimonialsSection coach={coach} />

      {/* ============ QUALIFICATIONS ============ */}
      <QualificationsSection coach={coach} />

      {/* ============ FAQ ============ */}
      <FaqSection coach={coach} />

      {/* ============ SOCIAL + ENQUIRE ============ */}
      <SocialSection coach={coach} slug={slug} enquireHref={enquireHref} />

      {/* ============ FOOTER MARK ============ */}
      <FooterMark />

      {/* ============ STICKY MOBILE BAR ============ */}
      <StickyMobileBar coach={coach} slug={slug} enquireHref={enquireHref} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                           */
/* ------------------------------------------------------------------ */

function ChromeBar({ coach }: { coach: Coach }) {
  return (
    <header className="sticky top-0 z-30 border-b border-reps-stone/70 bg-reps-warm-white/90 backdrop-blur supports-[backdrop-filter]:bg-reps-warm-white/70">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-4 px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2 text-reps-charcoal">
          <RepsWordmark className="h-4 w-auto text-reps-charcoal" />
          <Separator orientation="vertical" className="h-4 bg-reps-stone" />
          <span className="text-[13px] font-semibold text-reps-charcoal">{coach.name}</span>
        </Link>
        <div className="hidden items-center gap-4 md:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-green/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
            <BadgeCheck className="h-3 w-3" />
            Verified on REPs
          </span>
          <Link
            to="/login"
            className="text-[13px] font-medium text-reps-muted-light transition-colors hover:text-reps-charcoal"
          >
            Client login
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ coach, enquireHref, slug }: { coach: Coach; enquireHref: "/pro/$slug/enquire"; slug: string }) {
  return (
    <section className="bg-reps-warm-white">
      <div className="mx-auto max-w-[1320px] px-6 pb-10 pt-10 lg:px-10 lg:pb-16 lg:pt-14">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12">
          {/* Copy */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full bg-reps-green/15 text-reps-green ring-1 ring-reps-green/30">
                <BadgeCheck className="h-3 w-3" />
                REPs Verified · Insured
              </Badge>
              <span className="inline-flex items-center gap-1.5 text-[13px] text-reps-muted-light">
                <MapPin className="h-3.5 w-3.5" /> {coach.city}, {coach.region}
              </span>
            </div>

            <h1 className="mt-5 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.01em] text-reps-charcoal lg:text-[60px]">
              {coach.name}
            </h1>
            <div className="mt-2 text-[18px] text-reps-muted-light">{coach.role}</div>

            <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-reps-charcoal">
              {coach.tagline}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-reps-orange text-reps-orange" />
                <span className="font-semibold text-reps-charcoal">{coach.rating.toFixed(1)}</span>
                <span className="text-reps-muted-light">({coach.reviews} reviews)</span>
              </span>
              {coach.modes.map((m) => (
                <span key={m} className="inline-flex items-center gap-1.5 text-reps-muted-light">
                  {m === "In-person" ? <Users className="h-3.5 w-3.5" /> : <Laptop className="h-3.5 w-3.5" />}
                  {m}
                </span>
              ))}
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
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-reps-stone bg-reps-warm-white px-6 text-[14px] font-semibold text-reps-charcoal transition-colors hover:bg-reps-ivory"
              >
                See services
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Portrait */}
          <div className="relative overflow-hidden rounded-[24px] bg-reps-stone shadow-[var(--reps-shadow-card)]">
            <img
              src={coach.heroImage}
              alt={`${coach.name} — ${coach.role}`}
              className="aspect-[4/5] h-full w-full object-cover lg:aspect-[4/5]"
              width={920}
              height={1150}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-5 text-white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                Coaching since {new Date().getFullYear() - coach.years}
              </div>
              <div className="mt-1 font-display text-[20px] font-bold leading-tight">
                {coach.clients} clients coached · {coach.years}+ years
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip({ coach }: { coach: Coach }) {
  const items = [
    { label: "Years coaching", value: `${coach.years}+`, icon: Calendar },
    { label: "Clients trained", value: coach.clients, icon: Users },
    { label: "REPs verified since", value: coach.verifiedSince, icon: ShieldCheck },
    { label: "Insurance valid until", value: coach.insuranceUntil, icon: BadgeCheck },
  ];
  return (
    <section className="bg-reps-ivory">
      <div className="mx-auto max-w-[1320px] px-6 py-6 lg:px-10">
        <div className="grid grid-cols-2 gap-3 rounded-[18px] border border-reps-stone bg-reps-warm-white p-4 sm:grid-cols-4 lg:p-5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                  style={{ backgroundColor: "color-mix(in oklab, var(--accent-color) 12%, transparent)", color: "var(--accent-color)" }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-display text-[18px] font-bold leading-none text-reps-charcoal">
                    {item.value}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-reps-muted-light">
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
    <section id="services" className="scroll-mt-20 bg-reps-ivory">
      <div className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10 lg:py-20">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-muted-light">
            Services
          </span>
          <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-reps-charcoal lg:text-[40px]">
            How we can work together
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-reps-muted-light">
            Pick a starting point. Every option includes the same coaching, programming and accountability — the format just changes.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coach.services.map((service) => (
            <article
              key={service.slug}
              className="group flex flex-col overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white transition-shadow hover:shadow-[var(--reps-shadow-card)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-reps-stone">
                <img
                  src={service.image}
                  alt={service.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-[18px] font-bold text-reps-charcoal">{service.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-reps-muted-light">{service.desc}</p>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display text-[20px] font-bold text-reps-charcoal">{service.price}</span>
                  <span className="text-[12px] text-reps-muted-light">{service.unit}</span>
                </div>
                <Link
                  to={enquireHref}
                  params={{ slug }}
                  search={{ service: service.slug } as never}
                  className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--accent-color)" }}
                >
                  Enquire about this
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection({ coach }: { coach: Coach }) {
  return (
    <section id="about" className="scroll-mt-20 bg-reps-warm-white">
      <div className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start lg:gap-14">
          <div className="overflow-hidden rounded-[22px] bg-reps-stone">
            <img
              src={coach.portraitImage}
              alt={`About ${coach.firstName}`}
              className="aspect-[4/5] h-full w-full object-cover"
            />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-muted-light">
              About {coach.firstName}
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-reps-charcoal lg:text-[40px]">
              The coaching philosophy
            </h2>
            <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-reps-charcoal">
              {coach.bio.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <div className="mt-7">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-muted-light">
                Specialisms
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {coach.specialisms.map((s) => (
                  <Badge key={s} variant="outline" className="rounded-full border-reps-stone bg-reps-warm-white px-3 py-1 text-[12px] font-medium text-reps-charcoal">
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

function VenuesSection({ coach }: { coach: Coach }) {
  return (
    <section className="bg-reps-ivory">
      <div className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-muted-light">
              Where I train
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-reps-charcoal lg:text-[34px]">
              In-person venues
            </h2>
            <ul className="mt-5 space-y-3">
              {coach.venues.map((v) => (
                <li
                  key={v.name}
                  className="flex items-center justify-between rounded-[16px] border border-reps-stone bg-reps-warm-white px-4 py-3"
                >
                  <div>
                    <div className="text-[15px] font-semibold text-reps-charcoal">{v.name}</div>
                    <div className="text-[12px] text-reps-muted-light">{v.city}</div>
                  </div>
                  <MapPin className="h-4 w-4 text-reps-muted-light" />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-muted-light">
              Cities & online
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-reps-charcoal lg:text-[34px]">
              Coaching reach
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {coach.cities.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1.5 text-[13px] font-medium text-reps-charcoal"
                >
                  {c === "Online (worldwide)" ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                  {c}
                </span>
              ))}
            </div>
            <p className="mt-6 text-[14px] leading-relaxed text-reps-muted-light">
              Train with me in person across central London, or work together fully remote from anywhere in the world.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TransformationsSection({ coach }: { coach: Coach }) {
  return (
    <section className="bg-reps-warm-white">
      <div className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10 lg:py-20">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-muted-light">
            Client results
          </span>
          <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-reps-charcoal lg:text-[40px]">
            Real changes from real people
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coach.transformations.map((t) => (
            <figure key={t.caption} className="overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white">
              <div className="aspect-[4/5] overflow-hidden bg-reps-stone">
                <img src={t.image} alt={t.caption} className="h-full w-full object-cover" />
              </div>
              <figcaption className="p-4 text-[13.5px] leading-relaxed text-reps-charcoal">
                {t.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ coach }: { coach: Coach }) {
  return (
    <section className="bg-reps-ivory">
      <div className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10 lg:py-20">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-muted-light">
            What clients say
          </span>
          <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-reps-charcoal lg:text-[40px]">
            In their words
          </h2>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {coach.testimonials.map((t) => (
            <article
              key={t.name}
              className="flex flex-col rounded-[18px] border border-reps-stone bg-reps-warm-white p-6"
            >
              <Quote className="h-6 w-6" style={{ color: "var(--accent-color)" }} />
              <p className="mt-3 text-[15px] leading-relaxed text-reps-charcoal">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="size-10 rounded-full object-cover" />
                <div>
                  <div className="text-[13.5px] font-semibold text-reps-charcoal">{t.name}</div>
                  <div className="text-[12px] text-reps-muted-light">{t.role}</div>
                </div>
                <div className="ml-auto flex">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function QualificationsSection({ coach }: { coach: Coach }) {
  return (
    <section className="bg-reps-warm-white">
      <div className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-14">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-muted-light">
              Credentials
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-reps-charcoal lg:text-[40px]">
              Verified by REPs
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-reps-muted-light">
              Every qualification, insurance certificate and first-aid renewal is independently verified by REPs and kept current.
            </p>
            <Link
              to="/standards"
              className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-reps-charcoal hover:underline"
            >
              How REPs verifies professionals
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {coach.qualifications.map((q) => (
              <li
                key={q.title}
                className="flex flex-col rounded-[16px] border border-reps-stone bg-reps-ivory p-4"
              >
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-reps-green" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-reps-green">
                    Verified
                  </span>
                </div>
                <div className="mt-2 text-[14.5px] font-semibold text-reps-charcoal">{q.title}</div>
                <div className="mt-1 text-[12px] text-reps-muted-light">{q.issuer}</div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-reps-muted-light">
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

function FaqSection({ coach }: { coach: Coach }) {
  return (
    <section className="bg-reps-ivory">
      <div className="mx-auto max-w-[920px] px-6 py-14 lg:px-10 lg:py-20">
        <div className="text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-muted-light">
            FAQ
          </span>
          <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-reps-charcoal lg:text-[40px]">
            Common questions
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-8 w-full">
          {coach.faqs.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`item-${i}`}
              className="border-reps-stone"
            >
              <AccordionTrigger className="text-left text-[15.5px] font-semibold text-reps-charcoal hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[14.5px] leading-relaxed text-reps-muted-light">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function SocialSection({
  coach,
  slug,
  enquireHref,
}: {
  coach: Coach;
  slug: string;
  enquireHref: "/pro/$slug/enquire";
}) {
  return (
    <section className="bg-reps-warm-white">
      <div className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10 lg:py-20">
        <div className="grid items-center gap-10 rounded-[24px] border border-reps-stone bg-reps-ivory p-8 lg:grid-cols-[1.4fr_1fr] lg:gap-14 lg:p-12">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-muted-light">
              Get in touch
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-reps-charcoal lg:text-[40px]">
              Ready when you are
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-reps-muted-light">
              Send an enquiry through REPs and I'll reply privately with a clear quote and next steps. No middleman, no booking fees.
            </p>
            <Link
              to={enquireHref}
              params={{ slug }}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-[10px] px-7 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent-color)" }}
            >
              <MessageCircle className="h-4 w-4" />
              Send enquiry
            </Link>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-muted-light">
              Follow my work
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {coach.socials.map((s) => (
                <li key={s.kind}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-[12px] border border-reps-stone bg-reps-warm-white px-4 py-3 text-[14px] text-reps-charcoal transition-colors hover:border-reps-charcoal/30"
                  >
                    <span className="inline-flex items-center gap-3">
                      <SocialIcon kind={s.kind} />
                      <span className="font-medium">{s.label}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-reps-muted-light transition-transform group-hover:translate-x-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialIcon({ kind }: { kind: Coach["socials"][number]["kind"] }) {
  const className = "h-4 w-4 text-reps-charcoal";
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

function FooterMark() {
  return (
    <footer className="border-t border-reps-stone bg-reps-warm-white">
      <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-3 px-6 py-6 text-[12.5px] text-reps-muted-light sm:flex-row lg:px-10">
        <Link to="/" className="inline-flex items-center gap-2 text-reps-charcoal">
          <RepsWordmark className="h-3.5 w-auto text-reps-charcoal" />
          <span>·</span>
          <span className="font-medium">Powered by REPs</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/standards" className="hover:text-reps-charcoal">How we verify</Link>
          <Link to="/privacy" className="hover:text-reps-charcoal">Privacy</Link>
          <Link to="/terms" className="hover:text-reps-charcoal">Terms</Link>
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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-reps-stone bg-reps-warm-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] lg:hidden">
      <div className="mx-auto flex max-w-[640px] items-center gap-3">
        <img src={coach.heroImage} alt="" className="size-10 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-reps-charcoal">{coach.name}</div>
          <div className="truncate text-[11px] text-reps-muted-light">{coach.role}</div>
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

