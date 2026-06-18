import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useViewerOrigin } from "@/lib/useViewerOrigin";
import {
  BadgeCheck,
  ChevronRight,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Breadcrumb } from "@/components/Breadcrumb";
import { FeaturedProCard, type FeaturedPro } from "@/components/public/FeaturedProCard";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import proDaniel from "@/assets/pro-daniel.jpg";
import proJames from "@/assets/pro-james.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import { searchProfessionals, type SearchProfessionalRow } from "@/lib/directory/search.functions";

const PROFESSION_ROLE_LABEL: Record<string, string> = {
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
  const role = r.primary_profession ? (PROFESSION_ROLE_LABEL[r.primary_profession] ?? "Professional") : "Professional";
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
/* Profession catalogue (Phase 1 static)                               */
/* ------------------------------------------------------------------ */

type ProfessionMeta = {
  slug: string;
  title: string;
  plural: string;
  blurb: string;
  qualifications: string[];
  specialisms: string[];
  avgRate: string;
  count: number;
  related: { slug: string; label: string }[];
};

const PROFESSIONS: Record<string, ProfessionMeta> = {
  "personal-trainer": {
    slug: "personal-trainer",
    title: "Personal Trainer",
    plural: "Personal Trainers",
    blurb:
      "REPS-verified personal trainers help you build strength, lose body fat and feel better in your training — one-to-one, in person or online.",
    qualifications: ["Level 3 PT (RQF)", "Level 4 Specialist", "First Aid (current)"],
    specialisms: [
      "Strength Training",
      "Fat Loss",
      "Hypertrophy",
      "Pre & Postnatal",
      "Older Adults",
      "Sports Performance",
      "Online Coaching",
      "1:1 In-Person",
    ],
    avgRate: "£45 – £85 / hour",
    count: 1284,
    related: [
      { slug: "strength-coach", label: "Strength Coach" },
      { slug: "nutritionist", label: "Nutritionist" },
      { slug: "online-coach", label: "Online Coach" },
    ],
  },
  "pilates-instructor": {
    slug: "pilates-instructor",
    title: "Pilates Instructor",
    plural: "Pilates Instructors",
    blurb:
      "Find REPS-verified Pilates teachers for mat, reformer and rehabilitation Pilates — improving posture, mobility and long-term strength.",
    qualifications: ["Level 3 Mat Pilates", "Reformer Certification", "First Aid (current)"],
    specialisms: [
      "Mat Pilates",
      "Reformer Pilates",
      "Pre & Postnatal",
      "Rehabilitation",
      "Posture & Mobility",
      "Older Adults",
      "Online Classes",
      "Studio Sessions",
    ],
    avgRate: "£35 – £70 / hour",
    count: 412,
    related: [
      { slug: "yoga-teacher", label: "Yoga Teacher" },
      { slug: "personal-trainer", label: "Personal Trainer" },
      { slug: "rehab-specialist", label: "Rehab Specialist" },
    ],
  },
  nutritionist: {
    slug: "nutritionist",
    title: "Nutritionist",
    plural: "Nutritionists",
    blurb:
      "Evidence-based nutrition support from REPS-verified professionals — fat loss, performance, gut health and habit-building plans.",
    qualifications: ["BSc Nutrition", "Registered Nutritionist (ANutr / RNutr)", "Sports Nutrition (ISSN)"],
    specialisms: [
      "Fat Loss",
      "Muscle Gain",
      "Sports Nutrition",
      "Gut Health",
      "Plant-Based",
      "Female Hormones",
      "Online Plans",
      "Body Composition",
    ],
    avgRate: "£60 – £120 / session",
    count: 326,
    related: [
      { slug: "personal-trainer", label: "Personal Trainer" },
      { slug: "online-coach", label: "Online Coach" },
      { slug: "strength-coach", label: "Strength Coach" },
    ],
  },
  "strength-coach": {
    slug: "strength-coach",
    title: "Strength Coach",
    plural: "Strength Coaches",
    blurb:
      "Specialist strength and conditioning coaches for powerlifting, hypertrophy and athletic performance — all REPS-verified.",
    qualifications: ["Level 4 Strength & Conditioning", "UKSCA / NSCA-CSCS", "First Aid (current)"],
    specialisms: [
      "Powerlifting",
      "Hypertrophy",
      "Athletic Performance",
      "Programme Design",
      "Olympic Lifting",
      "Conditioning",
      "Online Programming",
      "Competition Prep",
    ],
    avgRate: "£55 – £95 / hour",
    count: 198,
    related: [
      { slug: "personal-trainer", label: "Personal Trainer" },
      { slug: "online-coach", label: "Online Coach" },
      { slug: "nutritionist", label: "Nutritionist" },
    ],
  },
  "online-coach": {
    slug: "online-coach",
    title: "Online Coach",
    plural: "Online Coaches",
    blurb:
      "Remote coaching from REPS-verified professionals — bespoke programming, weekly check-ins and video feedback, wherever you train.",
    qualifications: ["Level 3 PT (RQF)", "Online Coaching Certification", "Specialist Level 4"],
    specialisms: [
      "Online Programming",
      "Weekly Check-ins",
      "Video Form Reviews",
      "Habit Coaching",
      "Fat Loss",
      "Muscle Gain",
      "Strength Building",
      "Nutrition Support",
    ],
    avgRate: "£99 – £249 / month",
    count: 873,
    related: [
      { slug: "personal-trainer", label: "Personal Trainer" },
      { slug: "nutritionist", label: "Nutritionist" },
      { slug: "strength-coach", label: "Strength Coach" },
    ],
  },
  "yoga-teacher": {
    slug: "yoga-teacher",
    title: "Yoga Teacher",
    plural: "Yoga Teachers",
    blurb:
      "REPS-verified yoga teachers for vinyasa, hatha, yin and pregnancy yoga — register-checked through Yoga Alliance Professionals or BWY, insured and ready to teach.",
    qualifications: [
      "200hr / 500hr Yoga Alliance Professionals",
      "British Wheel of Yoga (BWY) Level 4",
      "First Aid (current)",
    ],
    specialisms: [
      "Vinyasa Flow",
      "Hatha",
      "Yin",
      "Pregnancy Yoga",
      "Beginners",
      "Mobility & Recovery",
      "1:1 Private",
      "Online Classes",
    ],
    avgRate: "£35 – £75 / class",
    count: 412,
    related: [
      { slug: "pilates-instructor", label: "Pilates Instructor" },
      { slug: "personal-trainer", label: "Personal Trainer" },
      { slug: "online-coach", label: "Online Coach" },
    ],
  },
};

function getProfession(slug: string): ProfessionMeta {
  return (
    PROFESSIONS[slug] ?? {
      slug,
      title: slug
        .split("-")
        .map((s) => s[0]?.toUpperCase() + s.slice(1))
        .join(" "),
      plural:
        slug
          .split("-")
          .map((s) => s[0]?.toUpperCase() + s.slice(1))
          .join(" ") + "s",
      blurb: "REPS-verified professionals in your city and online. Search, compare and book with confidence.",
      qualifications: ["Level 3 (RQF)", "Specialist Qualifications", "First Aid (current)"],
      specialisms: ["1:1 Coaching", "Online Sessions", "Group Classes", "Specialist Programmes"],
      avgRate: "£40 – £80 / hour",
      count: 64,
      related: [
        { slug: "personal-trainer", label: "Personal Trainer" },
        { slug: "nutritionist", label: "Nutritionist" },
        { slug: "online-coach", label: "Online Coach" },
      ],
    }
  );
}

/* ------------------------------------------------------------------ */
/* Route                                                               */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/professions/$profession")({
  head: ({ params }) => {
    const meta = getProfession(params.profession);
    return {
      meta: [
        { title: `${meta.plural} — REPS-Verified | REPS` },
        {
          name: "description",
          content: `${meta.blurb} Browse ${meta.count.toLocaleString()} verified ${meta.plural.toLowerCase()} on REPS.`,
        },
        { property: "og:title", content: `${meta.plural} — REPS` },
        { property: "og:description", content: meta.blurb },
        { property: "og:url", content: `/professions/${meta.slug}` },
      ],
      links: [{ rel: "canonical", href: `/professions/${meta.slug}` }],
    };
  },
  component: ProfessionLanding,
});

