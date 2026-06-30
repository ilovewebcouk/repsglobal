import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MapPin, ShieldCheck, BadgeCheck, Trophy, Users } from "lucide-react";

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
import { InlineHeroSearch } from "@/components/search/InlineHeroSearch";

import proDaniel from "@/assets/pro-daniel.jpg";
import proJames from "@/assets/pro-james.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proSophie from "@/assets/pro-sophie.jpg";

import {
  searchProfessionals,
  type SearchProfessionalRow,
} from "@/lib/directory/search.functions";
import { isProfessionSlug, PROFESSIONS, getProfessionLabel, getProfessionPlural } from "@/lib/professions";
import { getTitleLabel } from "@/lib/cpd/titles-catalog";

/* ----------------------- City catalogue (curated) ----------------------- */

type CityMeta = { slug: string; name: string; region: string };

const CITIES: Record<string, CityMeta> = {
  london: { slug: "london", name: "London", region: "Greater London" },
  manchester: { slug: "manchester", name: "Manchester", region: "Greater Manchester" },
  birmingham: { slug: "birmingham", name: "Birmingham", region: "West Midlands" },
  edinburgh: { slug: "edinburgh", name: "Edinburgh", region: "Lothian" },
  glasgow: { slug: "glasgow", name: "Glasgow", region: "Greater Glasgow" },
  bristol: { slug: "bristol", name: "Bristol", region: "South West" },
  leeds: { slug: "leeds", name: "Leeds", region: "West Yorkshire" },
  liverpool: { slug: "liverpool", name: "Liverpool", region: "Merseyside" },
  cardiff: { slug: "cardiff", name: "Cardiff", region: "South Wales" },
  newcastle: { slug: "newcastle", name: "Newcastle", region: "Tyne & Wear" },
  brighton: { slug: "brighton", name: "Brighton", region: "East Sussex" },
  nottingham: { slug: "nottingham", name: "Nottingham", region: "East Midlands" },
  sheffield: { slug: "sheffield", name: "Sheffield", region: "South Yorkshire" },
  oxford: { slug: "oxford", name: "Oxford", region: "Oxfordshire" },
  cambridge: { slug: "cambridge", name: "Cambridge", region: "Cambridgeshire" },
};

export const PROGRAMMATIC_CITY_SLUGS = Object.keys(CITIES);
export const PROGRAMMATIC_PROFESSION_SLUGS = PROFESSIONS.map((p) => p.slug);

function getCity(slug: string): CityMeta {
  return (
    CITIES[slug] ?? {
      slug,
      name: slug
        .split("-")
        .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : ""))
        .join(" "),
      region: "",
    }
  );
}

/* ------------------------------- Helpers ------------------------------- */

function rowToFeaturedPro(r: SearchProfessionalRow, fallbackImg: string): FeaturedPro {
  const mode: FeaturedPro["mode"] =
    r.in_person_available && r.online_available
      ? "In-person & Online"
      : r.online_available
        ? "Online"
        : "In-person";
  const primary =
    getTitleLabel(r.primary_title_slug) ?? getProfessionLabel(r.primary_profession) ?? "Personal Trainer";
  const secondary = getTitleLabel(r.secondary_title_slug);
  const role = secondary && secondary !== primary ? `${primary} & ${secondary}` : primary;
  return {
    name: r.full_name ?? "REPs Professional",
    role,
    city: r.location?.town ?? r.city ?? "",
    rating: 5.0,
    reviews: 0,
    mode,
    tags: (r.specialisms ?? []).slice(0, 3),
    image: r.avatar_url ?? fallbackImg,
    identityStatus: r.identity_status,
    verification: r.verification,
    tier: r.tier,
  };
}

const TRUST = [
  { icon: ShieldCheck, title: "Identity verified", sub: "ID-checked before going live." },
  { icon: Trophy, title: "Qualified", sub: "Recognised training standards." },
  { icon: BadgeCheck, title: "Insured", sub: "Active liability insurance on file." },
  { icon: Users, title: "Real reviews", sub: "Verified clients only." },
];

/* --------------------------------- Route -------------------------------- */

