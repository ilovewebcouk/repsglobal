import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Apple,
  BadgeCheck,
  Brain,
  Check,
  Dumbbell,
  ExternalLink,
  Flower2,
  Laptop,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
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

import heroSpecialismsAsset from "@/assets/specialisms-hero-v2.jpg.asset.json";
const heroSpecialisms = heroSpecialismsAsset.url;

/* ------------------------------------------------------------------ */
/* Page head                                                           */
/* ------------------------------------------------------------------ */

const CANONICAL = "https://repsglobal.lovable.app/specialisms";
const META_TITLE =
  "Specialisms — verified personal trainers, coaches & nutritionists | REPs";
const META_DESC =
  "Browse every REPs specialism — personal trainers, strength coaches, online coaches, nutritionists, yoga teachers and Pilates instructors. Every listing is identity-checked, qualification-verified and insured.";

export const Route = createFileRoute("/specialisms")({
  head: () => ({
    meta: [
      { title: META_TITLE },
      { name: "description", content: META_DESC },
      { property: "og:title", content: META_TITLE },
      { property: "og:description", content: META_DESC },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: CANONICAL },
      { rel: "preload", as: "image", href: heroSpecialisms, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "REPs Specialisms",
          itemListElement: SPEC_LIST_FOR_JSONLD(),
        }),
      },
    ],
  }),
  component: SpecialismsPage,
});

function SPEC_LIST_FOR_JSONLD() {
  return SPECIALISMS.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: s.plural,
    url: `https://repsglobal.lovable.app/professions/${s.slug}`,
  }));
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

type Qual = {
  acronym: string;
  full: string;
  meaning: string;
};

type Specialism = {
  slug: string;
  anchor: string;
  navLabel: string;
  icon: typeof Dumbbell;
  eyebrow: string;
  title: string;
  plural: string;
  intro: string;
  does: string[];
  verifies: string[];
  rate: string;
  count: number;
  quals: Qual[];
};

