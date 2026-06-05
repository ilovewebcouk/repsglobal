import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Laptop,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroGymBg from "@/assets/hero-gym-bg.jpg";
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import proLaura from "@/assets/pro-laura.jpg";

export const Route = createFileRoute("/find-a-professional")({
  head: () => ({
    meta: [
      { title: "Find a Professional — REPs" },
      {
        name: "description",
        content:
          "Search verified personal trainers, Pilates instructors, nutritionists and coaches near you. Filter by specialism, location, training type and rating.",
      },
      { property: "og:title", content: "Find a Professional — REPs" },
      {
        property: "og:description",
        content:
          "Browse REPs-verified fitness professionals. Filter by specialism, location and training type.",
      },
      { property: "og:url", content: "/find-a-professional" },
    ],
    links: [{ rel: "canonical", href: "/find-a-professional" }],
  }),
  component: DirectoryPage,
});

const popularSearches = [
  "Personal Trainer",
  "Pilates Instructor",
  "Nutritionist",
  "Strength Coach",
  "Pre & Postnatal",
  "Online Coaching",
];

type Pro = {
  name: string;
  role: string;
  distance: string;
  rating: number;
  reviews: number;
  mode: "In-person" | "Online" | "In-person & Online";
  tags: [string, string, string];
  blurb: string;
  image: string;
  featured?: boolean;
};

const directoryPros: Pro[] = [
  {
    name: "James Wilson",
    role: "Personal Trainer",
    distance: "Mayfair · 0.8 mi",
    rating: 5.0,
    reviews: 128,
    mode: "In-person & Online",
    tags: ["Strength Training", "Fat Loss", "Health & Fitness"],
    blurb: "Helping busy professionals build strength, improve fitness and feel their best.",
    image: proJames,
    featured: true,
  },
  {
    name: "Sophie Taylor",
    role: "Pilates Instructor",
    distance: "Marylebone · 1.2 mi",
    rating: 5.0,
    reviews: 96,
    mode: "In-person & Online",
    tags: ["Pilates", "Posture", "Core Strength"],
    blurb: "Pilates for strength, mobility and long-term wellness. All levels welcome.",
    image: proSophie,
  },
  {
    name: "Liam Roberts",
    role: "Strength Coach",
    distance: "Soho · 1.5 mi",
    rating: 4.9,
    reviews: 74,
    mode: "In-person",
    tags: ["Strength Training", "Performance", "Muscle Building"],
    blurb: "Build strength, move better and perform at your best.",
    image: proDaniel,
  },
  {
    name: "Priya Sharma",
    role: "Nutritionist",
    distance: "Fitzrovia · 2.1 mi",
    rating: 5.0,
    reviews: 112,
    mode: "Online",
    tags: ["Nutrition", "Weight Management", "Healthy Eating"],
    blurb: "Science-based nutrition advice to help you build healthy habits and feel your best.",
    image: proLaura,
  },
  {
    name: "Daniel Hughes",
    role: "Personal Trainer",
    distance: "Covent Garden · 2.3 mi",
    rating: 4.8,
    reviews: 64,
    mode: "In-person & Online",
    tags: ["Functional Training", "Fat Loss", "Lifestyle Coaching"],
    blurb: "Functional training and lifestyle coaching for long-term results.",
    image: proJames,
  },
  {
    name: "Emily Carter",
    role: "Pilates Instructor",
    distance: "Bloomsbury · 2.4 mi",
    rating: 5.0,
    reviews: 88,
    mode: "In-person",
    tags: ["Pilates", "Reformer Pilates", "Posture"],
    blurb: "Reformer and mat Pilates to improve strength, flexibility and posture.",
    image: proSophie,
  },
  {
    name: "Marcus Lee",
    role: "Strength Coach",
    distance: "Holborn · 2.6 mi",
    rating: 4.9,
    reviews: 51,
    mode: "In-person & Online",
    tags: ["Strength Training", "Athletic Performance", "Powerlifting"],
    blurb: "Strength and conditioning for athletes and everyday lifters.",
    image: proDaniel,
  },
  {
    name: "Hannah Thompson",
    role: "Pre & Postnatal Specialist",
    distance: "Clerkenwell · 3.0 mi",
    rating: 5.0,
    reviews: 77,
    mode: "In-person & Online",
    tags: ["Pre & Postnatal", "Pelvic Health", "Core Recovery"],
    blurb: "Support for every stage of pregnancy and postpartum recovery.",
    image: proLaura,
  },
];

