import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Check,
  Flag,
  GraduationCap,
  Heart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import ctaTrainers from "@/assets/cta-band.jpg";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

import heroCpdAsset from "@/assets/cpd-tutor-moment.jpg.asset.json";
const heroCpd = heroCpdAsset.url;

/* ------------------------------------------------------------------ */
/* Page head                                                           */
/* ------------------------------------------------------------------ */

const CANONICAL = "https://staging.repsuk.org/education";
const META_TITLE =
  "Fitness qualifications, decoded — find a verified training provider | REPs";
const META_DESC =
  "Regulated qualifications, REPs-verified training providers, and CPD that's logged — explained in plain English so you spend on the right course, or hire the right professional.";

export const Route = createFileRoute("/education")({
  head: () => ({
    meta: [
      { title: META_TITLE },
      { name: "description", content: META_DESC },
      { property: "og:title", content: META_TITLE },
      { property: "og:description", content: META_DESC },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: heroCpd },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: heroCpd },
    ],
    links: [
      { rel: "canonical", href: CANONICAL },
      { rel: "preload", as: "image", href: heroCpd, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS_FOR_JSONLD(),
        }),
      },
    ],
  }),
  component: EducationPage,
});

function FAQS_FOR_JSONLD() {
  return FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  }));
}

/* ------------------------------------------------------------------ */
/* Qualification ladder data                                           */
/* ------------------------------------------------------------------ */

type Qual = { acronym: string; full: string; meaning: string };

type LadderRung = {
  level: string;
  title: string;
  blurb: string;
  scope: string[];
  notScope: string[];
  quals: Qual[];
};

const FITNESS_LADDER: LadderRung[] = [
  {
    level: "Level 2",
    title: "Gym Instructor",
    blurb:
      "The industry entry point. Runs inductions, supervises programmes and leads group circuits on the gym floor.",
    scope: [
      "Gym-floor inductions and equipment demos",
      "Supervised programmes written by a senior coach",
      "Group circuits, bootcamp, indoor cycling",
    ],
    notScope: ["1:1 personal training", "Programme design for specialist populations"],
    quals: [
      {
        acronym: "L2 GI",
        full: "Level 2 Gym Instructor (RQF)",
        meaning: "Government-recognised baseline for any insured gym instructor.",
      },
      {
        acronym: "L2 ETM",
        full: "Level 2 Exercise to Music",
        meaning: "Choreographed studio classes — aerobics, dance fitness, step.",
      },
      {
        acronym: "REPs",
        full: "Register of Exercise Professionals",
        meaning:
          "The global register that sets professional standards across the sport and physical-activity sector and endorses qualifications, providers and CPD.",
      },
    ],
  },
  {
    level: "Level 3",
    title: "Personal Trainer",
    blurb:
      "The professional baseline. The qualification any insured personal trainer must hold to coach 1:1.",
    scope: [
      "1:1 personal training, in-person or online",
      "Programme design for the general adult population",
      "Form coaching, progress tracking, lifestyle advice",
    ],
    notScope: [
      "Prescribing exercise for clinical conditions",
      "Issuing therapeutic diets or treating disease",
    ],
    quals: [
      {
        acronym: "L3 PT",
        full: "Level 3 Personal Trainer (RQF)",
        meaning: "Government-recognised qualification — the minimum every 1:1 coach must hold.",
      },
      {
        acronym: "REPs",
        full: "Register of Exercise Professionals",
        meaning:
          "The global register that sets professional standards across the sport and physical-activity sector and endorses qualifications, providers and CPD.",
      },
    ],
  },
  {
    level: "Level 4",
    title: "Specialist",
    blurb:
      "Advanced credentials for clinical populations and high-performance work. The consultant tier.",
    scope: [
      "Low back pain, obesity & diabetes, cancer rehab",
      "Pre and post-natal training",
      "Older adults, falls prevention, neurological conditions",
      "Strength & conditioning for athletes",
    ],
    notScope: ["Diagnosis or medical treatment — refer to a clinician"],
    quals: [
      {
        acronym: "L4 LBP",
        full: "Level 4 Lower Back Pain Management (RQF)",
        meaning: "Clinical-population specialism for chronic low back pain.",
      },
      {
        acronym: "L4 O&D",
        full: "Level 4 Obesity & Diabetes Management",
        meaning: "Working with clients living with obesity or Type 2 diabetes.",
      },
      {
        acronym: "UKSCA",
        full: "UK Strength & Conditioning Association — Accredited S&C Coach",
        meaning: "Gold standard for strength & conditioning coaches working with athletes.",
      },
      {
        acronym: "NSCA CSCS",
        full: "Certified Strength & Conditioning Specialist (NSCA)",
        meaning: "Internationally recognised S&C qualification.",
      },
      {
        acronym: "REPs",
        full: "Register of Exercise Professionals",
        meaning:
          "The global register that sets professional standards across the sport and physical-activity sector and endorses qualifications, providers and CPD.",
      },
    ],
  },
];

