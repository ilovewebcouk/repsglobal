import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Apple,
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  Brain,
  CalendarCheck,
  ChartLine,
  Check,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  FileText,
  Flag,
  Gauge,
  HeartPulse,
  Layers,
  LineChart,
  MessageSquare,
  NotebookPen,
  Salad,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Users,
  UtensilsCrossed,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { BlockHeading } from "@/components/marketing/BlockHeading";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { TierCard } from "@/components/marketing/TierCard";
import { HeroOverlay } from "@/components/marketing/HeroOverlay";

import heroCoaching from "@/assets/hero-coaching-bg.jpg.asset.json";
import exerciseLib from "@/data/exercise-library.sample.json";

// =============================================================================
// Route
// =============================================================================

export const Route = createFileRoute("/features/coaching")({
  head: () => ({
    meta: [
      { title: "Coaching delivery — One connected platform · REPs" },
      {
        name: "description",
        content:
          "Programmes, meal plans, check-ins, progress tracking and a client portal — REPs is the coaching delivery layer that lives on the same client record as your profile and Shop Front.",
      },
      { property: "og:title", content: "Coaching — One connected platform · REPs" },
      {
        property: "og:description",
        content:
          "Deliver training, nutrition and check-ins from one workspace. Built for professional coaches.",
      },
      { property: "og:image", content: heroCoaching.url },
      {
        property: "og:url",
        content: "https://repsglobal.lovable.app/features/coaching",
      },
    ],
    links: [
      { rel: "canonical", href: "https://repsglobal.lovable.app/features/coaching" },
    ],
  }),
  component: CoachingPage,
});

// =============================================================================
// Data
// =============================================================================

const SARAH = {
  name: "Sarah K.",
  brief: "12-week fat-loss client · 3×/week · 145g protein target",
} as const;

const WORKFLOW_STAGES: { icon: LucideIcon; label: string; features: string[] }[] = [
  { icon: ClipboardList, label: "Assess", features: ["Onboarding", "PAR-Q", "Goals"] },
  { icon: Dumbbell, label: "Plan", features: ["Programme builder", "Meal builder"] },
  { icon: Smartphone, label: "Deliver", features: ["Client portal", "Sessions"] },
  { icon: CalendarCheck, label: "Check in", features: ["Weekly check-ins", "Forms"] },
  { icon: LineChart, label: "Track", features: ["Adherence", "Progress trends"] },
  { icon: Sparkles, label: "Adjust", features: ["Coach notes", "AI next actions"] },
  { icon: HeartPulse, label: "Retain", features: ["Reviews", "Renewals"] },
];

const SCATTERED_TOOLS = [
  { label: "WhatsApp threads", note: "Check-ins, photos, last-minute changes" },
  { label: "PDF meal plans", note: "Out of date the day you send them" },
  { label: "Notes app", note: "Coach memory for every client, somewhere" },
  { label: "Camera roll", note: "Progress photos, never compared side-by-side" },
  { label: "Spreadsheet", note: "Adherence tracking that nobody updates" },
];

const PORTAL_CALLOUTS = [
  { title: "Today's session", body: "Warm-up, working sets, finisher — with cues and videos." },
  { title: "Weekly programme", body: "Three sessions, current phase, what's coming next." },
  { title: "Meal plan + swaps", body: "Today's meals with one-tap swaps inside the trainer's rules." },
  { title: "Check-in", body: "Weekly form with weight, sleep, energy, adherence and photos." },
  { title: "Coach feedback", body: "Voice notes and replies attached to the client record." },
  { title: "Next steps", body: "Tasks the coach assigned — clear, dated, single click." },
];

const CHECKIN_FIELDS = [
  { label: "Training adherence", value: "11 / 12 sessions", positive: true },
  { label: "Meal-plan adherence", value: "82% on plan", positive: true },
  { label: "Mood / energy / sleep", value: "7 · 8 · 6", positive: true },
  { label: "Bodyweight", value: "74.6 kg", trend: "−0.4 this week" },
  { label: "Waist", value: "82 cm", trend: "−1.2 cm in 4 wks" },
  { label: "Habits", value: "5 / 7 hit", positive: true },
];

