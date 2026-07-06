import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import type {
  ServiceDTO,
  WebsiteDTO,
  WebsiteFaqDTO,
} from "@/lib/website/website.functions";

/* ------------------------------------------------------------------ */
/*  Training-provider variant of /c/$slug — locked twin of the coach   */
/*  website mock: same dark shell, sticky nav, radius map, REPs orange */
/*  accent, verified card visual language. Institutional 'we' voice.   */
/* ------------------------------------------------------------------ */

type Course = {
  id: string;
  title: string;
  level: string | null;
  awardingBody: string | null;
  startsAt: Date | null;
  seatsTotal: number | null;
  seatsTaken: number | null;
  pricePence: number | null;
  priceLabel: string | null;
  description: string | null;
  bullets: string[];
  isFeatured: boolean;
};

type OrgFaq = { question: string; answer: string };

type Props = {
  slug: string;
  website: WebsiteDTO;
  services: ServiceDTO[];
  faqs: WebsiteFaqDTO[];
};

/* ------------------------------ helpers ---------------------------- */

function toCourses(services: ServiceDTO[]): Course[] {
  return services
    .filter((s) => s.service_kind === "course" || s.service_kind === "programme")
    .map((s) => ({
      id: s.id,
      title: s.title,
      level: s.qualification_level,
      awardingBody: s.awarding_body,
      startsAt: s.starts_at ? new Date(s.starts_at) : null,
      seatsTotal: s.seats_total,
      seatsTaken: s.seats_taken,
      pricePence: s.price_pence,
      priceLabel: s.price_label,
      description: s.description,
      bullets: Array.isArray(s.bullets) ? s.bullets : [],
      isFeatured: s.is_featured,
    }));
}

function fmtPrice(p: Course): string {
  if (p.priceLabel) return p.priceLabel;
  if (p.pricePence == null) return "Enquire";
  return `£${Math.round(p.pricePence / 100).toLocaleString("en-GB")}`;
}

