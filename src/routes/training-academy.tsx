import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CourseRow } from "@/components/academy/CourseRow";
import {
  AcademyFilterRail,
  DEFAULT_FILTERS,
  isDefaultFilters,
  type AcademyFilterState,
} from "@/components/academy/AcademyFilterRail";

import { ACADEMY_COURSES } from "@/lib/training-academy";

const CANONICAL = "https://repsuk.org/training-academy";
const META_TITLE = "REPs Training Academy — Endorsed qualifications & CPD | REPS";
const META_DESC =
  "Browse qualifications and CPD courses from REPs-endorsed training providers. One catalogue, one endorsement mark, direct links to every provider.";

type SortKey = "recommended" | "rating-desc" | "cpd-desc" | "price-asc" | "level-asc";

const LEVEL_ORDER: Record<string, number> = { L2: 1, L3: 2, L4: 3, cpd: 4 };

export const Route = createFileRoute("/training-academy")({
  head: () => ({
    meta: [
      { title: META_TITLE },
      { name: "description", content: META_DESC },
      { property: "og:title", content: META_TITLE },
      { property: "og:description", content: META_DESC },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: TrainingAcademyPage,
});

function TrainingAcademyPage() {
  const [filters, setFilters] = useState<AcademyFilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const cpdMin = filters.cpdMin === "any" ? 0 : parseInt(filters.cpdMin, 10);
    const list = ACADEMY_COURSES.filter((c) => {
      if (q) {
        const hay = `${c.title} ${c.summary} ${c.provider.name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.profession !== "all" && c.profession !== filters.profession) return false;
      if (filters.level !== "all" && c.level !== filters.level) return false;
      if (filters.delivery !== "all" && c.delivery !== filters.delivery) return false;
      if (c.cpdPoints < cpdMin) return false;
      if (filters.providers.length > 0 && !filters.providers.includes(c.provider.slug)) return false;
      if (filters.ofqualOnly && !c.ofqualRegulated) return false;
      return true;
    });

    const sorted = [...list];
    if (sort === "rating-desc") sorted.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    else if (sort === "cpd-desc") sorted.sort((a, b) => b.cpdPoints - a.cpdPoints);
    else if (sort === "price-asc") sorted.sort((a, b) => a.priceFromGBP - b.priceFromGBP);
    else if (sort === "level-asc") sorted.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
    return sorted;
  }, [filters, sort]);

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-black antialiased">
      <PublicHeader variant="solid" mobileOpaque />

      <main id="main-content">
        {/* Compact header — matches Find a Training Provider */}
        <section className="border-b border-black/10 bg-white">
          <div className="mx-auto max-w-[1320px] px-4 py-10 lg:px-6 lg:py-14">
            <nav aria-label="Breadcrumb" className="text-[13px] text-black/55">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/" className="hover:text-black">Home</Link>
                </li>
                <li aria-hidden><ChevronRight className="h-3.5 w-3.5" strokeWidth={2} /></li>
                <li aria-current="page" className="font-medium text-black">Training Academy</li>
              </ol>
            </nav>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#FF7A00]/30 bg-[#FF7A00]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF7A00]">
              <GraduationCap className="h-3.5 w-3.5" strokeWidth={2.2} />
              REPs Training Academy
            </span>
            <h1 className="mt-3 font-display text-[34px] font-bold leading-[1.05] tracking-[-0.01em] text-black lg:text-[46px]">
              Every REPs-endorsed course, in one catalogue.
            </h1>
            <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-black/65 lg:text-[16px]">
              Qualifications and CPD from training providers that have applied for and passed the REPs
              endorsement review. Filter by level, specialism, delivery and CPD points — then head
              straight to the provider to enrol.
            </p>

            {/* Search + sort rail */}
            <div className="mt-6 grid grid-cols-1 gap-3 rounded-[18px] border border-black/10 bg-white p-3 md:grid-cols-[1fr_auto_auto] lg:p-4">
              <label className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-black/40" strokeWidth={2} />
                <input
                  type="search"
                  placeholder="Search courses, providers or specialisms…"
                  value={filters.query}
                  onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                  className="h-11 w-full rounded-[12px] border border-black/10 bg-white pl-9 pr-3 text-[14px] text-black placeholder:text-black/45 focus:border-[#FF7A00] focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/25"
                />
              </label>

              {/* Mobile filters trigger */}
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 rounded-[12px] border-black/12 bg-white px-4 text-[13px] font-semibold text-black shadow-none hover:border-black/30 lg:hidden"
                  >
                    <SlidersHorizontal data-icon="inline-start" />
                    Filters
                    {!isDefaultFilters(filters) ? (
                      <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-[#FF7A00] text-[10.5px] font-bold text-white">
                        ●
                      </span>
                    ) : null}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] overflow-y-auto bg-white p-6 sm:w-[360px]">
                  <SheetHeader className="p-0 pb-4">
                    <SheetTitle className="text-black">Filters</SheetTitle>
                    <SheetDescription className="text-black/55">
                      Narrow the catalogue by profession, level, delivery and provider.
                    </SheetDescription>
                  </SheetHeader>
                  <AcademyFilterRail value={filters} onChange={setFilters} />
                </SheetContent>
              </Sheet>

              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="h-11 w-full shrink-0 rounded-[12px] border-black/12 bg-white text-[13px] font-medium text-black shadow-none md:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="recommended">Sort: Recommended</SelectItem>
                    <SelectItem value="rating-desc">Sort: Highest rated</SelectItem>
                    <SelectItem value="cpd-desc">Sort: CPD points</SelectItem>
                    <SelectItem value="price-asc">Sort: Price (low → high)</SelectItem>
                    <SelectItem value="level-asc">Sort: Level (L2 → L4)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Directory: left rail + card grid */}
        <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-6 lg:py-14">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
            {/* Sticky filter rail */}
            <aside className="hidden lg:block">
              <div className="sticky top-[92px] rounded-[18px] border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <ScrollArea className="h-[calc(100vh-140px)] pr-3">
                  <AcademyFilterRail value={filters} onChange={setFilters} />
                </ScrollArea>
              </div>
            </aside>

            {/* Grid column */}
            <div className="min-w-0">
              <header className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-[20px] font-bold text-black">
                  {filtered.length} {filtered.length === 1 ? "course" : "courses"}
                </h2>
                <p className="hidden text-[13px] text-black/55 sm:block">
                  of {ACADEMY_COURSES.length} endorsed courses
                </p>
              </header>

              {filtered.length === 0 ? (
                <Empty className="rounded-[18px] border border-black/10 bg-white">
                  <EmptyHeader>
                    <EmptyTitle className="text-black">No courses match those filters</EmptyTitle>
                    <EmptyDescription className="text-black/55">
                      Try widening the profession, level or CPD points filter, or reset to see the
                      full catalogue.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      type="button"
                      onClick={() => setFilters(DEFAULT_FILTERS)}
                      className="h-10 rounded-[10px] bg-[#FF7A00] px-5 text-[13px] font-semibold text-white shadow-none hover:bg-[#E96F00]"
                    >
                      <RefreshCw data-icon="inline-start" />
                      Reset filters
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="flex flex-col gap-4">
                  {filtered.map((c) => (
                    <CourseRow key={c.id} course={c} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* What endorsement means (dark strip for rhythm) */}
        <section className="border-t border-reps-border bg-reps-ink text-white">
          <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
            <SectionHeader
              eyebrow="The endorsement mark"
              heading={<>What "REPs Endorsed" means.</>}
              lede="Every course listed here has been submitted by its provider and independently reviewed by REPs against a shared professional standard. It is not a regulated qualification — where a course is also Ofqual-regulated, that is stated on the card."
            />

            <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Verified provider",
                  body: "We check the provider's insurance, tutor qualifications and complaints record before their catalogue can be listed.",
                },
                {
                  icon: ClipboardCheck,
                  title: "Assessed syllabus",
                  body: "Learning outcomes, assessment method, delivery format and sample material are reviewed course-by-course.",
                },
                {
                  icon: RefreshCw,
                  title: "Ongoing review",
                  body: "Endorsement is re-checked annually. Providers who slip below the standard are removed from the Academy.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-[10px] border border-reps-orange-border bg-reps-orange-soft text-reps-orange">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-[19px] font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/70">{item.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-10 max-w-[720px] text-[13px] leading-relaxed text-white/55">
              REPs endorsement is a professional-standards review. It does not replace Ofqual
              regulation, and no course is presented as a REPs qualification. Where a course is
              Ofqual-regulated, the card carries an Ofqual badge alongside the endorsement mark.
            </p>

            <div className="mt-8">
              <Link
                to="/training-providers"
                className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/25 bg-white/5 px-5 text-[13.5px] font-semibold text-white hover:bg-white/10"
              >
                Get your course endorsed
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <MarketingFaq
          heading="Training Academy FAQ."
          items={[
            {
              q: "What is a REPs endorsement?",
              a: "REPs endorsement means we have independently reviewed a training provider and their course against a shared professional standard — covering learning outcomes, assessment, tutor competence and learner support.",
            },
            {
              q: "How is it different from Ofqual regulation?",
              a: "Ofqual regulation is a government framework for regulated qualifications. REPs endorsement is a separate professional-standards review that can sit alongside an Ofqual-regulated course or apply to CPD short courses that are not regulated. We never present endorsement as a regulated qualification.",
            },
            {
              q: "How do you vet providers?",
              a: "We check insurance, tutor qualifications, assessment method, learner support arrangements and any prior complaints record before a provider's catalogue can appear here.",
            },
            {
              q: "Do endorsed courses count towards Verified status?",
              a: "Yes — any Ofqual-regulated qualification from a REPs-endorsed provider can be submitted as part of a professional's verification file, just like any other recognised qualification.",
            },
            {
              q: "I'm a training provider — how do I apply?",
              a: "Head to the training providers page to submit your provider profile and first course for review. Endorsement decisions are usually returned within 10 working days.",
            },
          ]}
        />

        <FinalCta
          eyebrow={{ icon: GraduationCap, label: "REPs Training Academy" }}
          heading="Find your next qualification."
          headingAccent="Endorsed by REPs."
          lede="Filter the catalogue, pick a course, and enrol directly with the provider."
          primary={{ to: "/training-academy", label: "Browse endorsed courses" }}
          secondary={{ to: "/training-providers", label: "Get your course endorsed" }}
        />
      </main>

      <PublicFooter />
    </div>
  );
}
