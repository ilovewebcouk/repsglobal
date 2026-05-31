import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Laptop,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
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
};

const directoryPros: Pro[] = [
  {
    name: "James Wilson",
    role: "Personal Trainer",
    distance: "London, 0.8 miles away",
    rating: 5.0,
    reviews: 128,
    mode: "In-person & Online",
    tags: ["Strength Training", "Fat Loss", "Health & Fitness"],
    blurb: "Helping busy professionals build strength, improve fitness and feel their best.",
    image: proJames,
  },
  {
    name: "Sophie Taylor",
    role: "Pilates Instructor",
    distance: "London, 1.2 miles away",
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
    distance: "London, 1.5 miles away",
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
    distance: "London, 2.1 miles away",
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
    distance: "London, 2.3 miles away",
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
    distance: "London, 2.4 miles away",
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
    distance: "London, 2.6 miles away",
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
    distance: "London, 3.0 miles away",
    rating: 5.0,
    reviews: 77,
    mode: "In-person & Online",
    tags: ["Pre & Postnatal", "Pelvic Health", "Core Recovery"],
    blurb: "Support for every stage of pregnancy and postpartum recovery.",
    image: proLaura,
  },
];

const trustItems = [
  { icon: ShieldCheck, title: "REPs Verified", sub: "Qualifications & insurance checked" },
  { icon: Star, title: "Reviewed & Rated", sub: "Real client feedback" },
  { icon: Trophy, title: "Ongoing Standards", sub: "Committed to CPD & excellence" },
  { icon: Users, title: "Trusted Worldwide", sub: "In-person & online" },
];

function DirectoryPage() {
  return (
    <div className="min-h-screen bg-reps-ivory">
      {/* ============ DARK SEARCH BAND ============ */}
      <section className="relative isolate bg-reps-black text-white">
        <PublicHeader variant="transparent" />

        <div className="mx-auto max-w-[1320px] px-6 pb-8 pt-[120px] lg:px-10 lg:pb-10 lg:pt-[140px]">
          <div className="rounded-[20px] border border-white/10 bg-reps-panel/75 p-3 backdrop-blur-md">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.1fr_1.1fr_1fr_auto]">
              <SearchField
                label="I'm looking for"
                placeholder="e.g. Personal Trainer"
                icon={UserRound}
              />
              <SearchField label="Near" placeholder="SW1A 1AA" icon={MapPin} />
              <SearchField
                label="Training type"
                placeholder="In-person, Online or Both"
                icon={ChevronDown}
                isSelect
              />
              <button
                type="button"
                className="inline-flex h-[58px] items-center justify-center gap-2 rounded-[14px] bg-reps-orange px-7 text-[15px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
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

      {/* ============ RESULTS ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-10 lg:px-10 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            {/* Filter rail */}
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-[20px] border border-reps-stone bg-reps-warm-white p-5">
                <div className="flex items-center justify-between border-b border-reps-stone pb-3">
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

                <FilterGroup label="Verified status">
                  <Checkbox label="REPs Verified only" />
                </FilterGroup>

                <FilterGroup label="Rating" last>
                  <RatingRow stars={5} />
                  <RatingRow stars={4} />
                  <RatingRow stars={3} />
                </FilterGroup>
              </div>
            </aside>

            {/* Results column */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
                <h1 className="font-display text-[20px] font-semibold text-reps-charcoal lg:text-[22px]">
                  126 professionals found near SW1A 1AA
                </h1>
                <label className="flex items-center gap-2 text-[13px] text-reps-muted-light">
                  Sort by
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

              <div className="space-y-4">
                {directoryPros.map((p) => (
                  <ProCard key={p.name} pro={p} />
                ))}
              </div>

              {/* Pagination */}
              <nav
                aria-label="Pagination"
                className="mt-8 flex items-center justify-center gap-2"
              >
                <PagerBtn aria-label="Previous">
                  <ChevronLeft className="h-4 w-4" />
                </PagerBtn>
                <PagerNum n={1} active />
                <PagerNum n={2} />
                <PagerNum n={3} />
                <PagerNum n={4} />
                <PagerNum n={5} />
                <span className="px-1 text-reps-muted-light">…</span>
                <PagerNum n={13} />
                <PagerBtn aria-label="Next">
                  <ChevronRight className="h-4 w-4" />
                </PagerBtn>
              </nav>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST BAND ============ */}
      <section className="bg-reps-ivory pb-12">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="grid items-center gap-6 rounded-[20px] border border-reps-stone bg-reps-warm-white p-6 lg:grid-cols-[1.2fr_repeat(4,1fr)] lg:p-8">
            <div>
              <h2 className="font-display text-[20px] font-bold leading-tight text-reps-charcoal">
                Why trust REPs
                <br />
                professionals?
              </h2>
              <p className="mt-2 text-[13px] text-reps-muted-light">
                We connect you with verified fitness and health professionals you can trust.
              </p>
            </div>
            {trustItems.map((t) => (
              <div key={t.title} className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-reps-ivory text-reps-charcoal">
                  <t.icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <div className="text-[13px] font-semibold text-reps-charcoal">{t.title}</div>
                <div className="text-[12px] leading-snug text-reps-muted-light">{t.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIAL ============ */}
      <section className="bg-reps-ivory pb-16">
        <div className="mx-auto max-w-[760px] px-6 text-center lg:px-10">
          <div className="mx-auto flex h-10 w-10 items-center justify-center text-reps-orange">
            <svg viewBox="0 0 32 24" fill="currentColor" className="h-7 w-7">
              <path d="M0 24V14C0 6.3 4.9 1.2 12.6 0l1 3.4C8.7 4.7 6 7.7 6 12h6v12H0Zm20 0V14C20 6.3 24.9 1.2 32.6 0l1 3.4C28.7 4.7 26 7.7 26 12h6v12H20Z" />
            </svg>
          </div>
          <p className="mt-5 font-display text-[20px] leading-snug text-reps-charcoal lg:text-[22px]">
            “REPs helped me find the perfect trainer to reach my goals. The verification and
            reviews gave me complete confidence.”
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <img
              src={proLaura}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
              width={40}
              height={40}
            />
            <div className="text-left">
              <div className="text-[14px] font-semibold text-reps-charcoal">Natalie S.</div>
              <div className="text-[12px] text-reps-muted-light">London, UK</div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === 2 ? "w-6 bg-reps-orange" : "w-1.5 bg-reps-stone"
                }`}
              />
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
    <label className="flex flex-col gap-1.5 rounded-[14px] bg-reps-panel-soft/70 px-4 pb-3 pt-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
        {label}
      </span>
      <span className="flex items-center gap-2 text-white">
        <input
          type="text"
          placeholder={placeholder}
          readOnly={isSelect}
          className="w-full bg-transparent text-[14px] text-white placeholder:text-white/45 focus:outline-none"
        />
        <Icon className="h-4 w-4 shrink-0 text-white/55" />
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
        className={`flex w-full items-center justify-between rounded-[10px] border border-reps-stone bg-reps-warm-white px-3 py-2 text-[13px] ${
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
        className={`flex h-4 w-4 items-center justify-center rounded-[4px] border ${
          defaultChecked
            ? "border-reps-orange bg-reps-orange text-white"
            : "border-reps-stone bg-reps-warm-white"
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
      <span className="flex items-center gap-0.5 text-reps-gold">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < stars ? "fill-reps-gold text-reps-gold" : "text-reps-stone"
            }`}
          />
        ))}
      </span>
      <span className="text-reps-muted-light">&amp; up</span>
    </div>
  );
}

