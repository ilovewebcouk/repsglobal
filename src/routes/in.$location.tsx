import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bookmark,
  ChevronRight,
  Laptop,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import proDaniel from "@/assets/pro-daniel.jpg";
import proJames from "@/assets/pro-james.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proSophie from "@/assets/pro-sophie.jpg";

/* ------------------------------------------------------------------ */
/* Location catalogue (Phase 1 static)                                 */
/* ------------------------------------------------------------------ */

type LocationMeta = {
  slug: string;
  name: string;
  region: string;
  blurb: string;
  count: number;
  areas: string[];
  professions: { slug: string; label: string; count: number }[];
};

const LOCATIONS: Record<string, LocationMeta> = {
  london: {
    slug: "london",
    name: "London",
    region: "Greater London, England",
    blurb:
      "Find REPs-verified personal trainers, Pilates instructors, nutritionists and coaches across central, east, west, north and south London.",
    count: 482,
    areas: ["Central London", "East London", "West London", "North London", "South London", "Canary Wharf", "Shoreditch", "Clapham", "Islington", "Hackney"],
    professions: [
      { slug: "personal-trainer", label: "Personal Trainers", count: 264 },
      { slug: "pilates-instructor", label: "Pilates Instructors", count: 88 },
      { slug: "strength-coach", label: "Strength Coaches", count: 47 },
      { slug: "nutritionist", label: "Nutritionists", count: 39 },
      { slug: "online-coach", label: "Online Coaches", count: 44 },
    ],
  },
  manchester: {
    slug: "manchester",
    name: "Manchester",
    region: "Greater Manchester, England",
    blurb:
      "Browse REPs-verified fitness professionals across Manchester city centre, Salford, Didsbury, Altrincham and the wider region.",
    count: 164,
    areas: ["City Centre", "Salford", "Didsbury", "Altrincham", "Chorlton", "Trafford", "Stockport"],
    professions: [
      { slug: "personal-trainer", label: "Personal Trainers", count: 92 },
      { slug: "pilates-instructor", label: "Pilates Instructors", count: 26 },
      { slug: "strength-coach", label: "Strength Coaches", count: 19 },
      { slug: "nutritionist", label: "Nutritionists", count: 14 },
      { slug: "online-coach", label: "Online Coaches", count: 13 },
    ],
  },
  birmingham: {
    slug: "birmingham",
    name: "Birmingham",
    region: "West Midlands, England",
    blurb:
      "Connect with REPs-verified personal trainers, coaches and nutritionists across Birmingham and the surrounding West Midlands.",
    count: 128,
    areas: ["City Centre", "Edgbaston", "Jewellery Quarter", "Solihull", "Sutton Coldfield"],
    professions: [
      { slug: "personal-trainer", label: "Personal Trainers", count: 72 },
      { slug: "pilates-instructor", label: "Pilates Instructors", count: 21 },
      { slug: "strength-coach", label: "Strength Coaches", count: 14 },
      { slug: "nutritionist", label: "Nutritionists", count: 9 },
      { slug: "online-coach", label: "Online Coaches", count: 12 },
    ],
  },
  edinburgh: {
    slug: "edinburgh",
    name: "Edinburgh",
    region: "Scotland",
    blurb:
      "Find REPs-verified fitness professionals across Edinburgh — Leith, New Town, Stockbridge, Morningside and beyond.",
    count: 74,
    areas: ["New Town", "Leith", "Stockbridge", "Morningside", "Bruntsfield"],
    professions: [
      { slug: "personal-trainer", label: "Personal Trainers", count: 41 },
      { slug: "pilates-instructor", label: "Pilates Instructors", count: 13 },
      { slug: "strength-coach", label: "Strength Coaches", count: 8 },
      { slug: "nutritionist", label: "Nutritionists", count: 5 },
      { slug: "online-coach", label: "Online Coaches", count: 7 },
    ],
  },
};

function getLocation(slug: string): LocationMeta {
  return (
    LOCATIONS[slug] ?? {
      slug,
      name: slug
        .split("-")
        .map((s) => s[0]?.toUpperCase() + s.slice(1))
        .join(" "),
      region: "United Kingdom",
      blurb:
        "REPs-verified personal trainers, Pilates instructors, nutritionists and coaches in your area — every professional identity, qualification and insurance checked.",
      count: 32,
      areas: ["Town Centre", "Surrounding Areas"],
      professions: [
        { slug: "personal-trainer", label: "Personal Trainers", count: 18 },
        { slug: "pilates-instructor", label: "Pilates Instructors", count: 6 },
        { slug: "strength-coach", label: "Strength Coaches", count: 3 },
        { slug: "nutritionist", label: "Nutritionists", count: 2 },
        { slug: "online-coach", label: "Online Coaches", count: 3 },
      ],
    }
  );
}

