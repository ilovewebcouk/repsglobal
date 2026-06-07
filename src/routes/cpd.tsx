import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Check,
  Crosshair,
  ExternalLink,
  Flag,
  GraduationCap,
  Heart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Wand2,
  X,
} from "lucide-react";

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
import { PressMarquee } from "@/components/marketing/PressMarquee";

import heroCpdAsset from "@/assets/cpd-hero-v5.jpg.asset.json";
const heroCpd = heroCpdAsset.url;

/* ------------------------------------------------------------------ */
/* Page head                                                           */
/* ------------------------------------------------------------------ */

const CANONICAL = "https://repsglobal.lovable.app/cpd";
const META_TITLE =
  "CPD & Verified Training Providers — Education that actually counts | REPs";
const META_DESC =
  "What CPD really is, how REPs governs it, and how to spot an unsafe training provider before you pay. Every CPD hour through a REPs-verified provider counts. The rest don't count.";

export const Route = createFileRoute("/cpd")({
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
  component: CpdPage,
});

function FAQS_FOR_JSONLD() {
  return FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  }));
}

/* ------------------------------------------------------------------ */
/* Sticky nav chips                                                    */
/* ------------------------------------------------------------------ */

const NAV_CHIPS: Array<{ anchor: string; label: string }> = [
  { anchor: "what-cpd-is", label: "What CPD is" },
  { anchor: "how-reps-runs-it", label: "How REPs runs it" },
  { anchor: "qualifications", label: "Qualifications" },
  { anchor: "specialist-vs-generalist", label: "Generalist vs specialist" },
  { anchor: "verified-providers", label: "Verified providers" },
  { anchor: "dodgy-courses", label: "Spot a poor-quality course" },
  { anchor: "raise-the-standard", label: "Raise the standard" },
  { anchor: "faq", label: "FAQ" },
];

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
        meaning: "The global register that sets professional standards across the sport and physical-activity sector and endorses qualifications, providers and CPD.",
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
        meaning: "The global register that sets professional standards across the sport and physical-activity sector and endorses qualifications, providers and CPD.",
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
        meaning: "The global register that sets professional standards across the sport and physical-activity sector and endorses qualifications, providers and CPD.",
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
    letters: "ANutr / RNutr (AfN)",
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
    letters: "RD (HCPC)",
    body:
      "The only legally protected title. Regulated by the Health & Care Professions Council. The only role that can assess, diagnose and treat clinical conditions with diet.",
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
    body: "Real external assessment — not in-house multiple-choice questions you can resit until you pass.",
  },
  {
    icon: BookOpen,
    title: "Refunds & complaints",
    body: "Published refund policy and a real complaints route — not a help-desk that goes silent once payment clears.",
  },
];

const REGISTERS = [
  {
    short: "Ofqual",
    full: "Office of Qualifications & Examinations Regulation",
    covers: "Regulated vocational qualifications (RQF — L2, L3, L4)",
    meaning: "The independent regulator. If a fitness qualification isn't on the RQF, it doesn't count as a regulated qualification.",
    href: "https://www.gov.uk/government/organisations/ofqual",
  },
  {
    short: "REPs",
    full: "Register of Exercise Professionals",
    covers: "Endorses training providers, qualifications and CPD",
    meaning: "Sets professional standards across the sport and physical-activity sector. REPs-endorsed CPD is the safe default.",
    href: "/",
  },
  {
    short: "Active IQ",
    full: "Active IQ (Awarding Organisation)",
    covers: "Awards regulated L2, L3 and L4 fitness qualifications",
    meaning: "One of the largest Ofqual-regulated awarding bodies for active-leisure qualifications.",
    href: "https://www.activeiq.co.uk/",
  },
  {
    short: "YMCA Awards",
    full: "YMCA Awards (Awarding Organisation)",
    covers: "Regulated fitness and active-leisure qualifications",
    meaning: "Long-established awarding body for personal training and instructor qualifications.",
    href: "https://www.ymcaawards.co.uk/",
  },
  {
    short: "Focus Awards",
    full: "Focus Awards (Awarding Organisation)",
    covers: "Regulated qualifications across fitness, education and care",
    meaning: "Ofqual-recognised awarding organisation used by many fitness training providers.",
    href: "https://focusawards.org.uk/",
  },
  {
    short: "AfN",
    full: "Association for Nutrition",
    covers: "Nutritionists (ANutr, RNutr) and nutrition courses",
    meaning: "Owner of the UK Voluntary Register of Nutritionists — the meaningful baseline for 'nutritionist'.",
    href: "https://www.associationfornutrition.org/",
  },
  {
    short: "HCPC",
    full: "Health & Care Professions Council",
    covers: "Registered Dietitians (RD) — legally protected title",
    meaning: "Statutory regulator. The only register where 'dietitian' is legally protected.",
    href: "https://www.hcpc-uk.org/",
  },
  {
    short: "YAP",
    full: "Yoga Alliance Professionals",
    covers: "Yoga teachers, schools and training providers",
    meaning: "Verifies teacher-training hours (200hr / 500hr) and standards across studios.",
    href: "https://www.yogaalliance.com/",
  },
];