export const Route = createFileRoute("/in/$location/$profession")({
  loader: async ({ params }) => {
    if (!isProfessionSlug(params.profession)) throw notFound();
    const city = getCity(params.location);
    const result = await searchProfessionals({
      data: { city: city.name, profession: params.profession, limit: 24 },
    });
    return { city, profession: params.profession as string, rows: result.rows };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Not found | REPS" }, { name: "robots", content: "noindex,nofollow" }],
      };
    }
    const { city } = loaderData;
    const label = getProfessionLabel(loaderData.profession) ?? "Personal Trainer";
    const plural = getProfessionPlural(loaderData.profession) ?? `${label}s`;
    const canonical = `https://repsuk.org/in/${params.location}/${params.profession}`;
    const count = loaderData.rows.length;
    const countPhrase = count > 0 ? `${count}+ REPS-verified ${plural.toLowerCase()}` : `REPS-verified ${plural.toLowerCase()}`;
    const title = `${plural} in ${city.name} | REPS-Verified`;
    const description = `${countPhrase} in ${city.name}. Identity, qualifications and insurance checked. Find, message and book your ${label.toLowerCase()} on REPS.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: title,
            url: canonical,
            numberOfItems: count,
            itemListElement: loaderData.rows.slice(0, 10).map((r, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `https://repsuk.org/c/${r.slug}`,
              name: r.full_name ?? "REPS Professional",
            })),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://repsuk.org/" },
              {
                "@type": "ListItem",
                position: 2,
                name: city.name,
                item: `https://repsuk.org/in/${params.location}`,
              },
              { "@type": "ListItem", position: 3, name: plural, item: canonical },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-reps-ivory">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Page not found</h1>
        <Link to="/find-a-professional" className="mt-4 inline-block text-reps-orange underline">
          Find a professional
        </Link>
      </div>
    </div>
  ),
  component: ProfessionInCityPage,
});

/* --------------------------------- Page --------------------------------- */

const FALLBACK_IMGS = [proJames, proSophie, proDaniel, proLaura];