/* ------------------------------------------------------------------ */
/* Route                                                               */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/in/$location")({
  head: ({ params }) => {
    const loc = getLocation(params.location);
    return {
      meta: [
        { title: `Personal Trainers & Coaches in ${loc.name} | REPs` },
        {
          name: "description",
          content: `${loc.blurb} ${loc.count.toLocaleString()} verified professionals in ${loc.name}.`,
        },
        { property: "og:title", content: `REPs-Verified Professionals in ${loc.name}` },
        { property: "og:description", content: loc.blurb },
        { property: "og:url", content: `/in/${loc.slug}` },
      ],
      links: [{ rel: "canonical", href: `/in/${loc.slug}` }],
    };
  },
  component: LocationLanding,
});

/* ------------------------------------------------------------------ */
/* Featured                                                            */
/* ------------------------------------------------------------------ */

type Pro = {
  name: string;
  role: string;
  area: string;
  rating: number;
  reviews: number;
  mode: "In-person" | "Online" | "In-person & Online";
  tags: string[];
  image: string;
};

const FEATURED: Pro[] = [
  {
    name: "James Wilson",
    role: "Personal Trainer",
    area: "Shoreditch",
    rating: 5.0,
    reviews: 128,
    mode: "In-person & Online",
    tags: ["Strength", "Fat Loss", "Hypertrophy"],
    image: proJames,
  },
  {
    name: "Sophie Taylor",
    role: "Pilates Instructor",
    area: "Clapham",
    rating: 5.0,
    reviews: 96,
    mode: "In-person & Online",
    tags: ["Reformer", "Posture", "Pre & Postnatal"],
    image: proSophie,
  },
  {
    name: "Liam Roberts",
    role: "Strength Coach",
    area: "Hackney",
    rating: 4.9,
    reviews: 74,
    mode: "In-person",
    tags: ["Powerlifting", "Hypertrophy"],
    image: proDaniel,
  },
  {
    name: "Priya Sharma",
    role: "Nutritionist",
    area: "Canary Wharf",
    rating: 5.0,
    reviews: 112,
    mode: "Online",
    tags: ["Sports Nutrition", "Fat Loss"],
    image: proLaura,
  },
  {
    name: "Daniel Hughes",
    role: "Personal Trainer",
    area: "Islington",
    rating: 4.8,
    reviews: 64,
    mode: "In-person & Online",
    tags: ["Functional", "Lifestyle"],
    image: proDaniel,
  },
  {
    name: "Laura Bennett",
    role: "Yoga Teacher",
    area: "Notting Hill",
    rating: 5.0,
    reviews: 88,
    mode: "In-person",
    tags: ["Vinyasa", "Restorative"],
    image: proLaura,
  },
];

