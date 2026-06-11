import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Check,
  Crosshair,
  Disc,
  ExternalLink,
  Flag,
  Flower2,
  GraduationCap,
  Heart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  TrendingUp,
  Wand2,
  X,
} from "lucide-react";

import ctaTrainers from "@/assets/cta-band.jpg";
import cpdProfileAsset from "@/assets/cpd-profile-screenshot.jpg.asset.json";
import cpdTutorMomentAsset from "@/assets/cpd-tutor-moment.jpg.asset.json";
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

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
const heroCpd = cpdTutorMomentAsset.url;

/* ------------------------------------------------------------------ */
/* Page head                                                           */
/* ------------------------------------------------------------------ */

const CANONICAL = "https://repsglobal.lovable.app/cpd-legacy";
const META_TITLE =
  "CPD & Verified Training Providers — Education that actually counts | REPS";
const META_DESC =
  "What CPD really is, how REPS runs it, and how to spot a worthless training provider before you spend a penny. Every CPD hour through a verified provider counts. The rest don't.";

export const Route = createFileRoute("/cpd-legacy")({
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
        acronym: "REPS",
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
        acronym: "REPS",
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
        acronym: "REPS",
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

const PILATES_LADDER: LadderRung[] = [
  {
    level: "Mat",
    title: "Mat Pilates Teacher",
    blurb:
      "The baseline studio qualification — bodyweight Pilates on the mat, taught to general adult populations.",
    scope: [
      "Mat-based group classes",
      "1:1 mat sessions for healthy adults",
      "Core, mobility and posture programmes",
    ],
    notScope: ["Reformer or equipment-based teaching", "Rehab for clinical populations"],
    quals: [
      {
        acronym: "L3 Mat",
        full: "Level 3 Mat Pilates (RQF)",
        meaning: "Ofqual-regulated baseline for mat-Pilates teaching.",
      },
      {
        acronym: "BASI Mat",
        full: "Body Arts and Science International — Mat Programme",
        meaning: "Internationally recognised mat-Pilates teacher training.",
      },
    ],
  },
  {
    level: "Reformer",
    title: "Reformer & Equipment",
    blurb:
      "Studio-based equipment Pilates — Reformer, Cadillac, Chair and Barrels. Required for any equipment-based studio work.",
    scope: [
      "Reformer group and 1:1 sessions",
      "Cadillac, Wunda Chair and Barrel work",
      "Apparatus-based programming",
    ],
    notScope: ["Clinical rehab without a clinician", "Teaching apparatus you weren't certified on"],
    quals: [
      {
        acronym: "Reformer",
        full: "Recognised Reformer Pilates Certification",
        meaning: "Required for equipment-based Pilates teaching and studio work.",
      },
      {
        acronym: "STOTT",
        full: "STOTT Pilates — Reformer / Full Equipment",
        meaning: "Globally recognised contemporary Pilates teacher training.",
      },
    ],
  },
  {
    level: "Comprehensive",
    title: "Comprehensive Teacher",
    blurb:
      "The senior tier — full apparatus, advanced programming and the ability to mentor newer teachers.",
    scope: [
      "Full apparatus across all repertoire",
      "Advanced and specialist clients (with referral)",
      "Mentoring and teacher training",
    ],
    notScope: ["Diagnosis or medical treatment — refer to a clinician"],
    quals: [
      {
        acronym: "Comprehensive",
        full: "Comprehensive Pilates Teacher Training (450hr+)",
        meaning: "Full mat plus all apparatus — the senior studio standard.",
      },
      {
        acronym: "PMA-CPT",
        full: "Pilates Method Alliance — Certified Pilates Teacher",
        meaning: "Independent international certification for Pilates teachers.",
      },
    ],
  },
];

const YOGA_LADDER: LadderRung[] = [
  {
    level: "200hr",
    title: "Yoga Teacher",
    blurb:
      "The international entry-level standard. 200 hours of teacher training covering asana, anatomy, philosophy and teaching practice.",
    scope: [
      "Open-level group classes",
      "1:1 yoga for healthy adults",
      "Studio, gym and community teaching",
    ],
    notScope: ["Yoga therapy for medical conditions", "Pre/post-natal without specialist training"],
    quals: [
      {
        acronym: "YAP 200hr",
        full: "Yoga Alliance Professionals — 200-hour Teacher Training",
        meaning: "Internationally recognised baseline for yoga teachers.",
      },
      {
        acronym: "RYT 200",
        full: "Registered Yoga Teacher — 200hr (Yoga Alliance)",
        meaning: "The most widely used entry-level yoga teaching credential.",
      },
    ],
  },
  {
    level: "500hr",
    title: "Senior Teacher",
    blurb:
      "Advanced teacher training — typical of senior studio teachers and those running workshops or short trainings.",
    scope: [
      "Advanced group and specialist classes",
      "Workshops, retreats and short courses",
      "Mentoring newer teachers",
    ],
    notScope: ["Clinical yoga therapy", "Therapeutic prescription for disease"],
    quals: [
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
    ],
  },
  {
    level: "Specialist",
    title: "Specialist & Therapy",
    blurb:
      "Post-graduate specialisms — pre/post-natal, children's yoga, trauma-informed and clinical yoga therapy.",
    scope: [
      "Pre and post-natal yoga",
      "Children's and family yoga",
      "Trauma-informed and accessible classes",
    ],
    notScope: ["Diagnosis or medical treatment — refer to a clinician"],
    quals: [
      {
        acronym: "C-IAYT",
        full: "Certified Yoga Therapist (International Association of Yoga Therapists)",
        meaning: "Recognised clinical yoga-therapy credential for working alongside healthcare.",
      },
      {
        acronym: "Pre/Post-natal",
        full: "Recognised Pre & Post-natal Yoga Training",
        meaning: "Specialist training required to teach pregnant and post-natal clients safely.",
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
    body: "Qualifications must be Ofqual-regulated or endorsed by a recognised professional body (REPS, AfN, Yoga Alliance Professionals).",
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
    body: "Published refund policy and a real complaints route — not a help-desk that ghosts you after the card clears.",
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
    short: "REPS",
    full: "Register of Exercise Professionals",
    covers: "Endorses training providers, qualifications and CPD",
    meaning: "Sets professional standards across the sport and physical-activity sector. REPS-endorsed CPD is the safe default.",
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
  "Awarding body not Ofqual-regulated or REPS-accredited (or no awarding body listed at all).",
  "No external assessment — everything is in-house multiple-choice you can retake until you pass.",
  "High-pressure finance sales and time-limited “today-only” discounts.",
  "Tutor names, faces and qualifications hidden behind a generic “expert team” page.",
  "No published refund policy, complaints route or external ombudsman.",
  "Marketing focuses on income claims rather than what you will actually learn and be assessed on.",
];

const GOOD_SIGNS = [
  "Regulated qualification on the RQF, awarded by a named Ofqual body.",
  "REPS endorsement listed openly on the course page.",
  "Tutors are named, with their own qualifications visible and verifiable.",
  "External assessment, with re-sit rules in writing.",
  "Published refund policy, complaints procedure and learner-outcome data.",
  "Listed on REPS as a verified training provider — CPD hours auto-count toward your log.",
];

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "What does it mean for a course to be accredited by REPS?",
    a: "REPS accreditation means the training provider and its course have been independently checked at the points that matter: a recognised awarding body (Ofqual for regulated fitness and nutrition qualifications; Yoga Alliance Professionals, the British Wheel of Yoga or comparable bodies for yoga; the PMA, BASI, STOTT or comparable for Pilates), named and qualified tutors, external assessment, and published refund and complaints policies. Hours earned through an accredited provider auto-count toward a REPS member's CPD log.",
  },
  {
    q: "What is CPD?",
    a: "Continuing Professional Development. Ongoing, evidenced learning that a professional commits to after their initial qualification — courses, conferences, peer-reviewed reading, supervised practice. The point is that the certificate on your wall stays current with the science, not frozen at the date you passed.",
  },
  {
    q: "How many CPD hours do I need per year on REPS?",
    a: "Every REPS professional commits to a meaningful annual minimum, logged quarterly in their dashboard and audited at random. Specific hour thresholds per tier are published in each member's onboarding pack and updated as standards evolve.",
  },
  {
    q: "What happens if I miss a CPD quarter?",
    a: "The verified badge auto-suspends on the public profile until you bring your CPD log current. The public can see that a profile is currently unverified — that's the entire point of the standard. Catch up, log it, badge restored.",
  },
  {
    q: "Does the L3 PT course I'm considering need to be from a REPS-verified provider?",
    a: "If you want the qualification to mean anything on REPS — yes. Hours through a verified provider auto-count toward your CPD log once you're a member. Hours through unverified providers don't. More importantly, REPS-verified providers have been checked for accreditation, tutor qualifications and assessment integrity. If the provider isn't on REPS, ask them why.",
  },
  {
    q: "Why are some big-name training providers not on REPS?",
    a: "Because the bar is real. Verification is open to apply for and the standard is industry-baseline — accrediting body recognition, tutor checks, assessment integrity, published refund and complaints policies. There is no legitimate reason to refuse it. If a provider isn't here, treat that as information.",
  },
  {
    q: "What's the difference between a Nutritionist and a Dietitian?",
    a: "Anyone can call themselves a 'nutritionist' — the title isn't legally protected. On REPS we only list nutritionists who hold ANutr or RNutr status with the Association for Nutrition (or an equivalent degree-led registration). 'Dietitian' is legally protected and regulated by the HCPC — it's the only role that can assess, diagnose and treat clinical conditions with diet.",
  },
  {
    q: "Do I need a specialist or is a general PT enough?",
    a: "For general adult fitness — fat loss, getting stronger, building the habit — a Level 3 PT is the right tool. For specialist populations (clinical conditions, pre/post-natal, competition strength & conditioning, rehabilitation), you want a Level 4 specialist or a registered S&C coach. REPS surfaces the right specialism for the goal so you don't end up with a generalist trying to wing it.",
  },
  {
    q: "Can CPD upgrade me to a new specialism?",
    a: "Yes. Stack CPD toward a recognised Level 4 credential — strength & conditioning, lower-back pain, pre/post-natal, obesity & diabetes, online coaching — and the new specialism appears on your REPS profile once the awarding body confirms it.",
  },
  {
    q: "Does being verified on REPS let me charge more?",
    a: "When the public can tell the difference between a verified expert and a chancer, the verified expert sets the price. Visible verification + logged CPD + a specialism credential is the case for charging what you're worth. REPS exists to widen that gap, not narrow it.",
  },
  {
    q: "How do I report a predatory provider or coach?",
    a: "Use the reporting route on this page. Every report is reviewed, evidence cross-checked, and where required, escalated to the relevant awarding body or register. Bad actors lose verification and lose listings.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function TutorMoment() {
  return (
    <section className="relative isolate overflow-hidden border-b border-reps-border bg-reps-ink">
      <img
        src={cpdTutorMomentAsset.url}
        alt=""
        loading="lazy"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
      />
      {/* Mobile: bottom-anchored legibility gradient */}
      <div
        aria-hidden
        className="absolute inset-0 md:hidden"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(11,13,16,0.55) 0%, rgba(11,13,16,0.35) 35%, rgba(11,13,16,0.85) 70%, #0B0D10 100%)",
        }}
      />
      {/* Desktop: left-anchored copy well */}
      <div
        aria-hidden
        className="absolute inset-0 hidden md:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0B0D10 0%, rgba(11,13,16,0.92) 30%, rgba(11,13,16,0.55) 48%, rgba(11,13,16,0) 62%)",
        }}
      />
      {/* Warm orange micro-glow tying to brand */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(900px 500px at 10% 60%, rgba(255,107,53,0.10), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="max-w-[640px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
            <BookOpen className="h-3.5 w-3.5" /> Inside a verified CPD course
          </span>
          <p className="mt-6 font-display text-[28px] font-bold leading-[1.1] text-white lg:text-[44px]">
            “The honest providers are already here.
            <span className="text-reps-orange"> The rest are running a print shop for certificates.”</span>
          </p>
          <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.22em] text-white/55">
            REPS — verified training providers
          </p>
        </div>
      </div>
    </section>
  );
}

function CpdPage() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
        <PublicHeader variant="solid" />

        <Hero />

        <ProfileScreenshot />

        <WhatCpdIs />



        <RepsCpdSystem />

        <Qualifications />

        

        <VerifiedProviders />

        <DodgyCourses />

        

        <RaiseTheStandard />

        <ProviderCtaBand />

        <RegistersBlock />

        <VerifyStrip />

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
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Education & accredited courses
          </span>

          <h1
            className="mt-6 animate-fade-in font-display text-[36px] font-bold leading-[1.04] text-white sm:text-[46px] lg:text-[60px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            The standard for accredited education
            <br />
            <span className="text-reps-orange">in fitness, sport and movement.</span>
          </h1>

          <p
            className="mt-6 max-w-[600px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            REPS accredits training providers, qualifications and CPD across three pillars —
            initial qualifications in fitness and nutrition, ongoing CPD, and teacher training in
            Pilates and yoga. Every accredited course is checked at the points that matter:
            awarding body, tutor credentials, assessment integrity and learner protections.
          </p>

          <div
            className="mt-8 flex animate-fade-in flex-wrap gap-3"
            style={{ animationDuration: "640ms", animationDelay: "260ms", animationFillMode: "both" }}
          >
            <a
              href="#verified-providers"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Find verified training providers <ArrowRight className="h-4 w-4" />
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
              Accredited providers only
            </li>
          </ul>

          <div
            className="mt-10 w-full animate-fade-in border-t border-white/10 pt-5"
            style={{ animationDuration: "640ms", animationDelay: "420ms", animationFillMode: "both" }}
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
              <span>Ofqual</span>
              <span className="text-reps-orange/70">·</span>
              <span>REPS</span>
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
/* Section: Profile screenshot — what CPD looks like on a REPS profile */
/* ------------------------------------------------------------------ */

function ProfileScreenshot() {
  const bullets = [
    "Logged quarterly, audited annually",
    "Verified-provider hours auto-count",
    "Specialisms appear once the awarding body confirms",
  ];
  return (
    <section className="relative overflow-hidden border-b border-reps-border bg-reps-ink">
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
              This is what verified CPD looks like to your clients.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
              Every verified hour, qualification and insurance certificate shows up live on the
              public REPS profile — with the provider, the awarding body and the date it was issued.
              Unverified hours sit in a separate column. Clients can see the difference at a glance.
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
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[24px] bg-[radial-gradient(50%_60%_at_50%_50%,rgba(255,122,0,0.18),transparent_70%)] blur-2xl"
            />
            <BrowserFrame url="repsglobal.com/c/james-wilson">
              <img
                src={cpdProfileAsset.url}
                alt="Screenshot of a REPS professional profile showing four verified credentials: Level 3 Personal Trainer, Level 3 Diploma in Personal Training, Professional Indemnity Insurance and First Aid & CPR."
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
/* Section: What CPD actually is                                       */
/* ------------------------------------------------------------------ */

function WhatCpdIs() {
  const counts = [
    "Regulated qualifications (Ofqual / RQF)",
    "REPS-endorsed CPD courses",
    "Accredited conferences and workshops",
    "Peer-reviewed reading with reflective notes",
    "Supervised mentoring with a senior coach",
  ];
  const doesnt = [
    "Vendor product demos dressed up as “education”",
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
            What "accredited" actually means
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Real learning. Externally checked.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
            Accredited education means a course has been independently assessed against
            a recognised standard — and that members keep learning after the initial qualification
            through Continuing Professional Development (CPD). The science of training, nutrition,
            rehab and movement moves every year; adjacent professions like physiotherapy and
            dietetics mandate ongoing CPD by default. On REPS, it's the same standard.
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
/* Section: How REPS runs CPD                                          */
/* ------------------------------------------------------------------ */

function RepsCpdSystem() {
  const pillars = [
    {
      icon: RefreshCw,
      title: "Logged quarterly",
      body: "Members log every CPD activity in their REPS dashboard four times a year — with evidence attached. No “trust me bro”.",
    },
    {
      icon: ShieldCheck,
      title: "Verified-provider only",
      body: "Hours through REPS-verified training providers auto-count. Hours from unverified providers don't — they go in a separate column the public can see.",
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
      className="scroll-mt-[140px] border-b border-reps-border bg-reps-midnight"
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[760px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            How REPS accredits education
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Four mechanics. No theatre.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
            REPS accredits training providers and the courses they deliver — qualifications,
            CPD and teacher training — and holds professionals to an ongoing CPD log. The system
            is evidenced, governed and visible to the public.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <article key={p.title} className="rounded-[18px] border border-reps-border bg-reps-panel-soft p-6">
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

function LadderCard({ rung: r }: { rung: LadderRung }) {
  return (
    <article className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
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
            Every accredited pathway, in plain English.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
            REPS accredits qualifications across four pathways: fitness, nutrition, Pilates and
            yoga. Each pathway has its own recognised awarding bodies and credentials — here is
            what those letters actually mean, and what each tier is qualified to do.
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
            This is where buyers get burned hardest. Anyone can call themselves a “nutritionist.”
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
              they're operating outside their lane. REPS verifies which role you're actually getting.
            </p>
          </div>
        </div>

        {/* Pilates pathway */}
        <div className="mt-16">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <Disc className="h-4 w-4" />
            </span>
            <h3 className="font-display text-[20px] font-bold text-white">Pilates pathway</h3>
          </div>
          <p className="mt-3 max-w-[760px] text-[14px] leading-relaxed text-white/70">
            Pilates runs on hours-based teacher training rather than the RQF for most apparatus work.
            Here's the honest ladder REPS cross-checks.
          </p>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {PILATES_LADDER.map((r) => (
              <LadderCard key={r.title} rung={r} />
            ))}
          </div>
        </div>

        {/* Yoga pathway */}
        <div className="mt-16">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <Flower2 className="h-4 w-4" />
            </span>
            <h3 className="font-display text-[20px] font-bold text-white">Yoga pathway</h3>
          </div>
          <p className="mt-3 max-w-[760px] text-[14px] leading-relaxed text-white/70">
            Yoga teacher training is measured in hours, not RQF levels — but the international
            standards are clear. These are the ones REPS verifies.
          </p>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {YOGA_LADDER.map((r) => (
              <LadderCard key={r.title} rung={r} />
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
      className="scroll-mt-[140px] border-b border-reps-border bg-reps-midnight"
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
          <article className="rounded-[18px] border border-reps-border bg-reps-panel-soft p-7">
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

          <article className="rounded-[18px] border border-reps-border bg-reps-panel-soft p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <h3 className="font-display text-[18px] font-bold text-white">Same logic. In fitness.</h3>
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
                <span>REPS surfaces the specialist for the exact thing you're chasing. No “I also do that on the side.”</span>
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
              Accredited training providers, across every pathway.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
              A REPS-verified training provider has been independently checked at the points that
              matter — accrediting body recognition, tutor credentials, assessment integrity, and
              published refund and complaints policies. This covers Ofqual-regulated awarding bodies
              for fitness and nutrition qualifications, and recognised teacher-training schools for
              Pilates and yoga.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
              Hours earned through verified providers auto-count toward a member's REPS CPD log.
              Verification is open to apply for and the standard is industry-baseline — there is no
              legitimate reason for a credible provider to refuse it.
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
      id="worthless-courses"
      className="scroll-mt-[140px] border-b border-reps-border bg-reps-midnight"
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
            The most predatory training providers follow the same playbook — oversized claims, hidden tutors,
            in-house assessment, finance pressure and a stack of “free” CPDs taped to the side.
            Here's what to look for, and what good actually looks like.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[18px] border border-reps-border bg-reps-panel-soft p-7">
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

          <article className="rounded-[18px] border border-reps-orange-border bg-reps-panel-soft p-7">
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
      title: "Cut the noise.",
      body: "Bedroom PTs with no qualifications. Instagram “online coaches” selling £400 PDFs. People issuing meal plans they're not legally allowed to prescribe. REPS makes them visibly absent — the listing alone proves the work.",
    },
    {
      n: "02",
      title: "Make the profession look like a profession.",
      body: "Identity check, qualification check, insurance check, CPD logged and audited. The same baseline a physio or dietitian meets — applied to fitness, properly and publicly.",
    },
    {
      n: "03",
      title: "So you can charge what you're worth.",
      body: "When the public can tell the difference between a verified expert and a chancer, the verified expert sets the price. REPS exists to widen that gap, not narrow it.",
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
            REPS exists for one reason: to raise the floor of this industry.
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-white/75">
            Fitness has been cheap for too long because nobody checks. REPS checks. That's the entire
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
            Cheap coaching exists because nobody checks. REPS checks.
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
                Find a verified training provider — or report one that isn't.
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/70">
                The verified-provider directory opens shortly. Until then, if a provider claims
                accreditation they can't back up, send it our way.
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
/* Registers block                                                     */
/* ------------------------------------------------------------------ */

function RegistersBlock() {
  return (
    <section className="border-b border-reps-border bg-reps-midnight">
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
            and which ones we cross-check before a profile or provider goes live on REPS.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REGISTERS.map((r) => (
            <article
              key={r.short}
              className="flex flex-col rounded-[18px] border border-reps-border bg-reps-panel-soft p-6"
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
    body: "Every credential cross-checked against the body that issued it — Ofqual, REPS, AfN, HCPC, YAP.",
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
          Accreditation, qualifications & providers — answered.
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
/* Join REPS CTA — CPD-tuned variant of the homepage Pro CTA          */
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
                Train with accredited providers. Be found on REPS.
              </h2>
              <p className="mt-3 max-w-[440px] text-[14.5px] leading-relaxed text-white/85">
                Find the verified training providers behind every accredited course — or join the
                global register of fitness, nutrition, Pilates and yoga professionals with your
                qualifications and CPD on show.
              </p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {[
                  "Accredited providers, every pathway",
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
                <a
                  href="#verified-providers"
                  className="inline-flex h-[48px] items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-dark"
                >
                  Find verified training providers <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/for-professionals"
                  className="inline-flex h-[48px] items-center rounded-[10px] border border-white/30 px-6 text-[14.5px] font-semibold text-white shadow-none transition-colors hover:bg-white/10"
                >
                  Apply to be a verified provider
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
