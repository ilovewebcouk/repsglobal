import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { searchProfessionals } from "@/lib/directory/search.functions";
import { getProfessionLabel } from "@/lib/professions";
import { getSpecialismLabel } from "@/lib/specialisms";
import { searchTaxonomy } from "@/lib/search/taxonomy";

import { useViewerOrigin } from "@/lib/useViewerOrigin";
import { haversineMiles, formatMiles } from "@/lib/geo";
import { ResultsSearchBar, type ResultsBarMode, type ResultsBarSort, type ResultsBarState } from "@/components/directory/ResultsSearchBar";
import {
  Bookmark,
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
  Users,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VENUES } from "@/components/marketing/VenueWordmarks";
import { Monogram } from "@/components/directory/Monogram";
import { VerificationPill } from "@/components/directory/VerificationPill";

import proSophie from "@/assets/pro-sophie.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import proLaura from "@/assets/pro-laura.jpg";

const VALID_VENUE_SLUGS = new Set([
  "puregym",
  "gym-group",
  "virgin-active",
  "bannatyne",
  "david-lloyd",
  "nuffield-health",
  "third-space",
  "anytime-fitness",
]);

const VALID_SORTS = new Set<ResultsBarSort>(["recommended", "nearest", "rating", "most_reviewed", "newest"]);
const VALID_MODES = new Set<ResultsBarMode>(["any", "in_person", "online"]);

export const Route = createFileRoute("/find-a-professional")({
  validateSearch: (raw: Record<string, unknown>) => {
    const venueRaw = typeof raw.venue === "string" ? raw.venue : undefined;
    const venue = venueRaw && VALID_VENUE_SLUGS.has(venueRaw) ? venueRaw : undefined;
    const str = (k: string) =>
      typeof raw[k] === "string" && (raw[k] as string).length > 0
        ? ((raw[k] as string).slice(0, 120))
        : undefined;
    const pageRaw = Number(raw.page);
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
    const sortRaw =
      typeof raw.sort === "string" && VALID_SORTS.has(raw.sort as ResultsBarSort)
        ? (raw.sort as ResultsBarSort)
        : ("nearest" as ResultsBarSort);
    const modeRaw =
      typeof raw.mode === "string" && VALID_MODES.has(raw.mode as ResultsBarMode)
        ? (raw.mode as ResultsBarMode)
        : ("any" as ResultsBarMode);
    const ratingRaw = Number(raw.min_rating);
    const min_rating =
      Number.isFinite(ratingRaw) && ratingRaw >= 0 && ratingRaw <= 5
        ? Math.floor(ratingRaw)
        : 0;
    const radiusRaw = Number(raw.radius_mi);
    const radius_mi =
      Number.isFinite(radiusRaw) && radiusRaw >= 0 && radiusRaw <= 200
        ? Math.floor(radiusRaw)
        : 0;
    return {
      venue,
      city: str("city"),
      profession: str("profession"),
      specialism: str("specialism"),
      q: str("q"),
      page,
      sort: sortRaw,
      mode: modeRaw,
      min_rating,
      radius_mi,
    };
  },
  head: () => ({
    meta: [
      { title: "Find a Professional — REPS" },
      {
        name: "description",
        content:
          "Search verified personal trainers, Pilates instructors, nutritionists and coaches near you. Filter by specialism, location, training type, gym and rating.",
      },
      { property: "og:title", content: "Find a Professional — REPS" },
      {
        property: "og:description",
        content:
          "Browse REPS-verified fitness professionals. Filter by specialism, location, gym and training type.",
      },
      { property: "og:url", content: "/find-a-professional" },
    ],
    links: [{ rel: "canonical", href: "/find-a-professional" }],
  }),
  component: DirectoryPage,
});


type ProGymPill = {
  id: string;
  name: string;
  branch: string | null;
};

type Pro = {
  name: string;
  role: string;
  /** Legacy display fallback (neighbourhood · miles). Used when no viewer origin. */
  distance: string;
  /** Town/area label, used when computing live distance from viewer origin. */
  town?: string;
  /** Approximate lat/lng — when viewer origin is set, drives the real distance. */
  coords?: { latitude: number; longitude: number };
  rating: number;
  reviews: number;
  mode: "In-person" | "Online" | "In-person & Online";
  /** Real specialism labels — empty array when the pro hasn't set any yet. */
  tags: string[];
  blurb: string;
  /** null → render Monogram fallback. Never substitute another pro's photo. */
  image: string | null;
  /** Real gym pills from professional_gyms. */
  gyms: ProGymPill[];
  /** Lowest published service price in pence. */
  from_price_pence: number | null;
  /** ISO timestamp — drives "Newest" sort. */
  created_at: string | null;
  featured?: boolean;
  /** Override slug for live DB pros — otherwise derived from name. */
  slug?: string;
  /** True for rows pulled from the DB (vs static visual seed data). */
  live?: boolean;
  /** Trust-state plumbing for VerificationPill. */
  identity_status?: string | null;
  verification?: string | null;
  tier?: "studio" | "pro" | "verified" | "free";
};

