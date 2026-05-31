import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Apple,
  BadgeCheck,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Globe,
  Heart,
  Laptop,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  Target,
  UserRound,
  Users,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroImg from "@/assets/hero-trainer.jpg";
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import proLaura from "@/assets/pro-laura.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "REPs — Find. Trust. Train. Transform." },
      {
        name: "description",
        content:
          "REPs connects you with verified fitness professionals you can trust to help you reach your goals.",
      },
      { property: "og:title", content: "REPs — Find. Trust. Train. Transform." },
      {
        property: "og:description",
        content:
          "Search verified personal trainers, Pilates instructors, nutritionists and coaches.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const heroBadges = [
  { title: "REPs Verified", sub: "Qualified & insured" },
  { title: "Reviewed & Rated", sub: "Real client feedback" },
  { title: "Trusted Worldwide", sub: "In-person & online" },
];

const whyReps = [
  { icon: BadgeCheck, title: "Professionals are verified", sub: "Qualifications & insurance checked" },
  { icon: ShieldCheck, title: "Ongoing CPD & standards", sub: "Committed to excellence" },
  { icon: Star, title: "Client reviews you can trust", sub: "Real people. Real results." },
  { icon: Target, title: "Your goals. Matched right.", sub: "We help you find the perfect fit." },
];

const stats = [
  { icon: Users, value: "25,000+", label: "Verified Professionals" },
  { icon: Star, value: "50,000+", label: "Client Reviews" },
  { icon: Globe, value: "120+", label: "Countries Worldwide" },
  { icon: Calendar, value: "1M+", label: "Sessions Booked" },
  { icon: ShieldCheck, value: "100%", label: "REPs Verified" },
];

const specialisms = [
  { icon: Dumbbell, label: "Personal Trainer" },
  { icon: Activity, label: "Pilates" },
  { icon: Apple, label: "Nutritionist" },
  { icon: Target, label: "Strength Coach" },
  { icon: Heart, label: "Pre & Postnatal" },
  { icon: Stethoscope, label: "Rehab Specialist" },
  { icon: Users, label: "Sports Coach" },
  { icon: Laptop, label: "Online Coaching" },
];

const featuredPros = [
  {
    name: "James Carter",
    role: "Personal Trainer",
    location: "London, UK",
    rating: 5.0,
    reviews: 128,
    mode: "In-person & Online",
    image: proJames,
  },
  {
    name: "Sophie Williams",
    role: "Pilates Instructor",
    location: "Manchester, UK",
    rating: 5.0,
    reviews: 96,
    mode: "In-person & Online",
    image: proSophie,
  },
  {
    name: "Daniel Roberts",
    role: "Strength Coach",
    location: "Birmingham, UK",
    rating: 4.9,
    reviews: 74,
    mode: "In-person",
    image: proDaniel,
  },
  {
    name: "Laura Mitchell",
    role: "Nutritionist",
    location: "Online",
    rating: 5.0,
    reviews: 112,
    mode: "Online",
    image: proLaura,
    online: true,
  },
];

const popularSearches = [
  "Personal Trainer",
  "Pilates Instructor",
  "Nutritionist",
  "Strength Coach",
  "Pre & Postnatal",
  "Online Coaching",
];

