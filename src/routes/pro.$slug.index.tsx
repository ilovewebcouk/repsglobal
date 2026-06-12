import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  BadgeCheck,
  Bookmark,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Globe,
  Info,
  Laptop,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Umbrella,
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

/* ------------------------------------------------------------------ */
/* Static data (Phase 1)                                              */
/* ------------------------------------------------------------------ */

type Pro = {
  slug: string;
  name: string;
  firstName: string;
  role: string;
  location: string;
  region: string;
  rating: number;
  reviews: number;
  modes: ("In-person" | "Online")[];
  blurb: string;
  image: string;
  years: number;
  clients: string;
  bio: string[];
  specialisms: string[];
  services: {
    title: string;
    desc: string;
    price: string;
    unit: string;
    image: string;
    icon: typeof BadgeCheck;
  }[];
  qualifications: {
    badge: string;
    title: string;
    issuer: string;
    id: string;
    issued: string;
  }[];
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

const STATS = [
  { icon: Users, value: "25,000+", label: "Verified Professionals" },
  { icon: Star, value: "50,000+", label: "Client Reviews" },
  { icon: Globe, value: "120+", label: "Countries Worldwide" },
  { icon: Calendar, value: "1M+", label: "Sessions Booked" },
  { icon: ShieldCheck, value: "100%", label: "REPS Verified" },
];

const SUB_NAV = [
  "About",
  "Services",
  "Specialisms",
  "Reviews",
  "Qualifications",
  "Availability",
  "Location",
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

function proFromDb(row: NonNullable<DbPro>): Pro {
  const template = PROS["james-carter"];
  return {
    slug: row.slug ?? "",
    name: row.full_name ?? "REPS Professional",
    firstName: (row.full_name ?? "").split(" ")[0] || "Coach",
    role: "REPS Verified Professional",
    location: row.city ?? "Online",
    region: row.country ?? "",
    rating: 0,
    reviews: 0,
    modes: [
      ...(row.in_person_available ? (["In-person"] as const) : []),
      ...(row.online_available ? (["Online"] as const) : []),
    ] as Pro["modes"],
    blurb: row.headline ?? "",
    image: row.avatar_url || proJames,
    years: 0,
    clients: "—",
    bio: row.bio ? row.bio.split(/\n\n+/).filter(Boolean) : [],
    specialisms: row.specialisms ?? [],
    services: row.hourly_rate_pence
      ? [
          {
            title: "1-to-1 session",
            desc: "Personalised coaching tailored to your goals.",
            price: `From £${(row.hourly_rate_pence / 100).toFixed(0)}`,
            unit: "per session",
            image: heroCoaching,
            icon: Users,
          },
        ]
      : template.services,
    qualifications: [],
    faqs: [],
  };
}

export const Route = createFileRoute("/pro/$slug/")({
  loader: async ({ params }) => {
    if (PROS[params.slug]) return { source: "fixture" as const, db: null };
    const db = await getPublicProfileBySlug({ data: { slug: params.slug } });
    return { source: db ? ("db" as const) : ("fallback" as const), db };
  },
  head: ({ params, loaderData }) => {
    const fixture = PROS[params.slug];
    const dbPro = loaderData?.db ? proFromDb(loaderData.db) : null;
    const pro = fixture ?? dbPro ?? PROS["james-carter"];
    const title = `${pro.name} — ${pro.role} | REPS`;
    const description = `${pro.name}, REPS Verified ${pro.role}${pro.location ? ` in ${pro.location}` : ""}. ${pro.blurb}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `/pro/${pro.slug}` },
      ],
      links: [{ rel: "canonical", href: `/pro/${pro.slug}` }],
    };
  },
  component: ProProfilePage,
});

function ProProfilePage() {
  const { slug } = Route.useParams();
  const { db } = Route.useLoaderData();
  const pro = PROS[slug] ?? (db ? proFromDb(db) : PROS["james-carter"]);

  return (
    <div className="min-h-screen bg-reps-ivory">
      <PublicHeader variant="solid" />

      {/* ============ HERO ============ */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 pb-8 pt-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[460px_1fr] lg:gap-10">
            {/* Portrait */}
            <div className="relative overflow-hidden rounded-[24px] bg-reps-stone">
              <img
                src={pro.image}
                alt={`${pro.name} — ${pro.role}`}
                className="aspect-[4/3] h-full w-full object-cover"
                width={920}
                height={690}
              />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                <Camera className="h-3 w-3" />
                12 photos
              </span>
            </div>

            {/* Right info */}
            <div className="flex flex-col">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-reps-green/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
                <BadgeCheck className="h-3 w-3" />
                REPS Verified
              </span>

              <h1 className="mt-3 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.01em] text-reps-charcoal lg:text-[52px]">
                {pro.name}
              </h1>
              <div className="mt-1 text-[16px] text-reps-muted-light">{pro.role}</div>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px]">
                <span className="inline-flex items-center gap-1.5 text-reps-charcoal">
                  <MapPin className="h-4 w-4 text-reps-muted-light" />
                  {pro.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-reps-orange text-reps-orange" />
                  <span className="font-semibold text-reps-charcoal">{pro.rating.toFixed(1)}</span>
                  <span className="text-reps-muted-light">({pro.reviews} reviews)</span>
                </span>
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

              <p className="mt-4 max-w-[520px] text-[14px] leading-relaxed text-reps-muted-light">
                {pro.blurb}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/pro/$slug/enquire"
                  params={{ slug }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enquire Now
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

          {/* Trust strip */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-[16px] border border-reps-stone bg-reps-warm-white p-4 sm:grid-cols-4 lg:p-5">
            <TrustItem
              icon={ShieldCheck}
              title="REPS Verified"
              sub="Qualified & insured"
            />
            <TrustItem
              icon={Award}
              title="Qualifications Checked"
              sub="Up to date"
            />
            <TrustItem
              icon={Umbrella}
              title="Professional Indemnity"
              sub="Active until 12 Dec 2025"
            />
            <TrustItem
              icon={GraduationCap}
              title="CPD Compliant"
              sub="18 / 20 pts this cycle"
              info
            />
          </div>
        </div>
      </section>

      {/* ============ SUB NAV ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-reps-stone py-4 text-[14px]">
            {SUB_NAV.map((s, i) => (
              <a
                key={s}
                href={`#${s.toLowerCase()}`}
                className={`relative px-3 py-1.5 font-medium ${
                  i === 0
                    ? "text-reps-orange after:absolute after:inset-x-3 after:-bottom-[17px] after:h-[2px] after:rounded-full after:bg-reps-orange"
                    : "text-reps-muted-light hover:text-reps-charcoal"
                }`}
              >
                {s}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* ============ ABOUT + SERVICES + SPECIALISMS / LOCATION ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-8 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr_1fr]">
            {/* About */}
            <div id="about" className="flex flex-col rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
              <h2 className="font-display text-[18px] font-bold text-reps-charcoal">
                About {pro.firstName}
              </h2>
              <p className="mt-3 border-l-2 border-reps-orange pl-3 font-display text-[15px] italic leading-snug text-reps-charcoal">
                &ldquo;{pro.blurb}&rdquo;
              </p>
              <div className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-reps-muted-light">
                {pro.bio.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
                <div className="rounded-[12px] bg-reps-ivory p-3 text-center">
                  <div className="font-display text-[20px] font-bold leading-none text-reps-orange">
                    {pro.years}+
                  </div>
                  <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-reps-muted-light">
                    Years experience
                  </div>
                </div>
                <div className="rounded-[12px] bg-reps-ivory p-3 text-center">
                  <div className="font-display text-[20px] font-bold leading-none text-reps-orange">
                    {pro.clients}
                  </div>
                  <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-reps-muted-light">
                    Clients helped
                  </div>
                </div>
                <div className="rounded-[12px] bg-reps-ivory p-3 text-center">
                  <div className="font-display text-[20px] font-bold leading-none text-reps-orange">
                    {pro.qualifications[0]?.issued.split(" ").pop() ?? "—"}
                  </div>
                  <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-reps-muted-light">
                    Verified since
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div id="services" className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-[18px] font-bold text-reps-charcoal">
                  Services &amp; Pricing
                </h2>
                <a
                  href={`/pro/${pro.slug}/services`}
                  className="text-[12px] font-semibold text-reps-orange hover:underline"
                >
                  View all services →
                </a>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {pro.services.map((s) => (
                  <article
                    key={s.title}
                    className="flex items-stretch gap-4 rounded-[18px] bg-reps-panel p-3 text-white"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[12px]">
                      <img
                        src={s.image}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                      <div className="font-display text-[16px] font-bold leading-tight text-white">
                        {s.title}
                      </div>
                      <div className="text-[13px] leading-snug text-white/65 line-clamp-2">
                        {s.desc}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-center pl-2 pr-1 text-right">
                      <div className="font-display text-[16px] font-bold leading-tight text-white">
                        {s.price}
                      </div>
                      <div className="mt-0.5 text-[12px] text-white/60">
                        {s.unit}
                      </div>
                    </div>
                  </article>
                ))}
              </div>


            </div>

            {/* Specialisms + Location */}
            <div className="flex flex-col gap-5">
              <div id="specialisms" className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
                <h2 className="font-display text-[18px] font-bold text-reps-charcoal">Specialisms</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pro.specialisms.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[12px] font-medium text-reps-charcoal"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div id="location" className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
                <h2 className="font-display text-[18px] font-bold text-reps-charcoal">Location</h2>
                <div className="mt-3 grid grid-cols-[1fr_1.1fr] gap-3">
                  <div className="relative aspect-square overflow-hidden rounded-[12px] bg-reps-stone ring-1 ring-inset ring-reps-charcoal/5">
                    <MapPlaceholder />
                  </div>
                  <div className="flex flex-col gap-2 text-[13px] text-reps-muted-light">
                    <div>
                      <div className="text-[14px] font-semibold text-reps-charcoal">{pro.location}</div>
                      <div className="text-[12px] text-reps-muted-light">{pro.region}</div>
                    </div>
                    <div className="leading-snug">
                      In-person at private
                      <br />
                      studio or local gym
                    </div>
                    <button
                      type="button"
                      className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-[10px] border border-reps-stone bg-reps-warm-white px-3 py-1.5 text-[12px] font-medium text-reps-charcoal hover:bg-reps-ivory"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      View on map
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
                <h2 className="font-display text-[18px] font-bold text-reps-charcoal">
                  Trains at
                </h2>
                <p className="mt-1 text-[12px] text-reps-muted-light">
                  Independent — not affiliated with the gyms shown.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "Virgin Active", branch: "Barbican" },
                    { label: "PureGym", branch: "Old Street" },
                    { label: "Third Space", branch: "City" },
                  ].map((v) => (
                    <span
                      key={`${v.label}-${v.branch}`}
                      className="inline-flex items-center rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[12px] font-medium text-reps-charcoal"
                    >
                      {v.label} · {v.branch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ QUALIFICATIONS + TRUST ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 pb-8 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <div id="qualifications" className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
              <h2 className="font-display text-[18px] font-bold text-reps-charcoal">
                Qualifications &amp; Credentials
              </h2>
              <div className="mt-5 space-y-5">
                {pro.qualifications.map((q) => (
                  <div
                    key={q.id}
                    className="grid grid-cols-[64px_1fr_auto_auto] items-center gap-4 border-b border-reps-stone/70 pb-5 last:border-0 last:pb-0"
                  >
                    <div className="flex h-12 w-16 items-center justify-center rounded-[10px] bg-reps-ivory text-[11px] font-bold text-reps-charcoal">
                      {q.badge}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-reps-charcoal">{q.title}</div>
                      <div className="text-[12px] text-reps-muted-light">{q.issuer}</div>
                      <div className="mt-0.5 text-[11px] text-reps-muted-light">ID: {q.id}</div>
                    </div>
                    <div className="text-right text-[12px] text-reps-muted-light">
                      <div>Issued: {q.issued}</div>
                      <div className="mt-1 text-[11px] font-medium text-reps-green">Verified</div>
                    </div>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-reps-green text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  </div>
                ))}
              </div>
              <a className="mt-5 inline-block text-[13px] font-semibold text-reps-orange hover:underline" href="#qualifications">
                View all qualifications (3)
              </a>
            </div>

            <div className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
              <h2 className="font-display text-[18px] font-bold text-reps-charcoal">
                Trust &amp; Assurance
              </h2>
              <ul className="mt-4 space-y-3 text-[13px]">
                {[
                  { t: "REPS Verified Professional", s: "Identity, qualifications & insurance verified" },
                  { t: "Professional Indemnity Insurance", s: "Active until 12 Dec 2025" },
                  { t: "CPD Compliant", s: "18 / 20 points this cycle" },
                ].map((i) => (
                  <li key={i.t} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-reps-green text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <div>
                      <div className="font-semibold text-reps-charcoal">{i.t}</div>
                      <div className="text-[12px] text-reps-muted-light">{i.s}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-reps-stone">
                  <div className="h-full w-[90%] rounded-full bg-reps-orange" />
                </div>
                <div className="mt-1 text-right text-[11px] font-medium text-reps-muted-light">90%</div>
              </div>
              <a
                href="#qualifications"
                className="mt-2 flex items-center justify-between text-[13px] font-semibold text-reps-orange hover:underline"
              >
                View full verification
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ REVIEWS + FAQ ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 pb-10 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            {/* Reviews */}
            <div id="reviews" className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[18px] font-bold text-reps-charcoal">
                  What Clients Say
                </h2>
                <a className="text-[12px] font-medium text-reps-orange hover:underline" href="#reviews">
                  See all {pro.reviews} reviews
                </a>
              </div>

              <div className="mt-5 grid gap-6 sm:grid-cols-[220px_1fr]">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="font-display text-[42px] font-bold leading-none text-reps-charcoal">
                      {pro.rating.toFixed(1)}
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-reps-orange text-reps-orange" />
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 text-[12px] text-reps-muted-light">
                    Based on {pro.reviews} reviews
                  </div>
                  <div className="mt-4 space-y-2">
                    {RATING_DIST.map((d) => (
                      <div key={d.stars} className="grid grid-cols-[18px_12px_1fr_28px] items-center gap-2 text-[11px] text-reps-muted-light">
                        <span>{d.stars}</span>
                        <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                        <div className="h-1.5 overflow-hidden rounded-full bg-reps-stone">
                          <div
                            className="h-full rounded-full bg-reps-orange"
                            style={{ width: `${Math.min(100, (d.count / 128) * 100)}%` }}
                          />
                        </div>
                        <span className="text-right text-reps-charcoal">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  {REVIEWS.map((r, i) => (
                    <div key={r.name} className="grid grid-cols-[44px_1fr] gap-3">
                      <img
                        src={REVIEW_AVATARS[i % REVIEW_AVATARS.length]}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[13px] font-semibold text-reps-charcoal">{r.name}</div>
                            <div className="text-[11px] text-reps-muted-light">{r.when}</div>
                          </div>
                        </div>
                        <div className="mt-1 flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, k) => (
                            <Star key={k} className="h-3 w-3 fill-reps-orange text-reps-orange" />
                          ))}
                        </div>
                        <p className="mt-2 text-[13px] leading-relaxed text-reps-muted-light">
                          “{r.body}”
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-6">
              <h2 className="font-display text-[18px] font-bold text-reps-charcoal">
                Frequently Asked Questions
              </h2>
              <div className="mt-4 space-y-2">
                {pro.faqs.map((f) => (
                  <div
                    key={f.q}
                    className={`rounded-[12px] border border-reps-stone ${f.open ? "bg-reps-ivory" : "bg-reps-warm-white"}`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13px] font-semibold text-reps-charcoal"
                    >
                      {f.q}
                      <ChevronDown
                        className={`h-4 w-4 text-reps-muted-light transition-transform ${f.open ? "rotate-180" : ""}`}
                      />
                    </button>
                    {f.open && f.a && (
                      <div className="px-4 pb-4 text-[12.5px] leading-relaxed text-reps-muted-light">
                        {f.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <a href="#" className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-reps-orange hover:underline">
                View all FAQs <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
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
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
              >
                <MessageCircle className="h-4 w-4" />
                Send Enquiry
              </button>
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

      {/* ============ STATS ============ */}
      <section className="bg-reps-ivory pb-10">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="grid grid-cols-2 gap-4 border-t border-reps-stone pt-6 sm:grid-cols-3 lg:grid-cols-5">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-reps-ivory text-reps-charcoal">
                  <s.icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-display text-[18px] font-bold leading-none text-reps-charcoal">
                    {s.value}
                  </div>
                  <div className="mt-1 text-[11px] text-reps-muted-light">{s.label}</div>
                </div>
              </div>
            ))}
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
