import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import ctaTrainers from "@/assets/cta-band.jpg";
import cpdProfileAsset from "@/assets/cpd-profile-screenshot.jpg.asset.json";
import { BrowserFrame } from "@/components/mockups/BrowserFrame";

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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

import heroCpdAsset from "@/assets/cpd-tutor-moment.jpg.asset.json";
const heroCpd = heroCpdAsset.url;

/* ------------------------------------------------------------------ */
/* Page head                                                           */
/* ------------------------------------------------------------------ */

const CANONICAL = "https://staging.repsuk.org/education";
const META_TITLE =
  "Fitness education that actually counts — qualifications & verified providers | REPs";
const META_DESC =
  "Regulated qualifications and REPs-verified training providers across fitness, nutrition, yoga and Pilates — and how to spot a worthless course before you spend a penny.";

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
    ],
  },
];

const NUTRITION_LADDER: LadderRung[] = [
  {
    level: "Tier 1",
    title: "Nutrition Coach",
    blurb:
      "A trained coach for general healthy eating, fat-loss frameworks and sports nutrition for the general population. Cannot prescribe diets for disease.",
    scope: [
      "Macro and food-first frameworks for healthy adults",
      "Fuelling for general fitness and recreational sport",
      "Refers clinical cases to a Registered Dietitian",
    ],
    notScope: ["Therapeutic diets for clinical conditions", "Diagnosis or medical treatment"],
    quals: [
      {
        acronym: "L3 / L4 Nutrition",
        full: "Level 3 / Level 4 Nutrition for Sport & Exercise",
        meaning: "Regulated nutrition qualifications for fitness professionals.",
      },
    ],
  },
  {
    level: "Tier 2",
    title: "Registered Nutritionist",
    blurb:
      "Degree-led, register-checked nutritionists on the UK Voluntary Register of Nutritionists. The meaningful baseline if you want a 'nutritionist' worth the name.",
    scope: [
      "Evidence-based nutrition for the healthy population",
      "Public health, food industry, sports nutrition",
      "Scope-of-practice declaration in writing",
    ],
    notScope: ["Therapeutic diets for clinical conditions"],
    quals: [
      {
        acronym: "ANutr",
        full: "Associate Registered Nutritionist (AfN)",
        meaning: "Entry-level registration with the Association for Nutrition.",
      },
      {
        acronym: "RNutr",
        full: "Registered Nutritionist (AfN)",
        meaning: "Full registration after three years of competent practice.",
      },
    ],
  },
  {
    level: "Tier 3",
    title: "Registered Dietitian",
    blurb:
      "The only legally protected title. Regulated by the Health & Care Professions Council. The only role that can assess, diagnose and treat clinical conditions with diet.",
    scope: [
      "Therapeutic diets for clinical conditions (IBS, kidney disease, eating disorders)",
      "Works in the NHS, hospitals and private clinics",
      "The only person legally allowed to call themselves a dietitian",
    ],
    notScope: [],
    quals: [
      {
        acronym: "RD",
        full: "Registered Dietitian (HCPC)",
        meaning: "Legally protected title. Statutory regulator: HCPC.",
      },
    ],
  },
];

