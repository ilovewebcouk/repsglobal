import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  ChevronRight,
  MapPin,
  Navigation,
  ShieldCheck,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { InlineHeroSearch } from "@/components/search/InlineHeroSearch";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { FeaturedProCard, type FeaturedPro } from "@/components/public/FeaturedProCard";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import proDaniel from "@/assets/pro-daniel.jpg";
import proJames from "@/assets/pro-james.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import { searchProfessionals, getCityProfessionCounts, type SearchProfessionalRow } from "@/lib/directory/search.functions";

const PROFESSION_LABEL: Record<string, string> = {
  "personal-trainer": "Personal Trainer",
  "pilates-instructor": "Pilates Instructor",
  "strength-coach": "Strength Coach",
  "nutritionist": "Nutritionist",
  "online-coach": "Online Coach",
  "yoga-teacher": "Yoga Teacher",
  "group-exercise-instructor": "Group Exercise Instructor",
};

function rowToFeaturedPro(r: SearchProfessionalRow, fallbackImg: string): FeaturedPro {
  const mode: FeaturedPro["mode"] =
    r.in_person_available && r.online_available
      ? "In-person & Online"
      : r.online_available
        ? "Online"
        : "In-person";
  const role = r.primary_profession ? (PROFESSION_LABEL[r.primary_profession] ?? "Professional") : "Professional";
  return {
    name: r.full_name ?? "REPs Professional",
    role,
    city: r.location?.town ?? r.city ?? "",
    rating: 5.0,
    reviews: 0,
    mode,
    tags: (r.specialisms ?? []).slice(0, 2),
    image: r.avatar_url ?? fallbackImg,
  };
}

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
    region: "Greater London",
    blurb:
      "Find REPS-verified personal trainers, Pilates instructors, nutritionists and coaches across central, east, west, north and south London.",
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
    region: "Greater Manchester",
    blurb:
      "Browse REPS-verified fitness professionals across Manchester city centre, Salford, Didsbury, Altrincham and the wider region.",
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
    region: "West Midlands",
    blurb:
      "Connect with REPS-verified personal trainers, coaches and nutritionists across Birmingham and the surrounding West Midlands.",
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
    region: "Lothian",
    blurb:
      "Find REPS-verified fitness professionals across Edinburgh — Leith, New Town, Stockbridge, Morningside and beyond.",
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
      region: "",
      blurb:
        "REPS-verified personal trainers, Pilates instructors, nutritionists and coaches in your area — every professional identity, qualification and insurance checked.",
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
        { title: `Personal Trainers & Coaches in ${loc.name} | REPS` },
        {
          name: "description",
          content: `${loc.blurb} ${loc.count.toLocaleString()} verified professionals in ${loc.name}.`,
        },
        { property: "og:title", content: `REPS-Verified Professionals in ${loc.name}` },
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

const FEATURED: FeaturedPro[] = [
  {
    name: "James Wilson",
    role: "Personal Trainer",
    city: "Shoreditch",
    rating: 5.0,
    reviews: 128,
    mode: "In-person & Online",
    tags: ["Strength", "Fat Loss", "Hypertrophy"],
    image: proJames,
  },
  {
    name: "Sophie Taylor",
    role: "Pilates Instructor",
    city: "Clapham",
    rating: 5.0,
    reviews: 96,
    mode: "In-person & Online",
    tags: ["Reformer", "Posture", "Pre & Postnatal"],
    image: proSophie,
  },
  {
    name: "Liam Roberts",
    role: "Strength Coach",
    city: "Hackney",
    rating: 4.9,
    reviews: 74,
    mode: "In-person",
    tags: ["Powerlifting", "Hypertrophy"],
    image: proDaniel,
  },
  {
    name: "Priya Sharma",
    role: "Nutritionist",
    city: "Canary Wharf",
    rating: 5.0,
    reviews: 112,
    mode: "Online",
    tags: ["Sports Nutrition", "Fat Loss"],
    image: proLaura,
  },
  {
    name: "Daniel Hughes",
    role: "Personal Trainer",
    city: "Islington",
    rating: 4.8,
    reviews: 64,
    mode: "In-person & Online",
    tags: ["Functional", "Lifestyle"],
    image: proDaniel,
  },
  {
    name: "Laura Bennett",
    role: "Yoga Teacher",
    city: "Notting Hill",
    rating: 5.0,
    reviews: 88,
    mode: "In-person",
    tags: ["Vinyasa", "Restorative"],
    image: proLaura,
  },
];

const TRUST = [
  { icon: ShieldCheck, title: "Identity Verified", sub: "Every professional ID-checked before going live." },
  { icon: Trophy, title: "Qualified", sub: "Held to recognised training standards." },
  { icon: BadgeCheck, title: "Insured", sub: "Active liability insurance on file." },
  { icon: Users, title: "Real Reviews", sub: "Only verified clients can leave a review." },
];