const trustItems = [
  { icon: ShieldCheck, title: "REPs Verified", sub: "Qualifications & insurance check" },
  { icon: Star, title: "Reviewed & Rated", sub: "Real client feedback" },
  { icon: Trophy, title: "Ongoing Standards", sub: "Committed to CPD & excellence" },
  { icon: Users, title: "Trusted Worldwide", sub: "In-person & online" },
];

const testimonials = [
  {
    quote:
      "I'd been burned by PTs who weren't actually qualified. REPs let me see credentials before I even booked. My coach is brilliant.",
    name: "Natalie S.",
    role: "Strength training",
    city: "London",
    image: proLaura,
  },
  {
    quote:
      "Found a Pilates instructor who understood my back rehab brief on the first message. Verified, insured, and genuinely good.",
    name: "Maya R.",
    role: "Pilates",
    city: "Manchester",
    image: proSophie,
  },
  {
    quote:
      "I work shifts so I needed someone flexible and remote. REPs filtered down to qualified online coaches in minutes.",
    name: "Tom B.",
    role: "Online coaching",
    city: "Bristol",
    image: proDaniel,
  },
];

function DirectoryPage() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  return (
    <div className="min-h-screen bg-reps-ivory">
      <PublicHeader variant="transparent" />

      {/* ============ SEARCH HERO ============ */}
      <section className="relative isolate overflow-hidden bg-reps-black text-white">
        {/* atmosphere */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-[0.28]"
          style={{ backgroundImage: `url(${heroGymBg})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-reps-black/85 via-reps-black/65 to-reps-black"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-px bg-white/5"
        />


        <div className="mx-auto max-w-[1320px] px-5 pb-10 pt-[120px] sm:px-6 sm:pb-12 sm:pt-[140px] lg:px-10 lg:pb-16 lg:pt-[168px]">
          {/* editorial title */}
          <div className="max-w-[760px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-reps-orange" />
              <span className="hidden sm:inline">Every REP verified · qualified · insured</span>
              <span className="sm:hidden">Verified · qualified · insured</span>
            </div>
            <h1 className="mt-5 font-display text-[32px] font-bold leading-[1.05] tracking-tight text-white sm:text-[40px] lg:text-[58px]">
              Find a coach worth trusting.
            </h1>
            <p className="mt-4 max-w-[560px] text-[14px] leading-relaxed text-white/70 sm:text-[15px] lg:text-[16px]">
              Search the global register of qualified, insured and credential-checked
              fitness professionals — in your city, on your schedule, in person or online.
            </p>
          </div>

          {/* search panel */}
          <div className="mt-7 rounded-[22px] border border-white/10 bg-reps-panel/75 p-2.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-md sm:mt-8 sm:p-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-[1.1fr_1.1fr_1fr_auto]">
              <SearchField
                label="I'm looking for"
                placeholder="e.g. Personal Trainer"
                icon={UserRound}
              />
              <SearchField label="Near" placeholder="London, UK" icon={MapPin} />
              <SearchField
                label="Training type"
                placeholder="In-person, Online or Both"
                icon={ChevronDown}
                isSelect
              />
              <button
                type="button"
                className="inline-flex h-[56px] items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[15px] font-semibold text-white transition-colors hover:bg-reps-orange-dark md:col-span-2 lg:col-span-1 lg:h-[62px]"
              >
                <Search className="h-4 w-4" />
                Find Professionals
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-2 pb-1 pt-4 text-[13px] sm:px-3 sm:pb-2">
              <span className="font-medium text-white/55">Popular:</span>
              {popularSearches.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="story-link font-medium text-reps-orange transition-colors hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ============ RESULTS ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-5 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
          <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
            {/* Filter rail — collapsible on mobile/tablet */}
            <aside className="lg:sticky lg:top-[88px] lg:self-start">
              <div className="rounded-[22px] border border-reps-stone bg-reps-warm-white shadow-[0_24px_60px_-30px_rgba(15,15,15,0.18)]">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen((v) => !v)}
                  aria-expanded={mobileFiltersOpen}
                  className="flex w-full items-center justify-between gap-2 px-5 py-4 lg:hidden"
                >
                  <span className="text-[14px] font-semibold text-reps-charcoal">Filters (5)</span>
                  <ChevronDown className={`h-4 w-4 text-reps-muted-light transition-transform ${mobileFiltersOpen ? "rotate-180" : ""}`} />
                </button>
                <div className={`${mobileFiltersOpen ? "block" : "hidden"} px-5 pb-5 sm:px-6 sm:pb-6 lg:block lg:px-6 lg:pt-6`}>
                  <div className="hidden items-center justify-between border-b border-reps-stone pb-3 lg:flex">
                    <h2 className="text-[15px] font-semibold text-reps-charcoal">Filter results</h2>
                    <button
                      type="button"
                      className="text-[12px] font-medium text-reps-orange hover:underline"
                    >
                      Clear all
                    </button>
                  </div>

                  <FilterGroup label="Distance">
                    <Select value="Within 10 miles" />
                  </FilterGroup>

                  <FilterGroup label="Specialism">
                    <Select value="Select specialism" placeholder />
                  </FilterGroup>

                  <FilterGroup label="Training Type">
                    <Checkbox label="In-person" defaultChecked />
                    <Checkbox label="Online" defaultChecked />
                    <Checkbox label="Both" defaultChecked />
                  </FilterGroup>

                  <FilterGroup label="Availability">
                    <Select value="Any day" />
                  </FilterGroup>

                  <FilterGroup label="Rating" last>
                    <RatingRow stars={5} />
                    <RatingRow stars={4} />
                    <RatingRow stars={3} />
                  </FilterGroup>
                </div>
              </details>

              {/* Help card — fills the sticky rail beyond the filters */}
              <div className="mt-5 hidden rounded-[22px] border border-reps-stone bg-reps-warm-white p-5 lg:block">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange/12 text-reps-orange">
                  <Compass className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <h3 className="mt-3 font-display text-[15px] font-bold leading-snug text-reps-charcoal">
                  Can't find your match?
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-reps-muted-light">
                  Tell us what you're looking for and we'll hand-match you to a verified REP within 24 hours.
                </p>
                <Link
                  to="/find-a-professional"
                  className="story-link mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-reps-orange"
                >
                  Tell us what you need
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </aside>

            {/* Results column */}
            <div>
              {/* Sort/results bar */}
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-reps-stone/70 pb-4 sm:pb-5">
                <div>
                  <h1 className="font-display text-[18px] font-semibold text-reps-charcoal sm:text-[20px] lg:text-[22px]">
                    126 professionals in London
                  </h1>
                  <p className="mt-1 text-[12px] text-reps-muted-light">
                    Showing 1–8 · all REPs Verified
                  </p>
                </div>
                <label className="flex items-center gap-2 text-[13px] text-reps-muted-light">
                  <span className="hidden sm:inline">Sort by</span>
                  <span className="relative">
                    <select
                      className="appearance-none rounded-[10px] border border-reps-stone bg-reps-warm-white py-2 pl-3 pr-9 text-[13px] font-medium text-reps-charcoal focus:outline-none"
                      defaultValue="relevant"
                    >
                      <option value="relevant">Most relevant</option>
                      <option value="rating">Top rated</option>
                      <option value="distance">Nearest</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-reps-muted-light" />
                  </span>
                </label>
              </div>

              {/* Active filter chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-reps-muted-light">
                  Active
                </span>
                {["Within 10mi", "In-person", "Online", "5★ & up"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[12px] font-medium text-reps-charcoal transition-colors hover:border-reps-orange/40 hover:bg-white"
                  >
                    {chip}
                    <X className="h-3 w-3 text-reps-muted-light" />
                  </button>
                ))}
                <button
                  type="button"
                  className="ml-1 text-[12px] font-semibold text-reps-orange hover:text-reps-orange-dark"
                >
                  Clear all
                </button>
              </div>


              {/* Cards w/ rhythm break */}
              <div className="space-y-4 pt-5">
                {directoryPros.slice(0, 4).map((p) => (
                  <ProCard key={p.name} pro={p} />
                ))}

                <EditorialBreak />

                {directoryPros.slice(4).map((p) => (
                  <ProCard key={p.name} pro={p} />
                ))}
              </div>

              {/* Pagination */}
              <nav
                aria-label="Pagination"
                className="mt-8 flex flex-col items-center gap-3 border-t border-reps-stone/70 pt-6 sm:mt-10 sm:flex-row sm:justify-between"
              >
                <p className="text-[13px] text-reps-muted-light">
                  Showing <span className="font-semibold text-reps-charcoal">1–8</span> of{" "}
                  <span className="font-semibold text-reps-charcoal">126</span>
                </p>
                <div className="flex items-center gap-2">
                  <PagerBtn aria-label="Previous">
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </PagerBtn>
                  <PagerNum n={1} active />
                  <PagerNum n={2} />
                  <PagerNum n={3} className="hidden sm:flex" />
                  <span className="hidden sm:contents">
                    <PagerNum n={4} />
                    <PagerNum n={5} />
                  </span>
                  <span className="hidden px-1 text-reps-muted-light sm:inline">…</span>
                  <PagerNum n={13} className="hidden sm:flex" />
                  <PagerBtn aria-label="Next">
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </PagerBtn>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </section>


      {/* ============ TRUST BAND — borderless editorial closer ============ */}
      <section className="bg-reps-ivory pb-14 sm:pb-16">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-10">
          <div className="border-t border-reps-stone pt-10 sm:pt-12">
            <div className="grid items-start gap-8 sm:gap-10 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-reps-orange">
                  The REPs standard
                </div>
                <h2 className="mt-2 font-display text-[22px] font-bold leading-tight text-reps-charcoal sm:text-[24px]">
                  Why trust REPs professionals?
                </h2>
                <p className="mt-2 max-w-[320px] text-[13px] leading-relaxed text-reps-muted-light">
                  We connect you with verified fitness and health professionals you can trust.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:contents">
                {trustItems.map((t) => (
                  <div key={t.title} className="flex flex-col items-start gap-2 text-left">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-reps-orange/10 text-reps-orange">
                      <t.icon className="h-5 w-5" strokeWidth={1.6} />
                    </span>
                    <div className="mt-1 text-[14px] font-semibold text-reps-charcoal">{t.title}</div>
                    <div className="text-[12.5px] leading-snug text-reps-muted-light">{t.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ============ TESTIMONIALS — dark closer, 3-up ============ */}
      <section className="relative isolate overflow-hidden bg-reps-black text-white">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-[0.18]"
          style={{ backgroundImage: `url(${heroGymBg})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-reps-black via-reps-black/90 to-reps-black"
        />
        <div className="mx-auto max-w-[1320px] px-5 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
          <div className="flex flex-col items-start gap-2 sm:items-center sm:text-center">
            <span className="text-reps-orange">
              <svg viewBox="0 0 32 24" fill="currentColor" className="h-7 w-7">
                <path d="M0 24V14C0 6.3 4.9 1.2 12.6 0l1 3.4C8.7 4.7 6 7.7 6 12h6v12H0Zm20 0V14C20 6.3 24.9 1.2 32.6 0l1 3.4C28.7 4.7 26 7.7 26 12h6v12H20Z" />
              </svg>
            </span>
            <h2 className="font-display text-[24px] font-bold leading-tight text-white sm:text-[30px] lg:text-[36px]">
              People who found their match.
            </h2>
            <p className="max-w-[520px] text-[14px] leading-relaxed text-white/65 sm:text-[15px]">
              Real stories from clients who used REPs to find a coach they could trust.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex h-full flex-col rounded-[18px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-0.5 text-reps-orange">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 font-display text-[16px] leading-snug text-white/90 sm:text-[17px]">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                  <img
                    src={t.image}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
                    width={40}
                    height={40}
                  />
                  <div>
                    <div className="text-[13.5px] font-semibold text-white">{t.name}</div>
                    <div className="text-[12px] text-white/55">
                      {t.role} · {t.city}
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponents                                                       */
/* ------------------------------------------------------------------ */

function SearchField({
  label,
  placeholder,
  icon: Icon,
  isSelect,
}: {
  label: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  isSelect?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 rounded-[12px] bg-reps-panel-soft/70 px-4 pb-3 pt-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
        {label}
      </span>
      <span className="flex items-center gap-2 text-white">
        <Icon className="h-4 w-4 shrink-0 text-white/55" />
        <input
          type="text"
          placeholder={placeholder}
          readOnly={isSelect}
          className="w-full bg-transparent text-[14px] text-white placeholder:text-white/45 focus:outline-none"
        />
      </span>
    </label>
  );
}

function FilterGroup({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? "pt-4" : "border-b border-reps-stone/70 pb-4 pt-4"}>
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-reps-muted-light">
        {label}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Select({ value, placeholder }: { value: string; placeholder?: boolean }) {
  return (
    <div className="relative">
      <button
        type="button"
        className={`flex w-full items-center justify-between rounded-[10px] border border-reps-stone bg-white px-3 py-2 text-[13px] ${
          placeholder ? "text-reps-muted-light" : "text-reps-charcoal"
        }`}
      >
        {value}
        <ChevronDown className="h-3.5 w-3.5 text-reps-muted-light" />
      </button>
    </div>
  );
}

function Checkbox({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-reps-charcoal">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-[6px] border ${
          defaultChecked
            ? "border-reps-orange bg-reps-orange text-white"
            : "border-reps-stone bg-white"
        }`}
      >
        {defaultChecked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
            <path
              d="M2 6.5 5 9l5-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}

function RatingRow({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-reps-charcoal">
      <span className="flex items-center gap-0.5 text-reps-orange">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < stars ? "fill-reps-orange text-reps-orange" : "text-reps-stone"
            }`}
          />
        ))}
      </span>
      <span className="text-reps-muted-light">&amp; up</span>
    </div>
  );
}

function proSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function ProCard({ pro }: { pro: Pro }) {
  const photoSize = pro.featured ? 160 : 112;
  const mobilePhotoSize = pro.featured ? 96 : 80;

  return (
    <article
      className={`group relative overflow-hidden rounded-[18px] border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-30px_rgba(15,15,15,0.22)] sm:p-5 ${
        pro.featured
          ? "border-reps-orange/40 bg-gradient-to-br from-reps-warm-white via-white to-reps-warm-white shadow-[0_18px_50px_-28px_rgba(234,88,12,0.35)] ring-1 ring-reps-orange/20"
          : "border-reps-stone"
      }`}
    >
      {pro.featured && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-reps-orange to-reps-orange-dark"
        />
      )}
      <div className="flex flex-col gap-4 sm:grid sm:items-center sm:gap-5 sm:[grid-template-columns:var(--cols)]"
        style={{ ["--cols" as never]: `${photoSize}px 1fr auto` }}
      >
        {/* TOP: photo + heading + save (mobile inline; sm grid cell) */}
        <div className="flex items-start gap-3 sm:block">
          <div className="relative shrink-0">
            <img
              src={pro.image}
              alt={`${pro.name} — ${pro.role}`}
              className="rounded-[12px] object-cover sm:!h-[var(--p)] sm:!w-[var(--p)]"
              style={{
                width: mobilePhotoSize,
                height: mobilePhotoSize,
                ["--p" as never]: `${photoSize}px`,
              }}
              loading="lazy"
              width={photoSize * 2}
              height={photoSize * 2}
            />
            {pro.featured && (
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-reps-orange px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm sm:left-2 sm:top-2">
                <Sparkles className="h-3 w-3" />
                Featured
              </span>
            )}
          </div>

          {/* Mobile-only heading next to photo */}
          <div className="flex min-w-0 flex-1 items-start justify-between gap-2 sm:hidden">
            <div className="min-w-0">
              <h3 className="font-display text-[16px] font-bold leading-tight text-reps-charcoal">
                {pro.name}
              </h3>
              <div className="mt-0.5 text-[12px] text-reps-muted-light">{pro.role}</div>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-reps-green/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </span>
            </div>
            <button
              type="button"
              aria-label="Save"
              className="shrink-0 rounded-full border border-reps-stone bg-white p-2 text-reps-muted-light transition-colors hover:border-reps-orange hover:text-reps-orange"
            >
              <Bookmark className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* MAIN content */}
        <div className="min-w-0">
          {/* Desktop heading (hidden on mobile, shown sm+) */}
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <h3 className="font-display text-[18px] font-bold leading-tight text-reps-charcoal">
              {pro.name}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-reps-green/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
              <BadgeCheck className="h-3 w-3" />
              REPs Verified
            </span>
          </div>
          <div className="mt-0.5 hidden text-[13px] text-reps-muted-light sm:block">{pro.role}</div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-reps-muted-light sm:mt-1.5 sm:text-[13px]">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {pro.distance}
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
              <span className="font-semibold text-reps-orange">{pro.rating.toFixed(1)}</span>
              <span>({pro.reviews})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Laptop className="h-3.5 w-3.5" />
              {pro.mode}
            </span>
          </div>
          <p className="mt-2 max-w-[460px] text-[13px] leading-snug text-reps-charcoal/80">
            {pro.blurb}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {pro.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-reps-stone bg-reps-ivory px-2.5 py-1 text-[11px] font-medium text-reps-charcoal"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT actions (desktop only) */}
        <div className="hidden flex-col items-end gap-2 sm:flex">
          <button
            type="button"
            aria-label="Save"
            className="rounded-full border border-reps-stone bg-white p-2 text-reps-muted-light transition-colors hover:border-reps-orange hover:text-reps-orange"
          >
            <Bookmark className="h-4 w-4" />
          </button>
          <Link
            to="/pro/$slug"
            params={{ slug: proSlug(pro.name) }}
            className="inline-flex items-center justify-center rounded-[10px] bg-reps-orange px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
          >
            View Profile
          </Link>
        </div>

        {/* Mobile full-width CTA */}
        <Link
          to="/pro/$slug"
          params={{ slug: proSlug(pro.name) }}
          className="inline-flex items-center justify-center rounded-[10px] bg-reps-orange px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-reps-orange-dark sm:hidden"
        >
          View Profile
        </Link>
      </div>
    </article>
  );
}


function EditorialBreak() {
  return (
    <aside className="relative overflow-hidden rounded-[18px] border border-reps-charcoal bg-reps-black px-6 py-5 text-white">
      <div
        aria-hidden
        className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-reps-orange/20 blur-3xl"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange/15 text-reps-orange">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-reps-orange">
              Why REPs
            </div>
            <p className="mt-1 max-w-[520px] text-[14px] leading-snug text-white/85">
              Every professional on this page is qualification-checked, insurance-verified
              and bound to the REPs Code of Ethical Practice.
            </p>
          </div>
        </div>
        <Link
          to="/verify"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-white/10"
        >
          How verification works
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}

function PagerNum({
  n,
  active,
  className,
}: {
  n: number;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold transition-colors sm:h-11 sm:w-11 ${
        active
          ? "bg-reps-orange text-white"
          : "border border-reps-stone bg-white text-reps-charcoal hover:bg-reps-warm-white"
      } ${className ?? ""}`}
    >
      {n}
    </button>
  );
}

function PagerBtn({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-reps-stone bg-white text-reps-charcoal transition-colors hover:bg-reps-warm-white sm:h-11 sm:w-11"
    >
      {children}
    </button>
  );
}