/* ------------------------------------------------------------------ */
/* Featured pros (static, Phase 1)                                     */
/* ------------------------------------------------------------------ */

const FEATURED: FeaturedPro[] = [
  {
    name: "James Wilson",
    role: "Personal Trainer",
    city: "London",
    rating: 5.0,
    reviews: 128,
    mode: "In-person & Online",
    tags: ["Strength Training", "Fat Loss", "Hypertrophy"],
    image: proJames,
  },
  {
    name: "Sophie Taylor",
    role: "Pilates Instructor",
    city: "London",
    rating: 5.0,
    reviews: 96,
    mode: "In-person & Online",
    tags: ["Reformer", "Posture", "Pre & Postnatal"],
    image: proSophie,
  },
  {
    name: "Liam Roberts",
    role: "Strength Coach",
    city: "Manchester",
    rating: 4.9,
    reviews: 74,
    mode: "In-person",
    tags: ["Powerlifting", "Hypertrophy", "Performance"],
    image: proDaniel,
  },
  {
    name: "Priya Sharma",
    role: "Nutritionist",
    city: "Bristol",
    rating: 5.0,
    reviews: 112,
    mode: "Online",
    tags: ["Sports Nutrition", "Fat Loss", "Habit Coaching"],
    image: proLaura,
  },
];

