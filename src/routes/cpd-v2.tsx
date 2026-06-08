import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Award,
  BadgeCheck,
  Brain,
  Briefcase,
  Check,
  Crosshair,
  Dumbbell,
  GraduationCap,
  Heart,
  Lightbulb,
  Lock,
  Monitor,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    delivery: "Blended",
    category: "Rehabilitation",
    audience: "PTs working 1-1 with desk-bound or post-injury clients",
    status: "Cohort starts 14 Apr",
    price: "£249",
  },
  {
    title: "Pre & Postnatal Foundations",
    provider: "Holistic Core Restore",
    points: 12,
    delivery: "Online",
    category: "Pre/Postnatal",
    audience: "Coaches programming for pregnant and postpartum clients",
    status: "Self-paced · open now",
    price: "£189",
  },
  {
    title: "Strength & Conditioning for Coaches",
    provider: "S&C Education",
    points: 20,
    delivery: "In-person",
    category: "Strength & Conditioning",
    audience: "PTs moving into sport-specific S&C work",
    status: "Cohort starts 06 May",
    price: "£395",
  },
  {
    title: "Behaviour Change in Practice",
    provider: "Coach Catalyst",
    points: 8,
    delivery: "Online",
    category: "Coaching skills",
    audience: "Any coach focused on adherence and habit change",
    status: "Self-paced · open now",
    price: "£89",
  },
  {
    title: "Older Adults Specialism",
    provider: "Functional Ageing Institute",
    points: 14,
    delivery: "Blended",
    category: "Older adults",
    audience: "PTs and group instructors training clients 55+",
    status: "Cohort starts 21 Apr",
    price: "£275",
  },
  {
    title: "Online Coaching Operations",
    provider: "REPs Academy",
    points: 6,
    delivery: "Online",
    category: "Business growth",
    audience: "Coaches building or scaling an online practice",
    status: "Self-paced · open now",
    price: "£59",
  },
];