/* ------------------------------------------------------------------ */
/* Dodgy-course red flags                                              */
/* ------------------------------------------------------------------ */

const RED_FLAGS = [
  "“Level 3 PT plus dozens of free CPD courses” bundled — those CPDs are typically self-marked PDFs with no awarding body behind them.",
  "Awarding body not Ofqual-regulated or REPs-endorsed (or no awarding body listed at all).",
  "No external assessment — everything is in-house multiple-choice you can retake until you pass.",
  "High-pressure finance sales, “today-only” discounts and commission-based sales reps.",
  "Tutor names, faces and qualifications hidden behind a generic “expert team” page.",
  "No refund policy. No complaints route. No external ombudsman.",
  "Marketing leads with income claims (“earn £5k a month”) instead of what you'll actually learn.",
];

const GOOD_SIGNS = [
  "Regulated qualification on the RQF, awarded by a named Ofqual body.",
  "REPs endorsement listed openly on the course page.",
  "Tutors are named, with their own qualifications visible and verifiable.",
  "External assessment, with re-sit rules in writing.",
  "Published refund policy, complaints procedure and learner-outcome data.",
  "Listed on REPs as a verified training provider — CPD hours auto-count toward your log.",
];

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "What is CPD?",
    a: "Continuing Professional Development. Ongoing, evidenced learning that a professional commits to after their initial qualification — courses, conferences, peer-reviewed reading, supervised practice. The point is that the certificate on your wall stays current with the science, not frozen at the date you passed.",
  },
  {
    q: "How many CPD hours do I need per year on REPs?",
    a: "Every REPs professional commits to a meaningful annual minimum, logged quarterly in their dashboard and audited at random. Specific hour thresholds per tier are published in each member's onboarding pack and updated as standards evolve.",
  },
  {
    q: "What happens if I miss a CPD quarter?",
    a: "The verified badge auto-suspends on the public profile until you bring your CPD log current. The public can see that a profile is currently unverified — that's the entire point of the standard. Catch up, log it, badge restored.",
  },
  {
    q: "Does the L3 PT course I'm considering need to be from a REPs-verified provider?",
    a: "If you want the qualification to mean anything on REPs — yes. Hours through a verified provider auto-count toward your CPD log once you're a member. Hours through unverified providers don't. More importantly, REPs-verified providers have been checked for accreditation, tutor qualifications and assessment integrity. If the provider isn't on REPs, ask them why.",
  },
  {
    q: "Why are some big-name training providers not on REPs?",
    a: "Because the bar is real. Verification is open to apply for and the standard is industry-baseline — accrediting body recognition, tutor checks, assessment integrity, published refund and complaints policies. There is no legitimate reason to refuse it. If a provider isn't here, treat that as a signal.",
  },
  {
    q: "What's the difference between a Nutritionist and a Dietitian?",
    a: "Anyone can call themselves a 'nutritionist' — the title isn't legally protected. On REPs we only list nutritionists who hold ANutr or RNutr status with the Association for Nutrition (or an equivalent degree-led registration). 'Dietitian' is legally protected and regulated by the HCPC — it's the only role that can assess, diagnose and treat clinical conditions with diet.",
  },
  {
    q: "Do I need a specialist or is a general PT enough?",
    a: "For general adult fitness — fat loss, strength, getting stronger and healthier — a Level 3 PT is the right tool. For specialist populations (clinical conditions, pre/post-natal, competition strength & conditioning, rehabilitation), you want a Level 4 specialist or a registered S&C coach. REPs surfaces the right specialism for the goal so you don't end up with a generalist trying to wing it.",
  },
  {
    q: "Can CPD upgrade me to a new specialism?",
    a: "Yes. Stack CPD toward a recognised Level 4 credential — strength & conditioning, lower-back pain, pre/post-natal, obesity & diabetes, online coaching — and the new specialism appears on your REPs profile once the awarding body confirms it.",
  },
  {
    q: "Does being verified on REPs let me charge more?",
    a: "When the public can tell the difference between a verified expert and an unverified operator, the verified expert sets the price. Visible verification + logged CPD + a specialism credential is the case for charging what you're worth. REPs exists to widen that gap, not narrow it.",
  },
  {
    q: "How do I report a poor-quality provider or coach?",
    a: "Use the reporting route on this page. Every report is reviewed, evidence cross-checked, and where required, escalated to the relevant awarding body or register. Bad actors lose verification and lose listings.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function CpdPage() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
        <PublicHeader variant="solid" />

        <Hero />

        <PressMarquee />

        <StickyNav />

        <WhatCpdIs />

        <RepsCpdSystem />

        <Qualifications />

        <GeneralistVsSpecialist />

        <VerifiedProviders />

        <DodgyCourses />

        <RaiseTheStandard />

        <ProviderCtaBand />

        <RegistersBlock />

        <VerifyStrip />

        <FaqBlock />

        <CrossLinkStrip />

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
    <section className="relative overflow-hidden lg:min-h-[680px]">
      <img
        src={heroCpd}
        alt=""
        width={1536}
        height={1024}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[75%_center] lg:object-center"
      />
      <div className="absolute inset-0 bg-reps-ink/55 lg:bg-reps-ink/35" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(95%_75%_at_30%_45%,rgba(10,10,12,0.60),transparent_75%)] lg:bg-[radial-gradient(50%_75%_at_18%_55%,rgba(10,10,12,0.72),transparent_70%)]"
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
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> CPD & Education
          </span>

          <h1
            className="mt-6 animate-fade-in font-display text-[36px] font-bold leading-[1.04] text-white sm:text-[46px] lg:text-[60px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            The certificate is only worth
            <br />
            <span className="text-reps-orange">the people behind it.</span>
          </h1>

          <p
            className="mt-6 max-w-[580px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            REPs is the global standard for verified CPD in fitness, sport and physical activity.
            CPD keeps a qualification current — logged quarterly, audited annually, and only counted
            when it's from a verified training provider. If a course isn't from a verified provider,
            it doesn't count toward your CPD log.
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
              href="#how-reps-runs-it"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              How REPs governs CPD
            </a>
          </div>

          <ul
            className="mt-7 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/75"
            style={{ animationDuration: "640ms", animationDelay: "340ms", animationFillMode: "both" }}
          >
            <li className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-reps-orange" />
              Identity, qualification & insurance verified
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-reps-orange" />
              CPD logged quarterly, audited annually
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-reps-orange" />
              Only verified-provider hours count
            </li>
          </ul>

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
/* Sticky in-page nav                                                  */
/* ------------------------------------------------------------------ */