const AI_ASSISTS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: UtensilsCrossed, title: "Draft meal plans", body: "From the client's intake, goals, allergies and schedule." },
  { icon: Apple, title: "Suggest swaps", body: "Within the macros and dietary rules you set." },
  { icon: NotebookPen, title: "Summarise check-ins", body: "Weekly digest of what's trending up and down." },
  { icon: Flag, title: "Flag clients needing attention", body: "Adherence drops, missed check-ins, plateau weeks." },
  { icon: Activity, title: "Spot adherence patterns", body: "Sessions usually missed, meals usually skipped." },
  { icon: MessageSquare, title: "Draft coach feedback", body: "Starting points you edit — never sent without you." },
  { icon: Target, title: "Suggest review points", body: "Programme phase end, plateau, deload triggers." },
  { icon: ListIcon, title: "Turn notes into next actions", body: "Free-text becomes a checklist on the client record." },
];

// Lucide doesn't export "ListIcon" by alias here — re-use ClipboardList for that slot at render time.

const TEMPLATES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Dumbbell, title: "Programme templates", body: "Reusable training plans by goal and level." },
  { icon: Layers, title: "Exercise templates", body: "Your default cues, tempo, rest by movement." },
  { icon: Salad, title: "Meal plan templates", body: "Fat loss, muscle gain, vegetarian, busy-pro variants." },
  { icon: CalendarCheck, title: "Check-in templates", body: "Standard weekly form, plus deload + plateau variants." },
  { icon: ClipboardList, title: "Onboarding templates", body: "Intake questions tuned per service or specialism." },
  { icon: Gauge, title: "Assessment templates", body: "Movement screen, baselines and re-test cadence." },
  { icon: MessageSquare, title: "Feedback templates", body: "Frequent messages — written once, personalised per send." },
  { icon: Workflow, title: "Coaching workflows", body: "Run every client through the same standard." },
];

const USE_CASES = [
  { title: "Personal trainers", body: "Build programmes, assign meals, track progress and keep notes together." },
  { title: "Online coaches", body: "Deliver programmes, meal plans, check-ins and client feedback remotely." },
  { title: "Strength coaches", body: "Track lifts, training phases, exercise progressions and athlete feedback." },
  { title: "Transformation coaches", body: "Manage training, nutrition support, measurements, habits and weekly accountability." },
  { title: "Small group coaches", body: "Deliver structured programming while still tracking individual progress." },
  { title: "Studio teams", body: "Keep coaching standards consistent across multiple coaches and clients." },
];

const SAFETY_NOT_REPLACEMENT = [
  "Medical diagnosis or treatment",
  "Registered nutrition advice for diagnosed conditions",
  "Eating disorder care or therapy",
  "Clinical exercise rehab without an appropriately qualified practitioner",
];

const SAFETY_SAFEGUARDS = [
  "Allergies and food exclusions captured on intake",
  "Medical flags surfaced on the client record",
  "Eating-disorder history prompts referral guidance",
  "Pregnancy and post-natal flagged with scope reminders",
  "Diabetes and other diagnosed conditions trigger a sign-off step",
  "Every meal plan requires explicit trainer approval before the client sees it",
];

const FAQ_ITEMS = [
  {
    q: "Does REPs replace Trainerize, My PT Hub or PT Distinction?",
    a: "For most coaches, yes. REPs covers programmes, exercise library, meal planning, check-ins, progress tracking and a client portal — and ties them to the same client record as your public profile and Shop Front. The difference is the connection: training, nutrition and check-ins live on one client record, not three.",
  },
  {
    q: "Can I bring my own exercises?",
    a: "Yes. The library is deep out of the box, and every coach can add their own exercises, cues, videos and alternatives. Custom exercises behave like first-class library items — searchable, taggable and reusable across programmes.",
  },
  {
    q: "How does the AI meal-plan workflow work?",
    a: "AI drafts a meal plan from the client's intake, goal, allergies, preferences, schedule and cooking ability. You edit anything you want. Nothing reaches the client until you explicitly approve it. AI drafts, the trainer reviews, the trainer approves.",
  },
  {
    q: "What does the client see vs what stays internal?",
    a: "The client portal shows today's session, weekly programme, current meal plan, check-in form, coach feedback and next steps. Coach notes, internal flags, the client record timeline and unreleased plans stay private to you.",
  },
  {
    q: "Do I need Pro for nutrition?",
    a: "Yes. Meal planning, AI-assisted drafts, the client portal and check-in workflows sit on the Pro tier. Verified is for professionals who want a trusted REPs profile, reviews and visibility without the coaching delivery layer.",
  },
  {
    q: "Is this medical nutrition advice?",
    a: "No. REPs supports fitness coaching workflows. It is not a replacement for medical diagnosis, treatment, or registered nutrition advice for diagnosed conditions. The platform prompts referral to suitably qualified professionals where appropriate.",
  },
];

// =============================================================================
// Component tree
// =============================================================================

function CoachingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <Hero />
      <ProblemSection />
      <WorkflowSection />
      <ProgrammeSection />
      <NutritionSection />
      <PortalSection />
      <CheckinsSection />
      <ProgressSection />
      <NotesSection />
      <AISection />
      <TemplatesSection />
      <TierMatrixSection />
      <UseCasesSection />
      <SafetySection />

      <MarketingFaq
        eyebrow="Common questions"
        heading="What Coaching covers, and how it fits."
        items={FAQ_ITEMS}
      />

      <FinalCta
        heading="Deliver coaching clients can follow,"
        headingAccent="track and stay engaged with."
        lede="Use REPs Pro to build programmes, create meal plans, manage check-ins, track progress and support every client from one connected coaching workspace."
        primary={{ to: "/signup", label: "Start using REPs Pro" }}
        secondary={{ to: "/for-professionals", label: "Explore all features" }}
      />

      <PublicFooter />
    </div>
  );
}

// =============================================================================
// 1. Hero
// =============================================================================

function Hero() {
  return (
    <section className="relative flex min-h-[640px] overflow-hidden lg:min-h-[780px]">
      <img
        src={heroCoaching.url}
        alt="REPs-verified coach reviewing a client's training and nutrition plan on a tablet at a premium gym"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover object-center lg:object-right"
      />
      <HeroOverlay copySide="left" />

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col justify-start px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-24">
        <div className="max-w-[680px]">
          <MarketingHeroEyebrow
            icon={Workflow}
            style={{ animationDuration: "560ms", animationFillMode: "both" }}
          >
            Coaching · Your client delivery layer
          </MarketingHeroEyebrow>

          <h1
            className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[60px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            Deliver better coaching{" "}
            <span className="text-reps-orange">from one connected platform.</span>
          </h1>

          <p
            className="mt-6 max-w-[620px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            Build programmes, create meal plans, manage check-ins, track progress and support every
            client from the same workspace that powers your REPs profile, Shop Front and business
            operations.
          </p>

          <div
            className="mt-8 flex animate-fade-in flex-wrap gap-3"
            style={{ animationDuration: "640ms", animationDelay: "260ms", animationFillMode: "both" }}
          >
            <Link
              to="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Start using REPs Pro <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#workflow"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              Explore coaching tools
            </a>
          </div>

          <ul
            className="mt-7 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70"
            style={{ animationDuration: "640ms", animationDelay: "340ms", animationFillMode: "both" }}
          >
            <li className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-reps-orange" /> Used by Pro-tier coaches
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Workflow className="h-4 w-4 text-reps-orange" /> Training · nutrition · check-ins
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-reps-orange" /> One client record
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 2. Problem
// =============================================================================

function ProblemSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The reality of delivery"
          heading="Most coaches don't struggle for knowledge. They struggle because delivery is fragmented."
          lede="Programmes live in one app. Meal plans sit in PDFs. Check-ins arrive through WhatsApp. Progress photos are in camera rolls. Client notes are buried in messages. Accountability depends on memory."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          {/* Scattered */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <X className="h-3 w-3" /> Coaching, scattered
            </span>
            <BlockHeading className="mt-4">Five tools. One overwhelmed coach.</BlockHeading>
            <ul className="mt-6 space-y-2.5">
              {SCATTERED_TOOLS.map((tool) => (
                <li
                  key={tool.label}
                  className="flex items-start gap-3 rounded-[16px] border border-reps-border/70 bg-reps-ink/60 px-4 py-3"
                >
                  <X className="mt-1 h-4 w-4 shrink-0 text-white/35" />
                  <div>
                    <p className="text-[14px] font-semibold text-white/80">{tool.label}</p>
                    <p className="mt-0.5 text-[13px] text-white/55">{tool.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pull-line */}
          <div className="flex flex-col justify-between gap-6 rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
              <Check className="h-3 w-3" /> Coaching, connected
            </span>
            <p className="font-display text-[24px] font-bold leading-[1.2] text-white lg:text-[30px]">
              Your coaching should not depend on scattered messages, screenshots and five different
              tools.
            </p>
            <p className="text-[14.5px] leading-relaxed text-white/70">
              REPs Pro is the workspace where training, nutrition, check-ins, progress and client
              engagement live on the same client record — so the next coaching decision is never
              more than one screen away.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 3. Workflow
// =============================================================================

function WorkflowSection() {
  return (
    <section id="workflow" className="scroll-mt-24 border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="One connected workflow"
          heading="Assess. Plan. Deliver. Check in. Track. Adjust. Retain."
          lede="The same client moves through every stage on the same record. Each stage is a feature in this page — the rest of it is a tour of what each step looks like inside REPs."
        />

        <div className="mt-12 overflow-x-auto">
          <ol className="grid min-w-[760px] grid-cols-7 gap-3 lg:gap-4">
            {WORKFLOW_STAGES.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <li
                  key={stage.label}
                  className="relative rounded-[16px] border border-reps-border bg-reps-ink/60 p-4"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Step {i + 1}
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-white">{stage.label}</p>
                  <ul className="mt-3 space-y-1 text-[12.5px] text-white/65">
                    {stage.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-reps-orange" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="mt-8 max-w-[640px] text-[14px] text-white/55">
          Scroll to follow {SARAH.name} — a {SARAH.brief.toLowerCase()} — through programmes, meal
          plans, check-ins, progress tracking and adjustment.
        </p>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Sarah ribbon — used above each section that walks through her record
// -----------------------------------------------------------------------------

function SarahRibbon() {
  return (
    <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-reps-border bg-reps-panel/60 px-4 py-2 text-[12.5px] text-white/70">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-reps-orange-soft text-[11px] font-bold text-reps-orange">
        SK
      </span>
      Following <span className="font-semibold text-white">{SARAH.name}</span>
      <span className="hidden text-white/45 sm:inline">· {SARAH.brief}</span>
    </div>
  );
}

// =============================================================================
// 4. Programme delivery + exercise library
// =============================================================================

function ProgrammeSection() {
  const featured = exerciseLib.exercises.slice(0, 6);
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SarahRibbon />
        <SectionHeader
          eyebrow="Programme delivery"
          heading="Build training programmes clients can actually follow."
          lede="Use a structured exercise library to build clear training plans, assign sessions, add coaching notes and adapt exercises around each client's goals, equipment and ability."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          {/* Programme builder mock */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Programme · Sarah K. · Week 6 of 12
                </p>
                <p className="mt-1 text-[15px] font-semibold text-white">Lower Body — Session B</p>
              </div>
              <span className="rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
                Phase 2
              </span>
            </div>

            <ol className="mt-5 space-y-3">
              {[
                { name: "Barbell Back Squat", scheme: "4 × 6 @ RPE 7", rest: "180s" },
                { name: "Romanian Deadlift", scheme: "3 × 8", rest: "120s" },
                { name: "Bulgarian Split Squat", scheme: "3 × 10 ea.", rest: "90s" },
                { name: "Leg Curl", scheme: "3 × 12", rest: "75s" },
                { name: "Standing Calf Raise", scheme: "3 × 15", rest: "60s" },
              ].map((row, i) => (
                <li
                  key={row.name}
                  className="flex items-center justify-between rounded-[16px] border border-reps-border bg-reps-ink/70 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-bold text-reps-orange">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold text-white">{row.name}</p>
                      <p className="text-[12.5px] text-white/55">{row.scheme} · rest {row.rest}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-[8px] border border-white/15 px-2.5 py-1 text-[11.5px] font-semibold text-white/65 hover:bg-white/5"
                  >
                    Swap
                  </button>
                </li>
              ))}
            </ol>

            <div className="mt-5 rounded-[16px] border border-reps-orange-border/60 bg-reps-orange-soft/30 px-4 py-3">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
                Coach note
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-white/80">
                Hold RPE 7 — last week's RIR was honest. If bar speed dips on set 3, drop the last
                set rather than the weight.
              </p>
            </div>
          </div>

          {/* Exercise library mock */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px] font-semibold text-white">Exercise library</p>
              <span className="text-[12px] text-white/45">
                {exerciseLib.exercises.length} exercises · 8 equipment types
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {["All", "Quads", "Hamstrings", "Glutes", "Back", "Chest", "Core"].map((m, i) => (
                <button
                  key={m}
                  type="button"
                  className={
                    i === 0
                      ? "rounded-full bg-reps-orange px-3 py-1 text-[12px] font-semibold text-white"
                      : "rounded-full border border-reps-border bg-reps-ink/60 px-3 py-1 text-[12px] font-semibold text-white/65 hover:bg-white/5"
                  }
                >
                  {m}
                </button>
              ))}
            </div>

            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {featured.map((ex) => (
                <li
                  key={ex.id}
                  className="rounded-[16px] border border-reps-border bg-reps-ink/70 p-3"
                >
                  <div className="flex h-20 w-full items-center justify-center rounded-[10px] bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
                    <Dumbbell className="h-5 w-5 text-white/30" />
                  </div>
                  <p className="mt-2.5 text-[13.5px] font-semibold text-white">{ex.name}</p>
                  <p className="mt-0.5 text-[11.5px] text-white/55">
                    {ex.muscle} · {ex.equipment} · {ex.level}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between rounded-[16px] border border-dashed border-reps-orange-border/70 bg-reps-orange-soft/20 px-4 py-3">
              <p className="text-[13.5px] text-white/80">
                <span className="font-semibold text-reps-orange">+ Add custom exercise</span> —
                your library, your cues, your videos.
              </p>
              <ArrowRight className="h-4 w-4 text-reps-orange" />
            </div>
          </div>
        </div>

        <p className="mt-10 max-w-[760px] text-[14.5px] leading-relaxed text-white/65">
          A deep exercise library you can extend — every coach can add their own exercises, cues,
          videos and alternatives. Custom exercises behave like first-class library items,
          searchable and reusable across every programme.
        </p>
      </div>
    </section>
  );
}

// =============================================================================
// 5. Meal planning + nutrition support
// =============================================================================

function NutritionSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SarahRibbon />
        <SectionHeader
          eyebrow="Meal planning + nutrition support"
          heading="Meal planning, built into coaching — not bolted on."
          lede="Create meal plans manually, use saved templates, or generate AI-assisted drafts based on the client's goals, intake answers, preferences and dietary requirements. You review and approve the final plan before it reaches the client."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          <MealModeCard
            badge="Manual"
            icon={UtensilsCrossed}
            title="Manual builder"
            body="Build the plan yourself from the REPs meal library or your own custom meals. Full control, full ownership."
            list={["Drag meals into the day", "Live macro totals", "Save as a personal template"]}
          />
          <MealModeCard
            badge="Templates"
            icon={Layers}
            title="Templates"
            body="Reusable plan structures for common goals — fat loss, muscle gain, high-protein, vegetarian, low-prep, busy professional."
            list={["Clone and personalise in seconds", "Tag by goal and dietary style", "Studio-wide template library"]}
          />
          <MealModeCard
            badge="AI draft"
            icon={Sparkles}
            title="AI-assisted draft"
            body="AI drafts a plan from intake, goal, food preferences, allergies, schedule and cooking ability. You edit and approve."
            list={["Draft in under 30 seconds", "Respects allergies and exclusions", "Always opens in edit mode"]}
            highlighted
          />
        </div>

        <div className="mt-10 rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
          <p className="font-display text-[22px] font-bold leading-[1.2] text-white lg:text-[26px]">
            "AI should speed up meal planning, not replace professional judgement."
          </p>
          <ApprovalStrip />
        </div>
      </div>
    </section>
  );
}

function MealModeCard({
  badge,
  icon: Icon,
  title,
  body,
  list,
  highlighted,
}: {
  badge: string;
  icon: LucideIcon;
  title: string;
  body: string;
  list: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] p-6 ${
        highlighted
          ? "border border-reps-orange-border bg-reps-panel/70"
          : "border border-reps-border bg-reps-panel/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={
            highlighted
              ? "rounded-full bg-reps-orange px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
              : "rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange"
          }
        >
          {badge}
        </span>
        <Icon className="h-5 w-5 text-reps-orange" />
      </div>
      <p className="mt-4 text-[18px] font-semibold text-white">{title}</p>
      <p className="mt-2 text-[14px] leading-relaxed text-white/70">{body}</p>
      <ul className="mt-5 space-y-2">
        {list.map((line) => (
          <li key={line} className="flex items-start gap-2 text-[13px] text-white/70">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ApprovalStrip() {
  const steps = [
    { label: "Client intake", icon: ClipboardList },
    { label: "AI draft", icon: Sparkles },
    { label: "Trainer edits", icon: NotebookPen },
    { label: "Trainer approves", icon: CheckCircle2, status: true as const },
    { label: "Client sees plan", icon: Smartphone },
  ];
  return (
    <ol className="mt-6 flex flex-wrap items-center gap-2">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isApprove = s.status;
        return (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className={
                isApprove
                  ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-[12.5px] font-semibold text-emerald-300"
                  : "inline-flex items-center gap-1.5 rounded-full border border-reps-border bg-reps-ink/70 px-3 py-1.5 text-[12.5px] font-medium text-white/70"
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </span>
            {i < steps.length - 1 ? <ArrowRight className="h-3.5 w-3.5 text-white/30" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

// =============================================================================
// 6. Client portal
// =============================================================================

function PortalSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Client portal"
          heading="Give clients one clear place to know what to do next."
          lede="Clients stay more engaged when their training, nutrition and check-ins are not scattered across messages and PDFs. The portal is what the work feels like, from their side."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* Phone mock */}
          <div className="mx-auto w-full max-w-[340px] rounded-[24px] border border-reps-border bg-reps-panel/60 p-4 lg:max-w-[360px]">
            <div className="rounded-[18px] border border-reps-border bg-reps-ink/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Wednesday · Week 6
                  </p>
                  <p className="mt-1 text-[16px] font-semibold text-white">Hi Sarah</p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-bold text-reps-orange">
                  SK
                </span>
              </div>

              <div className="mt-4 rounded-[16px] border border-reps-orange-border bg-reps-orange-soft/30 p-4">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
                  Today's session
                </p>
                <p className="mt-1.5 text-[15px] font-semibold text-white">Lower Body — Session B</p>
                <p className="mt-0.5 text-[12.5px] text-white/55">5 exercises · ~55 min</p>
                <button
                  type="button"
                  className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white"
                >
                  Start session
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <PortalTile icon={Salad} label="Today's meals" sub="1,940 kcal · 145P" />
                <PortalTile icon={CalendarCheck} label="Check-in" sub="Due Sunday" />
                <PortalTile icon={MessageSquare} label="Coach" sub="2 new replies" />
                <PortalTile icon={ChartLine} label="Progress" sub="−2.1 kg in 6 wks" />
              </div>

              <div className="mt-3 rounded-[14px] border border-reps-border bg-reps-panel/60 p-3">
                <p className="text-[12px] font-semibold text-white/80">Next step</p>
                <p className="mt-0.5 text-[12px] text-white/55">
                  Log Wednesday session by 9pm — coach will review Thursday.
                </p>
              </div>
            </div>
          </div>

          {/* Callouts list */}
          <ol className="space-y-3 self-center">
            {PORTAL_CALLOUTS.map((c, i) => (
              <li
                key={c.title}
                className="flex items-start gap-3 rounded-[16px] border border-reps-border bg-reps-panel/40 p-4"
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-bold text-reps-orange">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[14.5px] font-semibold text-white">{c.title}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-white/70">{c.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function PortalTile({ icon: Icon, label, sub }: { icon: LucideIcon; label: string; sub: string }) {
  return (
    <div className="rounded-[14px] border border-reps-border bg-reps-panel/60 p-3">
      <Icon className="h-4 w-4 text-reps-orange" />
      <p className="mt-2 text-[12.5px] font-semibold text-white">{label}</p>
      <p className="mt-0.5 text-[11px] text-white/55">{sub}</p>
    </div>
  );
}

// =============================================================================
// 7. Check-ins
// =============================================================================

function CheckinsSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SarahRibbon />
        <SectionHeader
          eyebrow="Check-ins + accountability"
          heading="Turn coaching into a feedback loop."
          lede="Weekly check-ins pull training adherence, meal adherence, mood, sleep, weight, measurements, photos and habits into one review screen — with space for your notes and next actions."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* Check-in review mock */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Weekly check-in · Sarah K.
                </p>
                <p className="mt-1 text-[15px] font-semibold text-white">Week 6 review</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> On track
              </span>
            </div>

            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {CHECKIN_FIELDS.map((f) => (
                <li
                  key={f.label}
                  className="rounded-[16px] border border-reps-border bg-reps-ink/70 p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    {f.label}
                  </p>
                  <p className="mt-1.5 text-[15.5px] font-semibold text-white">{f.value}</p>
                  {f.trend ? (
                    <p className="mt-0.5 text-[12px] text-white/55">{f.trend}</p>
                  ) : null}
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-[16px] border border-reps-border bg-reps-ink/70 p-4">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Client note
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/80">
                "Felt great Mon/Wed. Friday squats were heavy — slept badly Thursday. Hit protein
                every day. Photos look the same to me but waist tape is down."
              </p>
            </div>

            <div className="mt-5 rounded-[16px] border border-reps-orange-border/60 bg-reps-orange-soft/30 p-4">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
                Next actions
              </p>
              <ul className="mt-2 space-y-1.5 text-[13.5px] text-white/80">
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-reps-orange" /> Hold programme — strong adherence week.</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-reps-orange" /> Add 1 swap for Friday breakfast (low time).</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-reps-orange" /> Voice note on photo expectations — week 6 is normal.</li>
              </ul>
            </div>
          </div>

          {/* Pull-quote + frame */}
          <div className="flex flex-col justify-between gap-6 rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <p className="font-display text-[26px] font-bold leading-[1.2] text-white lg:text-[32px]">
              Check-ins turn a plan into a coaching relationship.
            </p>
            <ul className="space-y-2.5 text-[14px] text-white/75">
              {[
                "One review screen, not five tabs",
                "Pulls training and meal adherence automatically",
                "Photos compared side-by-side over time",
                "Coach notes saved to the client record",
                "Next actions become tasks the client sees",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 8. Progress tracking
// =============================================================================

function ProgressSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SarahRibbon />
        <SectionHeader
          eyebrow="Progress tracking"
          heading="Track progress across training, nutrition and behaviour."
          lede="When progress is visible, coaching decisions become clearer. REPs tracks strength, attendance, adherence, bodyweight and habits side-by-side — across one client or across your roster."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-5">
          {[
            { label: "Bodyweight trend", value: "−2.1 kg", sub: "6-week average pace 0.35 kg/wk", icon: ChartLine },
            { label: "Squat 5RM", value: "+7.5 kg", sub: "75 → 82.5 kg since week 1", icon: Dumbbell },
            { label: "Workout adherence", value: "92%", sub: "11 of 12 sessions completed", icon: Activity },
            { label: "Meal-plan adherence", value: "82%", sub: "Rolling 4-week average", icon: Apple },
            { label: "Waist measurement", value: "−1.2 cm", sub: "Last 4 weeks", icon: Gauge },
            { label: "Habits", value: "5 / 7", sub: "Hit this week — best to date", icon: Target },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    {stat.label}
                  </p>
                  <Icon className="h-4 w-4 text-reps-orange" />
                </div>
                <p className="mt-3 font-display text-[28px] font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-[13px] text-white/55">{stat.sub}</p>
                {/* tiny sparkline */}
                <div className="mt-4 flex h-8 items-end gap-1">
                  {[40, 55, 48, 62, 70, 68, 78, 82].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-[6px] bg-reps-orange/60"
                      style={{ height: `${h}%`, opacity: 0.4 + i * 0.075 }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 max-w-[680px] text-[13.5px] text-white/55">
          REPs reports adherence and trend — it doesn't promise transformations. Outcomes belong to
          the coach–client relationship.
        </p>
      </div>
    </section>
  );
}

// =============================================================================
// 9. Coaching notes + client context
// =============================================================================

function NotesSection() {
  const timeline = [
    { when: "Week 6", what: "Check-in: on track. Programme held. Breakfast swap added." },
    { when: "Week 5", what: "Programme phase 2 started — squats 4×6 @ RPE 7." },
    { when: "Week 4", what: "Mid-block review: −1.6 kg, sleep variable. Caffeine cut after 2pm." },
    { when: "Week 2", what: "Meal plan adjusted: more flexible lunches; protein floor 145g." },
    { when: "Week 1", what: "Onboarding: weddings cancelled twice in past year, history of yo-yo." },
    { when: "Day 0", what: "Intake: 76.7 kg, 83.2 cm waist. PAR-Q clear. No allergies." },
  ];
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Coaching notes + client context"
          heading="Coach with context, not guesswork."
          lede="The client record is the memory layer behind every coaching decision — goals, intake, dietary preferences, allergies, injuries, history, programme + meal plan history, check-ins, notes and upcoming reviews. Open the file, see the client."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-10">
          {/* Profile card */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-6">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-reps-orange-soft text-[18px] font-bold text-reps-orange">
                SK
              </span>
              <div>
                <p className="text-[16px] font-semibold text-white">Sarah K.</p>
                <p className="text-[13px] text-white/55">{SARAH.brief}</p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-[13px]">
              {[
                ["Primary goal", "Fat loss + maintain strength"],
                ["Sessions / wk", "3 (Mon · Wed · Fri)"],
                ["Equipment", "Full gym"],
                ["Dietary", "No restrictions · likes Italian"],
                ["Allergies", "None recorded"],
                ["Injuries", "Mild L knee — avoid deep box squats"],
                ["Coach", "James W."],
                ["Next review", "Sun · Week 6"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[12px] border border-reps-border bg-reps-ink/70 px-3 py-2.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{k}</dt>
                  <dd className="mt-1 text-[13.5px] text-white/85">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Timeline */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-6">
            <p className="text-[15px] font-semibold text-white">Client timeline</p>
            <ol className="mt-5 space-y-3">
              {timeline.map((e, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-reps-orange" />
                    {i < timeline.length - 1 ? (
                      <span className="my-1 h-10 w-px bg-reps-border" />
                    ) : null}
                  </div>
                  <div className="pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                      {e.when}
                    </p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-white/80">{e.what}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 10. AI coaching support
// =============================================================================

function AISection() {
  // Swap the placeholder ListIcon ref for ClipboardList without re-typing data
  const items = AI_ASSISTS.map((a) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a.icon as unknown) === (ListIcon as unknown) ? { ...a, icon: ClipboardList } : a,
  );
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="AI coaching support"
          heading="AI support for the coach — not instead of the coach."
          lede="AI helps you draft, summarise and spot patterns. It never sends a plan, never replies to a client, and never closes a check-in on its own. The coach is always in the loop."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((a) => {
            const Icon = a.icon;
            return (
              <li
                key={a.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-5"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-[14.5px] font-semibold text-white">{a.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{a.body}</p>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 rounded-[22px] border border-emerald-400/30 bg-emerald-500/10 p-7">
          <p className="font-display text-[24px] font-bold leading-[1.2] text-white lg:text-[30px]">
            AI drafts. The trainer reviews. The trainer approves.
          </p>
          <p className="mt-3 max-w-[720px] text-[14px] leading-relaxed text-white/70">
            Nothing reaches the client until you say so. The default for every AI output is "open
            in edit mode" — never "send".
          </p>
        </div>
      </div>
    </section>
  );
}

// Local alias used inside AI_ASSISTS — points at ClipboardList by default.
const ListIcon = ClipboardList;

// =============================================================================
// 11. Templates
// =============================================================================

function TemplatesSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Templates + repeatable systems"
          heading="Create a repeatable coaching standard — without making every client feel generic."
          lede="Save what works, clone it for the next client, personalise the parts that matter. Templates are how Pro coaches and Studio teams keep quality high as the roster grows."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <li
                key={t.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-5"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-[14.5px] font-semibold text-white">{t.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{t.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// =============================================================================
// 12. Verified vs Pro
// =============================================================================

function TierMatrixSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Verified vs Pro"
          heading="Where Coaching sits in the REPs tiers."
          lede="Verified is for professionals who want a trusted REPs profile, verification, reviews and visibility. Pro is the full coaching delivery system on top of that."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <TierCard
            badge="Verified"
            price="£99 / yr"
            blurb="A trusted REPs profile, verification, reviews and visibility. For professionals who run their coaching elsewhere."
            cta={{ to: "/pricing", label: "See Verified" }}
          />
          <TierCard
            badge="Pro · Founding £59 / mo"
            price="Includes Verified"
            blurb="Everything in Verified, plus the full coaching delivery layer — programmes, exercise library, meal planning, AI-assisted drafts, check-ins, progress tracking, client portal and connected client records."
            cta={{ to: "/pricing", label: "See Pro" }}
            highlighted
          />
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 13. Use cases
// =============================================================================

function UseCasesSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Who Coaching is for"
          heading="Built for every kind of coaching practice."
          lede="From a single PT delivering 12 clients to a studio team running standards across multiple coaches — the workflow is the same."
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((u) => (
            <li
              key={u.title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                <Users className="h-4 w-4" />
              </span>
              <p className="mt-4 text-[16px] font-semibold text-white">{u.title}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{u.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// =============================================================================
// 14. Safety + scope
// =============================================================================

function SafetySection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Safety + scope"
          heading="Built for fitness coaching, with professional boundaries."
          lede="REPs supports meal planning and nutrition coaching workflows. It is not a replacement for medical diagnosis, treatment, or registered nutrition advice for diagnosed conditions. Where a client needs that, the platform prompts referral to a suitably qualified professional."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <BlockHeading>REPs is not a replacement for</BlockHeading>
            </div>
            <ul className="mt-6 space-y-2.5">
              {SAFETY_NOT_REPLACEMENT.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 rounded-[16px] border border-reps-border bg-reps-ink/70 px-4 py-3 text-[13.5px] text-white/75"
                >
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                <BookOpen className="h-4 w-4" />
              </span>
              <BlockHeading>What the platform asks the coach to handle</BlockHeading>
            </div>
            <ul className="mt-6 space-y-2.5">
              {SAFETY_SAFEGUARDS.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 rounded-[16px] border border-reps-orange-border/60 bg-reps-orange-soft/30 px-4 py-3 text-[13.5px] text-white/85"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[12.5px] text-white/55">
              Every meal plan requires explicit trainer approval before the client sees it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Unused-import nudge: Bell + Brain + FileText kept available for future
// callouts; reference them once so tree-shaking keeps the route file honest.
// =============================================================================
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _reserved = { Bell, Brain, FileText };