function fmtDate(d: Date | null): string {
  if (!d) return "Rolling intake";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function seatsRemaining(c: Course): number | null {
  if (c.seatsTotal == null) return null;
  return Math.max(0, c.seatsTotal - (c.seatsTaken ?? 0));
}

const DEFAULT_ORG_FAQS: OrgFaq[] = [
  {
    question: "Are your qualifications Ofqual-regulated?",
    answer:
      "Yes. Every course we deliver leads to an Ofqual-regulated qualification, certified by a recognised awarding body. You leave with a nationally recognised certificate — the same one employers and REPS-verified pros hold.",
  },
  {
    question: "Do you offer payment plans?",
    answer:
      "Yes. We split most courses into monthly instalments across the duration of study, interest-free. Talk to admissions for exact figures on the course you're considering.",
  },
  {
    question: "What are the entry requirements?",
    answer:
      "Level 2 courses have no formal prerequisites — a genuine interest in coaching is enough. Level 3 requires Level 2 Gym Instructor (or equivalent). Level 4 requires a Level 3 personal-training qualification.",
  },
  {
    question: "How much tutor contact time will I get?",
    answer:
      "Every cohort has a named lead tutor. In-person days are small-group (max 18 learners, ~6:1 ratio). Between sessions you have direct email and portal access to your tutor for coursework feedback.",
  },
  {
    question: "What happens after I qualify?",
    answer:
      "You're eligible to list on the REPS register immediately. We also introduce top-of-cohort learners to partner gyms and studios who recruit from us directly.",
  },
];

/* ------------------------------ page ------------------------------- */

export default function CoachWebsiteOrg({ slug, website, services, faqs }: Props) {
  const courses = toCourses(services);
  const featured = courses.find((c) => c.isFeatured) ?? courses[0] ?? null;
  const orgName = website.legal_entity_name || website.full_name || "Training organisation";
  const city = website.city ?? "the UK";
  const awardingBodies = website.awarding_bodies ?? [];
  const staff = website.staff_count ?? null;
  const faqItems: OrgFaq[] =
    faqs.length > 0
      ? faqs.map((f) => ({ question: f.question, answer: f.answer }))
      : DEFAULT_ORG_FAQS;

  const accent = "var(--brand-orange, #FF7A00)";
  const accentStyle = { ["--accent-color" as string]: accent } as React.CSSProperties;

  return (
    <div
      data-coach-theme="dark"
      className="min-h-screen bg-reps-ink text-reps-text"
      style={accentStyle}
    >
      <OrgChrome name={orgName} />
      <OrgNav />

      <OrgHero
        orgName={orgName}
        tagline={website.tagline}
        subtitle={website.subtitle}
        city={city}
        awardingBodies={awardingBodies}
        staff={staff}
        featured={featured}
        slug={slug}
        totalCourses={courses.length}
      />

      <CoursesSection courses={courses} slug={slug} />
      <AccreditationBand
        awardingBodies={awardingBodies}
        orgName={orgName}
        legalName={website.legal_entity_name}
        verified={website.trust.isVerified}
      />
      <HowWeTeachSection />
      <TutorsStrip staff={staff} orgName={orgName} />
      <OutcomesStats />
      <AlumniVoices />
      <AboutOrgSection about={website.about} orgName={orgName} city={city} staff={staff} />
      <VerifiedByRepsBand />
      <OrgFaqSection items={faqItems} />
      <OrgFinalCta slug={slug} orgName={orgName} nextCourse={featured} />
      <OrgFooter />
    </div>
  );
}

/* ---------------------------- chrome ------------------------------- */

function OrgChrome({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-40 bg-reps-ink/85 backdrop-blur supports-[backdrop-filter]:bg-reps-ink/70 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)]">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-4 px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3 text-reps-text">
          <RepsWordmark className="h-4 w-auto text-reps-text" />
          <Separator orientation="vertical" className="h-4 bg-reps-border" />
          <span className="text-[13px] font-semibold text-reps-text">{name}</span>
        </Link>
        <div className="hidden items-center gap-4 md:flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-green/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
                <BadgeCheck className="h-3 w-3" />
                Verified training provider
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Company details, awarding-body accreditation and delivery quality independently verified by REPS.
            </TooltipContent>
          </Tooltip>
          <Link
            to="/auth"
            className="text-[13px] font-medium text-reps-muted transition-colors hover:text-reps-text"
          >
            Learner login
          </Link>
        </div>
      </div>
    </header>
  );
}

const NAV = [
  { id: "courses", label: "Courses" },
  { id: "accreditation", label: "Accreditation" },
  { id: "how-we-teach", label: "How we teach" },
  { id: "tutors", label: "Tutors" },
  { id: "outcomes", label: "Outcomes" },
  { id: "about", label: "About" },
  { id: "faq", label: "FAQ" },
];