function StickyNav() {
  return (
    <nav
      aria-label="CPD page sections"
      className="sticky top-[72px] z-30 border-t border-white/10 border-b border-reps-border/60 bg-reps-ink/85 backdrop-blur supports-[backdrop-filter]:bg-reps-ink/70"
    >
      <div className="mx-auto flex h-[52px] max-w-[1320px] items-center gap-1 overflow-x-auto px-6 lg:px-10">
        {NAV_CHIPS.map((c) => (
          <a
            key={c.anchor}
            href={`#${c.anchor}`}
            className="whitespace-nowrap rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-reps-muted transition-colors hover:bg-reps-panel hover:text-white"
          >
            {c.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Section: What CPD actually is                                       */
/* ------------------------------------------------------------------ */

function WhatCpdIs() {
  const counts = [
    "Regulated qualifications (Ofqual / RQF)",
    "REPs-endorsed CPD courses",
    "Accredited conferences and workshops",
    "Peer-reviewed reading with reflective notes",
    "Supervised mentoring with a senior coach",
  ];
  const doesnt = [
    "Vendor product demos presented as “education”",
    "Sales webinars from supplement or app companies",
    "YouTube videos with no awarding body or assessment",
    "Free in-house “mini-CPDs” bundled with a sales course",
    "Anything self-marked with no external check",
  ];
  return (
    <section id="what-cpd-is" className="scroll-mt-[140px] border-b border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[760px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            What CPD actually is
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Ongoing learning that's actually checked.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
            Continuing Professional Development means a professional keeps learning after the initial
            qualification — and proves it. The science of training, nutrition and rehab moves every year.
            Adjacent professions (physio, dietetics, medicine) mandate CPD by default. Fitness should too.
            On REPs, it does.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <article className="rounded-[18px] border border-reps-border bg-reps-panel p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Check className="h-5 w-5" />
              </span>
              <h3 className="font-display text-[18px] font-bold text-white">What counts as CPD</h3>
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
/* Section: How REPs runs CPD                                          */
/* ------------------------------------------------------------------ */

function RepsCpdSystem() {
  const pillars = [
    {
      icon: RefreshCw,
      title: "Logged quarterly",
      body: "Members log every CPD activity in their REPs dashboard four times a year — with evidence attached. Self-declared hours without evidence don't count.",
    },
    {
      icon: ShieldCheck,
      title: "Verified-provider only",
      body: "Hours through REPs-verified training providers auto-count. Hours from unverified providers don't — they go in a separate column the public can see.",
    },
    {
      icon: Award,
      title: "Specialism stacking",
      body: "Stack CPD toward a recognised L4 credential and the new specialism appears on your public profile once the awarding body confirms it.",
    },
    {
      icon: Crosshair,
      title: "Audited annually",
      body: "A random sample of members is fully audited each year. Faked logs lose verification. The badge means current — not historic.",
    },
  ];

  return (
    <section
      id="how-reps-runs-it"
      className="scroll-mt-[140px] border-b border-reps-border bg-reps-panel-soft/40"
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[760px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            How REPs runs CPD
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Four mechanics. No window dressing.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
            CPD is only worth something if it's evidenced, governed and visible to the public.
            Here's the system every REPs professional signs up to.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <article key={p.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-[17px] font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{p.body}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-[18px] border border-reps-orange-border bg-reps-orange-soft px-5 py-4">
          <BadgeCheck className="h-5 w-5 text-reps-orange" />
          <span className="text-[14px] font-semibold text-white">
            Miss a quarter, the badge auto-suspends on your public profile until you bring CPD current.
          </span>
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
    <section id="qualifications" className="scroll-mt-[140px] border-b border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[820px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            Qualifications, decoded
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Know what the letters actually mean — before you spend.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
            The fitness industry runs on acronyms, and most clients can't tell the difference between
            a Level 2, a Level 3 and a weekend “mastery” certificate. Here's the real ladder —
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
            This is where the public is most often misled. Anyone can call themselves a “nutritionist.”
            Only one role is legally protected — and only that role can prescribe diets for disease.
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
/* Section: Generalist vs specialist                                   */
/* ------------------------------------------------------------------ */

function GeneralistVsSpecialist() {
  return (
    <section
      id="specialist-vs-generalist"
      className="scroll-mt-[140px] border-b border-reps-border bg-reps-panel-soft/40"
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[820px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            Generalist vs specialist
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            You wouldn't book your GP for a heart operation.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
            Medicine sorted this out a long time ago. For the thing you actually need fixed, you
            see the specialist — not the generalist. Fitness should work the same way.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[18px] border border-reps-border bg-reps-panel p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Stethoscope className="h-5 w-5" />
              </span>
              <h3 className="font-display text-[18px] font-bold text-white">In medicine</h3>
            </div>
            <ul className="mt-5 flex flex-col gap-3 text-[14.5px] leading-relaxed text-white/80">
              <li className="flex gap-2.5">
                <ArrowRight className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                <span>Heart issue? You see a <strong className="text-white">cardiologist</strong>.</span>
              </li>
              <li className="flex gap-2.5">
                <ArrowRight className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                <span>Knee rebuild? You see an <strong className="text-white">orthopaedic surgeon</strong>.</span>
              </li>
              <li className="flex gap-2.5">
                <ArrowRight className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                <span>Clinical diet? You see a <strong className="text-white">dietitian</strong>.</span>
              </li>
              <li className="flex gap-2.5">
                <ArrowRight className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                <span>The GP is brilliant at triage — not at the thing you actually need fixed.</span>
              </li>
            </ul>
          </article>

          <article className="rounded-[18px] border border-reps-border bg-reps-panel p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <h3 className="font-display text-[18px] font-bold text-white">Same logic. Different industry.</h3>
            </div>
            <ul className="mt-5 flex flex-col gap-3 text-[14.5px] leading-relaxed text-white/80">
              <li className="flex gap-2.5">
                <ArrowRight className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                <span>A <strong className="text-white">Level 3 PT</strong> trains the general adult population safely. That's the GP.</span>
              </li>
              <li className="flex gap-2.5">
                <ArrowRight className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                <span>A <strong className="text-white">Level 4 specialist</strong>, an <strong className="text-white">accredited S&C coach</strong>, a <strong className="text-white">Registered Dietitian</strong> — that's the consultant.</span>
              </li>
              <li className="flex gap-2.5">
                <ArrowRight className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                <span>REPs surfaces the specialist for the exact thing you're chasing. Not a generalist with a side interest.</span>
              </li>
              <li className="flex gap-2.5">
                <ArrowRight className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                <span>Generalists are fine for general. For specific, get specific.</span>
              </li>
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/specialisms"
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[13.5px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Browse specialisms <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/find-a-professional"
                className="inline-flex h-11 items-center rounded-[10px] border border-reps-border bg-reps-ink px-5 text-[13.5px] font-semibold text-white shadow-none hover:border-reps-orange-border"
              >
                Find a specialist
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section: Verified training providers                                */
/* ------------------------------------------------------------------ */

function VerifiedProviders() {
  return (
    <section
      id="verified-providers"
      className="scroll-mt-[140px] border-b border-reps-border bg-reps-ink"
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
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
              complaints policy. Every CPD hour you earn through them auto-counts toward your REPs
              log. Hours from unverified providers don't.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
              The standard is industry-baseline. Verification is open to apply for. The only reason
              a provider refuses or fails it is the reason you should refuse them.
            </p>

            <blockquote className="mt-8 border-l-2 border-reps-orange pl-5">
              <p className="font-display text-[18px] leading-snug text-white lg:text-[20px]">
                “The honest providers are already here. The rest are selling certificates without standards.”
              </p>
            </blockquote>
          </div>

          <div className="grid gap-4">
            {PROVIDER_CHECKS.map((c) => {
              const Icon = c.icon;
              return (
                <article
                  key={c.title}
                  className="rounded-[18px] border border-reps-border bg-reps-panel p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-[15px] font-bold text-white">{c.title}</h3>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/70">{c.body}</p>
                    </div>
                  </div>
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
/* Section: Dodgy courses                                              */
/* ------------------------------------------------------------------ */

function DodgyCourses() {
  return (
    <section
      id="dodgy-courses"
      className="scroll-mt-[140px] border-b border-reps-border bg-reps-panel-soft/40"
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[820px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            Spot a poor-quality course
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Before you pay, run this list.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
            Low-quality training providers follow the same playbook — oversized claims, hidden tutors,
            in-house assessment, finance pressure and a long list of bundled “free” CPDs.
            Here's what to look for, and what good actually looks like.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[18px] border border-reps-border bg-reps-panel p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/5 text-white/70">
                <Flag className="h-5 w-5" />
              </span>
              <h3 className="font-display text-[18px] font-bold text-white">Red flags</h3>
            </div>
            <ul className="mt-5 flex flex-col gap-3 text-[14px] leading-relaxed text-white/80">
              {RED_FLAGS.map((r) => (
                <li key={r} className="flex gap-2.5">
                  <X className="mt-[3px] h-4 w-4 shrink-0 text-white/45" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[18px] border border-reps-orange-border bg-reps-panel p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <h3 className="font-display text-[18px] font-bold text-white">What good looks like</h3>
            </div>
            <ul className="mt-5 flex flex-col gap-3 text-[14px] leading-relaxed text-white/80">
              {GOOD_SIGNS.map((g) => (
                <li key={g} className="flex gap-2.5">
                  <Check className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                  <span>{g}</span>
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
/* Section: Raise the standard                                         */
/* ------------------------------------------------------------------ */

function RaiseTheStandard() {
  const beats = [
    {
      n: "01",
      title: "Filter out the bad actors.",
      body: "Unqualified trainers. “Online coaches” selling £400 PDFs. People issuing meal plans they're not legally allowed to prescribe. REPs makes them visibly absent — the listing alone proves the work.",
    },
    {
      n: "02",
      title: "Make the profession look like a profession.",
      body: "Identity check, qualification check, insurance check, CPD logged and audited. The same baseline a physio or dietitian meets — applied to fitness, properly and publicly.",
    },
    {
      n: "03",
      title: "So you can charge what you're worth.",
      body: "When the public can tell the difference between a verified expert and an unqualified operator, the verified expert sets the price. REPs exists to widen that gap, not narrow it.",
    },
  ];

  return (
    <section
      id="raise-the-standard"
      className="scroll-mt-[140px] border-b border-reps-border bg-reps-ink"
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[820px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
            <TrendingUp className="h-3.5 w-3.5" /> Raise the standard
          </span>
          <h2 className="mt-4 font-display text-[32px] font-bold leading-[1.05] text-white lg:text-[44px]">
            REPs exists for one reason: to raise the floor of this industry.
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-white/75">
            Fitness has been cheap for too long because nobody checks. REPs checks. That's the entire
            product. Three things change when the standard goes up.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {beats.map((b) => (
            <article
              key={b.n}
              className="rounded-[18px] border border-reps-border bg-reps-panel p-7"
            >
              <span className="font-display text-[40px] font-bold leading-none text-reps-orange/70">
                {b.n}
              </span>
              <h3 className="mt-4 font-display text-[20px] font-bold leading-snug text-white">
                {b.title}
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-white/75">{b.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-[22px] border border-reps-orange-border bg-reps-orange-soft px-6 py-6 lg:px-8">
          <p className="font-display text-[20px] font-bold leading-tight text-white lg:text-[24px]">
            Cheap coaching exists because nobody checks. REPs checks.
            <span className="text-reps-orange"> Price accordingly.</span>
          </p>
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
                The REPs verified-provider directory opens shortly. In the meantime, if a provider
                claims credibility they can't back up, send it our way.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span
                aria-disabled
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange/60 px-6 text-[14px] font-semibold text-white shadow-none"
                title="Verified provider directory coming soon"
              >
                Directory coming soon
              </span>
              <Link
                to="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink px-6 text-[14px] font-semibold text-white shadow-none hover:border-reps-orange-border"
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
/* Registers block                                                     */
/* ------------------------------------------------------------------ */

function RegistersBlock() {
  return (
    <section className="border-b border-reps-border bg-reps-panel-soft/40">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[760px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            The regulators, awarding bodies & registers
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Every acronym, in plain English.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            The industry runs on letters after people's names. Here's what each one actually means —
            and which ones we cross-check before a profile or provider goes live on REPs.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REGISTERS.map((r) => (
            <article
              key={r.short}
              className="flex flex-col rounded-[18px] border border-reps-border bg-reps-panel p-6"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-[6px] bg-reps-orange-soft px-2 py-0.5 text-[12px] font-semibold text-reps-orange">
                  {r.short}
                </span>
              </div>
              <h3 className="mt-3 font-display text-[15px] font-bold leading-snug text-white">
                {r.full}
              </h3>
              <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.14em] text-white/45">
                {r.covers}
              </p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">{r.meaning}</p>
              {r.href && (
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-reps-orange hover:underline"
                >
                  Visit register <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Verify strip                                                        */
/* ------------------------------------------------------------------ */

const VERIFY_STEPS = [
  {
    icon: Wand2,
    title: "Identity",
    body: "Government photo ID and a live selfie check before any badge is issued.",
  },
  {
    icon: GraduationCap,
    title: "Qualifications",
    body: "Every credential cross-checked against the body that issued it — Ofqual, REPs, AfN, HCPC, YAP.",
  },
  {
    icon: ShieldCheck,
    title: "Insurance & CPD",
    body: "Public liability and professional indemnity confirmed current and scope-correct. CPD logged and audited.",
  },
];

function VerifyStrip() {
  return (
    <section className="border-b border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[760px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            How we verify every professional
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Three checks — every profile, every renewal.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {VERIFY_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-[18px] font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">{step.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-[18px] border border-reps-orange-border bg-reps-orange-soft px-5 py-4">
          <BadgeCheck className="h-5 w-5 text-reps-orange" />
          <span className="text-[14px] font-semibold text-white">
            The result: a single Verified badge the public can actually trust.
          </span>
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
    <section id="faq" className="scroll-mt-[140px] border-b border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[920px] px-6 py-20 lg:px-10 lg:py-24">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
          FAQ
        </span>
        <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[38px]">
          CPD, qualifications & providers — answered.
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
/* Cross-link strip                                                    */
/* ------------------------------------------------------------------ */

function CrossLinkStrip() {
  return (
    <section className="bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
        <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[520px]">
              <h2 className="font-display text-[22px] font-bold leading-tight text-white lg:text-[26px]">
                Looking for something else?
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                Jump into specialisms, find a verified pro, or read the rest of the REPs platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/specialisms"
                className="inline-flex h-9 items-center rounded-full border border-reps-border bg-reps-ink px-4 text-[13px] font-medium text-white shadow-none hover:border-reps-orange-border hover:text-reps-orange"
              >
                All specialisms
              </Link>
              <Link
                to="/find-a-professional"
                className="inline-flex h-9 items-center rounded-full border border-reps-border bg-reps-ink px-4 text-[13px] font-medium text-white shadow-none hover:border-reps-orange-border hover:text-reps-orange"
              >
                Find a professional
              </Link>
              <Link
                to="/for-professionals"
                className="inline-flex h-9 items-center rounded-full border border-reps-border bg-reps-ink px-4 text-[13px] font-medium text-white shadow-none hover:border-reps-orange-border hover:text-reps-orange"
              >
                For professionals
              </Link>
              <Link
                to="/about"
                className="inline-flex h-9 items-center rounded-full border border-reps-border bg-reps-ink px-4 text-[13px] font-medium text-white shadow-none hover:border-reps-orange-border hover:text-reps-orange"
              >
                About REPs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