const faqsFor = (city: string) => [
  {
    q: `What does REPS-verified mean in ${city}?`,
    a: `Every professional listed in ${city} has had their identity, qualifications, insurance and (where required) DBS checked by our verification team before going live on the platform.`,
  },
  {
    q: `Can I train in person or online in ${city}?`,
    a: `Both. Many professionals in ${city} work face-to-face in studios, gyms and clients' homes, and a large share also deliver remote coaching and check-ins. Use the 'Online' filter to narrow your search.`,
  },
  {
    q: `What's the typical price range in ${city}?`,
    a: `Pricing is set by each professional and you'll see a typical hourly rate on every profile. In ${city}, most personal trainers list between £45 and £85 per session, with online coaching packages priced separately.`,
  },
  {
    q: "What should I ask on the first session?",
    a: "Ask about their experience with your goal, how they assess progress, what a typical block of training looks like, and what happens if you need to cancel. A good professional will welcome the questions.",
  },
  {
    q: "How do I report a concern about a professional?",
    a: "Every profile has a 'Report a concern' link. Reports go to our verification team and we investigate every one — including suspending profiles where needed.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function LocationLanding() {
  const { location } = Route.useParams();
  const loc = getLocation(location);
  const relatedCities = Object.values(LOCATIONS).filter((c) => c.slug !== loc.slug);

  const fallbackImgs = [proJames, proSophie, proDaniel, proLaura];
  const { data: liveResult } = useQuery({
    queryKey: ["directory-featured", loc.slug],
    queryFn: () => searchProfessionals({ data: { city: loc.name, limit: 4 } }),
    staleTime: 60_000,
  });
  const livePros = liveResult?.rows ?? [];
  const featured: FeaturedPro[] = livePros.length
    ? livePros.slice(0, 4).map((r, i) => rowToFeaturedPro(r, fallbackImgs[i % fallbackImgs.length]))
    : FEATURED.slice(0, 4);

  const professionSlugs = loc.professions.map((p) => p.slug);
  const { data: liveCounts } = useQuery({
    queryKey: ["city-profession-counts", loc.slug, professionSlugs.join(",")],
    queryFn: () =>
      getCityProfessionCounts({ data: { city: loc.name, professions: professionSlugs } }),
    staleTime: 60_000,
  });

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
            {loc.region ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-reps-muted-light">
                <MapPin className="h-3 w-3 text-reps-orange" />
                {loc.region}
              </span>
            ) : null}
            <h1 className="mt-4 font-display text-[40px] font-bold leading-[1.05] text-reps-charcoal lg:text-[56px]">
              Verified fitness pros in <span className="text-reps-orange">{loc.name}</span>
            </h1>
            <p className="mt-4 max-w-[620px] text-[16px] leading-relaxed text-reps-muted-light">
              {loc.blurb}
            </p>

            <InlineHeroSearch
              variant="light"
              lockedCity={loc.name}
              whatPlaceholder="Specialism (e.g. fat loss, Pilates)"
              wherePlaceholder="City, town or postcode"
              className="mt-6 grid gap-2 rounded-[18px] border border-reps-stone bg-reps-warm-white p-2 sm:grid-cols-[1fr_1fr_auto]"
            />
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
            {loc.professions.map((p) => {
              const liveCount = liveCounts?.[p.slug];
              const displayCount = liveCount ?? p.count;
              return (
                <Link
                  key={p.slug}
                  to="/find-a-professional"
                  search={{ city: loc.name, profession: p.slug }}
                  className="group flex flex-col rounded-[16px] border border-reps-stone bg-reps-ivory p-4 transition-colors hover:border-reps-orange"
                >
                  <span className="text-[14px] font-semibold text-reps-charcoal group-hover:text-reps-orange">{p.label}</span>
                  <span className="mt-1 text-[12px] text-reps-muted-light">
                    {liveCount == null ? "—" : displayCount} in {loc.name}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange">
                    View <ChevronRight className="h-3 w-3" />
                  </span>
                </Link>
              );
            })}
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
              REPS-verified professionals accepting new clients near you.
            </p>
          </div>
          <Link
            to="/find-a-professional"
            className="hidden items-center gap-1.5 text-[13px] font-semibold text-reps-orange hover:text-reps-orange-dark sm:inline-flex"
          >
            See all {loc.count.toLocaleString()} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <FeaturedProCard key={p.name} pro={p} />
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

      {/* FAQ */}
      <section className="bg-reps-ivory py-14">
        <div className="mx-auto max-w-[860px] px-6 lg:px-10">
          <h2 className="font-display text-[26px] font-bold leading-tight text-reps-charcoal lg:text-[32px]">
            Hiring a professional in {loc.name}
          </h2>
          <Accordion
            type="single"
            collapsible
            className="mt-6 overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white"
          >
            {faqsFor(loc.name).map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`faq-${i}`}
                className="border-b border-reps-stone last:border-b-0"
              >
                <AccordionTrigger className="px-5 py-4 text-[15px] font-semibold text-reps-charcoal hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 text-[14px] leading-relaxed text-reps-muted-light">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-reps-warm-white py-12">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="grid items-center gap-6 rounded-[18px] border border-reps-stone bg-reps-ivory p-5 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
            <div>
              <h2 className="font-display text-[20px] font-bold leading-tight text-reps-charcoal">
                Why trust the pros
                <br />on REPS in {loc.name}
              </h2>
              <p className="mt-2 text-[13px] text-reps-muted-light">
                Every professional has been checked before going live.
              </p>
            </div>
            {TRUST.map((t) => (
              <div key={t.title} className="flex flex-col items-center gap-2 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-reps-warm-white text-reps-charcoal">
                  <t.icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <div className="text-[13px] font-semibold text-reps-charcoal">{t.title}</div>
                <div className="text-[12px] leading-snug text-reps-muted-light">{t.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related cities */}
      {relatedCities.length > 0 ? (
        <section className="bg-reps-ivory py-14">
          <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
            <h2 className="font-display text-[22px] font-bold leading-tight text-reps-charcoal">
              Related cities
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedCities.map((c) => (
                <Link
                  key={c.slug}
                  to="/in/$location"
                  params={{ location: c.slug }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-4 py-2 text-[13px] font-semibold text-reps-charcoal hover:border-reps-orange hover:text-reps-orange"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <PublicFooter />
    </div>
  );
}
