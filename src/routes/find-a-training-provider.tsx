import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronRight, MapPin, Search, ShieldCheck, Star, Users } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { listPublicProviders, type ProviderCard } from "@/lib/directory/providers.functions";

const MODES = [
  { key: "any", label: "All delivery" },
  { key: "in_person", label: "In-person" },
  { key: "online", label: "Online" },
  { key: "blended", label: "Blended" },
] as const;

type Mode = (typeof MODES)[number]["key"];

export const Route = createFileRoute("/find-a-training-provider")({
  head: () => {
    const title = "Find a REPS-verified training provider";
    const description =
      "Browse REPS-verified training providers. Ofqual-regulated courses, recognised awarding bodies, and vetted tutors — pick the right provider for your next qualification.";
    const url = "https://repsuk.org/find-a-training-provider";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: FindTrainingProviderPage,
});

function FindTrainingProviderPage() {
  const [q, setQ] = React.useState("");
  const [city, setCity] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("any");

  const fetchProviders = useServerFn(listPublicProviders);
  const { data, isLoading } = useQuery({
    queryKey: ["public-providers", q, city, mode],
    queryFn: () =>
      fetchProviders({
        data: {
          q: q || undefined,
          city: city || undefined,
          mode: mode === "any" ? undefined : mode,
        },
      }),
    staleTime: 60_000,
  });

  const rows = data?.rows ?? [];

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-black antialiased">
      <PublicHeader variant="solid" mobileOpaque />

      <main id="main-content">
        {/* Hero */}
        <section className="border-b border-black/10 bg-white">
          <div className="mx-auto max-w-[1180px] px-4 py-12 lg:px-6 lg:py-16">
            <nav aria-label="Breadcrumb" className="text-[13px] text-black/55">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/" className="hover:text-black">Home</Link>
                </li>
                <li aria-hidden><ChevronRight className="h-3.5 w-3.5" strokeWidth={2} /></li>
                <li aria-current="page" className="font-medium text-black">Training providers</li>
              </ol>
            </nav>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
              REPS Verified
            </span>
            <h1 className="mt-3 font-display text-[34px] font-bold leading-[1.05] tracking-[-0.01em] text-black lg:text-[46px]">
              Find a training provider
            </h1>
            <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-black/65 lg:text-[16px]">
              Ofqual-regulated qualifications and CPD from REPS-verified training providers.
              Every provider on this directory has been checked for accreditation, insurance
              and delivery standards.
            </p>

            {/* Search rail */}
            <div className="mt-6 grid grid-cols-1 gap-3 rounded-[18px] border border-black/10 bg-white p-3 md:grid-cols-[1fr_1fr_auto] lg:p-4">
              <label className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-black/40" strokeWidth={2} />
                <input
                  type="search"
                  placeholder="Search providers"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-11 w-full rounded-[12px] border border-black/10 bg-white pl-9 pr-3 text-[14px] text-black placeholder:text-black/45 focus:border-[#FF7A00] focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/25"
                />
              </label>
              <label className="relative flex items-center">
                <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-black/40" strokeWidth={2} />
                <input
                  type="search"
                  placeholder="City or town"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 w-full rounded-[12px] border border-black/10 bg-white pl-9 pr-3 text-[14px] text-black placeholder:text-black/45 focus:border-[#FF7A00] focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/25"
                />
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MODES.map((m) => {
                  const active = mode === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMode(m.key)}
                      className={
                        active
                          ? "inline-flex h-11 items-center rounded-[12px] bg-black px-3 text-[13px] font-semibold text-white"
                          : "inline-flex h-11 items-center rounded-[12px] border border-black/12 bg-white px-3 text-[13px] font-medium text-black/70 hover:border-black/30"
                      }
                      aria-pressed={active}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="mx-auto max-w-[1180px] px-4 py-10 lg:px-6 lg:py-14">
          <header className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-[20px] font-bold text-black">
              {isLoading
                ? "Loading providers…"
                : `${rows.length} ${rows.length === 1 ? "provider" : "providers"}`}
            </h2>
          </header>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[300px] animate-pulse rounded-[18px] border border-black/10 bg-white"
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((r) => (
                <ProviderCardTile key={r.id} row={r} />
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function providerGradient(name: string): string {
  // Deterministic warm gradient derived from the provider name — keeps
  // hero-less cards feeling branded rather than empty.
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = 18 + (hash % 28); // orange (18) → amber (46)
  const h2 = 30 + ((hash >> 3) % 20);
  return `linear-gradient(135deg, hsl(${hue} 78% 58%) 0%, hsl(${h2} 65% 42%) 100%)`;
}

function ProviderCardTile({ row }: { row: ProviderCard }) {
  const deliveryLabel =
    row.in_person_available && row.online_available
      ? "Blended"
      : row.online_available
        ? "Online"
        : "In-person";
  const monogram = (row.name?.trim()?.[0] ?? "•").toUpperCase();
  return (
    <Link
      to="/t/$slug"
      params={{ slug: row.slug }}
      className="group flex flex-col overflow-hidden rounded-[18px] border border-black/10 bg-white transition-all hover:-translate-y-0.5 hover:border-black/25 hover:shadow-[0_12px_28px_-16px_rgba(0,0,0,0.25)]"
    >
      <div
        className="relative aspect-[16/9] w-full overflow-hidden"
        style={row.hero_image_url ? undefined : { background: providerGradient(row.name) }}
      >
        {row.hero_image_url ? (
          <img
            src={row.hero_image_url}
            alt=""
            aria-hidden
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : null}
        {/* Legibility wash so the logo chip always reads on photo or gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent"
        />
        {/* Logo chip */}
        <div className="absolute bottom-3 left-3 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[14px] bg-white ring-1 ring-black/5 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.35)]">
          {row.avatar_url ? (
            <img
              src={row.avatar_url}
              alt={`${row.name} logo`}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          ) : (
            <span className="font-display text-[20px] font-bold text-black/80">
              {monogram}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          {row.verified ? (
            <div className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.2} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                REPS Verified
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/45">
                Unverified
              </span>
            </div>
          )}
          {row.rating_avg != null && row.review_count > 0 ? (
            <span className="inline-flex items-center gap-1 text-[12.5px] text-black/60">
              <Star className="h-3.5 w-3.5 fill-[#FF7A00] text-[#FF7A00]" strokeWidth={0} />
              <span className="font-semibold text-black">{row.rating_avg.toFixed(1)}</span>
              <span className="text-black/55">({row.review_count})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[12.5px] text-black/45">
              <Star className="h-3.5 w-3.5" strokeWidth={2} />
              New
            </span>
          )}
        </div>
        <h3 className="font-display text-[17px] font-bold leading-tight text-black group-hover:text-[#E96F00]">
          {row.name}
        </h3>
        {row.registered_address ? (
          <p className="flex items-start gap-1.5 text-[13px] leading-snug text-black/60">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-black/45" strokeWidth={2} />
            <span className="line-clamp-2">{row.registered_address}</span>
          </p>
        ) : row.tagline ? (
          <p className="line-clamp-2 text-[13px] text-black/60">{row.tagline}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-[12.5px] text-black/60">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
            {deliveryLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[18px] border border-dashed border-black/15 bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f6f2] text-black/40">
        <Building2 className="h-6 w-6" strokeWidth={1.6} />
      </div>
      <h3 className="mt-4 font-display text-[18px] font-bold text-black">
        No providers match your search
      </h3>
      <p className="mx-auto mt-2 max-w-[420px] text-[13.5px] text-black/60">
        Try clearing your filters or search by provider name. New training providers are added
        as they complete REPS verification.
      </p>
    </div>
  );
}