function HomePage() {
  return (
    <div className="min-h-screen bg-reps-ivory">
      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden bg-reps-black text-white">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImg}
            alt=""
            className="h-full w-full object-cover object-center opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-reps-black via-reps-black/85 to-reps-black/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-reps-black/40 via-transparent to-reps-black" />
        </div>

        <PublicHeader variant="transparent" />

        <div className="mx-auto max-w-[1320px] px-6 pb-12 pt-[140px] lg:px-10 lg:pb-16 lg:pt-[160px]">
          <div className="grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:items-start">
            {/* Left: headline + badges */}
            <div>
              <h1 className="font-display text-[52px] font-bold leading-[0.98] tracking-[-0.02em] text-white sm:text-[64px] lg:text-[72px]">
                Find. Trust. Train.
                <br />
                Transform.
              </h1>

              <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-white/75">
                REPs connects you with verified fitness professionals you can trust to help you
                reach your goals.
              </p>

              <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
                {heroBadges.map((b) => (
                  <li key={b.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-reps-orange/70 text-reps-orange">
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                        <path
                          d="M2 6.5 5 9l5-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <div>
                      <div className="text-[15px] font-semibold text-white">{b.title}</div>
                      <div className="text-[13px] text-white/60">{b.sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Why REPs card */}
            <aside className="rounded-[22px] border border-white/10 bg-reps-panel/85 p-6 backdrop-blur-md lg:p-7">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <ShieldCheck className="h-4 w-4 text-reps-gold" />
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white">
                  Why REPs?
                </span>
              </div>
              <ul className="mt-5 space-y-5">
                {whyReps.map((w) => (
                  <li key={w.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-reps-orange">
                      <w.icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <div className="text-[14px] font-semibold text-white">{w.title}</div>
                      <div className="text-[13px] text-white/55">{w.sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-6 w-full rounded-[12px] border border-white/15 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-white/5"
              >
                Learn more about REPs
              </button>
            </aside>
          </div>

          {/* Search panel */}
          <div className="mt-12 rounded-[22px] border border-white/10 bg-reps-panel/75 p-3 backdrop-blur-md">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.1fr_1.1fr_1fr_auto]">
              <SearchField
                label="I'm looking for"
                placeholder="e.g. Personal Trainer"
                icon={UserRound}
              />
              <SearchField label="Near" placeholder="Enter location or postcode" icon={MapPin} />
              <SearchField
                label="Training type"
                placeholder="In-person, Online or Both"
                icon={ChevronDown}
                isSelect
              />
              <button
                type="button"
                className="inline-flex h-[58px] items-center justify-center gap-2 rounded-[14px] bg-reps-orange px-7 text-[15px] font-semibold text-white shadow-[0_10px_28px_-10px_rgba(242,140,56,0.8)] transition-colors hover:bg-reps-orange-dark"
              >
                <Search className="h-4 w-4" />
                Find Professionals
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-3 pb-2 pt-4 text-[13px]">
              <span className="font-medium text-white/55">Popular searches:</span>
              {popularSearches.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="font-medium text-reps-orange transition-colors hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS STRIP ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-6 lg:px-10">
          <div className="grid grid-cols-2 gap-4 rounded-[20px] border border-reps-stone bg-reps-warm-white p-6 sm:grid-cols-3 lg:grid-cols-5 lg:p-7">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-reps-ivory text-reps-charcoal">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-display text-[24px] font-bold leading-none text-reps-charcoal">
                    {s.value}
                  </div>
                  <div className="mt-1 text-[13px] text-reps-muted-light">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ EXPLORE BY SPECIALISM ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-[260px_1fr]">
            <div>
              <div className="text-[13px] font-medium uppercase tracking-wider text-reps-muted-light">
                Explore by
              </div>
              <h2 className="mt-1 font-display text-[34px] font-bold leading-tight text-reps-charcoal">
                Specialism
              </h2>
              <p className="mt-2 max-w-[220px] text-[14px] text-reps-muted-light">
                Find the right expert
                <br />
                for your goals
              </p>
              <button
                type="button"
                className="mt-5 inline-flex items-center gap-2 rounded-[12px] border border-reps-stone bg-reps-warm-white px-4 py-2.5 text-[13px] font-medium text-reps-charcoal transition-colors hover:bg-reps-ivory"
              >
                View all specialisms
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {specialisms.map((sp) => (
                <button
                  key={sp.label}
                  type="button"
                  className="group flex flex-col items-center gap-3 text-center"
                >
                  <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white text-reps-charcoal transition-all group-hover:border-reps-charcoal/30 group-hover:shadow-sm">
                    <sp.icon className="h-7 w-7" strokeWidth={1.6} />
                  </span>
                  <span className="text-[13px] font-medium text-reps-charcoal">{sp.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURED PROFESSIONALS ============ */}
      <section className="bg-reps-ivory pb-20">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[28px] font-bold leading-tight text-reps-charcoal lg:text-[32px]">
              Featured REPs Professionals
            </h2>
            <div className="flex items-center gap-4">
              <Link
                to="/find-a-professional"
                className="text-[14px] font-medium text-reps-charcoal underline-offset-4 hover:underline"
              >
                View all professionals
              </Link>
              <div className="hidden gap-2 sm:flex">
                <button
                  type="button"
                  aria-label="Previous"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white text-reps-charcoal transition-colors hover:bg-reps-ivory"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white text-reps-charcoal transition-colors hover:bg-reps-ivory"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredPros.map((p) => (
              <article
                key={p.name}
                className="group overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel text-white shadow-[var(--reps-shadow-card)] transition-transform hover:-translate-y-0.5"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={p.image}
                    alt={`${p.name} — ${p.role}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    width={512}
                    height={640}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-reps-panel via-reps-panel/70 to-transparent" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-reps-green/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
                    <BadgeCheck className="h-3 w-3" />
                    REPs Verified
                  </span>
                </div>
                <div className="space-y-2 px-4 pb-4 pt-3">
                  <div>
                    <h3 className="font-display text-[18px] font-bold leading-tight text-white">
                      {p.name}
                    </h3>
                    <div className="text-[13px] text-white/65">{p.role}</div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-[13px] ${p.online ? "text-reps-blue" : "text-white/65"}`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {p.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] text-reps-gold">
                    <Star className="h-3.5 w-3.5 fill-reps-gold text-reps-gold" />
                    <span className="font-semibold text-white">{p.rating.toFixed(1)}</span>
                    <span className="text-white/55">({p.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 text-[12px] text-white/55">
                    <Laptop className="h-3.5 w-3.5" />
                    {p.mode}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function SearchField({
  label,
  placeholder,
  icon: Icon,
  isSelect = false,
}: {
  label: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  isSelect?: boolean;
}) {
  return (
    <label className="group flex flex-col gap-1 rounded-[14px] border border-white/8 bg-reps-ink/60 px-4 py-3 transition-colors hover:border-white/15">
      <span className="text-[11px] font-medium uppercase tracking-wider text-white/55">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          readOnly={isSelect}
          placeholder={placeholder}
          className="w-full bg-transparent text-[14px] font-medium text-white placeholder:text-white/40 focus:outline-none"
        />
        <Icon className="h-4 w-4 shrink-0 text-white/45" />
      </div>
    </label>
  );
}
