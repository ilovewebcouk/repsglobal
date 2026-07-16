import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HeroOverlay } from "@/components/marketing/HeroOverlay";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

import { CourseCard } from "@/components/academy/CourseCard";
import {
  AcademyFilters,
  DEFAULT_FILTERS,
  type AcademyFilterState,
} from "@/components/academy/AcademyFilters";

import { ACADEMY_COURSES } from "@/lib/training-academy";

import heroAsset from "@/assets/cpd-tutor-moment.jpg.asset.json";
const heroImg = heroAsset.url;

const CANONICAL = "https://repsuk.org/training-academy";
const META_TITLE = "REPs Training Academy — Endorsed qualifications & CPD | REPS";
const META_DESC =
  "Browse qualifications and CPD courses from REPs-endorsed training providers. One catalogue, one endorsement mark, direct links to every provider.";

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
    links: [
      { rel: "canonical", href: CANONICAL },
      { rel: "preload", as: "image", href: heroImg, fetchPriority: "high" },
    ],
  }),
  component: TrainingAcademyPage,
});

function TrainingAcademyPage() {
  const [filters, setFilters] = useState<AcademyFilterState>(DEFAULT_FILTERS);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const cpdMin =
      filters.cpdMin === "any" ? 0 : parseInt(filters.cpdMin, 10);
    return ACADEMY_COURSES.filter((c) => {
      if (q) {
        const hay = `${c.title} ${c.summary} ${c.provider.name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.profession !== "all" && c.profession !== filters.profession)
        return false;
      if (filters.level !== "all" && c.level !== filters.level) return false;
      if (filters.delivery !== "all" && c.delivery !== filters.delivery)
        return false;
      if (c.cpdPoints < cpdMin) return false;
      if (filters.provider !== "all" && c.provider.slug !== filters.provider)
        return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden lg:min-h-[560px]">
        <img
          src={heroImg}
          alt=""
          width={1920}
          height={720}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[70%_center] lg:object-center"
        />
        <HeroOverlay copySide="left" />

        <div className="relative mx-auto max-w-[1320px] px-6 pb-20 pt-24 lg:px-10 lg:pb-24 lg:pt-28">
          <div className="flex max-w-[720px] flex-col items-start">
            <MarketingHeroEyebrow
              icon={GraduationCap}
              style={{ animationDuration: "560ms", animationFillMode: "both" }}
            >
              REPs Endorsed · Training Academy
            </MarketingHeroEyebrow>

            <h1
              className="mt-6 animate-fade-in font-display text-[36px] font-bold leading-[1.04] text-white sm:text-[46px] lg:text-[60px]"
              style={{
                animationDuration: "640ms",
                animationDelay: "80ms",
                animationFillMode: "both",
              }}
            >
              The REPs Training Academy.
              <br />
              <span className="text-reps-orange">
                Every endorsed course, in one place.
              </span>
            </h1>

            <p
              className="mt-6 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/80"
              style={{
                animationDuration: "640ms",
                animationDelay: "180ms",
                animationFillMode: "both",
              }}
            >
              Qualifications and CPD from training providers that have applied
              for and passed the REPs endorsement review. Filter by level,
              specialism, delivery and CPD points — then head straight to the
              provider to enrol.
            </p>

            <ul
              className="mt-8 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/75"
              style={{
                animationDuration: "640ms",
                animationDelay: "260ms",
                animationFillMode: "both",
              }}
            >
              <li className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-reps-orange" />
                Every course independently reviewed
              </li>
              <li className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-reps-orange" />
                Ofqual-regulated where applicable
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-reps-orange" />
                Direct links to every provider
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Filters */}
      <AcademyFilters
        value={filters}
        onChange={setFilters}
        totalCount={ACADEMY_COURSES.length}
        filteredCount={filtered.length}
      />

      {/* Results grid */}
      <section className="bg-reps-ink">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          {filtered.length === 0 ? (
            <Empty className="rounded-[18px] border border-reps-border bg-reps-panel/30">
              <EmptyHeader>
                <EmptyTitle className="text-white">
                  No courses match those filters
                </EmptyTitle>
                <EmptyDescription className="text-white/65">
                  Try widening the profession, level or CPD points filter, or
                  reset to see the full catalogue.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="h-10 rounded-[10px] bg-reps-orange px-5 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  <RefreshCw data-icon="inline-start" />
                  Reset filters
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* What endorsement means */}
      <section className="border-y border-reps-border bg-reps-panel/20">
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
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-[720px] text-[13px] leading-relaxed text-white/55">
            REPs endorsement is a professional-standards review. It does not
            replace Ofqual regulation, and no course is presented as a REPs
            qualification. Where a course is Ofqual-regulated, the card carries
            an Ofqual badge alongside the endorsement mark.
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

      {/* FAQ */}
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

      <PublicFooter />
    </div>
  );
}