function ProCard({ pro }: { pro: Pro }) {
  return (
    <article className="rounded-[18px] border border-reps-stone bg-reps-warm-white p-4">
      <div className="grid gap-4 sm:grid-cols-[112px_1fr_auto] sm:items-center">
        <img
          src={pro.image}
          alt={`${pro.name} — ${pro.role}`}
          className="h-[112px] w-[112px] rounded-[12px] object-cover"
          loading="lazy"
          width={224}
          height={224}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[18px] font-bold leading-tight text-reps-charcoal">
              {pro.name}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-reps-green/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
              <BadgeCheck className="h-3 w-3" />
              REPs Verified
            </span>
          </div>
          <div className="mt-0.5 text-[13px] text-reps-muted-light">{pro.role}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-reps-muted-light">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {pro.distance}
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-reps-gold text-reps-gold" />
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
                className="rounded-full bg-reps-ivory px-2.5 py-1 text-[11px] font-medium text-reps-charcoal"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-center">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-[10px] bg-reps-orange px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
          >
            View Profile
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] px-2 py-1 text-[12px] font-medium text-reps-muted-light hover:text-reps-charcoal"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>
    </article>
  );
}

function PagerNum({ n, active }: { n: number; active?: boolean }) {
  return (
    <button
      type="button"
      className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold transition-colors ${
        active
          ? "bg-reps-orange text-white"
          : "border border-reps-stone bg-reps-warm-white text-reps-charcoal hover:bg-reps-ivory"
      }`}
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
      className="flex h-9 w-9 items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white text-reps-charcoal transition-colors hover:bg-reps-ivory"
    >
      {children}
    </button>
  );
}