function OrgNav() {
  return (
    <nav
      aria-label="On this page"
      className="sticky top-14 z-30 hidden bg-reps-ink/80 backdrop-blur shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)] md:block"
    >
      <div className="mx-auto flex h-12 max-w-[1320px] items-center gap-1 overflow-x-auto px-6 lg:px-10">
        {NAV.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-reps-muted transition-colors hover:bg-reps-panel-soft hover:text-reps-text"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------ hero ------------------------------- */

function OrgHero({
  orgName,
  tagline,
  subtitle,
  city,
  awardingBodies,
  staff,
  featured,
  slug,
  totalCourses,
}: {
  orgName: string;
  tagline: string | null;
  subtitle: string | null;
  city: string;
  awardingBodies: string[];
  staff: number | null;
  featured: Course | null;
  slug: string;
  totalCourses: number;
}) {
  return (
    <section className="relative overflow-hidden bg-reps-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(60% 80% at 12% 0%, color-mix(in oklab, var(--accent-color) 22%, transparent), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[1320px] px-6 pb-16 pt-10 lg:px-10 lg:pb-24 lg:pt-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          {/* Copy */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-reps-muted">
              <Building2 className="h-3.5 w-3.5" />
              Training provider · {city}
            </div>
            <h1 className="font-display text-[40px] font-bold leading-[1.05] tracking-tight text-reps-text sm:text-[52px] lg:text-[64px]">
              {tagline || `We train the next generation of coaches in ${city}.`}
            </h1>
            <p className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-white/70">
              {subtitle ||
                `${orgName} delivers Ofqual-regulated Level 2, 3 and 4 fitness qualifications. Small cohorts, working practitioners as tutors, and direct routes onto the REPS register.`}
            </p>

            {/* Trust chips */}
            <div className="mt-7 flex flex-wrap items-center gap-2">
              {awardingBodies.slice(0, 4).map((body) => (
                <Badge
                  key={body}
                  variant="outline"
                  className="rounded-full border-reps-border bg-reps-panel/60 px-3 py-1 text-[12px] font-medium text-white/80"
                >
                  <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
                  {body}
                </Badge>
              ))}
              {staff ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-reps-border bg-reps-panel/60 px-3 py-1 text-[12px] font-medium text-white/80"
                >
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  {staff} tutors &amp; assessors
                </Badge>
              ) : null}
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#courses"
                className="inline-flex items-center gap-2 rounded-[10px] bg-[color:var(--accent-color)] px-5 py-3 text-[14px] font-semibold text-black transition-transform hover:-translate-y-[1px]"
              >
                See {totalCourses > 0 ? `${totalCourses} upcoming ${totalCourses === 1 ? "course" : "courses"}` : "upcoming courses"}
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/c/$slug/enquire"
                params={{ slug }}
                className="inline-flex items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel/40 px-5 py-3 text-[14px] font-semibold text-reps-text transition-colors hover:bg-reps-panel/60"
              >
                Talk to admissions
              </Link>
            </div>
          </div>

          {/* Verified card */}
          <VerifiedCard
            orgName={orgName}
            awardingBodies={awardingBodies}
            featured={featured}
            slug={slug}
          />
        </div>
      </div>
    </section>
  );
}

function VerifiedCard({
  orgName,
  awardingBodies,
  featured,
  slug,
}: {
  orgName: string;
  awardingBodies: string[];
  featured: Course | null;
  slug: string;
}) {
  const remaining = featured ? seatsRemaining(featured) : null;
  return (
    <div className="relative rounded-[22px] border border-reps-border bg-reps-panel/70 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-reps-green/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
            <ShieldCheck className="h-3 w-3" />
            Verified by REPS
          </div>
          <p className="mt-3 font-display text-[18px] font-semibold leading-tight text-reps-text">
            {orgName}
          </p>
          <p className="mt-1 text-[13px] text-white/60">
            Independently verified training provider
          </p>
        </div>
      </div>

      <Separator className="my-5 bg-reps-border" />

      <dl className="grid gap-3 text-[13px]">
        <div className="flex items-center justify-between">
          <dt className="text-white/55">Awarding bodies</dt>
          <dd className="text-right font-medium text-white/85">
            {awardingBodies.length ? awardingBodies.slice(0, 2).join(", ") : "Multiple"}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-white/55">Regulator</dt>
          <dd className="font-medium text-white/85">Ofqual-regulated</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-white/55">Register listing</dt>
          <dd className="font-medium text-white/85">Active</dd>
        </div>
      </dl>

      {featured ? (
        <div className="mt-5 rounded-[16px] border border-reps-border bg-reps-ink/60 p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--accent-color)]">
            Next cohort
          </div>
          <p className="mt-1 font-display text-[15px] font-semibold text-reps-text">
            {featured.title}
          </p>
          <div className="mt-2 flex items-center justify-between text-[12.5px] text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {fmtDate(featured.startsAt)}
            </span>
            {remaining !== null ? (
              <span
                className={
                  remaining <= 4
                    ? "rounded-full bg-reps-green/15 px-2 py-0.5 text-[11px] font-semibold text-reps-green ring-1 ring-reps-green/30"
                    : "text-white/60"
                }
              >
                {remaining > 0 ? `${remaining} seats left` : "Waitlist"}
              </span>
            ) : null}
          </div>
          <Link
            to="/c/$slug/enquire"
            params={{ slug }}
            search={{ course: featured.id } as never}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[color:var(--accent-color)] px-4 py-2.5 text-[13px] font-semibold text-black"
          >
            Enquire about this cohort
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/* ----------------------------- courses ----------------------------- */

function CoursesSection({ courses, slug }: { courses: Course[]; slug: string }) {
  return (
    <section id="courses" className="relative bg-reps-panel/15 py-20 lg:py-28">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <SectionHeader
          eyebrow="Upcoming courses"
          title="Nationally recognised qualifications, delivered by working practitioners."
          lede="Every course listed here is Ofqual-regulated. Cohorts are small, tutors are named, and progress is mentored — not just marked."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} slug={slug} />
          ))}
          {courses.length === 0 ? (
            <div className="col-span-full rounded-[18px] border border-dashed border-reps-border bg-reps-panel/30 p-10 text-center text-[14px] text-white/60">
              No upcoming cohorts published. Talk to admissions for the next intake.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CourseCard({ course, slug }: { course: Course; slug: string }) {
  const remaining = seatsRemaining(course);
  const filling = remaining !== null && remaining <= 4 && remaining > 0;
  return (
    <article
      className={
        "relative flex flex-col rounded-[18px] border bg-reps-panel/40 p-6 transition-colors " +
        (course.isFeatured
          ? "border-[color:var(--accent-color)]/40 shadow-[0_0_0_1px_color-mix(in_oklab,var(--accent-color)_25%,transparent),0_30px_80px_-40px_color-mix(in_oklab,var(--accent-color)_60%,transparent)]"
          : "border-reps-border hover:border-white/20")
      }
    >
      {course.isFeatured ? (
        <div className="absolute -top-3 left-6 rounded-full bg-[color:var(--accent-color)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
          Most enrolled
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        {course.level ? (
          <Badge
            variant="outline"
            className="rounded-full border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-white/80"
          >
            {course.level}
          </Badge>
        ) : null}
        {course.awardingBody ? (
          <span className="text-[11px] font-medium text-white/50">{course.awardingBody}</span>
        ) : null}
      </div>

      <h3 className="mt-3 font-display text-[20px] font-semibold leading-tight text-reps-text">
        {course.title}
      </h3>
      {course.description ? (
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">
          {course.description}
        </p>
      ) : null}

      {course.bullets.length ? (
        <ul className="mt-4 space-y-1.5 text-[12.5px] text-white/70">
          {course.bullets.slice(0, 3).map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-[color:var(--accent-color)]" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 grid gap-2 rounded-[12px] border border-reps-border bg-reps-ink/40 p-3 text-[12.5px]">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-white/55">
            <CalendarDays className="h-3.5 w-3.5" />
            Next cohort
          </span>
          <span className="font-medium text-white/85">{fmtDate(course.startsAt)}</span>
        </div>
        {remaining !== null ? (
          <div className="flex items-center justify-between">
            <span className="text-white/55">Seats</span>
            <span
              className={
                filling
                  ? "rounded-full bg-reps-green/15 px-2 py-0.5 text-[11px] font-semibold text-reps-green ring-1 ring-reps-green/30"
                  : remaining === 0
                    ? "text-white/60"
                    : "font-medium text-white/85"
              }
            >
              {remaining === 0 ? "Waitlist" : `${remaining} of ${course.seatsTotal} left`}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div>
          <div className="font-display text-[22px] font-bold text-reps-text">
            {fmtPrice(course)}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-white/45">
            Full course fee
          </div>
        </div>
        <Link
          to="/c/$slug/enquire"
          params={{ slug }}
          search={{ course: course.id } as never}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-[color:var(--accent-color)] px-4 py-2.5 text-[13px] font-semibold text-black"
        >
          Enquire
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

/* -------------------------- accreditation -------------------------- */

function AccreditationBand({
  awardingBodies,
  orgName,
  legalName,
  verified,
}: {
  awardingBodies: string[];
  orgName: string;
  legalName: string | null;
  verified: boolean;
}) {
  return (
    <section id="accreditation" className="relative bg-reps-panel/30 py-20 lg:py-28">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <SectionHeader
          eyebrow="Accreditation &amp; trust"
          title="Regulated qualifications from recognised awarding bodies."
          lede="We're not a self-issued certificate mill. Every learner leaves with a nationally recognised, Ofqual-regulated qualification."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/50 p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
              Delivered in partnership with
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {awardingBodies.length ? (
                awardingBodies.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-ink/40 px-4 py-2 text-[13px] font-semibold text-white/85"
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-[color:var(--accent-color)]" />
                    {b}
                  </span>
                ))
              ) : (
                <span className="text-[13px] text-white/60">
                  Awarding-body details available on request.
                </span>
              )}
            </div>
            <p className="mt-6 text-[14px] leading-relaxed text-white/70">
              Every qualification we deliver is Ofqual-regulated. That means external
              verification of assessment, standard-setting across the sector, and a
              certificate employers and REPS-verified pros already recognise.
            </p>
          </div>

          <div className="rounded-[22px] border border-reps-border bg-reps-panel/50 p-8">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-reps-green/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
              <ShieldCheck className="h-3 w-3" />
              {verified ? "Verified by REPS" : "Registered training provider"}
            </div>
            <p className="mt-4 font-display text-[22px] font-semibold leading-tight text-reps-text">
              {orgName}
            </p>
            {legalName ? (
              <p className="mt-1 text-[13px] text-white/55">Trading as {legalName}</p>
            ) : null}
            <dl className="mt-6 space-y-3 text-[13px]">
              <div className="flex items-center justify-between border-t border-reps-border pt-3">
                <dt className="text-white/55">Provider verification</dt>
                <dd className="font-medium text-white/85">Company &amp; delivery reviewed</dd>
              </div>
              <div className="flex items-center justify-between border-t border-reps-border pt-3">
                <dt className="text-white/55">Alumni on register</dt>
                <dd className="font-medium text-white/85">Direct listing route</dd>
              </div>
              <div className="flex items-center justify-between border-t border-reps-border pt-3">
                <dt className="text-white/55">Complaints handling</dt>
                <dd className="font-medium text-white/85">Independent — via REPS</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- how we teach ------------------------- */

function HowWeTeachSection() {
  const pillars = [
    {
      title: "Small cohorts, named tutor",
      body: "Max 18 learners per intake. Every cohort has one named lead tutor who runs the practicals and mentors coursework end to end.",
    },
    {
      title: "Working practitioners as tutors",
      body: "Our teaching team all still coach or program clients. Case studies come from this year, not a decade ago.",
    },
    {
      title: "Assessed, not just examined",
      body: "Coursework, mock assessments, and observed practicals — with feedback at each stage. The final exam is a checkpoint, not the whole grade.",
    },
  ];
  return (
    <section id="how-we-teach" className="relative bg-reps-panel/15 py-20 lg:py-28">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <SectionHeader
          eyebrow="How we teach"
          title="Delivery designed for coaches who'll actually work."
          lede="Every cohort is structured around the same three commitments — the reason our alumni pass, get hired, and stay on the register."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[color:var(--accent-color)]/15 text-[color:var(--accent-color)]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-[18px] font-semibold text-reps-text">
                {p.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ tutors ----------------------------- */

function TutorsStrip({ staff, orgName }: { staff: number | null; orgName: string }) {
  return (
    <section id="tutors" className="relative bg-reps-panel/30 py-20 lg:py-28">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <SectionHeader
          eyebrow="Tutors &amp; assessors"
          title={
            staff
              ? `${staff} named tutors, assessors and mentors.`
              : "A named teaching team behind every cohort."
          }
          lede={`Our tutors don't just teach — they coach. Their case studies, their programming, and their client outcomes are the material.`}
        />
        <div className="mt-12 rounded-[22px] border border-reps-border bg-reps-panel/40 p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                Ratio
              </p>
              <p className="mt-2 font-display text-[28px] font-bold text-reps-text">6 : 1</p>
              <p className="mt-1 text-[13px] text-white/60">Learners per tutor on practical days</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                Teaching team
              </p>
              <p className="mt-2 font-display text-[28px] font-bold text-reps-text">
                {staff ?? "—"}
              </p>
              <p className="mt-1 text-[13px] text-white/60">
                Tutors, assessors &amp; internal quality assurers
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                Practising coaches
              </p>
              <p className="mt-2 font-display text-[28px] font-bold text-reps-text">100%</p>
              <p className="mt-1 text-[13px] text-white/60">
                Every tutor still coaches clients or teams
              </p>
            </div>
          </div>
          <p className="mt-6 text-[13.5px] leading-relaxed text-white/65">
            {orgName} publishes a full tutor line-up on request during enrolment, including
            individual credentials, specialisms, and REPS profiles for each tutor.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- outcomes ---------------------------- */

function OutcomesStats() {
  const stats = [
    { value: "94%", label: "First-time pass rate", sub: "Rolling 12-month average" },
    { value: "1,200+", label: "Coaches qualified", sub: "Since founding" },
    { value: "40+", label: "Employer partners", sub: "Gyms recruiting from us directly" },
    { value: "3.6mo", label: "Time to first client", sub: "Median for Level 3 alumni" },
  ];
  return (
    <section id="outcomes" className="relative bg-reps-panel/15 py-20 lg:py-28">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <SectionHeader
          eyebrow="Outcomes"
          title="Numbers we report, not slogans."
          lede="We publish honest cohort outcomes — pass rates, employer placements, time to first paying client. Ask for the full report during enrolment."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
            >
              <p className="font-display text-[38px] font-bold leading-none text-reps-text">
                {s.value}
              </p>
              <p className="mt-3 text-[13.5px] font-semibold text-reps-text">{s.label}</p>
              <p className="mt-1 text-[12px] text-white/55">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- alumni voices ------------------------- */

function AlumniVoices() {
  const items = [
    {
      initials: "EJ",
      quote:
        "Cohort of 14, tutor knew every one of us by name. The mock assessments before the real one were what got me through.",
      attribution: "Ella J.",
      meta: "Level 3 PT, class of 2025",
    },
    {
      initials: "MT",
      quote:
        "I was on the floor coaching within 8 weeks of qualifying. The placement side of the course isn't a bolt-on — it's built in.",
      attribution: "Marcus T.",
      meta: "Level 2 Gym Instructor, class of 2025",
    },
    {
      initials: "RP",
      quote:
        "The Level 4 lower-back module was taught by a working physio. Not a textbook read to us — genuine clinical reasoning.",
      attribution: "Roisin P.",
      meta: "Level 4 alumnus, working PT",
    },
  ];
  return (
    <section className="relative bg-reps-panel/30 py-20 lg:py-28">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <SectionHeader
          eyebrow="Alumni voices"
          title="What learners say once they're on the floor."
          lede="Third-person attributed. No stock quotes, no anonymous testimonials."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((t) => (
            <figure
              key={t.initials}
              className="flex flex-col rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
            >
              <blockquote className="text-[14.5px] leading-relaxed text-white/80">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-reps-border pt-4">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--accent-color)]/15 text-[12px] font-bold text-[color:var(--accent-color)]">
                  {t.initials}
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-reps-text">
                    {t.attribution}
                  </span>
                  <span className="block text-[11.5px] text-white/55">{t.meta}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- about org ----------------------------- */

function AboutOrgSection({
  about,
  orgName,
  city,
  staff,
}: {
  about: string | null;
  orgName: string;
  city: string;
  staff: number | null;
}) {
  const paras = (about ?? "")
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const body = paras.length
    ? paras
    : [
        `${orgName} was founded to raise the floor on how fitness coaches are trained. Small cohorts, working practitioners as tutors, and a direct route onto the REPS register.`,
        `We run every intake from our ${city} base with a named lead tutor and a fixed cohort — no rolling drop-ins, no anonymous marking. If you're in one of our courses, we know your name and your goals.`,
      ];
  return (
    <section id="about" className="relative bg-reps-panel/15 py-20 lg:py-28">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--accent-color)]">
              About the academy
            </p>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-reps-text lg:text-[44px]">
              Built for the coach the industry actually needs.
            </h2>
            <div className="mt-6 flex items-center gap-6">
              <div>
                <p className="font-display text-[24px] font-bold text-reps-text">{city}</p>
                <p className="text-[12px] text-white/55">Primary campus</p>
              </div>
              {staff ? (
                <div>
                  <p className="font-display text-[24px] font-bold text-reps-text">{staff}</p>
                  <p className="text-[12px] text-white/55">Teaching team</p>
                </div>
              ) : null}
            </div>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-white/75">
            {body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------ verified by REPS band -------------------- */

function VerifiedByRepsBand() {
  return (
    <section className="relative border-y border-reps-border bg-reps-ink/60 py-16">
      <div className="mx-auto grid max-w-[1320px] items-center gap-6 px-6 md:grid-cols-[1fr_auto] lg:px-10">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-reps-green/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
            <ShieldCheck className="h-3 w-3" />
            Verified training provider
          </div>
          <h3 className="mt-4 font-display text-[22px] font-semibold leading-tight text-reps-text lg:text-[28px]">
            Company details, awarding-body accreditation and delivery quality — checked by REPS.
          </h3>
          <p className="mt-2 max-w-[720px] text-[14px] text-white/65">
            REPS is an independent register. Provider status means our company records,
            awarding-body agreements and internal quality assurance have been reviewed by
            a third party — not self-declared on our own website.
          </p>
        </div>
        <Link
          to="/trust"
          className="inline-flex shrink-0 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel/40 px-4 py-2.5 text-[13px] font-semibold text-reps-text transition-colors hover:bg-reps-panel/60"
        >
          How REPS verifies providers
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

/* -------------------------------- FAQ ------------------------------ */

function OrgFaqSection({ items }: { items: OrgFaq[] }) {
  return (
    <section id="faq" className="relative bg-reps-panel/15 py-20 lg:py-28">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <SectionHeader
          eyebrow="Common questions"
          title="What learners ask before enrolling."
          lede="If yours isn't here, admissions can answer in one email."
        />
        <div className="mx-auto mt-10 max-w-[820px] rounded-[22px] border border-reps-border bg-reps-panel/40 p-2">
          <Accordion type="single" collapsible className="w-full">
            {items.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-b border-reps-border last:border-b-0"
              >
                <AccordionTrigger className="px-4 py-4 text-left text-[15px] font-semibold text-reps-text hover:no-underline">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-5 text-[14px] leading-relaxed text-white/70">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- final CTA --------------------------- */

function OrgFinalCta({
  slug,
  orgName,
  nextCourse,
}: {
  slug: string;
  orgName: string;
  nextCourse: Course | null;
}) {
  return (
    <section className="relative bg-reps-ink py-20 lg:py-28">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-[24px] border border-reps-border bg-reps-panel/50 p-10 lg:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(50% 100% at 100% 0%, color-mix(in oklab, var(--accent-color) 28%, transparent), transparent 65%)",
            }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--accent-color)]">
                Ready to qualify?
              </p>
              <h2 className="mt-3 font-display text-[34px] font-bold leading-tight text-reps-text lg:text-[52px]">
                Come and train with {orgName}.
              </h2>
              <p className="mt-4 max-w-[520px] text-[15px] text-white/70">
                {nextCourse
                  ? `Next cohort — ${nextCourse.title} — starts ${fmtDate(nextCourse.startsAt)}. Small group, named tutor, direct route onto the register.`
                  : "Talk to admissions about the next intake. Small group, named tutor, direct route onto the register."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href="#courses"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[color:var(--accent-color)] px-5 py-3 text-[14px] font-semibold text-black"
              >
                See next cohorts
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/c/$slug/enquire"
                params={{ slug }}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel/50 px-5 py-3 text-[14px] font-semibold text-reps-text transition-colors hover:bg-reps-panel/70"
              >
                Talk to admissions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ footer ----------------------------- */

function OrgFooter() {
  return (
    <footer className="border-t border-reps-border bg-reps-ink py-10">
      <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-4 px-6 text-[12.5px] text-white/50 md:flex-row lg:px-10">
        <div className="flex items-center gap-3">
          <RepsWordmark className="h-3.5 w-auto text-white/55" />
          <span>Verified training provider on the REPS register.</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <span>Provider details verified by REPS · independent register</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------- primitives --------------------------- */

function SectionHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="max-w-[820px]">
      <p
        className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--accent-color)]"
        dangerouslySetInnerHTML={{ __html: eyebrow }}
      />
      <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-reps-text lg:text-[40px]">
        {title}
      </h2>
      {lede ? (
        <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">{lede}</p>
      ) : null}
    </div>
  );
}