const MOVEMENT_LADDER: LadderRung[] = [
  {
    level: "Yoga · Entry",
    title: "200-hour Yoga Teacher",
    blurb:
      "The internationally recognised baseline for yoga teachers. Hours-based teacher training rather than the RQF.",
    scope: [
      "General-population yoga classes (Hatha, Vinyasa, Yin)",
      "Group studio and online classes",
      "Beginner and improver-level teaching",
    ],
    notScope: ["Therapeutic or clinical yoga without further training"],
    quals: [
      {
        acronym: "YAP 200hr",
        full: "Yoga Alliance Professionals — 200-hour Teacher Training",
        meaning: "Internationally recognised baseline for yoga teachers.",
      },
      {
        acronym: "BWY L4",
        full: "British Wheel of Yoga — Level 4 Diploma",
        meaning: "Long-established teacher-training pathway recognised across studios.",
      },
    ],
  },
  {
    level: "Yoga · Senior",
    title: "500-hour Yoga Teacher",
    blurb:
      "Advanced training typical of senior or specialist teachers. Deeper anatomy, philosophy and teaching methodology.",
    scope: [
      "Teacher training and mentoring",
      "Specialist workshops and retreats",
      "Senior teaching at established studios",
    ],
    notScope: ["Clinical yoga therapy — separate qualification required"],
    quals: [
      {
        acronym: "YAP 500hr",
        full: "Yoga Alliance Professionals — 500-hour Teacher Training",
        meaning: "Advanced training; typical of senior or specialist teachers.",
      },
    ],
  },
  {
    level: "Pilates",
    title: "Pilates Teacher",
    blurb:
      "Regulated mat-Pilates qualifications plus recognised reformer / equipment certifications for studio work.",
    scope: [
      "Mat Pilates — group and 1:1",
      "Reformer and equipment-based Pilates",
      "General-population studio work",
    ],
    notScope: ["Clinical Pilates rehab without further training"],
    quals: [
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
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Provider verification checks                                        */
/* ------------------------------------------------------------------ */

const PROVIDER_CHECKS = [
  {
    icon: BadgeCheck,
    title: "Accrediting body recognition",
    body: "Qualifications must be Ofqual-regulated or endorsed by a recognised professional body — REPs, AfN, Yoga Alliance Professionals.",
  },
  {
    icon: GraduationCap,
    title: "Tutor & assessor credentials",
    body: "Every tutor's qualifications are checked. Nobody teaches a course they aren't themselves qualified to assess on.",
  },
  {
    icon: ShieldCheck,
    title: "Assessment integrity",
    body: "Real external assessment — not 47 multiple-choice questions you can re-take until you pass.",
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
  "“Level 3 PT plus 47 free CPD courses” bundled — those CPDs are usually self-marked PDFs with no awarding body.",
  "Awarding body not Ofqual-regulated or REPs-endorsed (or no awarding body listed at all).",
  "No external assessment — everything is in-house multiple-choice you can retake until you pass.",
  "High-pressure finance sales, “today-only” discounts and a sales rep on commission.",
  "Tutor names, faces and qualifications hidden behind a generic “expert team” page.",
  "No refund policy. No complaints route. No external ombudsman.",
  "Marketing leads with income claims instead of what you'll actually learn.",
];

const GOOD_SIGNS = [
  "Regulated qualification on the RQF, awarded by a named Ofqual body.",
  "REPs endorsement listed openly on the course page.",
  "Tutors are named, with their own qualifications visible and verifiable.",
  "External assessment, with re-sit rules in writing.",
  "Published refund policy, complaints procedure and learner-outcome data.",
  "Listed on REPs as a verified training provider — CPD hours auto-count toward your log.",
];

const ASK_BEFORE_YOU_PAY = [
  "Which awarding body issues this qualification, and is it on the Ofqual RQF?",
  "Can I see the names and qualifications of the tutors who'll teach and assess me?",
  "What does external assessment look like, and what's the written refund and complaints policy?",
];

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "What qualifications do I actually need to work as a personal trainer?",
    a: "The professional baseline is a Level 3 Personal Trainer qualification on the regulated framework (Ofqual / RQF). Most routes start with a Level 2 Gym Instructor first. Specialist work — clinical populations, strength & conditioning, pre/post-natal — sits at Level 4 with a recognised awarding body. REPs cross-checks every qualification against the awarding body before it appears on a profile.",
  },
  {
    q: "What's a regulated qualification, and why does it matter?",
    a: "A regulated qualification is one that sits on the official framework (in the UK, the Regulated Qualifications Framework, governed by Ofqual) and is awarded by an approved awarding body — Active IQ, YMCA Awards, Focus Awards and similar. Regulated means the course content, assessment and tutor standards are independently checked. An unregulated 'diploma' has no such check — anyone can print one. Insurers, employers and registers like REPs only recognise regulated qualifications.",
  },
  {
    q: "How do I know a training provider is legitimate before I pay them?",
    a: "Four checks: (1) the qualification they offer is Ofqual-regulated or endorsed by a recognised body; (2) tutors are named with their own qualifications visible; (3) there is real external assessment, not in-house multiple-choice you can re-take until you pass; (4) refund and complaints policies are published. REPs-verified providers have already passed those checks — see the red-flag list on this page for what to avoid otherwise.",
  },
  {
    q: "What is CPD?",
    a: "Continuing Professional Development — ongoing learning a professional commits to after their initial qualification. For REPs, the rule is simple: CPD only counts toward your profile if it's delivered by a REPs-accredited provider. The exact framework (hours, points, cycle) is being finalised and will be published before launch.",
  },
  {
    q: "Does the L3 PT course I'm considering need to be from a REPs-verified provider?",
    a: "If you want the qualification to mean anything on REPs — yes. REPs-verified providers have been checked for accreditation, tutor qualifications and assessment integrity. CPD delivered through a REPs-accredited provider is the only CPD that will update a REPs profile. If the provider isn't on REPs, ask them why.",
  },
  {
    q: "Can further training upgrade me to a new specialism?",
    a: "Yes. Stack training toward a recognised Level 4 credential — strength & conditioning, lower-back pain, pre/post-natal, obesity & diabetes — and the new specialism appears on your REPs profile once the awarding body confirms it.",
  },
  {
    q: "What's the difference between a Nutritionist and a Dietitian?",
    a: "Anyone can call themselves a 'nutritionist' — the title isn't legally protected. On REPs we only list nutritionists who hold ANutr or RNutr status with the Association for Nutrition (or an equivalent degree-led registration). 'Dietitian' is legally protected and regulated by the HCPC — it's the only role that can assess, diagnose and treat clinical conditions with diet.",
  },
  {
    q: "Where do yoga and Pilates qualifications fit in?",
    a: "Yoga and Pilates run on hours-based teacher training rather than the RQF. The honest standards are clear: Yoga Alliance Professionals (200hr / 500hr) and the British Wheel of Yoga for yoga teachers; Level 3 Mat Pilates and recognised reformer certifications for Pilates. REPs cross-checks these against the awarding body before a profile goes live.",
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

        <Qualifications />

        <HowTheStandardWorks />

        <VerifiedProviders />

        <ProfileScreenshot />

        <DodgyCourses />

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
    <section className="relative overflow-hidden min-h-[640px] sm:min-h-[680px] lg:min-h-[700px]">
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
        <div className="flex max-w-[760px] flex-col items-start">
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
            Regulated qualifications.{" "}
            <span className="text-reps-orange">Verified training providers.</span>
          </h1>

          <p
            className="mt-6 max-w-[600px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            The education standard behind every REPs professional — across fitness, nutrition, yoga and Pilates.
          </p>

          <div
            className="mt-8 flex animate-fade-in flex-wrap gap-3"
            style={{ animationDuration: "640ms", animationDelay: "260ms", animationFillMode: "both" }}
          >
            <a
              href="#qualifications"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              See the qualification ladder <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#how-the-standard-works"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              How the standard works
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
              Awarding body named on every profile
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-reps-orange" />
              Cross-checked at source
            </li>
          </ul>


          {/* Editorial cross-check strip — matches /specialisms hero pattern */}
          <div
            className="mt-10 w-full animate-fade-in border-t border-white/10 pt-5"
            style={{ animationDuration: "640ms", animationDelay: "420ms", animationFillMode: "both" }}
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
              <span>Ofqual</span>
              <span className="text-reps-orange/70">·</span>
              <span>AfN</span>
              <span className="text-reps-orange/70">·</span>
              <span>HCPC</span>
              <span className="text-reps-orange/70">·</span>
              <span>YAP</span>
              <span className="text-reps-orange/70">·</span>
              <span>Active IQ</span>
              <span className="text-reps-orange/70">·</span>
              <span>YMCA</span>
              <span className="text-reps-orange/70">·</span>
              <span>Focus</span>
              <span className="ml-2 text-reps-orange">— Cross-checked at source</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section: Qualifications — tabbed ladder                             */
/* ------------------------------------------------------------------ */

function LadderCard({ rung }: { rung: LadderRung }) {
  return (
    <article className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
      <span className="inline-flex items-center rounded-[6px] bg-reps-orange-soft px-2 py-0.5 text-[12px] font-semibold text-reps-orange">
        {rung.level}
      </span>
      <h4 className="mt-3 font-display text-[20px] font-bold leading-tight text-white">
        {rung.title}
      </h4>
      <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{rung.blurb}</p>

      <h5 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
        Can do
      </h5>
      <ul className="mt-2 flex flex-col gap-2 text-[13px] leading-relaxed text-white/80">
        {rung.scope.map((s) => (
          <li key={s} className="flex gap-2">
            <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-reps-orange" />
            <span>{s}</span>
          </li>
        ))}
      </ul>

      {rung.notScope.length > 0 && (
        <>
          <h5 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Can't do
          </h5>
          <ul className="mt-2 flex flex-col gap-2 text-[13px] leading-relaxed text-white/65">
            {rung.notScope.map((s) => (
              <li key={s} className="flex gap-2">
                <X className="mt-[3px] h-3.5 w-3.5 shrink-0 text-white/40" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-5 border-t border-reps-border pt-4">
        <h5 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          Recognised quals
        </h5>
        <div className="mt-2 flex flex-wrap gap-2">
          {rung.quals.map((q) => (
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
  );
}

function LadderBlock({
  eyebrow,
  title,
  blurb,
  rungs,
  footnote,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  rungs: LadderRung[];
  footnote?: React.ReactNode;
}) {
  return (
    <div className="mt-16 first:mt-0">
      <div className="max-w-[820px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
          {eyebrow}
        </span>
        <h3 className="mt-3 font-display text-[24px] font-bold leading-tight text-white lg:text-[30px]">
          {title}
        </h3>
        <p className="mt-3 text-[14.5px] leading-relaxed text-white/70">{blurb}</p>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {rungs.map((r) => (
          <LadderCard key={r.title} rung={r} />
        ))}
      </div>
      {footnote}
    </div>
  );
}

function Qualifications() {
  return (
    <section id="qualifications" className="scroll-mt-[140px] border-b border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[820px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            Qualifications, decoded
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Know what the letters mean — before you spend a penny.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
            The industry runs on acronyms, and most buyers don't know the difference between
            a Level 2, a Level 3 and a weekend “mastery” certificate. Here are the real
            ladders — fitness, nutrition, yoga and Pilates — with the recognised qualifications
            at every step.
          </p>
        </div>

        <LadderBlock
          eyebrow="Fitness"
          title="The fitness ladder"
          blurb="Ofqual-regulated RQF qualifications. Level 2 to lead group circuits, Level 3 to coach 1:1, Level 4 for clinical or performance specialisms."
          rungs={FITNESS_LADDER}
        />

        <LadderBlock
          eyebrow="Nutrition"
          title="The nutrition ladder"
          blurb="The most-mis-sold area in the industry. Three honest tiers — coach, registered nutritionist, registered dietitian — and only one of them can prescribe diets for clinical conditions."
          rungs={NUTRITION_LADDER}
          footnote={
            <div className="mt-8 rounded-[18px] border border-reps-orange-border bg-reps-orange-soft px-5 py-4">
              <p className="text-[14px] leading-relaxed text-white">
                <strong className="text-white">Plain English:</strong> if someone selling you a
                clinical meal plan for a medical condition isn't a Registered Dietitian (RD, HCPC),
                they're operating outside their lane.
              </p>
            </div>
          }
        />

        <LadderBlock
          eyebrow="Yoga"
          title="The yoga ladder"
          blurb="Yoga runs on hours-based teacher training rather than the RQF. The honest standards are Yoga Alliance Professionals (200hr / 500hr) and the British Wheel of Yoga."
          rungs={MOVEMENT_LADDER.filter((r) => r.level.startsWith("Yoga"))}
        />

        <LadderBlock
          eyebrow="Pilates"
          title="The Pilates ladder"
          blurb="Regulated mat-Pilates qualifications plus recognised reformer and equipment certifications for studio work."
          rungs={MOVEMENT_LADDER.filter((r) => r.level === "Pilates")}
        />
      </div>
    </section>
  );
}


/* ------------------------------------------------------------------ */
/* Section: How the standard works (merges 3 sections)                 */
/* ------------------------------------------------------------------ */

function HowTheStandardWorks() {
  const pillars = [
    {
      icon: GraduationCap,
      eyebrow: "Qualified",
      title: "Regulated qualifications only",
      body: "RQF / Ofqual baseline for fitness and nutrition; AfN / HCPC for nutrition titles; YAP for yoga. The awarding body is named on every profile.",
    },
    {
      icon: ShieldCheck,
      eyebrow: "Verified",
      title: "Providers checked end-to-end",
      body: "Accreditation, tutor credentials, assessment integrity and a published refunds + complaints policy. Hours from verified providers auto-count toward CPD.",
    },
    {
      icon: RefreshCw,
      eyebrow: "Current",
      title: "CPD must be REPs-accredited",
      body: "Continuing professional development only counts toward a REPs profile if it's delivered by a REPs-accredited provider. Unaccredited 'certificates' don't update the profile.",
    },
  ];

  return (
    <section
      id="how-the-standard-works"
      className="scroll-mt-[140px] border-b border-reps-border bg-reps-midnight"
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[820px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            How the standard works
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Qualified. Verified. Kept current.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
            Three things sit behind every REPs professional. Miss any one and the standard
            breaks — so all three are checked, evidenced and visible on the public profile.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <article
                key={p.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-7"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                  {p.eyebrow}
                </p>
                <h3 className="mt-2 font-display text-[19px] font-bold leading-snug text-white">
                  {p.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-white/75">{p.body}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-[18px] border border-reps-orange-border bg-reps-orange-soft px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <BadgeCheck className="h-5 w-5 text-reps-orange" />
            <p className="text-[14px] font-semibold text-white">
              The awarding body is named on every profile. CPD only counts toward a REPs profile when it's delivered by a REPs-accredited provider.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section: Verified training providers (with collapsible registers)   */
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
              accrediting body recognition (Ofqual / REPs / AfN / YAP), tutor qualifications, assessment
              integrity, refund and complaints policy. Any CPD that updates a REPs profile has to be
              delivered by a REPs-accredited provider.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
              The standard is industry-baseline. Verification is open to apply for.
            </p>
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

        {/* Collapsible: awarding-body glossary */}
        <Collapsible className="mt-12 rounded-[18px] border border-reps-border bg-reps-panel-soft">
          <CollapsibleTrigger className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
                Bodies we cross-check against
              </p>
              <p className="mt-1 text-[14.5px] font-semibold text-white">
                Ofqual · REPs · AfN · HCPC · YAP · Active IQ · YMCA Awards · Focus Awards
              </p>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-white/70 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid gap-4 border-t border-reps-border px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
              {REGISTERS.map((r) => (
                <article
                  key={r.short}
                  className="flex flex-col rounded-[16px] border border-reps-border bg-reps-panel p-5"
                >
                  <span className="self-start rounded-[6px] bg-reps-orange-soft px-2 py-0.5 text-[12px] font-semibold text-reps-orange">
                    {r.short}
                  </span>
                  <h3 className="mt-3 font-display text-[14px] font-bold leading-snug text-white">
                    {r.full}
                  </h3>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
                    {r.covers}
                  </p>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/70">{r.meaning}</p>
                  {r.href && (
                    <a
                      href={r.href}
                      target={r.href.startsWith("http") ? "_blank" : undefined}
                      rel={r.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-reps-orange hover:underline"
                    >
                      Visit register <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section: Profile screenshot — proof shot                            */
/* ------------------------------------------------------------------ */

function ProfileScreenshot() {
  const bullets = [
    "Qualifications & insurance — all evidenced",
    "Awarding body & issue date visible on every credential",
    "Specialisms appear once the awarding body confirms",
  ];
  return (
    <section className="relative overflow-hidden border-b border-reps-border bg-reps-midnight">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_75%_45%,rgba(255,122,0,0.10),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14">
          <div className="max-w-[520px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
              On the profile
            </span>
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
              This is what verified credentials look like to your clients.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
              Every qualification and insurance certificate shows up live on the
              public REPs profile — with the awarding body, the provider and the date it was issued.
              Unverified items sit in a separate column. Clients can see the difference at a glance.
            </p>
            <ul className="mt-7 flex flex-col gap-2.5 text-[14px] text-white/80">
              {bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <Check className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[28px] bg-[radial-gradient(50%_60%_at_50%_50%,rgba(255,122,0,0.18),transparent_70%)] blur-2xl"
            />
            <BrowserFrame url="repsglobal.com/c/james-wilson">
              <img
                src={cpdProfileAsset.url}
                alt="Screenshot of a REPs professional profile showing four verified credentials: Level 3 Personal Trainer, Level 3 Diploma in Personal Training, Professional Indemnity Insurance and First Aid & CPR."
                width={1400}
                height={416}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
            </BrowserFrame>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section: Dodgy courses (with pull-quote + ask-before-you-pay)       */
/* ------------------------------------------------------------------ */

function DodgyCourses() {
  return (
    <section
      id="worthless-courses"
      className="scroll-mt-[140px] border-b border-reps-border bg-reps-ink"
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[820px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            Spot a worthless course
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            How to tell a real qualification from a bad one.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
            The most predatory training providers follow the same playbook — oversized claims,
            hidden tutors, in-house assessment, finance pressure and a stack of “free” CPDs taped
            to the side. Here's what to look for, and what good actually looks like.
          </p>
        </div>

        {/* Pull-quote — the line that used to be the hero */}
        <figure className="mt-10 rounded-[22px] border-l-4 border-reps-orange bg-reps-panel-soft px-6 py-5 lg:px-8 lg:py-6">
          <blockquote className="font-display text-[20px] font-semibold leading-snug text-white lg:text-[24px]">
            “The honest providers are already here.{" "}
            <span className="text-reps-orange">The rest are running a print shop for certificates.”</span>
          </blockquote>
        </figure>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[18px] border border-reps-border bg-reps-panel p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/5 text-white/70">
                <X className="h-5 w-5" />
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

        {/* Ask-before-you-pay mini checklist */}
        <div className="mt-8 rounded-[18px] border border-reps-border bg-reps-panel-soft px-6 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            What to ask a provider before you pay
          </p>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {ASK_BEFORE_YOU_PAY.map((q, i) => (
              <li key={q} className="flex gap-3 text-[14px] leading-relaxed text-white/85">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-bold text-reps-orange">
                  {i + 1}
                </span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
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
          Qualifications & providers — answered.
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