const trustItems = [
  { icon: ShieldCheck, title: "REPS Verified", sub: "Qualifications & insurance check" },
  { icon: Star, title: "Reviewed & Rated", sub: "Real client feedback" },
  { icon: Trophy, title: "Ongoing Standards", sub: "Committed to CPD & excellence" },
  { icon: Users, title: "Trusted Worldwide", sub: "In-person & online" },
];

const testimonials = [
  {
    quote:
      "I'd been burned by PTs who weren't actually qualified. REPS let me see credentials before I even booked. My coach is brilliant.",
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
      "I work shifts so I needed someone flexible and remote. REPS filtered down to qualified online coaches in minutes.",
    name: "Tom B.",
    role: "Online coaching",
    city: "Bristol",
    image: proDaniel,
  },
];

const PAGE_SIZE = 24;

function DirectoryPage() {
  const {
    venue: venueFilter,
    city,
    profession,
    specialism,
    q,
    page,
    sort,
    mode,
    min_rating,
    radius_mi,
  } = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeVenue = VENUES.find((v) => v.slug === venueFilter);

  // Map mode → server boolean filters (preserves existing search.functions API).
  const serverFilters = {
    online: mode === "online" ? true : undefined,
    in_person: mode === "in_person" ? true : undefined,
  };

  const search = useServerFn(searchProfessionals);
  const { data: liveResult, isPending, isError, refetch } = useQuery({
    queryKey: ["directory", "search", { city, profession, specialism, q, page, mode }],
    queryFn: () =>
      search({
        data: {
          city,
          profession,
          specialism,
          q,
          page,
          limit: PAGE_SIZE,
          online: serverFilters.online,
          in_person: serverFilters.in_person,
        },
      }),
    staleTime: 60_000,
  });
  const livePros = liveResult?.rows ?? [];
  const total = liveResult?.total ?? 0;

  const liveAsPros: Pro[] = React.useMemo(
    () =>
      livePros
        .filter((r) => r.slug)
        .map((r) => {
          const town = r.location?.town ?? r.location?.postcode_outward ?? r.city ?? null;
          const coords =
            r.location?.latitude != null && r.location?.longitude != null
              ? { latitude: r.location.latitude, longitude: r.location.longitude }
              : undefined;
          const specLabels = (r.specialisms ?? [])
            .map((s) => getSpecialismLabel(s) ?? s)
            .filter(Boolean) as string[];
          const professionLabel = getProfessionLabel(r.primary_profession);
          return {
            name: r.full_name || "REPs Professional",
            role: professionLabel || specLabels[0] || "Fitness Professional",
            distance: town ?? "—",
            town: town ?? undefined,
            coords,
            rating: r.rating_avg ?? 0,
            reviews: r.review_count,
            mode: r.in_person_available && r.online_available
              ? "In-person & Online" as const
              : r.online_available
                ? "Online" as const
                : "In-person" as const,
            tags: specLabels.slice(0, 3),
            blurb: r.headline || "",
            image: r.avatar_url ?? null,
            gyms: r.gyms,
            from_price_pence: r.from_price_pence,
            created_at: r.created_at,
            slug: r.slug ?? undefined,
            live: true,
            identity_status: r.identity_status,
            verification: r.verification,
            tier: r.tier,
          };
        }),
    [livePros],
  );

  const venueFiltered = activeVenue
    ? liveAsPros.filter((p) =>
        p.gyms.some((g) => g.name.toLowerCase().includes(activeVenue.label.toLowerCase())),
      )
    : liveAsPros;

  // Viewer origin (postcode / geolocation) — drives live distance + nearest sort
  const { origin } = useViewerOrigin();

  // No fallback: "Nearest" is the default sort. When viewer has no origin,
  // server-side quality ranking applies (the client-side .sort() is a no-op
  // for nearest without origin), so the list still renders sensibly.

  // Decorate with real miles when origin + coords both exist
  type WithMiles = Pro & { _miles: number | null };
  const decorated: WithMiles[] = React.useMemo(
    () =>
      venueFiltered.map((p) => ({
        ...p,
        _miles:
          origin && p.coords
            ? haversineMiles(origin, p.coords)
            : null,
      })),
    [venueFiltered, origin],
  );

  // Client-side filter: rating + radius. Auto-widen when a radius leaves <5 results.
  const ratingFiltered = React.useMemo(
    () => (min_rating > 0 ? decorated.filter((p) => p.rating >= min_rating) : decorated),
    [decorated, min_rating],
  );

  const withinRadius = React.useMemo(() => {
    if (!origin || radius_mi <= 0) return ratingFiltered;
    return ratingFiltered.filter((p) => p._miles == null || p._miles <= radius_mi);
  }, [ratingFiltered, origin, radius_mi]);

  // Auto-widen rescue: if a radius cap leaves <5 results, surface the next tier.
  const autoWidenTiers = [10, 25, 50, 100];
  const autoWidenResult = React.useMemo(() => {
    if (!origin || radius_mi <= 0) return null;
    if (withinRadius.length >= 5) return null;
    for (const tier of autoWidenTiers) {
      if (tier <= radius_mi) continue;
      const wider = ratingFiltered.filter((p) => p._miles == null || p._miles <= tier);
      if (wider.length > withinRadius.length) {
        return { tier, rows: wider, extras: wider.length - withinRadius.length };
      }
    }
    return null;
  }, [origin, radius_mi, withinRadius, ratingFiltered]);

  const baseList = autoWidenResult ? autoWidenResult.rows : withinRadius;

  const visiblePros = React.useMemo(() => {
    const arr = [...baseList];
    if (sort === "nearest" && origin) {
      arr.sort((a, b) => {
        if (a._miles == null && b._miles == null) return 0;
        if (a._miles == null) return 1;
        if (b._miles == null) return -1;
        return a._miles - b._miles;
      });
    } else if (sort === "rating") {
      arr.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    } else if (sort === "most_reviewed") {
      arr.sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
    } else if (sort === "newest") {
      arr.sort((a, b) => {
        const at = a.created_at ? Date.parse(a.created_at) : 0;
        const bt = b.created_at ? Date.parse(b.created_at) : 0;
        return bt - at;
      });
    }
    return arr;
  }, [baseList, sort, origin]);

  const goToPage = (n: number) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, page: n }) });

  // When a radius is active with an origin, pagination must reflect the
  // FILTERED visible set (client-side filter), not the raw server total.
  // Otherwise a 1-mile radius showing 2 cards still offers 17 pages.
  const radiusActive = Boolean(origin) && radius_mi > 0;
  const visibleTotal = radiusActive ? visiblePros.length : total;
  const totalPages = Math.max(1, Math.ceil(visibleTotal / PAGE_SIZE));
  const rangeStart = visibleTotal === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, visibleTotal);

  // Scroll to results on page change
  const resultsRef = React.useRef<HTMLDivElement | null>(null);
  const prevPage = React.useRef(page);
  React.useEffect(() => {
    if (prevPage.current !== page) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      prevPage.current = page;
    }
  }, [page]);

  const barState: ResultsBarState = {
    profession,
    specialism,
    q,
    city,
    venue: venueFilter,
    mode,
    min_rating,
    radius_mi,
    sort,
  };

  const countLabel = activeVenue
    ? `${visiblePros.length} at ${activeVenue.label}`
    : visibleTotal === 0
      ? "No results"
      : `${visibleTotal.toLocaleString()} professional${visibleTotal === 1 ? "" : "s"}${city ? ` · ${city}` : ""}`;

  return (
    <div className="min-h-screen bg-reps-ivory">
      <PublicHeader variant="solid" />

      {/* Header is fixed 72px — reserve that height so content starts below it,
          then the sticky search bar mounts immediately and visually butts up
          to the header at scroll-top. */}
      <div className="h-[72px]" aria-hidden />

      <ResultsSearchBar state={barState} total={visibleTotal} countLabel={countLabel} />

      {/* ============ RESULTS ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1100px] px-5 pb-10 pt-3 sm:px-6 sm:pt-4 lg:px-10 lg:pb-14 lg:pt-5">
          <div ref={resultsRef}>
            {/* Did-you-mean: free-text q with no structured filter */}
            {q && !profession && !specialism ? <DidYouMeanBanner query={q} /> : null}

            {/* Auto-widen rescue banner */}
            {autoWidenResult ? (
              <div className="mt-2 rounded-[12px] border border-reps-orange/30 bg-reps-orange/[0.06] p-3 text-[13px] text-reps-charcoal">
                <span className="font-medium">
                  Only {withinRadius.length} within {radius_mi} mi.
                </span>{" "}
                <span className="text-reps-muted-light">
                  Showing {autoWidenResult.extras} more within {autoWidenResult.tier} mi.
                </span>
              </div>
            ) : null}

            {/* Cards w/ rhythm break */}
            {isPending ? (
              <div className="space-y-4 pt-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[180px] animate-pulse rounded-[18px] border border-reps-stone bg-reps-warm-white"
                  />
                ))}
              </div>
            ) : isError ? (
              <div className="mt-6 rounded-[18px] border border-reps-stone bg-reps-warm-white p-8 text-center">
                <p className="text-[14px] text-reps-muted-light">Couldn't load professionals.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 inline-flex h-9 items-center rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-dark"
                >
                  Try again
                </button>
              </div>
            ) : visiblePros.length === 0 ? (
              <EmptyResults />
            ) : (
              <div className="space-y-3 pt-2 sm:pt-3">
                {visiblePros.slice(0, 4).map((p, i) => (
                  <ProCard
                    key={p.slug ?? p.name}
                    pro={p}
                    isClosest={i === 0 && sort === "nearest" && Boolean(origin) && p._miles != null}
                  />
                ))}

                {visiblePros.length > 4 && <EditorialBreak />}

                {visiblePros.slice(4).map((p) => (
                  <ProCard key={p.slug ?? p.name} pro={p} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                aria-label="Pagination"
                className="mt-8 flex flex-col items-center gap-3 border-t border-reps-stone/70 pt-6 sm:mt-10 sm:flex-row sm:justify-between"
              >
                <p className="text-[13px] text-reps-muted-light">
                  Showing{" "}
                  <span className="font-semibold text-reps-charcoal">
                    {rangeStart}–{rangeEnd}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-reps-charcoal">
                    {visibleTotal.toLocaleString()}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <PagerBtn
                    aria-label="Previous"
                    disabled={page <= 1}
                    onClick={() => goToPage(Math.max(1, page - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </PagerBtn>
                  {compactPagerRange(page, totalPages).map((item, idx) =>
                    item === "…" ? (
                      <span
                        key={`gap-${idx}`}
                        className="px-1 text-reps-muted-light"
                      >
                        …
                      </span>
                    ) : (
                      <PagerNum
                        key={item}
                        n={item}
                        active={item === page}
                        onClick={() => goToPage(item)}
                      />
                    ),
                  )}
                  <PagerBtn
                    aria-label="Next"
                    disabled={page >= totalPages}
                    onClick={() => goToPage(Math.min(totalPages, page + 1))}
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </PagerBtn>
                </div>
              </nav>
            )}

            {/* Help card — moved from sidebar */}
            <div className="mt-10 rounded-[18px] border border-reps-stone bg-reps-warm-white p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-reps-orange/12 text-reps-orange">
                  <Compass className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-[15px] font-bold leading-snug text-reps-charcoal">
                    Can't find your match?
                  </h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-reps-muted-light">
                    Tell us what you're looking for and we'll hand-match you to a verified REP within 24 hours.
                  </p>
                </div>
                <Link
                  to="/find-a-professional"
                  className="inline-flex items-center gap-1 self-center text-[12.5px] font-semibold text-reps-orange hover:text-reps-orange-dark"
                >
                  Tell us what you need
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
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
                  The REPS standard
                </div>
                <h2 className="mt-2 font-display text-[22px] font-bold leading-tight text-reps-charcoal sm:text-[24px]">
                  Why trust REPS professionals?
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
              Real stories from clients who used REPS to find a coach they could trust.
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



function proSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatFromPrice(pence: number | null) {
  if (pence == null) return null;
  const pounds = Math.round(pence / 100);
  return `From £${pounds}/session`;
}

function ProCard({
  pro,
  isClosest = false,
}: {
  pro: Pro & { _miles?: number | null };
  isClosest?: boolean;
}) {
  const photoSize = pro.featured ? 144 : 120;
  const mobilePhotoSize = pro.featured ? 96 : 88;
  const priceLabel = formatFromPrice(pro.from_price_pence);
  const showRating = pro.reviews > 0;
  // "New on REPs" only for the first 60 days after the profile was created,
  // and only when there are still zero reviews. After that the pill is hidden.
  const NEW_PILL_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;
  const isNewPro =
    !showRating &&
    pro.live === true &&
    pro.created_at != null &&
    Date.now() - Date.parse(pro.created_at) < NEW_PILL_WINDOW_MS;

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
      <div
        className="flex flex-col gap-4 sm:grid sm:items-center sm:gap-4 sm:[grid-template-columns:var(--cols)]"
        style={{ ["--cols" as never]: `${photoSize}px 1fr auto` }}
      >
        {/* TOP: photo + heading + save (mobile inline; sm grid cell) */}
        <div className="flex items-start gap-3 sm:block">
          <div className="relative shrink-0">
            {pro.image ? (
              <img
                src={pro.image}
                alt={`${pro.name} — ${pro.role}`}
                className="rounded-[16px] object-cover sm:!h-[var(--p)] sm:!w-[var(--p)]"
                style={{
                  width: mobilePhotoSize,
                  height: mobilePhotoSize,
                  ["--p" as never]: `${photoSize}px`,
                }}
                loading="lazy"
                width={photoSize * 2}
                height={photoSize * 2}
              />
            ) : (
              <>
                <Monogram
                  name={pro.name}
                  size={mobilePhotoSize}
                  className="sm:hidden"
                />
                <Monogram
                  name={pro.name}
                  size={photoSize}
                  className="hidden sm:inline-flex"
                />
              </>
            )}
            {pro.featured && (
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-reps-orange px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white sm:left-2 sm:top-2">
                <Sparkles className="h-3 w-3" />
                Featured
              </span>
            )}
            {isClosest && !pro.featured && (
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-reps-charcoal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white sm:left-2 sm:top-2">
                <MapPin className="h-3 w-3" />
                Closest
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
              <div className="mt-1.5">
                <VerificationPill
                  identityStatus={pro.identity_status}
                  verification={pro.verification}
                  tier={pro.tier}
                  compact
                />
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Save"
                  className="shrink-0 rounded-full border border-reps-stone bg-white p-2 text-reps-muted-light transition-colors hover:border-reps-orange hover:text-reps-orange"
                >
                  <Bookmark className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={6} className="bg-reps-black text-white">Save</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* MAIN content */}
        <div className="min-w-0">
          {/* Desktop heading (hidden on mobile, shown sm+) */}
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <h3 className="font-display text-[17px] font-bold leading-tight text-reps-charcoal">
              {pro.name}
            </h3>
            <VerificationPill
              identityStatus={pro.identity_status}
              verification={pro.verification}
              tier={pro.tier}
            />
            {isNewPro && (
              <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">
                New on REPs
              </span>
            )}
          </div>
          <div className="mt-0.5 hidden text-[12.5px] text-reps-muted-light sm:block">{pro.role}</div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-reps-muted-light sm:text-[12.5px]">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {pro._miles != null && pro.town ? (
                <>
                  {pro.town} ·{" "}
                  <span className="font-semibold text-reps-charcoal">{formatMiles(pro._miles)}</span>
                </>
              ) : (
                pro.town ?? pro.distance
              )}
            </span>
            {showRating && (
              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
                <span className="font-semibold text-reps-orange">{pro.rating.toFixed(1)}</span>
                <span>({pro.reviews})</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Laptop className="h-3.5 w-3.5" />
              {pro.mode}
            </span>
            {priceLabel && (
              <span className="font-semibold text-reps-charcoal">{priceLabel}</span>
            )}
          </div>
          {pro.blurb && (
            <p className="mt-1.5 line-clamp-1 max-w-[560px] text-[13px] leading-snug text-reps-charcoal/80 lg:line-clamp-2">
              {pro.blurb}
            </p>
          )}
          {pro.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pro.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-reps-stone bg-reps-ivory px-2 py-0.5 text-[11px] font-medium text-reps-charcoal"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {pro.gyms.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-reps-muted-light">
              <span className="font-semibold uppercase tracking-[0.08em] text-reps-muted-light/90">
                Trains at
              </span>
              {pro.gyms.slice(0, 2).map((g) => (
                <span
                  key={g.id}
                  className="rounded-full border border-reps-stone bg-reps-warm-white px-2 py-0.5 text-[11px] font-medium text-reps-charcoal"
                >
                  {g.name}
                  {g.branch ? ` · ${g.branch}` : ""}
                </span>
              ))}
              {pro.gyms.length > 2 && (
                <span className="text-[11px] text-reps-muted-light">
                  +{pro.gyms.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* RIGHT actions (desktop only) */}
        <div className="hidden flex-col items-end gap-2 sm:flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Save"
                className="rounded-full border border-reps-stone bg-white p-2 text-reps-muted-light transition-colors hover:border-reps-orange hover:text-reps-orange"
              >
                <Bookmark className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={6} className="bg-reps-black text-white">Save</TooltipContent>
          </Tooltip>
          <Link
            to="/pro/$slug"
            params={{ slug: pro.slug ?? proSlug(pro.name) }}
            className="inline-flex items-center justify-center rounded-[10px] bg-reps-orange px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
          >
            View profile
          </Link>
        </div>

        {/* Mobile full-width CTA */}
        <Link
          to="/pro/$slug"
          params={{ slug: pro.slug ?? proSlug(pro.name) }}
          className="inline-flex items-center justify-center rounded-[10px] bg-reps-orange px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-reps-orange-dark sm:hidden"
        >
          View profile
        </Link>
      </div>
    </article>
  );
}


function EmptyResults() {
  return (
    <div className="mt-5 rounded-[18px] border border-dashed border-reps-stone bg-reps-warm-white px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-reps-stone">
        <Search className="h-5 w-5 text-reps-muted-light" />
      </div>
      <h3 className="mt-4 font-display text-[18px] font-semibold text-reps-charcoal">
        No professionals match those filters
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-reps-muted-light">
        Try widening the distance, removing a specialism or venue, or switching between in-person and online.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-[10px] bg-reps-orange px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
        >
          Clear all filters
        </button>
        <Link
          to="/find-a-professional"
          className="inline-flex items-center justify-center rounded-[10px] border border-reps-stone bg-white px-4 py-2 text-[13px] font-semibold text-reps-charcoal transition-colors hover:border-reps-orange hover:text-reps-orange"
        >
          Browse all REPS
        </Link>
      </div>
    </div>
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
              Why REPS
            </div>
            <p className="mt-1 max-w-[520px] text-[14px] leading-snug text-white/85">
              Every professional on this page is qualification-checked, insurance-verified
              and bound to the REPS Code of Ethical Practice.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PagerNum({
  n,
  active,
  className,
  onClick,
}: {
  n: number;
  active?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
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
  className,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      {...rest}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-reps-stone bg-white text-reps-charcoal transition-colors hover:bg-reps-warm-white sm:h-11 sm:w-11 ${
        disabled ? "cursor-not-allowed opacity-40 hover:bg-white" : ""
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function compactPagerRange(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: Array<number | "…"> = [];
  const window = 1; // pages either side of current
  const head = current <= 4;
  const tail = current >= total - 3;

  if (head) {
    for (let i = 1; i <= 5; i++) out.push(i);
    out.push("…");
    out.push(total);
    return out;
  }
  if (tail) {
    out.push(1);
    out.push("…");
    for (let i = total - 4; i <= total; i++) out.push(i);
    return out;
  }
  out.push(1, "…");
  for (let i = current - window; i <= current + window; i++) out.push(i);
  out.push("…", total);
  return out;
}

function DidYouMeanBanner({ query }: { query: string }) {
  const matches = React.useMemo(() => searchTaxonomy(query).slice(0, 4), [query]);
  if (matches.length === 0) return null;
  return (
    <div className="mt-4 rounded-[12px] border border-reps-orange/30 bg-reps-orange/[0.06] p-3 text-[13px] text-reps-charcoal">
      <span className="font-medium">
        Showing name matches for "{query}".
      </span>{" "}
      <span className="text-reps-muted-light">Did you mean:</span>{" "}
      <span className="inline-flex flex-wrap gap-1.5 align-middle">
        {matches.map((m) => (
          <Link
            key={m.slug}
            to="/find-a-professional"
            search={{
              ...(m.route.profession ? { profession: m.route.profession } : {}),
              ...(m.route.specialism ? { specialism: m.route.specialism } : {}),
              page: 1,
              sort: "recommended",
            }}
            className="inline-flex items-center rounded-full border border-reps-orange/40 bg-reps-orange/10 px-2.5 py-0.5 text-[12px] font-medium text-reps-orange transition-colors hover:bg-reps-orange/15"
          >
            {m.label}
          </Link>
        ))}
      </span>
    </div>
  );
}