const CITIES = [
  { slug: "london", label: "London", count: 482 },
  { slug: "manchester", label: "Manchester", count: 164 },
  { slug: "birmingham", label: "Birmingham", count: 128 },
  { slug: "leeds", label: "Leeds", count: 86 },
  { slug: "edinburgh", label: "Edinburgh", count: 74 },
  { slug: "glasgow", label: "Glasgow", count: 69 },
  { slug: "bristol", label: "Bristol", count: 58 },
  { slug: "cardiff", label: "Cardiff", count: 41 },
];

const TRUST = [
  { icon: ShieldCheck, title: "Verified Credentials", sub: "Every professional is identity & qualification checked." },
  { icon: Trophy, title: "Recognised Training", sub: "Held to internationally recognised standards." },
  { icon: BadgeCheck, title: "Insurance & DBS", sub: "Active insurance and enhanced DBS where required." },
  { icon: Users, title: "Real Reviews", sub: "Only verified clients can leave a review." },
];

const FAQS = [
  {
    q: "What does REPS-verified mean?",
    a: "Each professional has had their identity, qualifications, insurance and (where required) DBS checked by our verification team before going live on the platform.",
  },
  {
    q: "Can I book a session through REPS?",
    a: "Yes. Once you find someone you like, send an enquiry directly from their profile. They'll confirm availability and pricing, and you can book straight from the chat.",
  },
  {
    q: "Are there online options?",
    a: "Yes — many professionals offer remote coaching. Use the 'Online' filter on the directory to see only those who deliver online programmes and check-ins.",
  },
  {
    q: "How much does it cost?",
    a: "Pricing is set by each professional. You'll see typical rates on their profile and a clear quote on your enquiry before you commit to anything.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function ProfessionLanding() {
  const { profession } = Route.useParams();
  const meta = getProfession(profession);

  const fallbackImgs = [proJames, proSophie, proDaniel, proLaura];
  const { data: liveResult } = useQuery({
    queryKey: ["directory-featured-profession", meta.slug],
    queryFn: () => searchProfessionals({ data: { profession: meta.slug, limit: 4 } }),
    staleTime: 60_000,
  });
  const livePros = liveResult?.rows ?? [];
  const featured: FeaturedPro[] = livePros.length
    ? livePros.slice(0, 4).map((r, i) => rowToFeaturedPro(r, fallbackImgs[i % fallbackImgs.length]))
    : FEATURED.slice(0, 4);






  return (
    <div className="min-h-screen bg-reps-ivory text-reps-charcoal">
      <PublicHeader variant="solid" />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1320px] px-6 pt-6 lg:px-10">
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Find a Professional", to: "/find-a-professional" },
            { label: meta.plural },
          ]}
        />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-[1320px] px-6 pb-10 pt-6 lg:px-10 lg:pb-14 lg:pt-10">
        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-reps-muted-light">
              <BadgeCheck className="h-3 w-3 text-reps-orange" />
              {meta.count.toLocaleString()} REPS-verified {meta.plural.toLowerCase()}
            </span>
            <h1 className="mt-4 font-display text-[40px] font-bold leading-[1.05] text-reps-charcoal lg:text-[56px]">
              Find a verified <span className="text-reps-orange">{meta.title}</span>
            </h1>
            <p className="mt-4 max-w-[620px] text-[16px] leading-relaxed text-reps-muted-light">
              {meta.blurb}
            </p>

            {/* Inline search */}
            <form onSubmit={handleHeroSearch} className="mt-6 grid gap-2 rounded-[22px] border border-reps-stone bg-reps-warm-white p-2 sm:grid-cols-[1fr_1fr_auto]">
              <label className="flex items-center gap-2 rounded-[12px] bg-reps-ivory px-3 py-2.5">
                <Search className="h-4 w-4 text-reps-muted-light" />
                <input
                  type="text"
                  value={specialism}
                  onChange={(e) => setSpecialism(e.target.value)}
                  className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                  placeholder="e.g. Strength training, Fat loss"
                  aria-label={`Specialism or service for ${meta.title}`}
                />
              </label>
              <label className="flex items-center gap-2 rounded-[12px] bg-reps-ivory px-3 py-2.5">
                <MapPin className="h-4 w-4 text-reps-muted-light" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City, town or postcode"
                  className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                  aria-label="Location"
                />
              </label>
              <button
                type="submit"
                className="inline-flex h-[44px] items-center justify-center rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
              >
                Search
              </button>
            </form>

          </div>

          {/* Meta panel */}
          <aside className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-5">
            <h2 className="font-display text-[18px] font-bold text-reps-charcoal">At a glance</h2>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-reps-muted-light">Typical rate</dt>
                <dd className="font-semibold text-reps-charcoal">{meta.avgRate}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-reps-muted-light">Verified pros</dt>
                <dd className="font-semibold text-reps-charcoal">{meta.count.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-reps-muted-light">Avg. rating</dt>
                <dd className="flex items-center gap-1 font-semibold text-reps-charcoal">
                  <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" /> 4.9 / 5
                </dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-reps-stone pt-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-reps-muted-light">
                Typical qualifications
              </div>
              <ul className="space-y-1.5">
                {meta.qualifications.map((q) => (
                  <li key={q} className="flex items-start gap-2 text-[13px] text-reps-charcoal">
                    <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* Specialism chips */}
      <section className="border-y border-reps-stone bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-6 lg:px-10">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-reps-muted-light">
            Popular {meta.title.toLowerCase()} specialisms
          </div>
          <div className="flex flex-wrap gap-2">
            {meta.specialisms.map((s) => (
              <Link
                key={s}
                to="/find-a-professional"
                className="rounded-full border border-reps-stone bg-reps-ivory px-3.5 py-1.5 text-[13px] font-medium text-reps-charcoal hover:border-reps-orange hover:text-reps-orange"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured pros */}
      <section className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-[26px] font-bold leading-tight text-reps-charcoal lg:text-[32px]">
              Featured {meta.plural.toLowerCase()}
            </h2>
            <p className="mt-1 text-[14px] text-reps-muted-light">
              Hand-picked, REPS-verified and accepting new clients.
            </p>
          </div>
          <Link
            to="/find-a-professional"
            className="hidden items-center gap-1.5 text-[13px] font-semibold text-reps-orange hover:text-reps-orange-dark sm:inline-flex"
          >
            See all {meta.count.toLocaleString()} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p, i) => (
            <FeaturedProCard key={`${p.name}-${i}`} pro={p} />
          ))}
        </div>
      </section>

      {/* Cities */}
      <section className="bg-reps-warm-white py-14">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[26px] font-bold leading-tight text-reps-charcoal lg:text-[32px]">
                Browse {meta.plural.toLowerCase()} by city
              </h2>
              <p className="mt-1 text-[14px] text-reps-muted-light">
                A sample of cities — verified {meta.plural.toLowerCase()} are listed wherever you train.
              </p>
            </div>
            <Link
              to="/find-a-professional"
              className="hidden items-center gap-1.5 text-[13px] font-semibold text-reps-orange hover:text-reps-orange-dark sm:inline-flex"
            >
              See all locations <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CITIES.map((c) => (
              <Link
                key={c.slug}
                to="/in/$location"
                params={{ location: c.slug }}
                className="group flex items-center justify-between rounded-[16px] border border-reps-stone bg-reps-ivory px-4 py-3.5 transition-colors hover:border-reps-orange"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-reps-orange" />
                  <span className="text-[14px] font-semibold text-reps-charcoal">{meta.plural} in {c.label}</span>
                </span>
                <span className="text-[12px] text-reps-muted-light group-hover:text-reps-orange">{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust band */}
      <section className="bg-reps-ivory py-12">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="grid items-center gap-6 rounded-[18px] border border-reps-stone bg-reps-warm-white p-5 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
            <div>
              <h2 className="font-display text-[20px] font-bold leading-tight text-reps-charcoal">
                Why every {meta.title.toLowerCase()}
                <br />on REPS is verified
              </h2>
              <p className="mt-2 text-[13px] text-reps-muted-light">
                You shouldn't have to guess whether someone is qualified. We do the checking.
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

      {/* FAQ */}
      <section className="bg-reps-warm-white py-14">
        <div className="mx-auto max-w-[860px] px-6 lg:px-10">
          <h2 className="font-display text-[26px] font-bold leading-tight text-reps-charcoal lg:text-[32px]">
            Hiring a {meta.title.toLowerCase()} on REPS
          </h2>
          <Accordion
            type="single"
            collapsible
            className="mt-6 overflow-hidden rounded-[18px] border border-reps-stone bg-reps-ivory"
          >
            {FAQS.map((f, i) => (
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

      {/* Related */}
      <section className="bg-reps-ivory py-14">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <h2 className="font-display text-[22px] font-bold leading-tight text-reps-charcoal">
            Related professions
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {meta.related.map((r) => (
              <Link
                key={r.slug}
                to="/professions/$profession"
                params={{ profession: r.slug }}
                className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-4 py-2 text-[13px] font-semibold text-reps-charcoal hover:border-reps-orange hover:text-reps-orange"
              >
                <UserRound className="h-3.5 w-3.5" />
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
