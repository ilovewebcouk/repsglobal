import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Award,
  BadgeCheck,
  Brain,
  Briefcase,
  Compass,
  Crosshair,
  Dumbbell,
  Globe,
  GraduationCap,
  Heart,
  Layers,
  Lightbulb,
  Lock,
  MapPin,
  Monitor,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Wand2,
  Zap,
} from "lucide-react";

import cpdTutorMomentAsset from "@/assets/cpd-tutor-moment.jpg.asset.json";
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

const heroImg = cpdTutorMomentAsset.url;

/* ------------------------------------------------------------------ */
/* Head                                                                */
/* ------------------------------------------------------------------ */

const CANONICAL = "https://repsglobal.lovable.app/cpd-v2";
const META_TITLE =
  "Education, CPD & Career Growth for Fitness Professionals | REPs";
const META_DESC =
  "Build your professional profile, track your development and find recognised education that helps you stay credible, visible and trusted through REPs.";

export const Route = createFileRoute("/cpd-v2")({
  head: () => ({
    meta: [
      { title: META_TITLE },
      { name: "description", content: META_DESC },
      { property: "og:title", content: META_TITLE },
      { property: "og:description", content: META_DESC },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: heroImg },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: heroImg },
    ],
    links: [
      { rel: "canonical", href: CANONICAL },
      { rel: "preload", as: "image", href: heroImg, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: CpdV2Page,
});

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const PROOF_CARDS = [
  {
    icon: ShieldCheck,
    title: "Stay verified",
    body: "Keep your REPs status current as you complete CPD and renew insurance.",
  },
  {
    icon: TrendingUp,
    title: "Track CPD",
    body: "See your hours, points and renewal cycle in one place — not a spreadsheet.",
  },
  {
    icon: Award,
    title: "Develop specialisms",
    body: "Evidence focused practice areas through recognised qualifications and CPD.",
  },
  {
    icon: Star,
    title: "Stand out to clients",
    body: "Your public profile reflects every credential you keep up to date.",
  },
];

const PATHWAYS = [
  {
    icon: ShieldCheck,
    title: "Foundation & verification",
    outcome: "Get verified on REPs and meet baseline standards from day one.",
    topics: ["Level 2/3 fundamentals", "Insurance & first aid", "Safeguarding"],
  },
  {
    icon: Dumbbell,
    title: "Coaching delivery",
    outcome: "Sharpen the craft of programming, coaching cues and client outcomes.",
    topics: ["Programming", "Behaviour change", "Assessment & screening"],
  },
  {
    icon: Briefcase,
    title: "Business growth",
    outcome: "Build a sustainable practice — pricing, retention and visibility.",
    topics: ["Pricing models", "Client retention", "Marketing for PTs"],
  },
  {
    icon: Target,
    title: "Specialist practice",
    outcome: "Go deeper in a population, modality or clinical-adjacent area.",
    topics: ["Pre/Postnatal", "Lower back pain", "Older adults"],
  },
  {
    icon: Sparkles,
    title: "REPs platform & AI skills",
    outcome: "Use your shop-front, enquiries and AI tools to grow on REPs.",
    topics: ["Shop-front", "Enquiry conversion", "AI assistant"],
  },
];

const COURSES = [
  {
    title: "Coaching Lower Back Pain",
    provider: "Movement Mechanics",
    points: 16,
    level: "Level 4",
    format: "Blended",
    blurb: "Screening, exercise selection and red flags for low-back presentations.",
    price: "£249",
  },
  {
    title: "Pre & Postnatal Foundations",
    provider: "Holistic Core Restore",
    points: 12,
    level: "Level 3",
    format: "Online",
    blurb: "Programming for pregnant and postpartum clients with confidence.",
    price: "£189",
  },
  {
    title: "Strength & Conditioning for Coaches",
    provider: "S&C Education",
    points: 20,
    level: "Level 4",
    format: "In-person",
    blurb: "Force-velocity, periodisation and sport-specific programming.",
    price: "£395",
  },
  {
    title: "Behaviour Change in Practice",
    provider: "Coach Catalyst",
    points: 8,
    level: "Level 3",
    format: "Online",
    blurb: "Practical tools for habit formation, motivation and adherence.",
    price: "£89",
  },
  {
    title: "Older Adults Specialism",
    provider: "Functional Ageing Institute",
    points: 14,
    level: "Level 4",
    format: "Blended",
    blurb: "Train clients 55+ with confidence: balance, bone health, longevity.",
    price: "£275",
  },
  {
    title: "Online Coaching Operations",
    provider: "REPs Academy",
    points: 6,
    level: "Level 3",
    format: "Online",
    blurb: "Build an online coaching practice that delivers real outcomes.",
    price: "£59",
  },
];

const FILTERS: { label: string; options: string[] }[] = [
  { label: "Category", options: ["All", "Strength", "Pre/Postnatal", "Nutrition", "Mobility"] },
  { label: "Delivery type", options: ["Any", "Online", "In-person", "Blended"] },
  { label: "CPD points", options: ["Any", "1–5", "6–15", "16+"] },
  { label: "Level", options: ["Any", "Level 2", "Level 3", "Level 4"] },
  { label: "Provider", options: ["All providers", "Verified only"] },
  { label: "Specialism", options: ["Any", "S&C", "Pre/Postnatal", "Older Adults"] },
];

const SPECIALISMS = [
  { icon: Dumbbell, title: "Strength & Conditioning" },
  { icon: Heart, title: "Pre & Postnatal" },
  { icon: Users, title: "Older Adults" },
  { icon: BadgeCheck, title: "Disability & Inclusive Fitness" },
  { icon: Monitor, title: "Online Coaching" },
  { icon: Activity, title: "Nutrition Coaching" },
  { icon: Rocket, title: "Youth Fitness" },
  { icon: Crosshair, title: "Sports Performance" },
  { icon: Zap, title: "Mobility & Rehabilitation" },
];

const FAQS = [
  {
    q: "What counts as CPD?",
    a: "CPD is any structured learning that develops your practice — accredited courses, workshops, mentoring, webinars, conferences and reflective practice. REPs recognises CPD delivered by accredited training providers and equivalent industry bodies.",
  },
  {
    q: "Do I need CPD to stay verified?",
    a: "Verified members are expected to maintain a current CPD record alongside insurance and qualifications. REPs makes it easy to log hours and surface them on your profile.",
  },
  {
    q: "Can clients see my qualifications?",
    a: "Yes. Your public REPs profile shows the qualifications, specialisms and verification status clients use to decide who to trust.",
  },
  {
    q: "Can I add existing qualifications?",
    a: "Yes. You can add qualifications you already hold and link them to your REPs profile. Evidence is reviewed during verification.",
  },
  {
    q: "Can training providers list courses on REPs?",
    a: "A dedicated provider experience is in development. Register your interest below and we'll bring you into the next intake.",
  },
  {
    q: "Will REPs recommend CPD to me?",
    a: "We're building learning recommendations that surface CPD relevant to your specialisms, goals and profile gaps. The recommendation preview on this page shows the direction.",
  },
  {
    q: "Are specialist badges verified?",
    a: "REPs shows specialism areas evidenced by recognised qualifications and CPD. We don't issue badges that aren't backed by a credential — that's the point.",
  },
  {
    q: "Can I use REPs without completing CPD?",
    a: "Yes — you can join and build a profile. CPD becomes important when you want to stay verified, develop specialisms and grow visibility over time.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function CpdV2Page() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
        <PublicHeader variant="solid" />
        <Hero />
        <ProofCards />
        <DevelopmentPassport />
        <LearningPathways />
        <CpdDiscovery />
        <SpecialistAreas />
        <AiRecommendations />
        <TrainingProvidersBand />
        <FaqBlock />
        <FinalCta />
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
        src={heroImg}
        alt=""
        width={1536}
        height={1024}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[78%_38%] sm:object-[72%_42%] md:object-[68%_45%] lg:object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/35 via-reps-ink/60 to-reps-ink/85 lg:bg-reps-ink/40 lg:bg-none" />
      <div
        aria-hidden
        className="absolute inset-0 hidden lg:block bg-[radial-gradient(50%_75%_at_18%_55%,rgba(10,10,12,0.72),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(60%_50%_at_50%_15%,rgba(255,122,0,0.12),transparent_72%)] lg:bg-[radial-gradient(40%_45%_at_15%_20%,rgba(255,122,0,0.10),transparent_70%)]"
      />

      <div className="relative mx-auto flex min-h-[640px] sm:min-h-[680px] lg:min-h-[700px] w-full max-w-7xl flex-col items-start justify-start px-5 pt-24 sm:px-6 lg:px-8 lg:pt-28">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange/40 bg-reps-orange/10 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-reps-orange">
            <GraduationCap className="h-3.5 w-3.5" /> Education & CPD
          </span>
          <h1 className="mt-5 text-[40px] leading-[1.05] font-semibold tracking-tight text-white sm:text-[52px] lg:text-[60px]">
            Education, CPD and career growth{" "}
            <span className="text-reps-orange">for fitness professionals.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/85 sm:text-[18px]">
            Build your professional profile, track your development and find
            recognised education that helps you stay credible, visible and
            trusted through REPs.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-[10px] bg-reps-orange px-5 py-3 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,122,0,0.55)] hover:bg-reps-orange/90 transition"
            >
              Join REPs <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#cpd-discovery"
              className="inline-flex items-center gap-2 rounded-[10px] border border-white/25 bg-white/5 px-5 py-3 text-[15px] font-medium text-white hover:bg-white/10 transition"
            >
              Explore CPD
            </a>
            <a
              href="#training-providers"
              className="text-[14px] font-medium text-white/75 underline decoration-white/30 underline-offset-4 hover:text-white"
            >
              Are you a training provider?
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/65">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-reps-orange" />
              Accredited providers only
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-reps-orange" />
              Ofqual · Yoga Alliance · BASI · STOTT
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-reps-orange" />
              Trusted by clients worldwide
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Proof cards                                                         */
/* ------------------------------------------------------------------ */

function ProofCards() {
  return (
    <section className="border-y border-white/5 bg-reps-ink/95">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8 lg:py-14">
        {PROOF_CARDS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-[16px] border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange/15 text-reps-orange">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-[15px] font-semibold text-white">{title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/65">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Development passport (50/50)                                        */
/* ------------------------------------------------------------------ */

function DevelopmentPassport() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(45%_60%_at_80%_20%,rgba(255,122,0,0.10),transparent_70%)]" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-white/70">
            <Layers className="h-3.5 w-3.5" /> Professional Development Passport
          </span>
          <h2 className="mt-4 text-[34px] leading-[1.1] font-semibold tracking-tight text-white sm:text-[40px]">
            Your professional development,{" "}
            <span className="text-reps-orange">
              connected to your public profile.
            </span>
          </h2>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/75">
            Qualifications, CPD, insurance and specialist development don't
            belong in a folder on your laptop. On REPs they support the public
            profile clients see — so the work you put in shows up where it
            matters.
          </p>
          <ul className="mt-6 space-y-3 text-[14.5px] text-white/80">
            {[
              "Verification, CPD and insurance in one record",
              "Specialism areas evidenced by recognised credentials",
              "A trust score that reflects how complete your profile is",
              "Automatic renewal reminders so you never lapse",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-reps-orange" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <ProfessionalDevelopmentMockup />
      </div>
    </section>
  );
}

function ProfessionalDevelopmentMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[28px] bg-reps-orange/10 blur-2xl" aria-hidden />
      <div className="relative rounded-[22px] border border-white/10 bg-[#0E0E11]/95 p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-reps-orange/20 text-reps-orange font-semibold">
              SH
            </div>
            <div>
              <div className="text-[14px] font-semibold text-white">Sarah Hughes</div>
              <div className="text-[11.5px] text-white/55">Personal Trainer · Manchester</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
        </div>

        {/* CPD progress + trust score */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-wide text-white/55">CPD this cycle</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold text-white tabular-nums">18</span>
              <span className="text-[13px] text-white/55">/ 20 pts</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
              <div className="h-full w-[90%] rounded-full bg-reps-orange" />
            </div>
          </div>
          <div className="rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-wide text-white/55">Profile trust score</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold text-white tabular-nums">92</span>
              <span className="text-[13px] text-white/55">/ 100</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-emerald-300">
              <TrendingUp className="h-3 w-3" /> +8 this month
            </div>
          </div>
        </div>

        {/* Qualifications + Insurance */}
        <div className="mt-3 rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
          <div className="text-[11px] uppercase tracking-wide text-white/55">Qualifications</div>
          <ul className="mt-2 space-y-1.5 text-[13px] text-white/85">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-reps-orange" />
                L3 Personal Training
              </span>
              <span className="text-[11px] text-white/45">Active</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-reps-orange" />
                L4 Lower Back Pain
              </span>
              <span className="text-[11px] text-white/45">Active</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-reps-orange" />
                Insurance · Insure4Sport
              </span>
              <span className="text-[11px] text-white/45">Renews 14 Mar</span>
            </li>
          </ul>
        </div>

        {/* Specialisms */}
        <div className="mt-3 rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
          <div className="text-[11px] uppercase tracking-wide text-white/55">Specialism areas</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Strength & Conditioning", "Pre/Postnatal", "Lower Back Pain"].map(
              (s) => (
                <span
                  key={s}
                  className="rounded-full bg-reps-orange/12 px-2.5 py-1 text-[11.5px] font-medium text-reps-orange ring-1 ring-reps-orange/25"
                >
                  {s}
                </span>
              ),
            )}
          </div>
        </div>

        {/* Recommended next CPD */}
        <div className="mt-3 rounded-[14px] border border-reps-orange/30 bg-reps-orange/[0.06] p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wide text-reps-orange">
              Recommended next CPD
            </div>
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" />
          </div>
          <div className="mt-1.5 text-[14px] font-semibold text-white">
            Behaviour Change in Practice
          </div>
          <div className="mt-0.5 text-[12px] text-white/60">
            Coach Catalyst · 8 pts · Online · £89
          </div>
        </div>

        {/* Renewal */}
        <div className="mt-3 flex items-center justify-between rounded-[14px] border border-white/8 bg-white/[0.03] p-3.5">
          <div className="flex items-center gap-2 text-[12.5px] text-white/75">
            <Lock className="h-3.5 w-3.5 text-emerald-300" />
            REPs renewal
          </div>
          <span className="text-[12px] font-medium text-emerald-300">
            On track · 14 Mar 2027
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Learning pathways                                                   */
/* ------------------------------------------------------------------ */

function LearningPathways() {
  return (
    <section className="border-t border-white/5 bg-[#0B0B0D]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-white/70">
            <Compass className="h-3.5 w-3.5" /> Pathways
          </span>
          <h2 className="mt-4 text-[34px] leading-[1.1] font-semibold tracking-tight text-white sm:text-[40px]">
            Choose the pathway that{" "}
            <span className="text-reps-orange">matches your next stage.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white/70">
            From day-one verification to specialist depth, REPs maps the
            recognised education that fits where you are in your career.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PATHWAYS.map(({ icon: Icon, title, outcome, topics }) => (
            <div
              key={title}
              className="group rounded-[18px] border border-white/10 bg-white/[0.03] p-5 hover:border-reps-orange/40 hover:bg-white/[0.05] transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange/15 text-reps-orange">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-[16px] font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/65">
                {outcome}
              </p>
              <ul className="mt-3 space-y-1 text-[12.5px] text-white/55">
                {topics.map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-reps-orange" />
                    {t}
                  </li>
                ))}
              </ul>
              <a
                href="#cpd-discovery"
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-reps-orange hover:gap-2 transition-all"
              >
                See courses <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CPD discovery                                                       */
/* ------------------------------------------------------------------ */

function CpdDiscovery() {
  return (
    <section id="cpd-discovery" className="border-t border-white/5 bg-reps-ink">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-white/70">
              <Search className="h-3.5 w-3.5" /> CPD Discovery
            </span>
            <h2 className="mt-4 text-[34px] leading-[1.1] font-semibold tracking-tight text-white sm:text-[40px]">
              Find CPD that supports{" "}
              <span className="text-reps-orange">your professional goals.</span>
            </h2>
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11.5px] font-medium text-white/65">
            Preview · Example courses
          </span>
        </div>

        {/* Filter bar */}
        <div className="mt-8 grid grid-cols-2 gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-3 lg:grid-cols-7">
          {FILTERS.map((f) => (
            <div key={f.label} className="min-w-0">
              <div className="text-[10.5px] uppercase tracking-wide text-white/45">
                {f.label}
              </div>
              <button
                type="button"
                disabled
                className="mt-1 inline-flex w-full items-center justify-between gap-2 rounded-[8px] border border-white/10 bg-reps-ink/60 px-2.5 py-1.5 text-[12.5px] text-white/80"
              >
                <span className="truncate">{f.options[0]}</span>
                <ArrowRight className="h-3 w-3 rotate-90 text-white/40" />
              </button>
            </div>
          ))}
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-wide text-white/45">
              Mode
            </div>
            <div className="mt-1 inline-flex w-full rounded-[8px] border border-white/10 bg-reps-ink/60 p-0.5 text-[11.5px] font-medium text-white/80">
              <span className="flex-1 rounded-[6px] bg-reps-orange/20 px-2 py-1 text-center text-reps-orange">
                Online
              </span>
              <span className="flex-1 px-2 py-1 text-center text-white/55">
                In-person
              </span>
            </div>
          </div>
        </div>

        {/* Course grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((c) => (
            <article
              key={c.title}
              className="flex flex-col rounded-[18px] border border-white/10 bg-white/[0.03] p-5 hover:border-reps-orange/40 transition"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange/12 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-reps-orange ring-1 ring-reps-orange/25">
                  <ShieldCheck className="h-3 w-3" /> Verified provider
                </span>
                <span className="text-[12px] font-semibold text-white">{c.price}</span>
              </div>
              <h3 className="mt-3 text-[16px] font-semibold leading-snug text-white">
                {c.title}
              </h3>
              <div className="mt-0.5 text-[12.5px] text-white/55">{c.provider}</div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-white/65">
                {c.blurb}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-white/70">
                <span className="rounded-full bg-white/8 px-2 py-0.5">
                  {c.points} CPD pts
                </span>
                <span className="rounded-full bg-white/8 px-2 py-0.5">
                  {c.level}
                </span>
                <span className="rounded-full bg-white/8 px-2 py-0.5">
                  {c.format}
                </span>
              </div>
              <button
                type="button"
                disabled
                className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-white/15 bg-white/5 px-3 py-2 text-[13px] font-medium text-white/80"
              >
                View course
              </button>
            </article>
          ))}
        </div>

        <p className="mt-6 text-[12.5px] text-white/45">
          Live course search is in development. These are illustrative examples
          of the providers and CPD that will appear here.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Specialist areas                                                    */
/* ------------------------------------------------------------------ */

function SpecialistAreas() {
  return (
    <section className="border-t border-white/5 bg-[#0B0B0D]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-white/70">
            <Award className="h-3.5 w-3.5" /> Specialism areas
          </span>
          <h2 className="mt-4 text-[34px] leading-[1.1] font-semibold tracking-tight text-white sm:text-[40px]">
            Build credibility through{" "}
            <span className="text-reps-orange">recognised specialisms.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white/70">
            Specialism areas are evidenced through recognised qualifications and
            CPD — not handed out. When you complete the right credentials, your
            profile reflects them.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          {SPECIALISMS.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.03] p-4 hover:border-reps-orange/40 transition"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-reps-orange/15 text-reps-orange">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-[14px] font-medium text-white">{title}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[12.5px] text-white/45">
          REPs displays specialism areas you can evidence with recognised
          qualifications and CPD. Where a formal specialist register exists, it
          is shown separately on your profile.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* AI recommendations                                                  */
/* ------------------------------------------------------------------ */

function AiRecommendations() {
  return (
    <section className="border-t border-white/5 bg-reps-ink">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange/40 bg-reps-orange/10 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-reps-orange">
            <Wand2 className="h-3.5 w-3.5" /> AI · Preview
          </span>
          <h2 className="mt-4 text-[34px] leading-[1.1] font-semibold tracking-tight text-white sm:text-[40px]">
            Know what to learn{" "}
            <span className="text-reps-orange">next.</span>
          </h2>
          <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-white/75">
            REPs is building learning recommendations that look at your
            qualifications, specialisms and profile to suggest the next CPD that
            actually moves your career forward. Here's the direction.
          </p>
          <p className="mt-3 text-[12.5px] text-white/45">
            Preview only — recommendations are illustrative and not yet
            personalised.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[28px] bg-reps-orange/8 blur-2xl" aria-hidden />
          <div className="relative rounded-[22px] border border-white/10 bg-[#0E0E11]/95 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-reps-orange" />
                <span className="text-[12px] font-semibold uppercase tracking-wide text-white/70">
                  Suggested for Sarah
                </span>
              </div>
              <span className="rounded-full bg-reps-orange/15 px-2 py-0.5 text-[10.5px] font-semibold text-reps-orange ring-1 ring-reps-orange/30">
                Preview
              </span>
            </div>

            <div className="mt-5 rounded-[14px] border border-reps-orange/25 bg-reps-orange/[0.06] p-4">
              <div className="text-[11px] uppercase tracking-wide text-reps-orange">
                Recommended next CPD
              </div>
              <div className="mt-1.5 text-[16px] font-semibold text-white">
                Coaching Lower Back Pain · Movement Mechanics
              </div>
              <div className="mt-0.5 text-[12px] text-white/55">
                16 CPD pts · Level 4 · Blended
              </div>
            </div>

            <RecRow
              icon={Lightbulb}
              label="Why it matters"
              body="42% of your enquiries mention back pain. A recognised L4 course unlocks specialist visibility on your profile."
            />
            <RecRow
              icon={TrendingUp}
              label="Profile improvement"
              body="Adds a verified specialism area and lifts your trust score from 92 → 96."
            />
            <RecRow
              icon={Target}
              label="Suggested next action"
              body="Book the next cohort — starts 14 Apr."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function RecRow({
  icon: Icon,
  label,
  body,
}: {
  icon: typeof Brain;
  label: string;
  body: string;
}) {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-white/8 text-reps-orange">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-white/55">
          {label}
        </div>
        <div className="mt-0.5 text-[13.5px] leading-relaxed text-white/85">
          {body}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Training providers                                                  */
/* ------------------------------------------------------------------ */

function TrainingProvidersBand() {
  return (
    <section
      id="training-providers"
      className="relative overflow-hidden border-t border-white/5 bg-[#0B0B0D]"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(50%_60%_at_15%_50%,rgba(255,122,0,0.10),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-20 sm:px-6 lg:grid-cols-[1.2fr,1fr] lg:gap-14 lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-white/70">
            <GraduationCap className="h-3.5 w-3.5" /> Training providers
          </span>
          <h2 className="mt-4 text-[34px] leading-[1.1] font-semibold tracking-tight text-white sm:text-[40px]">
            Training providers will have a{" "}
            <span className="text-reps-orange">stronger place inside REPs.</span>
          </h2>
          <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/75">
            REPs is being developed to give training providers clearer
            visibility, stronger provider profiles and a better route to present
            qualifications, CPD and professional education to the fitness
            industry.
          </p>
          <div className="mt-7">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-[10px] bg-reps-orange px-5 py-3 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,122,0,0.55)] hover:bg-reps-orange/90 transition"
            >
              Register interest as a training provider{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <div className="text-[11px] uppercase tracking-wide text-reps-orange">
            What's coming
          </div>
          <ul className="mt-4 space-y-3 text-[14px] text-white/85">
            {[
              "Branded provider profiles with course catalogues",
              "Verified-provider badge surfaced across REPs",
              "Direct link to enquiries from member profiles",
              "Performance insights on enrolments and completions",
              "Tools to publish CPD, qualifications and short courses",
            ].map((l) => (
              <li key={l} className="flex items-start gap-2.5">
                <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-reps-orange" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
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
    <section className="border-t border-white/5 bg-reps-ink">
      <div className="mx-auto max-w-4xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-white/70">
            FAQ
          </span>
          <h2 className="mt-4 text-[34px] leading-[1.1] font-semibold tracking-tight text-white sm:text-[40px]">
            Questions, answered{" "}
            <span className="text-reps-orange">honestly.</span>
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`q-${i}`}
              className="border-white/10"
            >
              <AccordionTrigger className="text-left text-[15.5px] font-medium text-white hover:text-reps-orange hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[14px] leading-relaxed text-white/70">
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
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-[#0B0B0D]">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,122,0,0.18),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
        <h2 className="text-[34px] leading-[1.08] font-semibold tracking-tight text-white sm:text-[44px]">
          Build your profile. Prove your standards.{" "}
          <span className="text-reps-orange">Grow your career.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-white/75">
          Join REPs to connect your verification, education, profile and
          professional development in one platform.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-[10px] bg-reps-orange px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,122,0,0.6)] hover:bg-reps-orange/90 transition"
          >
            Join REPs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