type NutritionRow = {
  title: string;
  letters: string;
  body: string;
  protected: boolean;
  scope: string[];
};

const NUTRITION_LADDER: NutritionRow[] = [
  {
    title: "Nutrition Coach",
    letters: "L3 / L4 Nutrition for Sport & Exercise",
    body:
      "A trained coach can support general healthy eating, fat-loss frameworks and sports nutrition for the general population. Cannot prescribe diets for disease.",
    protected: false,
    scope: [
      "Macro and food-first frameworks for healthy adults",
      "Fuelling for general fitness and recreational sport",
      "Refers clinical cases to a Registered Dietitian",
    ],
  },
  {
    title: "Registered Nutritionist",
    letters: "ANutr / RNutr — Association for Nutrition (AfN)",
    body:
      "Degree-led, register-checked nutritionists on the UK Voluntary Register of Nutritionists. The meaningful baseline if you want a 'nutritionist' worth the name.",
    protected: false,
    scope: [
      "Evidence-based nutrition for the healthy population",
      "Public health, food industry, sports nutrition",
      "Scope-of-practice declaration in writing",
    ],
  },
  {
    title: "Registered Dietitian",
    letters: "RD — Health & Care Professions Council (HCPC)",
    body:
      "The only legally protected title. Regulated by the HCPC. The only role that can assess, diagnose and treat clinical conditions with diet.",
    protected: true,
    scope: [
      "Therapeutic diets for clinical conditions (IBS, kidney disease, eating disorders)",
      "Works in the NHS, hospitals and private clinics",
      "The only person legally allowed to call themselves a dietitian",
    ],
  },
];

const MOVEMENT_QUALS: Qual[] = [
  {
    acronym: "YAP 200hr",
    full: "Yoga Alliance Professionals — 200-hour Teacher Training",
    meaning: "Internationally recognised baseline for yoga teachers.",
  },
  {
    acronym: "YAP 500hr",
    full: "Yoga Alliance Professionals — 500-hour Teacher Training",
    meaning: "Advanced training; typical of senior or specialist teachers.",
  },
  {
    acronym: "BWY L4",
    full: "British Wheel of Yoga — Level 4 Diploma",
    meaning: "Long-established teacher-training pathway recognised across studios.",
  },
  {
    acronym: "L3 Mat",
    full: "Level 3 Mat Pilates (RQF)",
    meaning: "Baseline qualification for mat-Pilates teaching.",
  },
  {
    acronym: "Reformer",
    full: "Recognised Reformer Pilates Certification",
    meaning: "Required for equipment-based Pilates teaching and studio work.",
  },
];

/* ------------------------------------------------------------------ */
/* Provider verification checks                                        */
/* ------------------------------------------------------------------ */

const PROVIDER_CHECKS = [
  {
    icon: BadgeCheck,
    title: "Accrediting body recognition",
    body: "Qualifications must be Ofqual-regulated or endorsed by a recognised professional body (REPs, AfN, Yoga Alliance Professionals).",
  },
  {
    icon: GraduationCap,
    title: "Tutor & assessor credentials",
    body: "Every tutor's qualifications are checked. Nobody teaches a course they aren't themselves qualified to assess on.",
  },
  {
    icon: ShieldCheck,
    title: "Assessment integrity",
    body: "Real external assessment, with re-sit rules published in writing.",
  },
  {
    icon: BookOpen,
    title: "Refunds & complaints",
    body: "Published refund policy and a real complaints route — not a contact form that goes silent once payment clears.",
  },
];

