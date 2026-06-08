import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Award,
  BadgeCheck,
  Brain,
  Briefcase,
  Check,
  Compass,
  Crosshair,
  Dumbbell,
  Globe,
  GraduationCap,
  Heart,
  Layers,
  Lightbulb,
  Lock,
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

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { RegisterProof } from "@/components/marketing/RegisterProof";
import { StickyCtaPill } from "@/components/marketing/StickyCtaPill";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { VerifySteps } from "@/components/marketing/VerifySteps";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  {
    icon: Monitor,
    title: "Online coaching & tech",
    outcome: "Deliver high-quality coaching to clients anywhere, with the right tools.",
    topics: ["Online programming", "Coaching apps", "Client communications"],
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
  { label: "Category", options: ["All categories", "Strength", "Pre/Postnatal", "Nutrition", "Mobility"] },
  { label: "CPD points", options: ["Any points", "1–5", "6–15", "16+"] },
  { label: "Level", options: ["Any level", "Level 2", "Level 3", "Level 4"] },
  { label: "Provider", options: ["All providers", "Verified only"] },
  { label: "Specialism", options: ["Any specialism", "S&C", "Pre/Postnatal", "Older Adults"] },
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

const PROVIDER_BENEFITS = [
  "Branded provider profiles with course catalogues",
  "Verified-provider badge surfaced across REPs",
  "Direct link to enquiries from member profiles",
  "Performance insights on enrolments and completions",
  "Tools to publish CPD, qualifications and short courses",
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
      <div className="min-h-screen overflow-x-clip bg-reps-ink text-white">
        <PublicHeader variant="solid" />
        <Hero />
        <ProofCards />
        <DevelopmentPassport />
        <RegisterProofBand />
        <LearningPathways />
        <RecognitionStrip />
        <CpdDiscovery />
        <SpecialistAreas />
        <AiRecommendations />
        <TrainingProvidersBand />
        <FaqBlock />
        <VerifyStrip />
        <FinalCta />

        <PublicFooter />
        <StickyCtaPill />
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

      <div className="relative mx-auto flex min-h-[640px] sm:min-h-[680px] lg:min-h-[700px] w-full max-w-[1320px] flex-col items-start justify-start px-6 pb-20 pt-24 lg:px-10 lg:pb-28 lg:pt-28">
        <div className="max-w-[720px]">
          <MarketingHeroEyebrow
            icon={GraduationCap}
            style={{ animationDuration: "560ms", animationFillMode: "both" }}
          >
            Education & CPD
          </MarketingHeroEyebrow>

          <h1
            className="mt-6 animate-fade-in font-display text-[36px] font-bold leading-[1.04] text-white sm:text-[46px] lg:text-[60px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            Education, CPD and career growth{" "}
            <span className="text-reps-orange">for fitness professionals.</span>
          </h1>

          <p
            className="mt-6 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            Build your professional profile, track your development and find
            recognised education that helps you stay credible, visible and
            trusted through REPs.
          </p>

          <div
            className="mt-8 flex animate-fade-in flex-wrap items-center gap-3"
            style={{ animationDuration: "640ms", animationDelay: "260ms", animationFillMode: "both" }}
          >
            <Link
              to="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Join REPs <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#cpd-discovery"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              Explore CPD
            </a>
            <a
              href="#training-providers"
              className="text-[13.5px] font-medium text-white/75 underline decoration-white/30 underline-offset-4 hover:text-white"
            >
              Are you a training provider?
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
              Recognised education partners
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-reps-orange" />
              CPD tracked on your public profile
            </li>
          </ul>

          <div
            className="mt-10 w-full animate-fade-in border-t border-white/10 pt-5"
            style={{ animationDuration: "640ms", animationDelay: "420ms", animationFillMode: "both" }}
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
              <span>Education</span>
              <span className="text-reps-orange/70">·</span>
              <span>CPD</span>
              <span className="text-reps-orange/70">·</span>
              <span>Specialisms</span>
              <span className="text-reps-orange/70">·</span>
              <span>Pathways</span>
              <span className="text-reps-orange/70">·</span>
              <span>Career</span>
              <span className="ml-2 text-reps-orange">— All in one place</span>
            </p>
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
    <section className="border-y border-reps-border bg-reps-ink">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-4 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-10 lg:py-14">
        {PROOF_CARDS.map(({ icon: Icon, title, body }) => (
          <Card
            key={title}
            className="rounded-[16px] border-reps-border bg-reps-panel shadow-none transition hover:border-reps-orange-border"
          >
            <CardHeader className="pb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Icon className="h-5 w-5" />
              </span>
              <CardTitle className="mt-4 text-[15px] font-semibold text-white">
                {title}
              </CardTitle>
              <CardDescription className="text-[13.5px] leading-relaxed text-white/65">
                {body}
              </CardDescription>
            </CardHeader>
          </Card>
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
      <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:gap-14 lg:px-10 lg:py-24">
        <div>
          <Badge
            variant="outline"
            className="rounded-full border-reps-border bg-reps-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" /> Professional Development Passport
          </Badge>
          <h2 className="mt-4 font-display text-[34px] leading-[1.1] font-bold tracking-tight text-white sm:text-[40px]">
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
          <ul className="mt-6 flex flex-col gap-3 text-[14.5px] text-white/80">
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
      <div className="absolute -inset-6 rounded-[24px] bg-reps-orange/10 blur-2xl" aria-hidden />
      <Card className="relative rounded-[22px] border-reps-border bg-reps-panel p-2 shadow-none">
        <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border border-reps-border">
                <AvatarFallback className="bg-reps-orange-soft text-reps-orange font-semibold">
                  SH
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-[14px] font-semibold text-white">
                  Sarah Hughes
                </div>
                <div className="text-[11.5px] text-white/55">
                  Personal Trainer · Manchester
                </div>
              </div>
            </div>
            <Badge className="rounded-full border-emerald-400/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
              <ShieldCheck className="mr-1 h-3 w-3" /> Verified
            </Badge>
          </div>

          <Separator className="bg-reps-border" />

          {/* CPD progress + trust score */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[16px] border border-reps-border bg-reps-ink p-4">
              <div className="text-[11px] uppercase tracking-wide text-white/55">
                CPD this cycle
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-display text-[28px] font-bold text-white tabular-nums">
                  18
                </span>
                <span className="text-[13px] text-white/55">/ 20 pts</span>
              </div>
              <Progress value={90} className="mt-3 h-1.5 bg-reps-border [&>div]:bg-reps-orange" />
            </div>
            <div className="rounded-[16px] border border-reps-border bg-reps-ink p-4">
              <div className="text-[11px] uppercase tracking-wide text-white/55">
                Profile trust score
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-display text-[28px] font-bold text-white tabular-nums">
                  92
                </span>
                <span className="text-[13px] text-white/55">/ 100</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-emerald-300">
                <TrendingUp className="h-3 w-3" /> +8 this month
              </div>
            </div>
          </div>

          {/* Qualifications */}
          <div className="rounded-[16px] border border-reps-border bg-reps-ink p-4">
            <div className="text-[11px] uppercase tracking-wide text-white/55">
              Qualifications
            </div>
            <ul className="mt-2 flex flex-col gap-1.5 text-[13px] text-white/85">
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
          <div className="rounded-[16px] border border-reps-border bg-reps-ink p-4">
            <div className="text-[11px] uppercase tracking-wide text-white/55">
              Specialism areas
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Strength & Conditioning", "Pre/Postnatal", "Lower Back Pain"].map(
                (s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="rounded-full border-reps-orange-border bg-reps-orange-soft text-[11.5px] font-medium text-reps-orange"
                  >
                    {s}
                  </Badge>
                ),
              )}
            </div>
          </div>

          {/* Recommended next CPD */}
          <div className="rounded-[16px] border border-reps-orange-border bg-reps-orange-soft p-4">
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
          <div className="flex items-center justify-between rounded-[16px] border border-reps-border bg-reps-ink p-3.5">
            <div className="flex items-center gap-2 text-[12.5px] text-white/75">
              <Lock className="h-3.5 w-3.5 text-emerald-300" />
              REPs renewal
            </div>
            <span className="text-[12px] font-medium text-emerald-300">
              On track · 14 Mar 2027
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Register proof (shared)                                             */
/* ------------------------------------------------------------------ */

function RegisterProofBand() {
  return (
    <section className="border-t border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
        <div className="mb-8 max-w-2xl">
          <Badge
            variant="outline"
            className="rounded-full border-reps-border bg-reps-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"
          >
            Why members renew
          </Badge>
          <h2 className="mt-4 font-display text-[28px] leading-[1.1] font-bold tracking-tight text-white sm:text-[34px]">
            A register clients actually search.
          </h2>
        </div>
        <RegisterProof />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Learning pathways                                                   */
/* ------------------------------------------------------------------ */

function LearningPathways() {
  return (
    <section className="border-t border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-3xl">
          <Badge
            variant="outline"
            className="rounded-full border-reps-border bg-reps-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"
          >
            <Compass className="mr-1.5 h-3.5 w-3.5" /> Pathways
          </Badge>
          <h2 className="mt-4 font-display text-[34px] leading-[1.1] font-bold tracking-tight text-white sm:text-[40px]">
            Choose the pathway that{" "}
            <span className="text-reps-orange">matches your next stage.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white/75">
            From day-one verification to specialist depth, REPs maps the
            recognised education that fits where you are in your career.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PATHWAYS.map(({ icon: Icon, title, outcome, topics }) => (
            <Card
              key={title}
              className="flex flex-col rounded-[18px] border-reps-border bg-reps-panel shadow-none transition hover:border-reps-orange-border"
            >
              <CardHeader>
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-5 w-5" />
                </span>
                <CardTitle className="mt-4 font-display text-[18px] font-bold leading-tight text-white">
                  {title}
                </CardTitle>
                <CardDescription className="text-[13.5px] leading-relaxed text-white/70">
                  {outcome}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <ul className="flex flex-col gap-1.5 text-[12.5px] text-white/60">
                  {topics.map((t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-reps-orange" />
                      {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-0">
                <a
                  href="#cpd-discovery"
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-reps-orange hover:underline"
                >
                  See courses <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </CardFooter>
            </Card>
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
    <section id="cpd-discovery" className="border-t border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="rounded-full border-reps-border bg-reps-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"
            >
              <Search className="mr-1.5 h-3.5 w-3.5" /> CPD Discovery
            </Badge>
            <h2 className="mt-4 font-display text-[34px] leading-[1.1] font-bold tracking-tight text-white sm:text-[40px]">
              Find CPD that supports{" "}
              <span className="text-reps-orange">your professional goals.</span>
            </h2>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="rounded-full border-reps-orange-border bg-reps-orange-soft text-[11px] font-semibold uppercase tracking-wide text-reps-orange"
              >
                Preview · Example courses
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Filters and courses are illustrative. Live search is coming.
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Filter bar */}
        <Card className="mt-8 rounded-[18px] border-reps-border bg-reps-panel shadow-none">
          <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
            {FILTERS.map((f) => (
              <div key={f.label} className="flex min-w-0 flex-col gap-1">
                <span className="text-[10.5px] uppercase tracking-wide text-white/50">
                  {f.label}
                </span>
                <Select disabled defaultValue={f.options[0]}>
                  <SelectTrigger className="h-9 rounded-[8px] border-reps-border bg-reps-ink text-[12.5px] text-white/85">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {f.options.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[10.5px] uppercase tracking-wide text-white/50">
                Mode
              </span>
              <Tabs defaultValue="online">
                <TabsList className="h-9 w-full rounded-[8px] border border-reps-border bg-reps-ink p-0.5">
                  <TabsTrigger
                    value="online"
                    className="flex-1 rounded-[6px] text-[11.5px] data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange"
                  >
                    Online
                  </TabsTrigger>
                  <TabsTrigger
                    value="in-person"
                    className="flex-1 rounded-[6px] text-[11.5px] data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange"
                  >
                    In-person
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Course grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((c) => (
            <Card
              key={c.title}
              className="flex flex-col rounded-[18px] border-reps-border bg-reps-panel shadow-none transition hover:border-reps-orange-border"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="rounded-full border-reps-orange-border bg-reps-orange-soft text-[10.5px] font-semibold uppercase tracking-wide text-reps-orange"
                  >
                    <ShieldCheck className="mr-1 h-3 w-3" /> Verified provider
                  </Badge>
                  <span className="text-[12px] font-semibold text-white">
                    {c.price}
                  </span>
                </div>
                <CardTitle className="mt-3 font-display text-[17px] font-bold leading-snug text-white">
                  {c.title}
                </CardTitle>
                <CardDescription className="text-[12.5px] text-white/55">
                  {c.provider}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-[13px] leading-relaxed text-white/70">
                  {c.blurb}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="rounded-full bg-reps-ink text-[11px] text-white/75">
                    {c.points} CPD pts
                  </Badge>
                  <Badge variant="secondary" className="rounded-full bg-reps-ink text-[11px] text-white/75">
                    {c.level}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full bg-reps-ink text-[11px] text-white/75">
                    {c.format}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  disabled
                  className="w-full rounded-[10px] border-reps-border bg-reps-ink text-white/80 shadow-none hover:bg-reps-panel-soft"
                >
                  View course
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Alert className="mt-6 rounded-[16px] border-reps-border bg-reps-panel text-white/70">
          <Sparkles className="h-4 w-4 text-reps-orange" />
          <AlertDescription className="text-[13px] text-white/70">
            Live course search is in development. These are illustrative examples
            of the providers and CPD that will appear here.
          </AlertDescription>
        </Alert>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Specialist areas                                                    */
/* ------------------------------------------------------------------ */

function SpecialistAreas() {
  return (
    <section className="border-t border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-3xl">
          <Badge
            variant="outline"
            className="rounded-full border-reps-border bg-reps-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"
          >
            <Award className="mr-1.5 h-3.5 w-3.5" /> Specialism areas
          </Badge>
          <h2 className="mt-4 font-display text-[34px] leading-[1.1] font-bold tracking-tight text-white sm:text-[40px]">
            Build credibility through{" "}
            <span className="text-reps-orange">recognised specialisms.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white/75">
            Specialism areas are evidenced through recognised qualifications and
            CPD — not handed out. When you complete the right credentials, your
            profile reflects them.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SPECIALISMS.map(({ icon: Icon, title }) => (
            <Card
              key={title}
              className="flex flex-row items-center gap-3 rounded-[16px] border-reps-border bg-reps-panel p-4 shadow-none transition hover:border-reps-orange-border"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[14px] font-semibold text-white">
                {title}
              </span>
            </Card>
          ))}
        </div>

        <Alert className="mt-6 rounded-[16px] border-reps-border bg-reps-panel text-white/70">
          <BadgeCheck className="h-4 w-4 text-reps-orange" />
          <AlertDescription className="text-[13px] text-white/70">
            REPs displays specialism areas you can evidence with recognised
            qualifications and CPD. Where a formal specialist register exists,
            it is shown separately on your profile.
          </AlertDescription>
        </Alert>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* AI recommendations                                                  */
/* ------------------------------------------------------------------ */

function AiRecommendations() {
  return (
    <section className="border-t border-reps-border bg-reps-ink">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:gap-14 lg:px-10 lg:py-24">
        <div>
          <Badge
            variant="outline"
            className="rounded-full border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange"
          >
            <Wand2 className="mr-1.5 h-3.5 w-3.5" /> AI · Preview
          </Badge>
          <h2 className="mt-4 font-display text-[34px] leading-[1.1] font-bold tracking-tight text-white sm:text-[40px]">
            Know what to learn{" "}
            <span className="text-reps-orange">next.</span>
          </h2>
          <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-white/75">
            REPs is building learning recommendations that look at your
            qualifications, specialisms and profile to suggest the next CPD that
            actually moves your career forward. Here's the direction.
          </p>
          <p className="mt-3 text-[12.5px] text-white/55">
            Preview only — recommendations are illustrative and not yet
            personalised.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[24px] bg-reps-orange/8 blur-2xl" aria-hidden />
          <Card className="relative rounded-[22px] border-reps-border bg-reps-panel shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-reps-orange" />
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-white/70">
                    Suggested for Sarah
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-reps-orange-border bg-reps-orange-soft text-[10.5px] font-semibold text-reps-orange"
                >
                  Preview
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="rounded-[16px] border border-reps-orange-border bg-reps-orange-soft p-4">
                <div className="text-[11px] uppercase tracking-wide text-reps-orange">
                  Recommended next CPD
                </div>
                <div className="mt-1.5 text-[16px] font-semibold text-white">
                  Coaching Lower Back Pain · Movement Mechanics
                </div>
                <div className="mt-0.5 text-[12px] text-white/60">
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
            </CardContent>
          </Card>
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
    <div className="flex items-start gap-3 rounded-[16px] border border-reps-border bg-reps-ink p-4">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange">
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
      className="relative overflow-hidden border-t border-reps-border bg-reps-ink"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(50%_60%_at_15%_50%,rgba(255,122,0,0.10),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-10 px-6 py-20 lg:grid-cols-[1.2fr_1fr] lg:gap-14 lg:px-10 lg:py-24">
        <div>
          <Badge
            variant="outline"
            className="rounded-full border-reps-border bg-reps-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"
          >
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" /> Training providers
          </Badge>
          <h2 className="mt-4 font-display text-[34px] leading-[1.1] font-bold tracking-tight text-white sm:text-[40px]">
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
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Register interest as a training provider{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <Card className="rounded-[22px] border-reps-border bg-reps-panel shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-reps-orange">
              What's coming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-[14px] text-white/85">
              {PROVIDER_BENEFITS.map((l) => (
                <li key={l} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-reps-orange" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

function FaqBlock() {
  return (
    <section className="border-t border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-4xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="text-center">
          <Badge
            variant="outline"
            className="rounded-full border-reps-border bg-reps-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"
          >
            FAQ
          </Badge>
          <h2 className="mt-4 font-display text-[34px] leading-[1.1] font-bold tracking-tight text-white sm:text-[40px]">
            Questions, answered{" "}
            <span className="text-reps-orange">honestly.</span>
          </h2>
        </div>

        <Card className="mt-10 rounded-[22px] border-reps-border bg-reps-panel shadow-none">
          <CardContent className="p-2 sm:p-4">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((f, i) => (
                <AccordionItem
                  key={f.q}
                  value={`q-${i}`}
                  className="border-reps-border"
                >
                  <AccordionTrigger className="text-left text-[15px] font-semibold text-white hover:no-underline [&>svg]:text-white/60">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[14px] leading-relaxed text-white/70">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-reps-border bg-reps-ink">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,122,0,0.18),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
        <h2 className="font-display text-[34px] leading-[1.08] font-bold tracking-tight text-white sm:text-[44px]">
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
            className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-8 text-[15px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
          >
            Join REPs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Recognition strip — bodies that accredit the qualifications         */
/* ------------------------------------------------------------------ */

const RECOGNITION = [
  { name: "Ofqual", note: "UK regulator for vocational qualifications — including L2/L3/L4 fitness." },
  { name: "CIMSPA", note: "Chartered Institute for the Management of Sport & Physical Activity." },
  { name: "Yoga Alliance", note: "Global registry for yoga teachers and 200/500-hour trainings." },
  { name: "BASI Pilates", note: "Body Arts & Science International — comprehensive Pilates teacher training." },
  { name: "STOTT Pilates", note: "Merrithew's contemporary Pilates education — mat and apparatus." },
  { name: "Les Mills", note: "Group fitness programmes and instructor certification, used worldwide." },
];

function RecognitionStrip() {
  return (
    <section className="border-t border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-3xl">
          <Badge
            variant="outline"
            className="rounded-full border-reps-border bg-reps-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"
          >
            <Globe className="mr-1.5 h-3.5 w-3.5" /> Recognition
          </Badge>
          <h2 className="mt-4 font-display text-[34px] leading-[1.1] font-bold tracking-tight text-white sm:text-[40px]">
            Recognised by the bodies that{" "}
            <span className="text-reps-orange">issue the qualifications.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white/75">
            REPs accepts education from the regulators and registries that fitness, sport and movement professionals already trust. If your credential comes from one of these, it belongs on your REPs profile.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RECOGNITION.map((r) => (
            <Card
              key={r.name}
              className="rounded-[16px] border-reps-border bg-reps-panel shadow-none transition hover:border-reps-orange-border"
            >
              <CardContent className="flex items-start gap-3 p-4">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-white">{r.name}</div>
                  <div className="mt-0.5 text-[12.5px] leading-relaxed text-white/65">
                    {r.note}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Verify strip — three short proofs above the final CTA               */
/* ------------------------------------------------------------------ */

const VERIFY = [
  { icon: ShieldCheck, title: "Identity verified", body: "Government-ID checked on every REPs member — no anonymous listings." },
  { icon: BadgeCheck, title: "Insurance current", body: "Public liability and professional indemnity confirmed against the policy." },
  { icon: GraduationCap, title: "CPD on the public record", body: "Hours and points are visible on your profile, not buried in a folder." },
];

function VerifyStrip() {
  return (
    <section className="border-t border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {VERIFY.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-[16px] border border-reps-border bg-reps-panel p-5"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[14.5px] font-semibold text-white">{title}</div>
                <div className="mt-1 text-[13px] leading-relaxed text-white/70">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