const FILTERS: { label: string; options: string[] }[] = [
  { label: "Category", options: ["All categories", "Strength", "Pre/Postnatal", "Older adults", "Rehabilitation", "Coaching skills", "Business growth"] },
  { label: "CPD points", options: ["Any points", "1–5", "6–15", "16+"] },
  { label: "Delivery", options: ["Any delivery", "Online", "In-person", "Blended"] },
  { label: "Audience", options: ["Any audience", "PTs", "Group instructors", "Online coaches", "S&C"] },
  { label: "Status", options: ["Any status", "Open for enrolment", "Self-paced", "Cohort coming up"] },
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
    q: "How do specialism areas work?",
    a: "REPs shows specialism areas evidenced by recognised qualifications and CPD. We don't award badges for things you haven't proven — your specialism areas appear on your profile when the credential behind them is verified.",
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
        <VerifyStrip />
        <RegisterProofBand />
        <BeforeAfterTeardown />
        <LearningPathways />
        <CpdDiscovery />
        <SpecialistAreas />
        <AiRecommendations />
        <TrainingProvidersBand />
        <FaqBlock />
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
            Education and CPD that strengthens your REPs profile.
          </h1>

          <p
            className="mt-6 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            Track your development, build recognised specialisms and show
            clients the qualifications, standards and professional learning
            behind your work.
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
              className="text-[13.5px] font-medium text-white/70 underline decoration-white/30 underline-offset-4 hover:text-white"
            >
              Training providers
            </a>
          </div>

          <ul
            className="mt-7 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70"
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
              <CardDescription className="text-[13.5px] leading-relaxed text-white/70">
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
          <SectionHeader
            eyebrow="Professional Development Passport"
            heading="Your professional development, connected to your public profile."
            lede="Qualifications, CPD, insurance and specialist development don't belong in a folder on your laptop. On REPs they support the public profile clients see — so the work you put in shows up where it matters."
            className="max-w-none"
          />
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
            <ul className="mt-2 flex flex-col gap-1.5 text-[13px] text-white/80">
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
            <div className="mt-0.5 text-[12px] text-white/55">
              Coach Catalyst · 8 pts · Online · £89
            </div>
          </div>

          {/* Renewal */}
          <div className="flex items-center justify-between rounded-[16px] border border-reps-border bg-reps-ink p-3.5">
            <div className="flex items-center gap-2 text-[12.5px] text-white/70">
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
        <div className="mb-8">
          <SectionHeader
            eyebrow="Your public profile"
            heading="Your education strengthens the profile clients see."
            lede="Every qualification you log, every CPD point you renew and every specialism you evidence shows up as a trust signal on your public REPs profile — the page clients actually land on."
          />
        </div>
        <RegisterProof />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Before / after profile teardown                                     */
/* ------------------------------------------------------------------ */

type TeardownLine = { label: string; value: string; tone: "muted" | "active" };

const TEARDOWN_BEFORE: TeardownLine[] = [
  { label: "Verification", value: "Not verified", tone: "muted" },
  { label: "Qualifications", value: "1 listed · unverified", tone: "muted" },
  { label: "Insurance", value: "Not on file", tone: "muted" },
  { label: "CPD log", value: "Empty", tone: "muted" },
  { label: "Specialism areas", value: "None", tone: "muted" },
  { label: "Client reviews", value: "0 reviews", tone: "muted" },
];

const TEARDOWN_AFTER: TeardownLine[] = [
  { label: "Verification", value: "Verified · ID + insurance + CPD", tone: "active" },
  { label: "Qualifications", value: "3 verified · awarding body checked", tone: "active" },
  { label: "Insurance", value: "Current · renews 14 Apr", tone: "active" },
  { label: "CPD log", value: "32 pts logged · last 12 months", tone: "active" },
  { label: "Specialism areas", value: "Lower-back · Older adults", tone: "active" },
  { label: "Client reviews", value: "11 reviews · 4.9 average", tone: "active" },
];

function BeforeAfterTeardown() {
  return (
    <section className="border-t border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <SectionHeader
          eyebrow="Outcome"
          heading="What a year of CPD does to your REPs profile."
          lede="Side-by-side: the same coach on day one, and after twelve months of logged CPD, verified credentials and specialism evidence. This is the trust signal clients are scanning for."
        />

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TeardownCard
            stateLabel="Day one"
            stateTone="muted"
            name="Alex M."
            tagline="Personal trainer · Online & in-person"
            initials="AM"
            lines={TEARDOWN_BEFORE}
            footer="Public profile reads as 'new and unproven'."
          />
          <TeardownCard
            stateLabel="After 12 months"
            stateTone="active"
            name="Alex M."
            tagline="Personal trainer · Lower-back · Older adults"
            initials="AM"
            lines={TEARDOWN_AFTER}
            footer="Public profile reads as 'verified, current and specialist'."
            highlight
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-reps-border bg-reps-panel px-5 py-4">
          <p className="text-[13px] leading-relaxed text-white/70">
            Illustrative — built from the data points REPs surfaces on every
            public profile. Your real profile updates the moment each
            credential is verified or each CPD entry is logged.
          </p>
          <a
            href="#cpd-discovery"
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-white/15 bg-white/5 px-4 text-[13px] font-semibold text-white shadow-none hover:bg-white/10"
          >
            Start with CPD <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function TeardownCard({
  stateLabel,
  stateTone,
  name,
  tagline,
  initials,
  lines,
  footer,
  highlight,
}: {
  stateLabel: string;
  stateTone: "muted" | "active";
  name: string;
  tagline: string;
  initials: string;
  lines: TeardownLine[];
  footer: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden rounded-[22px] border-reps-border bg-reps-panel shadow-none ${
        highlight ? "border-reps-orange-border" : ""
      }`}
    >
      {highlight ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-6 bg-reps-orange/10 blur-3xl"
        />
      ) : null}

      <div className="relative flex items-center justify-between border-b border-reps-border px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            stateTone === "active"
              ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
              : "border border-white/10 bg-white/5 text-white/55"
          }`}
        >
          {stateTone === "active" ? (
            <Check className="h-3 w-3" strokeWidth={3} />
          ) : (
            <Lock className="h-3 w-3" />
          )}
          {stateLabel}
        </span>
        {stateTone === "active" ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
            Unverified
          </span>
        )}
      </div>

      <div className="relative flex items-center gap-4 px-6 py-5">
        <Avatar className="h-14 w-14 rounded-[14px]">
          <AvatarFallback className="rounded-[14px] bg-reps-ink text-[15px] font-bold text-white/80">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-display text-[18px] font-bold leading-tight text-white">
            {name}
          </div>
          <div className="mt-0.5 text-[12.5px] text-white/55">{tagline}</div>
        </div>
      </div>

      <div className="relative px-6 pb-6">
        <dl className="flex flex-col divide-y divide-reps-border overflow-hidden rounded-[16px] border border-reps-border">
          {lines.map((l) => (
            <div
              key={l.label}
              className="flex items-center justify-between gap-3 bg-reps-ink/40 px-4 py-3"
            >
              <dt className="text-[11.5px] font-semibold uppercase tracking-wider text-white/45">
                {l.label}
              </dt>
              <dd
                className={`text-right text-[13px] font-medium ${
                  l.tone === "active" ? "text-white" : "text-white/55"
                }`}
              >
                {l.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-[12.5px] italic leading-relaxed text-white/55">
          {footer}
        </p>
      </div>
    </Card>
  );
}


/* ------------------------------------------------------------------ */
/* Learning pathways                                                   */
/* ------------------------------------------------------------------ */

function LearningPathways() {
  return (
    <section className="border-t border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <SectionHeader
          eyebrow="Pathways"
          heading="Choose the pathway that matches your next stage."
          lede="From day-one verification to specialist depth, REPs maps the recognised education that fits where you are in your career."
        />

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
                <ul className="flex flex-col gap-1.5 text-[12.5px] text-white/55">
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
          <SectionHeader
            eyebrow="CPD Discovery"
            heading="Find CPD that supports your professional goals."
          />
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
                <span className="text-[10.5px] uppercase tracking-wide text-white/55">
                  {f.label}
                </span>
                <Select disabled defaultValue={f.options[0]}>
                  <SelectTrigger className="h-9 rounded-[8px] border-reps-border bg-reps-ink text-[12.5px] text-white/80">
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
              <span className="text-[10.5px] uppercase tracking-wide text-white/55">
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
              className="group relative flex flex-col overflow-hidden rounded-[18px] border-reps-border bg-reps-panel shadow-none transition hover:border-reps-orange-border"
            >
              {/* Signature accent — top-right orange glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute right-0 top-0 h-32 w-32 bg-reps-orange/10 opacity-60 blur-[60px] transition-opacity group-hover:opacity-100"
              />

              {/* Top chrome */}
              <div className="relative flex items-center justify-between px-5 pb-2 pt-5">
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-400/30 bg-emerald-500/15 text-[10px] font-bold uppercase tracking-wider text-emerald-300"
                >
                  <Check className="mr-1 h-3 w-3" strokeWidth={3} />
                  Verified provider
                </Badge>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                  {c.category}
                </span>
              </div>

              {/* Editorial body */}
              <div className="relative flex-1 px-5 py-4">
                <h3 className="font-display text-[22px] font-bold leading-tight tracking-tight text-white transition-colors group-hover:text-reps-orange">
                  {c.title}
                </h3>
                <p className="mt-1 text-[13.5px] font-medium tracking-wide text-white/55">
                  {c.provider}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-[8px] border border-reps-orange-border bg-reps-orange-soft px-3 py-1.5 text-[12px] font-bold text-reps-orange">
                    {c.points} CPD pts
                  </span>
                  <span className="inline-flex items-center rounded-[8px] border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-white/70">
                    {c.delivery}
                  </span>
                </div>

                <div className="mt-6">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">
                    Who it's for
                  </span>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/70">
                    {c.audience}
                  </p>
                </div>
              </div>

              {/* Sticky meta + CTA */}
              <div className="relative mt-auto">
                <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-5 py-4">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/45">
                      Status
                    </span>
                    <span className="text-[13px] font-medium text-white/80">
                      {c.status}
                    </span>
                  </div>
                  <span className="text-[18px] font-bold tracking-tight text-white">
                    {c.price}
                  </span>
                </div>
                <div className="p-5 pt-3">
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed rounded-[10px] border border-white/10 bg-white/5 py-3 text-[13px] font-bold text-white/80 shadow-none transition-all"
                  >
                    View course
                  </button>
                </div>
              </div>
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
        <SectionHeader
          eyebrow="Specialism areas"
          heading="Build visibility around your specialist areas."
          lede="Specialism areas are evidenced through recognised qualifications and CPD — REPs doesn't hand out badges for things you haven't proven. When you complete the right credentials, your profile reflects them."
        />

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

type Recommendation = {
  rank: number;
  title: string;
  provider: string;
  points: number;
  delivery: string;
  reasons: string[];
  impact: string;
  status: string;
};

const FOCUS_OPTIONS = [
  { value: "back-pain", label: "Lower back pain" },
  { value: "prenatal", label: "Pre/Postnatal" },
  { value: "older-adults", label: "Older adults" },
  { value: "online", label: "Online coaching" },
  { value: "strength", label: "Strength & Conditioning" },
] as const;

const STAGE_OPTIONS = [
  { value: "new", label: "Newly qualified" },
  { value: "mid", label: "2–5 years" },
  { value: "senior", label: "5+ years" },
] as const;

const RECS_BY_FOCUS: Record<string, Recommendation[]> = {
  "back-pain": [
    {
      rank: 1,
      title: "Coaching Lower Back Pain",
      provider: "Movement Mechanics",
      points: 16,
      delivery: "Blended",
      reasons: ["Matches your focus", "Specialism unlock", "Cohort starts 14 Apr"],
      impact: "Adds Lower-back specialism area · lifts profile trust signals",
      status: "Cohort starts 14 Apr",
    },
    {
      rank: 2,
      title: "Behaviour Change in Practice",
      provider: "Coach Catalyst",
      points: 8,
      delivery: "Online",
      reasons: ["Improves retention", "Pairs with rehab work", "Self-paced"],
      impact: "Strengthens 'How I coach' signal on your public profile",
      status: "Self-paced · open now",
    },
    {
      rank: 3,
      title: "Online Coaching Operations",
      provider: "REPs Academy",
      points: 6,
      delivery: "Online",
      reasons: ["Reach more rehab clients", "Light load", "Open now"],
      impact: "Opens online-coaching tag on your shop-front",
      status: "Self-paced · open now",
    },
  ],
  prenatal: [
    {
      rank: 1,
      title: "Pre & Postnatal Foundations",
      provider: "Holistic Core Restore",
      points: 12,
      delivery: "Online",
      reasons: ["Matches your focus", "Specialism unlock", "Open now"],
      impact: "Adds Pre/Postnatal specialism area to your profile",
      status: "Self-paced · open now",
    },
    {
      rank: 2,
      title: "Behaviour Change in Practice",
      provider: "Coach Catalyst",
      points: 8,
      delivery: "Online",
      reasons: ["Critical for adherence", "Low time cost", "Self-paced"],
      impact: "Strengthens client-retention signal",
      status: "Self-paced · open now",
    },
    {
      rank: 3,
      title: "Online Coaching Operations",
      provider: "REPs Academy",
      points: 6,
      delivery: "Online",
      reasons: ["Most clients want online", "Quick to complete", "Open now"],
      impact: "Opens online-coaching tag on your shop-front",
      status: "Self-paced · open now",
    },
  ],
  "older-adults": [
    {
      rank: 1,
      title: "Older Adults Specialism",
      provider: "Functional Ageing Institute",
      points: 14,
      delivery: "Blended",
      reasons: ["Matches your focus", "Specialism unlock", "Cohort starts 21 Apr"],
      impact: "Adds Older-adults specialism area · profile trust lifts",
      status: "Cohort starts 21 Apr",
    },
    {
      rank: 2,
      title: "Coaching Lower Back Pain",
      provider: "Movement Mechanics",
      points: 16,
      delivery: "Blended",
      reasons: ["High overlap with 55+ clients", "Awarded specialism", "Cohort soon"],
      impact: "Stacks with Older-adults for stronger trust signal",
      status: "Cohort starts 14 Apr",
    },
    {
      rank: 3,
      title: "Behaviour Change in Practice",
      provider: "Coach Catalyst",
      points: 8,
      delivery: "Online",
      reasons: ["Drives long-term adherence", "Self-paced", "Low cost"],
      impact: "Strengthens retention signal on profile",
      status: "Self-paced · open now",
    },
  ],
  online: [
    {
      rank: 1,
      title: "Online Coaching Operations",
      provider: "REPs Academy",
      points: 6,
      delivery: "Online",
      reasons: ["Matches your focus", "Quick win", "Open now"],
      impact: "Opens online-coaching tag on your shop-front",
      status: "Self-paced · open now",
    },
    {
      rank: 2,
      title: "Behaviour Change in Practice",
      provider: "Coach Catalyst",
      points: 8,
      delivery: "Online",
      reasons: ["Critical for remote adherence", "Self-paced", "Low cost"],
      impact: "Strengthens online-coaching trust signal",
      status: "Self-paced · open now",
    },
    {
      rank: 3,
      title: "Strength & Conditioning for Coaches",
      provider: "S&C Education",
      points: 20,
      delivery: "In-person",
      reasons: ["Differentiates your online offer", "Specialism unlock", "Cohort starts soon"],
      impact: "Adds S&C credibility to remote programming",
      status: "Cohort starts 06 May",
    },
  ],
  strength: [
    {
      rank: 1,
      title: "Strength & Conditioning for Coaches",
      provider: "S&C Education",
      points: 20,
      delivery: "In-person",
      reasons: ["Matches your focus", "Specialism unlock", "Cohort starts 06 May"],
      impact: "Adds S&C specialism area · qualifies you for sport clients",
      status: "Cohort starts 06 May",
    },
    {
      rank: 2,
      title: "Coaching Lower Back Pain",
      provider: "Movement Mechanics",
      points: 16,
      delivery: "Blended",
      reasons: ["Common in lifters", "Awarded specialism", "Cohort soon"],
      impact: "Stacks with S&C for stronger trust signal",
      status: "Cohort starts 14 Apr",
    },
    {
      rank: 3,
      title: "Behaviour Change in Practice",
      provider: "Coach Catalyst",
      points: 8,
      delivery: "Online",
      reasons: ["Programme adherence", "Self-paced", "Low cost"],
      impact: "Strengthens retention signal",
      status: "Self-paced · open now",
    },
  ],
};

function AiRecommendations() {
  const [focus, setFocus] = useState<string>("back-pain");
  const [stage, setStage] = useState<string>("mid");
  const [revealedFocus, setRevealedFocus] = useState<string>("back-pain");
  const [revealedStage, setRevealedStage] = useState<string>("mid");
  const [showResults, setShowResults] = useState<boolean>(true);

  const recs = RECS_BY_FOCUS[revealedFocus] ?? RECS_BY_FOCUS["back-pain"];
  const dirty = focus !== revealedFocus || stage !== revealedStage;

  const handleGenerate = () => {
    setRevealedFocus(focus);
    setRevealedStage(stage);
    setShowResults(true);
  };

  return (
    <section className="border-t border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <SectionHeader
          eyebrow="AI · Preview · Phase 1"
          heading="Know what to learn next."
          lede="Pick a focus and your experience stage. REPs returns three ranked CPD picks, each with reasoning and the impact on your public profile. Personalised on your real data once your CPD log is live."
        />

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Input panel */}
          <Card className="relative overflow-hidden rounded-[22px] border-reps-border bg-reps-panel shadow-none">
            <div aria-hidden className="pointer-events-none absolute -inset-4 bg-reps-orange/10 opacity-50 blur-3xl" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-reps-orange" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                    Your inputs
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-reps-orange-border bg-reps-orange-soft text-[10px] font-bold uppercase tracking-wider text-reps-orange"
                >
                  Preview
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative flex flex-col gap-5">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">
                  Your focus area
                </span>
                <ToggleGroup
                  type="single"
                  value={focus}
                  onValueChange={(v) => v && setFocus(v)}
                  className="mt-2 flex flex-wrap justify-start gap-1.5"
                >
                  {FOCUS_OPTIONS.map((o) => (
                    <ToggleGroupItem
                      key={o.value}
                      value={o.value}
                      className="h-8 rounded-full border border-white/10 bg-white/5 px-3 text-[12px] font-semibold text-white/70 hover:bg-white/10 hover:text-white data-[state=on]:border-reps-orange-border data-[state=on]:bg-reps-orange-soft data-[state=on]:text-reps-orange"
                    >
                      {o.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">
                  Experience stage
                </span>
                <ToggleGroup
                  type="single"
                  value={stage}
                  onValueChange={(v) => v && setStage(v)}
                  className="mt-2 flex flex-wrap justify-start gap-1.5"
                >
                  {STAGE_OPTIONS.map((o) => (
                    <ToggleGroupItem
                      key={o.value}
                      value={o.value}
                      className="h-8 rounded-full border border-white/10 bg-white/5 px-3 text-[12px] font-semibold text-white/70 hover:bg-white/10 hover:text-white data-[state=on]:border-reps-orange-border data-[state=on]:bg-reps-orange-soft data-[state=on]:text-reps-orange"
                    >
                      {o.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!dirty && showResults}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[13.5px] font-bold text-white shadow-none transition hover:bg-reps-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {dirty ? "Show recommendations" : "Recommendations ready"}
              </button>

              <p className="text-[11.5px] leading-relaxed text-white/55">
                Static preview — recommendations are illustrative and ranked by
                a deterministic rule set, not a model.
              </p>
            </CardContent>
          </Card>

          {/* Results panel */}
          <div key={revealedFocus} className="flex flex-col gap-3 animate-fade-in">
            {recs.map((r) => (
              <RecCard key={r.rank} rec={r} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RecCard({ rec }: { rec: Recommendation }) {
  return (
    <Card className="group relative overflow-hidden rounded-[18px] border-reps-border bg-reps-panel shadow-none transition hover:border-reps-orange-border">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-24 w-24 bg-reps-orange/10 opacity-60 blur-[60px] transition-opacity group-hover:opacity-100"
      />
      <div className="relative grid grid-cols-[auto_1fr] gap-4 p-5">
        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-[10px] border border-reps-orange-border bg-reps-orange-soft text-reps-orange">
          <span className="text-[10px] font-bold uppercase tracking-wider">Rank</span>
          <span className="text-[15px] font-bold leading-none">#{rec.rank}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h3 className="font-display text-[16px] font-bold leading-tight text-white">
              {rec.title}
            </h3>
            <span className="text-[12px] font-medium text-white/55">{rec.provider}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-[8px] border border-reps-orange-border bg-reps-orange-soft px-2.5 py-1 text-[11px] font-bold text-reps-orange">
              {rec.points} CPD pts
            </span>
            <span className="inline-flex items-center rounded-[8px] border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70">
              {rec.delivery}
            </span>
            <span className="inline-flex items-center rounded-[8px] border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70">
              {rec.status}
            </span>
          </div>

          <div className="mt-4 border-t border-reps-border pt-3">
            <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">
              Why this matches
            </span>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {rec.reasons.map((r) => (
                <li
                  key={r}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-white/70"
                >
                  <Check className="h-3 w-3 text-reps-orange" strokeWidth={3} />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-white/80">
            <TrendingUp className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-reps-orange" />
            <span>
              <span className="font-semibold text-white/70">Profile impact · </span>
              {rec.impact}
            </span>
          </div>
        </div>
      </div>
    </Card>
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
          <SectionHeader
            eyebrow="Training providers"
            heading="Training providers will have a stronger place inside REPs."
            lede="REPs is being developed to give training providers clearer visibility, stronger provider profiles and a better route to present qualifications, CPD and professional education to the fitness industry."
            className="max-w-none"
          />
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
            <ul className="flex flex-col gap-3 text-[14px] text-white/80">
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
    <MarketingFaq
      heading="Questions, answered honestly."
      items={FAQS}
    />
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
      <div className="relative mx-auto max-w-[920px] px-6 py-20 text-center lg:px-10 lg:py-28">
        <h2 className="font-display text-[30px] font-bold leading-tight text-white lg:text-[44px]">
          Build your profile. Prove your standards.{" "}
          <span className="text-reps-orange">Grow your career.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/70">
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
/* Verified training providers — empty-state slot for paying providers */
/* ------------------------------------------------------------------ */

function RecognitionStrip() {
  return (
    <section className="border-t border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <SectionHeader
          eyebrow="Verified training providers"
          heading="Training providers, listed when they're verified by REPs."
          lede="Verified training providers appear here once they've completed REPs verification — accrediting body checked, tutors named, refund and complaints policies published. We only list providers who meet the bar."
        />

        <Card className="mt-10 rounded-[18px] border-reps-border bg-reps-panel shadow-none">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-white">
                  First verified providers coming soon.
                </div>
                <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-white/70">
                  REPs is onboarding the first cohort of verified training
                  providers. Once verified, their courses, CPD points and
                  awarding body appear here — and feed automatically into
                  member profiles.
                </p>
              </div>
            </div>
            <Link
              to="/contact"
              className="inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[13.5px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Apply to become a verified provider{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
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
    <VerifySteps
      eyebrow="How REPs verifies"
      heading="Three checks — every profile, every renewal."
      steps={VERIFY}
      bannerText="The result: a single Verified badge the public can actually trust."
    />
  );
}