const RED_FLAGS = [
  "Awarding body not Ofqual-regulated or REPs-endorsed (or no awarding body listed at all).",
  "“Level 3 PT plus 40+ free CPDs” bundled — those CPDs are usually self-marked PDFs with no awarding body.",
  "Everything is in-house multiple-choice, with no real external assessment.",
  "Tutor names, faces and qualifications hidden behind a generic “expert team” page.",
  "High-pressure finance sales, “today-only” discounts and an income-claim-led pitch.",
];

const GOOD_SIGNS = [
  "Regulated qualification on the RQF, awarded by a named Ofqual body.",
  "REPs endorsement listed openly on the course page.",
  "Tutors are named, with their own qualifications visible and verifiable.",
  "External assessment, with re-sit rules in writing.",
  "Published refund policy and complaints procedure.",
];

/* ------------------------------------------------------------------ */
/* FAQ — trimmed to 6                                                  */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "What qualifications do I actually need to work as a personal trainer?",
    a: "The professional baseline is a Level 3 Personal Trainer qualification on the regulated framework (Ofqual / RQF). Most routes start with a Level 2 Gym Instructor first. Specialist work — clinical populations, strength & conditioning, pre/post-natal — sits at Level 4 with a recognised awarding body. REPs cross-checks every qualification against the awarding body before it appears on a profile.",
  },
  {
    q: "What's a regulated qualification, and why does it matter?",
    a: "A regulated qualification sits on the official framework (in the UK, the Regulated Qualifications Framework, governed by Ofqual) and is awarded by an approved awarding body — Active IQ, YMCA Awards, Focus Awards and similar. Regulated means the course content, assessment and tutor standards are independently checked. An unregulated 'diploma' has no such check. Insurers, employers and registers like REPs only recognise regulated qualifications.",
  },
  {
    q: "How do I know a training provider is legitimate before I pay them?",
    a: "Four checks: (1) the qualification they offer is Ofqual-regulated or endorsed by a recognised body; (2) tutors are named with their own qualifications visible; (3) there is real external assessment, with re-sit rules in writing; (4) refund and complaints policies are published. REPs-verified providers have already passed those checks.",
  },
  {
    q: "What's the difference between a Nutritionist and a Dietitian?",
    a: "Anyone can call themselves a 'nutritionist' — the title isn't legally protected. On REPs we only list nutritionists who hold ANutr or RNutr status with the Association for Nutrition (or an equivalent degree-led registration). 'Dietitian' is legally protected and regulated by the HCPC — it's the only role that can assess, diagnose and treat clinical conditions with diet.",
  },
  {
    q: "What is CPD?",
    a: "Continuing Professional Development. Ongoing, evidenced learning that a professional commits to after their initial qualification — courses, conferences, peer-reviewed reading, supervised practice. The point is that the qualification on the wall stays current with the science, not frozen at the date it was passed. REPs members log CPD quarterly, and hours through a verified provider auto-count toward the log.",
  },
  {
    q: "Why are some big-name training providers not on REPs?",
    a: "Verification is open to apply for and the standard is industry-baseline — accrediting body recognition, tutor checks, assessment integrity, published refund and complaints policies. If a provider isn't here, treat that as information and ask them why.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function EducationPage() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
        <PublicHeader variant="solid" />

        <Hero />
        <WhatEducationIs />
        <Qualifications />
        <CpdInOneSection />
        <VerifiedProviders />
        <ProviderCtaBand />
        <FaqBlock />
        <JoinRepsCta />

        <PublicFooter />
      </div>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[640px] sm:min-h-[680px] lg:min-h-[680px]">
      <img
        src={heroCpd}
        alt=""
        width={1536}
        height={1024}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[78%_38%] sm:object-[72%_42%] md:object-[68%_45%] lg:object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/30 via-reps-ink/55 to-reps-ink/80 lg:bg-reps-ink/35 lg:bg-none" />
      <div
        aria-hidden
        className="absolute inset-0 hidden lg:block bg-[radial-gradient(50%_75%_at_18%_55%,rgba(10,10,12,0.72),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(60%_50%_at_50%_15%,rgba(255,122,0,0.12),transparent_72%)] lg:bg-[radial-gradient(40%_45%_at_15%_20%,rgba(255,122,0,0.10),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent via-reps-ink/55 to-reps-ink lg:h-40 lg:via-reps-ink/60"
      />

      <div className="relative mx-auto max-w-[1320px] px-6 pb-20 pt-20 lg:px-10 lg:pb-28 lg:pt-24">
        <div className="flex max-w-[720px] flex-col items-start">
          <span
            className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-reps-border bg-reps-panel/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur"
            style={{ animationDuration: "560ms", animationFillMode: "both" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Education & standards
          </span>

          <h1
            className="mt-6 animate-fade-in font-display text-[36px] font-bold leading-[1.04] text-white sm:text-[46px] lg:text-[60px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            Know what the letters mean.{" "}
            <span className="text-reps-orange">Then pick a provider that earns them.</span>
          </h1>

          <p
            className="mt-6 max-w-[580px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            Regulated qualifications, REPs-verified training providers, and CPD that's logged —
            explained in plain English so you spend on the right course, or hire the right professional.
          </p>

          <div
            className="mt-8 flex animate-fade-in flex-wrap gap-3"
            style={{ animationDuration: "640ms", animationDelay: "260ms", animationFillMode: "both" }}
          >
            <a
              href="#verified-providers"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Browse verified providers <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#qualifications"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              Decode the qualifications
            </a>
          </div>

          <div
            className="mt-10 w-full animate-fade-in border-t border-white/10 pt-5"
            style={{ animationDuration: "640ms", animationDelay: "420ms", animationFillMode: "both" }}
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
              <span>Ofqual</span>
              <span className="text-reps-orange/70">·</span>
              <span>REPs</span>
              <span className="text-reps-orange/70">·</span>
              <span>AfN</span>
              <span className="text-reps-orange/70">·</span>
              <span>HCPC</span>
              <span className="text-reps-orange/70">·</span>
              <span>YAP</span>
              <span className="ml-2 text-reps-orange">— cross-checked at source</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section: What real education looks like                             */
/* ------------------------------------------------------------------ */

function WhatEducationIs() {
  const counts = [
    "Regulated qualifications on the RQF (Ofqual-recognised)",
    "REPs-endorsed CPD courses with external assessment",
    "Accredited conferences, workshops and supervised mentoring",
    "Peer-reviewed reading with reflective notes",
    "Specialist Level 4 credentials from recognised awarding bodies",
  ];
  const doesnt = [
    "Unregulated 'diplomas' with no named awarding body",
    "Vendor product demos dressed up as education",
    "Sales webinars from supplement or app companies",
    "Free in-house 'mini-CPDs' bundled with a sales course",
    "Anything self-marked with no external check",
  ];
  return (
    <section id="what-education-is" className="scroll-mt-[140px] border-b border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[760px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            What real education looks like
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Qualified. Verified. Kept current.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
            Three layers sit behind every REPs professional: a regulated qualification from a recognised
            awarding body, a training provider that's been checked end-to-end, and ongoing CPD that's
            logged. Miss any one and the standard breaks.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <article className="rounded-[18px] border border-reps-border bg-reps-panel p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Check className="h-5 w-5" />
              </span>
              <h3 className="font-display text-[18px] font-bold text-white">What counts</h3>
            </div>
            <ul className="mt-5 flex flex-col gap-2.5 text-[14px] leading-relaxed text-white/80">
              {counts.map((c) => (
                <li key={c} className="flex gap-2">
                  <Check className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[18px] border border-reps-border bg-reps-panel p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/5 text-white/70">
                <X className="h-5 w-5" />
              </span>
              <h3 className="font-display text-[18px] font-bold text-white">What doesn't</h3>
            </div>
            <ul className="mt-5 flex flex-col gap-2.5 text-[14px] leading-relaxed text-white/70">
              {doesnt.map((d) => (
                <li key={d} className="flex gap-2">
                  <X className="mt-[3px] h-4 w-4 shrink-0 text-white/40" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section: Qualification ladder                                       */
/* ------------------------------------------------------------------ */

function Qualifications() {
  return (
    <section id="qualifications" className="scroll-mt-[140px] border-b border-reps-border bg-reps-midnight">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[820px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            Qualifications, decoded
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Know what the letters mean — before you spend a penny.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
            The industry runs on acronyms, and most buyers don't know the difference between a
            Level 2, a Level 3 and a weekend “mastery” certificate. Here's the real ladder —
            for fitness, nutrition and movement disciplines.
          </p>
        </div>

        {/* Fitness ladder */}
        <div className="mt-12">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <Activity className="h-4 w-4" />
            </span>
            <h3 className="font-display text-[20px] font-bold text-white">Fitness pathway</h3>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {FITNESS_LADDER.map((r) => (
              <article key={r.level} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="inline-flex items-center rounded-[6px] bg-reps-orange-soft px-2 py-0.5 text-[12px] font-semibold text-reps-orange">
                  {r.level}
                </span>
                <h4 className="mt-3 font-display text-[20px] font-bold leading-tight text-white">
                  {r.title}
                </h4>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{r.blurb}</p>

                <h5 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Can do
                </h5>
                <ul className="mt-2 flex flex-col gap-2 text-[13px] leading-relaxed text-white/80">
                  {r.scope.map((s) => (
                    <li key={s} className="flex gap-2">
                      <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-reps-orange" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>

                <h5 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Can't do
                </h5>
                <ul className="mt-2 flex flex-col gap-2 text-[13px] leading-relaxed text-white/65">
                  {r.notScope.map((s) => (
                    <li key={s} className="flex gap-2">
                      <X className="mt-[3px] h-3.5 w-3.5 shrink-0 text-white/40" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 border-t border-reps-border pt-4">
                  <div className="flex flex-wrap gap-2">
                    {r.quals.map((q) => (
                      <Tooltip key={q.acronym}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="rounded-[6px] border border-reps-border bg-reps-ink px-2 py-1 text-[12px] font-semibold text-white underline decoration-reps-orange/70 decoration-dotted underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange"
                          >
                            {q.acronym}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span className="block text-[12px] font-semibold">{q.full}</span>
                          <span className="mt-1 block max-w-[260px] text-[12px] text-white/80">
                            {q.meaning}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Nutrition ladder */}
        <div className="mt-16">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <Heart className="h-4 w-4" />
            </span>
            <h3 className="font-display text-[20px] font-bold text-white">Nutrition pathway</h3>
          </div>
          <p className="mt-3 max-w-[760px] text-[14px] leading-relaxed text-white/70">
            Anyone can call themselves a “nutritionist.” Only one role is legally protected —
            and only that role can prescribe diets for disease.
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {NUTRITION_LADDER.map((row) => (
              <article
                key={row.title}
                className={`rounded-[18px] border bg-reps-panel p-6 ${
                  row.protected ? "border-reps-orange-border" : "border-reps-border"
                }`}
              >
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-[18px] font-bold text-white">{row.title}</h4>
                  {row.protected && (
                    <span className="inline-flex items-center gap-1 rounded-[6px] bg-reps-orange-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-reps-orange">
                      <ShieldCheck className="h-3 w-3" /> Protected title
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.14em] text-white/45">
                  {row.letters}
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-white/75">{row.body}</p>
                <ul className="mt-4 flex flex-col gap-2 text-[13px] leading-relaxed text-white/75">
                  {row.scope.map((s) => (
                    <li key={s} className="flex gap-2">
                      <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-reps-orange" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[18px] border border-reps-orange-border bg-reps-orange-soft px-5 py-4">
            <p className="text-[14px] leading-relaxed text-white">
              <strong className="text-white">Plain English:</strong> if someone selling you a
              “clinical meal plan” for a medical condition isn't a Registered Dietitian (RD, HCPC),
              they're operating outside their lane. REPs verifies which role you're actually getting.
            </p>
          </div>
        </div>

        {/* Movement disciplines */}
        <div className="mt-16">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="font-display text-[20px] font-bold text-white">Movement disciplines</h3>
          </div>
          <p className="mt-3 max-w-[760px] text-[14px] leading-relaxed text-white/70">
            Yoga and Pilates run on hours-based teacher training rather than the RQF. The honest
            standards are clear — here are the ones REPs cross-checks.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {MOVEMENT_QUALS.map((q) => (
              <Tooltip key={q.acronym}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-[8px] border border-reps-border bg-reps-panel px-3 py-1.5 text-[13px] font-semibold text-white underline decoration-reps-orange/70 decoration-dotted underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange"
                  >
                    {q.acronym}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="block text-[12px] font-semibold">{q.full}</span>
                  <span className="mt-1 block max-w-[260px] text-[12px] text-white/80">{q.meaning}</span>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section: CPD in one block                                           */
/* ------------------------------------------------------------------ */

function CpdInOneSection() {
  const mechanics = [
    {
      icon: RefreshCw,
      title: "Logged quarterly",
      body: "Members log every CPD activity in their REPs dashboard four times a year, with evidence attached to every entry.",
    },
    {
      icon: ShieldCheck,
      title: "Verified-provider hours auto-count",
      body: "Hours through a REPs-verified training provider flow straight into the log. Unverified hours sit in a separate column the public can see.",
    },
    {
      icon: Award,
      title: "Stack toward Level 4",
      body: "CPD can stack toward a recognised L4 credential — and the new specialism appears on the public profile once the awarding body confirms it.",
    },
  ];

  return (
    <section id="cpd" className="scroll-mt-[140px] border-b border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[760px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            Staying current
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Qualifications get you in the door. CPD keeps them current.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
            Continuing Professional Development is the ongoing, evidenced learning a professional commits to
            after their initial qualification. On REPs, it's logged in the dashboard and visible on the public profile.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {mechanics.map((m) => {
            const Icon = m.icon;
            return (
              <article key={m.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-[17px] font-bold text-white">{m.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{m.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section: Verified training providers (with red flags / good signs)  */
/* ------------------------------------------------------------------ */

function VerifiedProviders() {
  return (
    <section
      id="verified-providers"
      className="scroll-mt-[140px] border-b border-reps-border bg-reps-midnight"
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
              Verified training providers
            </span>
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
              If the provider isn't on REPs, ask them why.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
              A REPs-verified training provider has been checked at the points that actually matter —
              accrediting body recognition, tutor qualifications, assessment integrity, refund and
              complaints policy. CPD hours earned through them auto-count toward your REPs log.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
              The standard is industry-baseline. Verification is open to apply for. If a provider isn't
              listed, treat that as information.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/5 text-white/70">
                  <Flag className="h-4 w-4" />
                </span>
                <h3 className="font-display text-[15px] font-bold text-white">Red flags</h3>
              </div>
              <ul className="mt-4 flex flex-col gap-2.5 text-[13px] leading-relaxed text-white/75">
                {RED_FLAGS.map((r) => (
                  <li key={r} className="flex gap-2">
                    <X className="mt-[3px] h-3.5 w-3.5 shrink-0 text-white/40" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-[18px] border border-reps-orange-border bg-reps-panel p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <BadgeCheck className="h-4 w-4" />
                </span>
                <h3 className="font-display text-[15px] font-bold text-white">What good looks like</h3>
              </div>
              <ul className="mt-4 flex flex-col gap-2.5 text-[13px] leading-relaxed text-white/80">
                {GOOD_SIGNS.map((g) => (
                  <li key={g} className="flex gap-2">
                    <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-reps-orange" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>

        {/* Provider checks — 4-up row underneath */}
        <div className="mt-14">
          <h3 className="font-display text-[18px] font-bold text-white">
            The four checks every verified provider passes
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROVIDER_CHECKS.map((c) => {
              const Icon = c.icon;
              return (
                <article
                  key={c.title}
                  className="rounded-[18px] border border-reps-border bg-reps-panel p-5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h4 className="mt-4 font-display text-[15px] font-bold text-white">{c.title}</h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">{c.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section: Provider directory CTA                                     */
/* ------------------------------------------------------------------ */

function ProviderCtaBand() {
  return (
    <section className="border-b border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
        <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[640px]">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
                <BadgeCheck className="h-3.5 w-3.5" /> Training providers
              </span>
              <h2 className="mt-3 font-display text-[24px] font-bold leading-tight text-white lg:text-[30px]">
                Find a verified provider — or report one that isn't.
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/70">
                The verified-provider directory opens shortly. Until it does, if a provider
                claims credibility they can't back up, send it our way.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-[6px] border border-reps-border bg-reps-ink px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Directory · Coming soon
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Report a provider <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ block                                                           */
/* ------------------------------------------------------------------ */

function FaqBlock() {
  return (
    <section id="faq" className="scroll-mt-[140px] border-b border-reps-border bg-reps-midnight">
      <div className="mx-auto max-w-[920px] px-6 py-20 lg:px-10 lg:py-24">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
          FAQ
        </span>
        <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[38px]">
          Qualifications, providers & CPD — answered.
        </h2>

        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b border-reps-border">
              <AccordionTrigger className="text-left text-[15.5px] font-semibold text-white hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[14.5px] leading-relaxed text-white/75">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Join REPs CTA                                                       */
/* ------------------------------------------------------------------ */

function JoinRepsCta() {
  return (
    <section className="bg-reps-ink py-16 lg:py-20">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="relative isolate overflow-hidden rounded-[24px] border border-reps-border bg-reps-ink text-white shadow-[var(--reps-shadow-card)]">
          <div className="relative w-full md:absolute md:inset-0">
            <img
              src={ctaTrainers}
              alt=""
              className="aspect-[5/4] w-full object-cover object-[100%_center] md:aspect-auto md:h-full md:object-[100%_top] lg:object-center"
              loading="lazy"
            />
            <div
              className="absolute inset-0 hidden md:block"
              style={{ backgroundImage: "linear-gradient(to bottom, transparent 0%, transparent 18%, rgba(11,13,16,0.38) 42%, rgba(11,13,16,0.72) 65%, #0B0D10 88%)" }}
            />
            <div
              className="absolute inset-0 hidden lg:block"
              style={{ backgroundImage: "linear-gradient(to right, #0B0D10 0%, rgba(11,13,16,0.95) 25%, rgba(11,13,16,0.55) 38%, rgba(11,13,16,0) 50%)" }}
            />
          </div>
          <div className="relative px-6 py-10 md:min-h-[480px] md:px-10 md:py-12 lg:min-h-[440px] lg:px-14 lg:py-14">
            <div className="max-w-[520px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                <Sparkles className="h-3 w-3 fill-reps-orange" /> For professionals
              </span>
              <h2 className="mt-4 font-display text-[28px] font-bold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-[32px] lg:text-[38px]">
                Turn your CPD into clients.
              </h2>
              <p className="mt-3 max-w-[440px] text-[14.5px] leading-relaxed text-white/85">
                Join the global register of verified fitness professionals. Showcase your qualifications, CPD and specialisms on a profile clients actually find.
              </p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {[
                  "Verified profile that ranks",
                  "Qualifications & CPD on show",
                  "Built-in bookings & payments",
                  "Clients, CRM & messaging",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[14px] text-white">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-reps-orange/70 text-reps-orange">
                      <Star className="h-3 w-3 fill-reps-orange" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/for-professionals"
                  className="inline-flex h-[48px] items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-dark"
                >
                  Join REPs <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex h-[48px] items-center rounded-[10px] border border-white/30 px-6 text-[14.5px] font-semibold text-white shadow-none transition-colors hover:bg-white/10"
                >
                  See plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