const TRUST = [
  { icon: ShieldCheck, title: "Identity Verified", sub: "Every professional ID-checked before going live." },
  { icon: Trophy, title: "Qualified", sub: "Held to recognised UK training standards." },
  { icon: BadgeCheck, title: "Insured", sub: "Active liability insurance on file." },
  { icon: Users, title: "Real Reviews", sub: "Only verified clients can leave a review." },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function LocationLanding() {
  const { location } = Route.useParams();
  const loc = getLocation(location);

  return (
    <div className="min-h-screen bg-reps-ivory text-reps-charcoal">
      <PublicHeader variant="solid" />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1320px] px-6 pt-6 lg:px-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-reps-muted-light">
          <Link to="/" className="hover:text-reps-charcoal">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/find-a-professional" className="hover:text-reps-charcoal">Find a Professional</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-reps-charcoal">{loc.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-[1320px] px-6 pb-10 pt-6 lg:px-10 lg:pb-14 lg:pt-10">
        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-reps-muted-light">
              <MapPin className="h-3 w-3 text-reps-orange" />
              {loc.region}
            </span>
            <h1 className="mt-4 font-display text-[40px] font-bold leading-[1.05] text-reps-charcoal lg:text-[56px]">
              Verified fitness pros in <span className="text-reps-orange">{loc.name}</span>
            </h1>
            <p className="mt-4 max-w-[620px] text-[16px] leading-relaxed text-reps-muted-light">
              {loc.blurb}
            </p>

            <form className="mt-6 grid gap-2 rounded-[18px] border border-reps-stone bg-reps-warm-white p-2 sm:grid-cols-[1fr_1fr_auto]">
              <label className="flex items-center gap-2 rounded-[12px] bg-reps-ivory px-3 py-2.5">
                <Search className="h-4 w-4 text-reps-muted-light" />
                <input
                  type="text"
                  placeholder="Specialism (e.g. fat loss, Pilates)"
                  className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-2 rounded-[12px] bg-reps-ivory px-3 py-2.5">
                <MapPin className="h-4 w-4 text-reps-muted-light" />
                <input
                  type="text"
                  defaultValue={loc.name}
                  className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                />
              </label>
              <Link
                to="/find-a-professional"
                className="inline-flex h-[44px] items-center justify-center rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
              >
                Search
              </Link>
            </form>
          </div>

          {/* At a glance */}
          <aside className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-5">
            <h2 className="font-display text-[18px] font-bold text-reps-charcoal">{loc.name} at a glance</h2>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-reps-muted-light">Verified pros</dt>
                <dd className="font-semibold text-reps-charcoal">{loc.count.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-reps-muted-light">Avg. rating</dt>
                <dd className="flex items-center gap-1 font-semibold text-reps-charcoal">
                  <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" /> 4.9 / 5
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-reps-muted-light">Online options</dt>
                <dd className="font-semibold text-reps-charcoal">{Math.round(loc.count * 0.6)}</dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-reps-stone pt-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-reps-muted-light">
                Popular areas
              </div>
              <div className="flex flex-wrap gap-1.5">
                {loc.areas.slice(0, 6).map((a) => (
                  <span key={a} className="rounded-full bg-reps-ivory px-2.5 py-1 text-[12px] font-medium text-reps-charcoal">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* By profession */}
      <section className="border-y border-reps-stone bg-reps-warm-white py-12">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <h2 className="font-display text-[26px] font-bold leading-tight text-reps-charcoal lg:text-[32px]">
            Browse {loc.name} by profession
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {loc.professions.map((p) => (
              <Link
                key={p.slug}
                to="/professions/$profession"
                params={{ profession: p.slug }}
                className="group flex flex-col rounded-[16px] border border-reps-stone bg-reps-ivory p-4 transition-colors hover:border-reps-orange"
              >
                <span className="text-[14px] font-semibold text-reps-charcoal group-hover:text-reps-orange">{p.label}</span>
                <span className="mt-1 text-[12px] text-reps-muted-light">{p.count} in {loc.name}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange">
                  View <ChevronRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-[26px] font-bold leading-tight text-reps-charcoal lg:text-[32px]">
              Featured in {loc.name}
            </h2>
            <p className="mt-1 text-[14px] text-reps-muted-light">
              REPs-verified professionals accepting new clients near you.
            </p>
          </div>
          <Link
            to="/find-a-professional"
            className="hidden items-center gap-1.5 text-[13px] font-semibold text-reps-orange hover:text-reps-orange-dark sm:inline-flex"
          >
            See all {loc.count.toLocaleString()} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((p) => (
            <LocationCard key={p.name} pro={p} />
          ))}
        </div>
      </section>

      {/* Areas */}
      <section className="bg-reps-warm-white py-12">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <h2 className="font-display text-[22px] font-bold leading-tight text-reps-charcoal">
            All areas of {loc.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {loc.areas.map((a) => (
              <Link
                key={a}
                to="/find-a-professional"
                className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-ivory px-3.5 py-1.5 text-[13px] font-medium text-reps-charcoal hover:border-reps-orange hover:text-reps-orange"
              >
                <Navigation className="h-3 w-3" />
                {a}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-reps-ivory py-12">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="grid items-center gap-6 rounded-[18px] border border-reps-stone bg-reps-warm-white p-5 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
            <div>
              <h2 className="font-display text-[20px] font-bold leading-tight text-reps-charcoal">
                Why trust the pros
                <br />on REPs in {loc.name}
              </h2>
              <p className="mt-2 text-[13px] text-reps-muted-light">
                Every professional has been checked before going live.
              </p>
            </div>
            {TRUST.map((t) => (
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

      <PublicFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

function LocationCard({ pro }: { pro: Pro }) {
  const slug = pro.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <article className="overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white">
      <div className="grid grid-cols-[140px_1fr] gap-0">
        <div className="relative">
          <img src={pro.image} alt={pro.name} className="h-full w-full object-cover" loading="lazy" />
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-reps-green/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            <BadgeCheck className="h-2.5 w-2.5" /> Verified
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-[16px] font-bold leading-tight text-reps-charcoal">{pro.name}</h3>
              <p className="text-[12px] text-reps-muted-light">{pro.role}</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button aria-label="Save" className="text-reps-muted-light hover:text-reps-orange">
                  <Bookmark className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-reps-black text-white">Save</TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[12px]">
            <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
            <span className="font-semibold text-reps-orange">{pro.rating.toFixed(1)}</span>
            <span className="text-reps-muted-light">({pro.reviews})</span>
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-reps-muted-light">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {pro.area}</span>
            <span className="flex items-center gap-1"><Laptop className="h-3 w-3" /> {pro.mode}</span>
          </div>
          <Link
            to="/pro/$slug"
            params={{ slug }}
            className="mt-3 inline-flex h-8 items-center justify-center rounded-[10px] bg-reps-orange px-4 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
          >
            View Profile
          </Link>
        </div>
      </div>
    </article>
  );
}