function ProfessionInCityPage() {
  const { location, profession } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const city = loaderData.city;
  const label = getProfessionLabel(profession) ?? "Personal Trainer";
  const plural = getProfessionPlural(profession) ?? `${label}s`;

  const { data } = useQuery({
    queryKey: ["in-city-profession", location, profession],
    queryFn: () =>
      searchProfessionals({ data: { city: city.name, profession, limit: 24 } }),
    staleTime: 60_000,
    initialData: { rows: loaderData.rows, total: loaderData.rows.length } as {
      rows: SearchProfessionalRow[];
      total: number;
    },
  });
  const rows = data?.rows ?? loaderData.rows;
  const featured: FeaturedPro[] = rows.map((r, i) =>
    rowToFeaturedPro(r, FALLBACK_IMGS[i % FALLBACK_IMGS.length]),
  );

  const otherProfessions = PROFESSIONS.filter((p) => p.slug !== profession);
  const otherCities = Object.values(CITIES).filter((c) => c.slug !== location);

  const faqs = [
    {
      q: `How do I find a ${label.toLowerCase()} in ${city.name}?`,
      a: `Browse the verified ${plural.toLowerCase()} on this page, open a profile to see services and prices, then message or book directly. Every professional listed has been identity- and qualification-checked by REPS.`,
    },
    {
      q: `How much does a ${label.toLowerCase()} in ${city.name} cost?`,
      a: `Prices are set by each professional. In ${city.name}, most ${plural.toLowerCase()} list between £45 and £85 per session for in-person work, with online coaching priced separately.`,
    },
    {
      q: `What does REPS-verified mean?`,
      a: `It means we've checked their identity (via Stripe Identity), confirmed their qualification with the issuing body, and verified active liability insurance. Verification is re-checked annually.`,
    },
    {
      q: `Can I work with a ${label.toLowerCase()} online instead?`,
      a: `Yes — many ${plural.toLowerCase()} in ${city.name} offer online coaching alongside in-person work. Look for the "Online" badge on each card.`,
    },
  ];

  return (
    <div className="min-h-screen bg-reps-ivory text-reps-charcoal">
      <PublicHeader variant="solid" />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1320px] px-6 pt-6 lg:px-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-reps-muted-light">
          <Link to="/" className="hover:text-reps-charcoal">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/in/$location" params={{ location }} className="hover:text-reps-charcoal">
            {city.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-reps-charcoal">{plural}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-[1320px] px-6 pb-10 pt-6 lg:px-10 lg:pb-14 lg:pt-10">
        <div>
          {city.region ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-reps-muted-light">
              <MapPin className="h-3 w-3 text-reps-orange" />
              {city.region}
            </span>
          ) : null}
          <h1 className="mt-4 max-w-[820px] font-display text-[40px] font-bold leading-[1.05] text-reps-charcoal lg:text-[56px]">
            Verified <span className="text-reps-orange">{plural.toLowerCase()}</span> in {city.name}
          </h1>
          <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-reps-muted-light">
            {rows.length > 0
              ? `${rows.length} REPS-verified ${plural.toLowerCase()} in ${city.name}. Identity, qualifications and insurance checked — message and book directly.`
              : `REPS-verified ${plural.toLowerCase()} in ${city.name}. Identity, qualifications and insurance checked. New professionals are joining every week.`}
          </p>

          <InlineHeroSearch
            variant="light"
            lockedCity={city.name}
            whatPlaceholder={`Specialism (e.g. ${profession === "personal-trainer" ? "fat loss, hypertrophy" : "technique, mobility"})`}
            className="mt-8"
          />
        </div>

        {/* Trust strip */}
        <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div
              key={t.title}
              className="flex items-start gap-3 rounded-[16px] border border-reps-stone bg-white p-4"
            >
              <t.icon className="h-5 w-5 shrink-0 text-reps-orange" />
              <div>
                <div className="text-[13px] font-semibold text-reps-charcoal">{t.title}</div>
                <div className="mt-0.5 text-[12px] text-reps-muted-light">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Results grid */}
      <section className="mx-auto max-w-[1320px] px-6 pb-16 lg:px-10 lg:pb-24">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-[24px] font-bold text-reps-charcoal lg:text-[28px]">
            {plural} in {city.name}
          </h2>
          <Link
            to="/find-a-professional"
            className="text-[13px] font-semibold text-reps-orange hover:underline"
          >
            See all →
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-[18px] border border-reps-stone bg-white p-10 text-center">
            <p className="text-[15px] text-reps-muted-light">
              No {plural.toLowerCase()} listed in {city.name} yet — try a nearby city, or browse all{" "}
              <Link to="/professions/$profession" params={{ profession }} className="text-reps-orange underline">
                {plural.toLowerCase()}
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <FeaturedProCard key={`${p.name}-${i}`} pro={p} />
            ))}
          </div>
        )}
      </section>

      {/* Other professions in this city */}
      <section className="border-t border-reps-stone bg-reps-warm-white py-12 lg:py-16">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <h2 className="font-display text-[22px] font-bold text-reps-charcoal lg:text-[26px]">
            Other fitness professionals in {city.name}
          </h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {otherProfessions.map((p) => (
              <Link
                key={p.slug}
                to="/in/$location/$profession"
                params={{ location, profession: p.slug }}
                className="inline-flex items-center rounded-full border border-reps-stone bg-white px-4 py-2 text-[13px] font-medium text-reps-charcoal hover:border-reps-orange hover:text-reps-orange"
              >
                {p.plural} in {city.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Same profession in other cities */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <h2 className="font-display text-[22px] font-bold text-reps-charcoal lg:text-[26px]">
            {plural} in other cities
          </h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                to="/in/$location/$profession"
                params={{ location: c.slug, profession }}
                className="inline-flex items-center rounded-full border border-reps-stone bg-white px-4 py-2 text-[13px] font-medium text-reps-charcoal hover:border-reps-orange hover:text-reps-orange"
              >
                {plural} in {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-reps-stone bg-reps-warm-white py-12 lg:py-16">
        <div className="mx-auto max-w-[820px] px-6 lg:px-0">
          <h2 className="font-display text-[24px] font-bold text-reps-charcoal lg:text-[30px]">
            FAQs — {plural.toLowerCase()} in {city.name}
          </h2>
          <Accordion type="single" collapsible className="mt-6">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`f-${i}`}>
                <AccordionTrigger className="text-left text-[15px] font-semibold text-reps-charcoal">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-reps-muted-light">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        {/* FAQPage JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      </section>

      <PublicFooter />
      {/* Suppress unused-import warning for Breadcrumb during refactor */}
      <span className="hidden">{Breadcrumb ? "" : ""}</span>
    </div>
  );
}