const SPECIALISMS: Specialism[] = [
  {
    slug: "personal-trainer",
    anchor: "personal-trainers",
    navLabel: "Personal trainers",
    icon: Dumbbell,
    eyebrow: "Specialism 01",
    title: "Personal Trainers",
    plural: "Personal trainers",
    intro:
      "The largest specialism on REPs. One-to-one coaches who write your programme, teach your lifts and hold the standard week after week — in the gym, at home or online.",
    does: [
      "Programme design tailored to your goal, schedule and history",
      "1:1 sessions in the gym, your home, or a studio they teach from",
      "Form coaching, progress tracking and honest accountability",
    ],
    verifies: [
      "Government-recognised Level 3 PT qualification (RQF)",
      "Public liability and professional indemnity insurance",
      "Current first aid and a verified photo ID",
    ],
    rate: "£45 – £85 / hour",
    count: 1284,
    quals: [
      {
        acronym: "L3 PT",
        full: "Level 3 Personal Trainer (RQF)",
        meaning: "The baseline qualification any insured PT must hold.",
      },
      {
        acronym: "L4",
        full: "Level 4 Specialist (RQF)",
        meaning: "Advanced training in areas like low back pain or obesity & diabetes.",
      },
      {
        acronym: "REPs",
        full: "Register of Exercise Professionals",
        meaning: "The verified register clients search — identity, qualification and insurance on the public record.",
      },
    ],
  },
  {
    slug: "group-exercise",
    anchor: "group-exercise",
    navLabel: "Group ex & instructors",
    icon: Users,
    eyebrow: "Specialism 02",
    title: "Group Exercise & Fitness Instructors",
    plural: "Group ex and fitness instructors",
    intro:
      "The energy on the gym floor and in the studio. Level 2 instructors lead classes, run inductions and coach group sessions — the entry point into a career on the register.",
    does: [
      "Group classes: circuits, bootcamp, indoor cycling, exercise to music",
      "Gym floor inductions, equipment demos and supervised programmes",
      "Small-group training under a club, studio or PT's supervision",
    ],
    verifies: [
      "Government-recognised Level 2 qualification (RQF)",
      "Public liability insurance appropriate to the class type they teach",
      "Current first aid and a verified photo ID",
    ],
    rate: "£25 – £45 / session",
    count: 612,
    quals: [
      {
        acronym: "L2 GI",
        full: "Level 2 Gym Instructor (RQF)",
        meaning: "Gym-floor inductions, supervised programmes and group circuits — not 1:1 PT.",
      },
      {
        acronym: "L2 ETM",
        full: "Level 2 Exercise to Music",
        meaning: "Choreographed studio classes — aerobics, dance fitness, step.",
      },
      {
        acronym: "L2 GT",
        full: "Level 2 Group Training",
        meaning: "Bootcamp, circuits and small-group conditioning sessions.",
      },
      {
        acronym: "REPs",
        full: "Register of Exercise Professionals",
        meaning: "L2 instructors hold full register status — same identity, qualification and insurance checks as L3+ pros.",
      },
    ],
  },
  {
    slug: "strength-coach",
    anchor: "strength-coaches",
    navLabel: "Strength coaches",
    icon: Activity,
    eyebrow: "Specialism 03",
    title: "Strength Coaches",
    plural: "Strength coaches",
    intro:
      "Barbell-led specialists for serious lifters and athletes — powerlifting, hypertrophy, Olympic weightlifting and athletic performance, written by someone who's actually competed.",
    does: [
      "Block-periodised programming for strength, size or sport",
      "Technique work on squat, bench, deadlift, clean and snatch",
      "Competition prep, peaking and weight-cut management",
    ],
    verifies: [
      "Recognised strength-and-conditioning credential",
      "Insurance covering barbell, plyometric and athletic-performance work",
      "Coaching experience verified against their listed claims",
    ],
    rate: "£55 – £95 / hour",
    count: 198,
    quals: [
      {
        acronym: "UKSCA ASCC",
        full: "UK Strength & Conditioning Association — Accredited S&C Coach",
        meaning: "The gold standard for S&C coaches working with athletes.",
      },
      {
        acronym: "NSCA CSCS",
        full: "Certified Strength & Conditioning Specialist (NSCA)",
        meaning: "Internationally recognised S&C qualification.",
      },
      {
        acronym: "L4 S&C",
        full: "Level 4 Strength & Conditioning (RQF)",
        meaning: "Advanced barbell, programming and periodisation training.",
      },
    ],
  },
  {
    slug: "online-coach",
    anchor: "online-coaches",
    navLabel: "Online coaches",
    icon: Laptop,
    eyebrow: "Specialism 04",
    title: "Online Coaches",
    plural: "Online coaches",
    intro:
      "Remote coaching done properly — bespoke programming, structured weekly check-ins, async video form reviews and a real human on the other end of the chat. Train wherever you train.",
    does: [
      "A 4–12 week programme written for your gym, kit and schedule",
      "Weekly check-ins reviewing training, nutrition, sleep and stress",
      "Video form reviews and chat support between sessions",
    ],
    verifies: [
      "Level 3 PT minimum plus an online-coaching credential",
      "Real client roster with permission-marked transformations",
      "Insurance that explicitly covers remote programming",
    ],
    rate: "£99 – £249 / month",
    count: 873,
    quals: [
      {
        acronym: "L3 PT",
        full: "Level 3 Personal Trainer (RQF)",
        meaning: "Required even when coaching is delivered online.",
      },
      {
        acronym: "Online Coach Cert",
        full: "Recognised Online Coaching Certification",
        meaning: "Covers remote programming, check-ins and habit coaching.",
      },
      {
        acronym: "L4",
        full: "Level 4 Specialist (RQF)",
        meaning: "Required if they're coaching clinical or specialist populations remotely.",
      },
    ],
  },
  {
    slug: "nutritionist",
    anchor: "nutritionists",
    navLabel: "Nutritionists",
    icon: Apple,
    eyebrow: "Specialism 05",
    title: "Nutritionists",
    plural: "Nutritionists",
    intro:
      "Evidence-based nutrition support — fat loss, performance, gut health, female hormones, sports nutrition. Every nutritionist on REPs is checked against a recognised register: AfN, SENr, or a degree-led equivalent.",
    does: [
      "Personalised plans for fat loss, muscle gain or sports performance",
      "Macro and food-first frameworks built around your real life",
      "Supplement audits, lab-marker reviews and honest referrals when needed",
    ],
    verifies: [
      "Registered Nutritionist status (ANutr / RNutr) or equivalent degree",
      "Insurance covering nutrition consulting and plan-writing",
      "Scope-of-practice declaration — clinical work referred to a dietitian",
    ],
    rate: "£60 – £120 / session",
    count: 326,
    quals: [
      {
        acronym: "ANutr",
        full: "Associate Nutritionist — UK Voluntary Register of Nutritionists (AfN)",
        meaning: "Graduate-level entry to the AfN register; supervised practice.",
      },
      {
        acronym: "RNutr",
        full: "Registered Nutritionist (AfN)",
        meaning: "Three years of professional practice on top of an accredited degree.",
      },
      {
        acronym: "SENr",
        full: "Sport & Exercise Nutrition Register",
        meaning: "Specialist register for nutritionists working with athletes.",
      },
      {
        acronym: "ISSN",
        full: "International Society of Sports Nutrition certification",
        meaning: "Recognised sports-nutrition certification frequently held by coaches.",
      },
    ],
  },
  {
    slug: "yoga-teacher",
    anchor: "yoga-teachers",
    navLabel: "Yoga teachers",
    icon: Sparkles,
    eyebrow: "Specialism 06",
    title: "Yoga Teachers",
    plural: "Yoga teachers",
    intro:
      "Vinyasa, hatha, yin, pregnancy yoga and beginner-friendly mobility — taught by teachers whose hours are register-checked through Yoga Alliance Professionals or the British Wheel of Yoga.",
    does: [
      "Studio classes, private 1:1s and small-group sessions",
      "Pregnancy and post-natal yoga with appropriate modifications",
      "Mobility, breathwork and recovery work for athletes and lifters",
    ],
    verifies: [
      "Recognised 200hr or 500hr teacher-training hours",
      "Pregnancy / specialist modules where claimed",
      "Insurance covering studio, private and online teaching",
    ],
    rate: "£35 – £75 / class",
    count: 412,
    quals: [
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
        acronym: "BWY",
        full: "British Wheel of Yoga — Level 4 Diploma",
        meaning: "Long-established teacher-training pathway recognised across studios.",
      },
    ],
  },
  {
    slug: "pilates-instructor",
    anchor: "pilates-instructors",
    navLabel: "Pilates instructors",
    icon: Flower2,
    eyebrow: "Specialism 07",
    title: "Pilates Instructors",
    plural: "Pilates instructors",
    intro:
      "Mat, reformer and rehabilitation Pilates — for posture, core control, mobility and long-term strength. Many REPs Pilates instructors also work alongside physios and rehab specialists.",
    does: [
      "Mat-Pilates classes and 1:1 sessions for posture, core and mobility",
      "Reformer Pilates for resistance, control and rehabilitation",
      "Pre and post-natal programming, rehab-aware modifications",
    ],
    verifies: [
      "Recognised Level 3 mat-Pilates qualification (minimum)",
      "Reformer / equipment certification where claimed",
      "Insurance covering equipment and rehabilitation work",
    ],
    rate: "£40 – £85 / session",
    count: 537,
    quals: [
      {
        acronym: "L3 Mat",
        full: "Level 3 Mat Pilates (RQF)",
        meaning: "Baseline qualification for mat-Pilates teaching.",
      },
      {
        acronym: "Reformer",
        full: "Recognised Reformer Pilates Certification",
        meaning: "Required for equipment-based teaching and studio work.",
      },
      {
        acronym: "Pre/Post-natal",
        full: "Pre & Post-natal Pilates module",
        meaning: "Specialist add-on covering pregnancy and recovery phases.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Registers shown in the explainer grid                               */
/* ------------------------------------------------------------------ */

type Register = {
  short: string;
  full: string;
  covers: string;
  meaning: string;
  href?: string;
};

const REGISTERS: Register[] = [
  {
    short: "REPs",
    full: "Register of Exercise Professionals",
    covers: "PTs, online coaches, group instructors, strength coaches",
    meaning: "The verified register the public searches — identity, qualification and insurance on the public record.",
  },
  {
    short: "AfN",
    full: "Association for Nutrition",
    covers: "Nutritionists (ANutr, RNutr)",
    meaning: "Owner of the UK Voluntary Register of Nutritionists — the meaningful baseline for 'nutritionist'.",
    href: "https://www.associationfornutrition.org/",
  },
  {
    short: "SENr",
    full: "Sport & Exercise Nutrition Register",
    covers: "Sports nutritionists working with athletes",
    meaning: "Specialist register run by BDA — graduate, probationary and full categories.",
    href: "https://www.senr.org.uk/",
  },
  {
    short: "YAP",
    full: "Yoga Alliance Professionals",
    covers: "Yoga teachers, schools and training providers",
    meaning: "Verifies teacher-training hours (200hr / 500hr) and standards across studios.",
    href: "https://www.yogaalliance.com/",
  },
  {
    short: "BWY",
    full: "British Wheel of Yoga",
    covers: "Yoga teachers (L4 diploma route)",
    meaning: "Long-established teacher-training body recognised across studios.",
    href: "https://www.bwy.org.uk/",
  },
  {
    short: "UKSCA",
    full: "UK Strength & Conditioning Association",
    covers: "Accredited S&C coaches (ASCC)",
    meaning: "Most-respected S&C accreditation for coaches working with athletes.",
    href: "https://www.uksca.org.uk/",
  },
  {
    short: "NSCA",
    full: "National Strength & Conditioning Association",
    covers: "Strength coaches (CSCS), tactical and personal trainers (NSCA-CPT)",
    meaning: "Internationally recognised S&C body — CSCS is the global benchmark credential for coaches working with athletes.",
    href: "https://www.nsca.com/",
  },
  {
    short: "BASES",
    full: "British Association of Sport & Exercise Sciences",
    covers: "Sport scientists and accredited practitioners",
    meaning: "Professional body for sport and exercise scientists — accreditation signals research-grade practice.",
    href: "https://www.bases.org.uk/",
  },
];

/* ------------------------------------------------------------------ */
/* FAQs                                                                */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "What's the difference between a nutritionist and a dietitian?",
    a: "'Dietitian' is a legally protected title — only qualified clinical professionals can use it, and they're allowed to treat medical conditions. 'Nutritionist' isn't legally protected, so on REPs we only list nutritionists who hold ANutr or RNutr status with the Association for Nutrition (or an equivalent degree-led registration). For anything clinical, a REPs nutritionist will refer you on.",
  },
  {
    q: "Is a Level 3 personal trainer qualification enough?",
    a: "Level 3 (RQF) is the recognised baseline that any insured PT must hold. For specialist populations — older adults, pre/post-natal, low back pain, obesity and diabetes — look for a Level 4 specialist credential on the profile. REPs shows both on every listing.",
  },
  {
    q: "Do online coaches need different qualifications?",
    a: "Online coaches still need a Level 3 PT minimum. The good ones also hold a recognised online-coaching certification covering remote programming, check-in structure and habit coaching — and their insurance explicitly covers remote work. REPs lists both.",
  },
  {
    q: "What does 'Yoga Alliance Professionals registered' actually mean?",
    a: "It means the teacher's training hours (typically 200hr or 500hr) have been verified by an independent body and the training school itself is accredited. It's the most widely recognised standard for yoga teachers globally.",
  },
  {
    q: "Who actually polices REPs registrations?",
    a: "REPs verifies three things on every listing: identity (government photo ID), qualifications (checked against the issuing body), and insurance (current and policy-correct). If any of those lapse, the verified badge comes off the profile.",
  },
  {
    q: "Can one professional hold multiple specialisms?",
    a: "Yes — many do. A trainer might be a Level 3 PT, a Level 4 strength specialist and a registered nutritionist. Each credential is verified separately and shown on their profile so you can see the full picture, not just a generic label.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function SpecialismsPage() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
        <PublicHeader variant="solid" />

        <Hero />

        <PressMarquee />

        <StickyNav />

        <div className="border-b border-reps-border bg-reps-ink">
          {SPECIALISMS.map((s, i) => (
            <SpecialismSection key={s.slug} spec={s} isLast={i === SPECIALISMS.length - 1} />
          ))}
        </div>

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
        src={heroSpecialisms}
        alt=""
        width={1920}
        height={832}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[70%_center] lg:object-center"
      />
      {/* Base wash — photo-first, matches /for-professionals weight */}
      <div className="absolute inset-0 bg-reps-ink/55 lg:bg-reps-ink/35" />
      {/* Left-anchored darken behind copy column (no horizontal curtain — keeps room visible) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(95%_75%_at_30%_45%,rgba(10,10,12,0.60),transparent_75%)] lg:bg-[radial-gradient(50%_75%_at_18%_55%,rgba(10,10,12,0.72),transparent_70%)]"
      />
      {/* Orange top glow */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(60%_50%_at_50%_15%,rgba(255,122,0,0.12),transparent_72%)] lg:bg-[radial-gradient(40%_45%_at_15%_20%,rgba(255,122,0,0.10),transparent_70%)]"
      />
      {/* Floor seal */}
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
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Every specialism · One register
          </span>

          <h1
            className="mt-6 animate-fade-in font-display text-[36px] font-bold leading-[1.04] text-white sm:text-[46px] lg:text-[60px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            Every REPs specialism.
            <br />
            <span className="text-reps-orange">All verified, all in one place.</span>
          </h1>

          <p
            className="mt-6 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            Personal trainers, strength coaches, online coaches, nutritionists, yoga teachers and Pilates instructors —
            with their qualifications, insurance and registers checked against the bodies that issue them. No guesswork.
            No screenshots. Just verified pros.
          </p>

          <div
            className="mt-8 flex animate-fade-in flex-wrap gap-3"
            style={{ animationDuration: "640ms", animationDelay: "260ms", animationFillMode: "both" }}
          >
            <Link
              to="/find-a-professional"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Find a verified pro <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#personal-trainers"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              Browse specialisms
            </a>
          </div>

          <ul
            className="mt-7 flex animate-fade-in flex-wrap gap-x-6 gap-y-2.5 text-[12.5px] font-medium text-white/75"
            style={{ animationDuration: "640ms", animationDelay: "340ms", animationFillMode: "both" }}
          >
            <li className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-reps-orange" />
              Identity, qualification & insurance verified
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-reps-orange" />
              Registers cross-checked at source
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-reps-orange" />
              Reviews on the public record
            </li>
          </ul>

          {/* Editorial specialism strip — single typographic line, replaces card cluster */}
          <div
            className="mt-10 w-full animate-fade-in border-t border-white/10 pt-5"
            style={{ animationDuration: "640ms", animationDelay: "420ms", animationFillMode: "both" }}
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
              <span>PT</span>
              <span className="text-reps-orange/70">·</span>
              <span>Strength</span>
              <span className="text-reps-orange/70">·</span>
              <span>Online</span>
              <span className="text-reps-orange/70">·</span>
              <span>Nutrition</span>
              <span className="text-reps-orange/70">·</span>
              <span>Yoga</span>
              <span className="text-reps-orange/70">·</span>
              <span>Pilates</span>
              <span className="ml-2 text-reps-orange">— All verified</span>
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
  const maskStyle = {
    maskImage:
      "linear-gradient(to right, transparent 0, black 1.5rem, black calc(100% - 1.5rem), transparent 100%)",
    WebkitMaskImage:
      "linear-gradient(to right, transparent 0, black 1.5rem, black calc(100% - 1.5rem), transparent 100%)",
  } as const;
  return (
    <nav
      aria-label="Specialisms"
      className="sticky top-16 z-30 border-y border-reps-border/60 bg-reps-ink/85 backdrop-blur supports-[backdrop-filter]:bg-reps-ink/70"
    >
      <div
        className="mx-auto flex h-12 max-w-[1320px] items-center gap-1 overflow-x-auto scroll-smooth px-6 lg:px-10 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={maskStyle}
      >
        {SPECIALISMS.map((s) => (
          <a
            key={s.slug}
            href={`#${s.anchor}`}
            className="whitespace-nowrap rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-reps-muted transition-colors hover:bg-reps-panel hover:text-white"
          >
            {s.navLabel}
          </a>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Specialism section                                                  */
/* ------------------------------------------------------------------ */

function SpecialismSection({ spec, isLast }: { spec: Specialism; isLast: boolean }) {
  const Icon = spec.icon;
  return (
    <section
      id={spec.anchor}
      className={`scroll-mt-32 ${isLast ? "" : "border-b border-reps-border"}`}
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          {/* Left: narrative */}
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
                {spec.eyebrow}
              </span>
            </div>

            <h2 className="mt-5 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
              {spec.title}
            </h2>
            <p className="mt-4 max-w-[620px] text-[15.5px] leading-relaxed text-white/75">
              {spec.intro}
            </p>

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  What they actually do
                </h3>
                <ul className="mt-3 flex flex-col gap-2.5 text-[14px] leading-relaxed text-white/80">
                  {spec.does.map((d) => (
                    <li key={d} className="flex gap-2">
                      <Check className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  What REPs verifies
                </h3>
                <ul className="mt-3 flex flex-col gap-2.5 text-[14px] leading-relaxed text-white/80">
                  {spec.verifies.map((v) => (
                    <li key={v} className="flex gap-2">
                      <ShieldCheck className="mt-[3px] h-4 w-4 shrink-0 text-reps-orange" />
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] text-white/65">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Typical rate
                </span>
                <span className="mt-1 block text-[15px] font-semibold text-white">{spec.rate}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Verified pros
                </span>
                <span className="mt-1 block text-[15px] font-semibold text-white">
                  {spec.count.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/professions/$profession"
                params={{ profession: spec.slug }}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[13.5px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Browse {spec.plural.toLowerCase()} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/find-a-professional"
                className="inline-flex h-11 items-center rounded-[10px] border border-reps-border bg-reps-panel px-6 text-[13.5px] font-semibold text-white shadow-none hover:border-reps-orange-border"
              >
                Find one near you
              </Link>
            </div>
          </div>

          {/* Right: qualifications card */}
          <aside className="rounded-[18px] border border-reps-border bg-reps-panel p-6 lg:p-7">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-reps-orange" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">
                Recognised qualifications
              </span>
            </div>
            <h3 className="mt-3 font-display text-[18px] font-bold text-white">
              What "verified" means for {spec.plural.toLowerCase()}
            </h3>
            <ul className="mt-5 flex flex-col gap-4">
              {spec.quals.map((q) => (
                <li key={q.acronym} className="border-t border-reps-border pt-4 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[14px] font-semibold text-white underline decoration-reps-orange/70 decoration-dotted underline-offset-4">
                      {q.acronym}
                    </span>
                    <span className="text-[12.5px] text-white/55">{q.full}</span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/70">{q.meaning}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Registers explainer                                                 */
/* ------------------------------------------------------------------ */

function RegistersBlock() {
  return (
    <section className="border-b border-reps-border bg-reps-panel-soft/40">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[760px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            The registers, decoded
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Every acronym, in plain English.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            The fitness industry is full of letters after people's names. Here's what each register
            actually means — and which ones we cross-check before a profile goes live on REPs.
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
/* Verification strip                                                  */
/* ------------------------------------------------------------------ */

const VERIFY_STEPS = [
  {
    icon: Wand2,
    title: "Identity",
    body: "Government photo ID and a live selfie check before any badge is issued.",
  },
  {
    icon: Brain,
    title: "Qualifications",
    body: "Every credential cross-checked against the body that issued it — REPs, AfN, YAP, UKSCA, BWY, SENr.",
  },
  {
    icon: ShieldCheck,
    title: "Insurance",
    body: "Public liability and professional indemnity policies confirmed current and scope-correct.",
  },
];

function VerifyStrip() {
  return (
    <section className="border-b border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[760px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
            How we verify every specialism
          </span>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
            Three checks — every profile, every renewal.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {VERIFY_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-7"
              >
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
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

function FaqBlock() {
  return (
    <section className="border-b border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[920px] px-6 py-20 lg:px-10 lg:py-24">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
          FAQ
        </span>
        <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[38px]">
          Specialisms, qualifications & registers — answered.
        </h2>

        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b border-reps-border"
            >
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
  const chips: Array<{ label: string; to: string; params?: Record<string, string> }> = [
    { label: "Find a professional", to: "/find-a-professional" },
    { label: "Personal trainers in London", to: "/in/$location", params: { location: "london" } },
    { label: "For professionals", to: "/for-professionals" },
    { label: "CPD & qualifications", to: "/cpd" },
    { label: "About REPs", to: "/about" },
  ];
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
                Jump into search, your city, or the rest of the REPs platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {chips.map((c) =>
                c.params ? (
                  <Link
                    key={c.label}
                    to={c.to as "/in/$location"}
                    params={c.params as { location: string }}
                    className="inline-flex h-9 items-center rounded-full border border-reps-border bg-reps-ink px-4 text-[13px] font-medium text-white shadow-none hover:border-reps-orange-border hover:text-reps-orange"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <Link
                    key={c.label}
                    to={c.to as "/find-a-professional"}
                    className="inline-flex h-9 items-center rounded-full border border-reps-border bg-reps-ink px-4 text-[13px] font-medium text-white shadow-none hover:border-reps-orange-border hover:text-reps-orange"
                  >
                    {c.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
