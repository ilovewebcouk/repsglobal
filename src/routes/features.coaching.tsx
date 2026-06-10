import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getCoachingExerciseShowcase } from "@/lib/exercisedb.functions";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Dumbbell,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  ListChecks,
  MessageSquare,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
  Users,
  Utensils,
  Watch,
  Workflow,
  X,
  Zap,
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
import { ClientRecordMock } from "@/components/marketing/CoachingMocks";
import {
  ACC_SCENARIOS,
  AccountabilityMock,
  AiAssistMock,
  AutomationsMock,
  CheckInsInboxMock,
  ClientPortalInteractiveMock,
  ExerciseLibraryMock,
  HabitsMock,
  MessagingMock,
  NutritionMock,
  ProgrammeMock,
  ProgressMock,
  type AccId,
} from "@/components/marketing/coaching/InteractiveMocks";

import heroCoaching from "@/assets/hero-coaching-bg.jpg.asset.json";

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

const PROBLEM_FRAGMENTS = [
  { icon: Dumbbell, label: "Programmes in a workout app" },
  { icon: Utensils, label: "Nutrition in PDFs and screenshots" },
  { icon: MessageSquare, label: "Check-ins on WhatsApp" },
  { icon: Camera, label: "Progress photos in camera rolls" },
  { icon: Watch, label: "Sleep & steps in another app" },
  { icon: FileText, label: "Notes buried in DMs" },
];

const PROBLEM_ORGANISED = [
  "Programmes built next to the client record",
  "Recipes, meals and plan templates kept in your own nutrition library",
  "Sleep, steps and training data flow in from their wearable",
  "Check-ins arrive in one inbox, scored against the goal",
  "Messages, voice notes and form replies in one thread per client",
  "Accountability surfaces clients before they go quiet",
];

const PROGRAMME_BULLETS = [
  "Block, week and session structure — not a workout list",
  "Sets, reps, tempo, rest, load and exertion targets per exercise",
  "10,000+ video demos from the exercise library",
  "Client-specific adaptations stored on the programme",
  "Progression notes carried session to session",
  "Reusable templates so a new client never starts from a blank page",
];

const NUTRITION_BULLETS = [
  "Pick a client target — calories, macros, days, dietary rules — in seconds",
  "REPs drafts a plan from your approved library only — never random food database results",
  "Swap any meal, edit portions, add coaching notes inline",
  "Nothing reaches the client until you sign it off — every plan is your decision",
  "Approved plans land on the client record alongside programmes, check-ins and progress",
  "Clients log meals, photos, water and notes against the plan you assigned",
  "Optional: clients attach a public MyFitnessPal or Cronometer link for review — no sync promised",
  "Every AI draft, swap and approval is logged so you can show your working",
];

const HABITS_BULLETS = [
  "Sleep, steps and hydration tracked daily",
  "Apple Health, Garmin, Whoop, Fitbit sync — automatic",
  "Training sessions logged from the watch on the wrist",
  "Patterns surfaced into the check-in, not buried in another tab",
  "Habit streaks for the things that move the goal",
  "Coach sees the week without asking 'how's sleep been?'",
];

const CHECKIN_BULLETS = [
  "Weekly cadence with goal review baked in",
  "Mood, energy, sleep and adherence on a simple scale",
  "Bodyweight or measurements with deltas vs last week",
  "Training feedback per session: easy / right / hard",
  "Nutrition and habit data pulled in automatically",
  "Coach response and next action saved on the record",
];

const MESSAGING_BULLETS = [
  "One thread per client — text, voice and form replies",
  "Voice notes up to 3 minutes for cueing or context",
  "Check-in form replies appear inline with the conversation",
  "Search the whole history without scrolling chat apps",
  "Templated replies for common questions, edited per client",
  "Read receipts so you know what's landed",
];

const AUTOMATIONS_BULLETS = [
  "Onboarding sequences for new clients — welcome, screening, first session",
  "Re-engagement sequences for clients going quiet",
  "Session reminders, check-in prompts, milestone messages",
  "Pre-written drafts you edit before they send — never blasted",
  "Drip content delivered to the right client at the right week",
  "All triggered from real coaching events, not generic timers",
];

const TEMPLATE_CARDS = [
  { icon: BookOpen, title: "Programme templates", body: "Block, week and session frameworks ready to clone and personalise." },
  { icon: Utensils, title: "Nutrition plan templates", body: "AI-drafted meal plans built from your approved recipes — you swap, edit and sign off before anything reaches the client." },
  { icon: ClipboardList, title: "Onboarding templates", body: "Welcome, expectations, screening and first-session prep — sent once, repeatable." },
  { icon: HeartPulse, title: "Check-in templates", body: "Weekly, monthly and post-block check-ins shaped for coaching, not generic surveys." },
  { icon: Workflow, title: "Automation templates", body: "Onboarding, re-engagement and reminder sequences ready to switch on." },
  { icon: MessageSquare, title: "Message templates", body: "Pre-written nudges, congrats and re-engagement messages — edited, not blasted." },
];

const USE_CASES = [
  { icon: Users, title: "Personal trainers", body: "Plan sessions, track attendance, deliver programmes and nutrition — all connected to the booking." },
  { icon: LayoutDashboard, title: "Online coaches", body: "Run remote clients end-to-end: programmes, check-ins, nutrition, messaging and progress from one place." },
  { icon: Dumbbell, title: "Strength coaches", body: "Block periodisation, RPE logging, PR tracking and athlete feedback without a spreadsheet stack." },
  { icon: LineChart, title: "Transformation coaches", body: "Macros, weekly check-ins, measurements, photos and habits — with proper continuity." },
  { icon: ListChecks, title: "Small-group coaches", body: "Deliver structured programming while still tracking individual progress, not just the class." },
  { icon: Workflow, title: "Studio teams", body: "Coaching standards stay consistent across multiple coaches and shared clients." },
];

const COMPARISON_ROWS = [
  { feature: "Programme builder (block / week / session)", verified: false, pro: true },
  { feature: "Exercise library + 10,000+ video demos", verified: false, pro: true },
  { feature: "AI-assisted meal plans from your approved library + client food log", verified: false, pro: true },
  { feature: "Habits + wearable sync (Apple / Garmin / Whoop)", verified: false, pro: true },
  { feature: "Weekly check-ins with goal review", verified: false, pro: true },
  { feature: "Progress tracking (strength, body, adherence, photos)", verified: false, pro: true },
  { feature: "Messaging — text, voice notes, form replies", verified: false, pro: true },
  { feature: "Client portal view (browser, no app install)", verified: false, pro: true },
  { feature: "Coaching notes & client history timeline", verified: false, pro: true },
  { feature: "Accountability & next-action queue", verified: false, pro: true },
  { feature: "Automations & onboarding sequences", verified: false, pro: true },
  { feature: "AI assist for drafting and summaries", verified: false, pro: true },
  { feature: "Verified public profile & reviews", verified: true, pro: true },
];

const FAQ_ITEMS = [
  {
    q: "Is REPs Coaching trying to replace Trainerize, PT Distinction and TrueCoach?",
    a: "For coaching delivery — yes. Programmes, exercise library with video, a nutrition library and food log, check-ins, progress, messaging, client view, notes, automations. The difference is REPs connects coaching delivery to the rest of your professional life: a verified public profile, enquiries, bookings and payments live on the same record. You stop running four tools that don't know about each other.",
  },
  {
    q: "Does it actually replace MyFitnessPal for nutrition?",
    a: "For coach-led nutrition — yes. You build a library of recipes, ingredients, meals and meal plan templates, assign them to clients, and review their food log, photos and weekly check-in in one place. Clients can also attach a public MyFitnessPal, Cronometer or other tracker link if they prefer to log there — REPs treats it as evidence on the client record. Barcode scan, a food database and AI meal recognition are on the roadmap, not the beta.",
  },
  {
    q: "Which wearables does it sync with?",
    a: "Apple Health, Garmin, Whoop and Fitbit at launch — covering sleep, steps, hydration and training sessions. The data flows into the weekly check-in so you don't have to ask 'how's sleep been?' every Sunday.",
  },
  {
    q: "Can clients use this without downloading an app?",
    a: "Yes. The client view is a browser portal accessed by magic link from their check-in email or invite. No app install required. A dedicated mobile app may follow later; the portal is the supported v1 experience.",
  },
  {
    q: "How does AI show up — is this another AI-hype product?",
    a: "No. AI drafts the first version, you coach the result. It drafts programmes from goals and screening, summarises a week of check-ins so you can scan 14 clients in a minute, and suggests reply wording you can edit. Every output is a draft for you to review — nothing sent without you.",
  },
  {
    q: "Can I migrate from Trainerize, TrueCoach or PT Distinction?",
    a: "Yes. Import client contacts and basic history via CSV, recreate your programmes and meal plans as templates (often faster than importing messy data), and carry on. The team can help with a structured migration for Pro and Studio accounts.",
  },
];

// -----------------------------------------------------------------------------
// Route
// -----------------------------------------------------------------------------

export const Route = createFileRoute("/features/coaching")({
  head: () => ({
    meta: [
      {
        title: "Coaching — Deliver better coaching from one connected platform · REPs",
      },
      {
        name: "description",
        content:
          "Programmes, exercise library, nutrition, check-ins, habits, wearables, messaging, progress, automations and AI assist — every coaching delivery tool a world-class trainer needs, in one workspace. Included in REPs Pro.",
      },
      {
        property: "og:title",
        content: "Coaching — Deliver better coaching from one connected platform",
      },
      {
        property: "og:description",
        content:
          "Programmes, nutrition, check-ins, progress, messaging and automations — every coaching delivery tool a world-class trainer needs, in one workspace.",
      },
      { property: "og:image", content: heroCoaching.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/coaching" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/coaching" }],
  }),
  loader: () => getCoachingExerciseShowcase(),
  component: CoachingPage,
});

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

function CoachingPage() {
  const { curated, featured } = Route.useLoaderData();
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <Hero />

      <ProblemSection />
      <ProgrammeSection featured={featured} />
      <ExerciseLibrarySection curated={curated} featured={featured} />
      <NutritionSection />
      <HabitsSection />
      <CheckInsSection />
      <ProgressSection />
      <MessagingSection />
      <ClientViewSection />
      <ClientRecordSection />
      <AccountabilitySection />
      <AutomationsSection />
      <TemplatesSection />
      <AiAssistSection />
      <TierComparisonSection />
      <UseCasesSection />

      <MarketingFaq
        eyebrow="Common questions"
        heading="What Coaching covers, and how it fits."
        items={FAQ_ITEMS}
      />

      <FinalCta
        heading="Deliver coaching clients can follow,"
        headingAccent="track and stay engaged with."
        lede="Use REPs Pro to programme, feed, check in, track, message and support every client from one connected coaching workspace."
        primary={{ to: "/signup", label: "Start using REPs Pro" }}
        secondary={{ to: "/for-professionals", label: "Explore all features" }}
      />

      <PublicFooter />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Hero
// -----------------------------------------------------------------------------

function Hero() {
  return (
    <section className="relative flex min-h-[640px] overflow-hidden lg:min-h-[780px]">
      <img
        src={heroCoaching.url}
        alt="REPs-verified coach cueing a kettlebell squat with a client at a premium boutique gym at dusk"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover object-center lg:object-right"
      />
      <HeroOverlay copySide="left" />

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col justify-start px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-24">
        <div className="max-w-[680px]">
          <MarketingHeroEyebrow
            icon={Dumbbell}
            style={{ animationDuration: "560ms", animationFillMode: "both" }}
          >
            Coaching · Delivery, support &amp; outcomes
          </MarketingHeroEyebrow>

          <h1
            className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[60px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            Deliver better coaching from{" "}
            <span className="text-reps-orange">one connected platform.</span>
          </h1>

          <p
            className="mt-6 max-w-[600px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            Programmes, exercise library, nutrition, check-ins, habits, wearables, messaging,
            progress and automations — every delivery tool a world-class coach needs, in one
            workspace that also powers your REPs profile, Shop Front and bookings.
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
              href="#programme-delivery"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              See coaching tools
            </a>
          </div>

          <ul
            className="mt-7 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70"
            style={{ animationDuration: "640ms", animationDelay: "340ms", animationFillMode: "both" }}
          >
            <li className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-reps-orange" /> REPs Pro
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Workflow className="h-4 w-4 text-reps-orange" /> Connected to your client record
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-reps-orange" /> No extra add-ons
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 01. Problem
// -----------------------------------------------------------------------------

function ProblemSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The fragmented coaching stack"
          heading="Most coaches don't struggle to coach. They struggle to deliver consistently."
          lede="Programmes in Trainerize, nutrition in PDFs, screenshots and WhatsApp, check-ins in DMs, sleep data on the watch, photos in a camera roll, notes buried somewhere. Your coaching shouldn't depend on six apps and a good memory."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <X className="h-3 w-3" /> Today, without REPs Coaching
            </span>
            <BlockHeading className="mt-4">Six apps. One overwhelmed coach.</BlockHeading>
            <ul className="mt-6 space-y-2.5">
              {PROBLEM_FRAGMENTS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-start gap-2.5 rounded-[16px] border border-reps-border/70 bg-reps-ink/60 px-4 py-2.5 text-[13.5px] text-white/70"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[13.5px] leading-relaxed text-white/55">
              The work happens, but the system that should hold it together doesn't exist — so
              clients slip, history disappears and quality depends on memory.
            </p>
          </div>

          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
              <Check className="h-3 w-3" /> With REPs Coaching
            </span>
            <BlockHeading className="mt-4">One workspace. Every client connected.</BlockHeading>
            <ul className="mt-6 space-y-2.5">
              {PROBLEM_ORGANISED.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5 rounded-[16px] border border-reps-orange-border/60 bg-reps-orange-soft/40 px-4 py-2.5 text-[13.5px] text-white/80"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[13.5px] leading-relaxed text-white/70">
              Operations gets the client organised. Coaching helps you{" "}
              <em>deliver the result.</em>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 02. Programme delivery
// -----------------------------------------------------------------------------

function ProgrammeSection({
  featured,
}: {
  featured: Awaited<ReturnType<typeof getCoachingExerciseShowcase>>["featured"];
}) {
  return (
    <section id="programme-delivery" className="scroll-mt-24 border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Programme delivery"
          heading="Build structured coaching plans clients can actually follow."
          lede="A programme builder shaped for fitness, not a generic workout list. Block, week and session structure with sets, reps, tempo, rest and load — adapted per client and saved as templates so a new client never starts from a blank page. Toggle the demo to see weeks 1, 4 and 8 of the same block."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <ProgrammeMock featured={featured} />
          <BulletColumn
            heading="The coaching command centre, not a workout list."
            body="You open a client and see the whole block — where they are, what's next, how the last week went, what to progress. The programme lives next to the client record, not in an app that doesn't know about your bookings or payments."
            bullets={PROGRAMME_BULLETS}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 03. Exercise library
// -----------------------------------------------------------------------------

function ExerciseLibrarySection({
  curated,
  featured,
}: {
  curated: Awaited<ReturnType<typeof getCoachingExerciseShowcase>>["curated"];
  featured: Awaited<ReturnType<typeof getCoachingExerciseShowcase>>["featured"];
}) {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Exercise library"
          heading="10,000+ exercises with video demos — built into the programme builder."
          lede="Filter by movement, equipment or muscle group. Add to a programme in one click. Every exercise carries cues, regressions and progressions so the client knows what 'good' looks like — without you re-recording the same video ten times."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <ExerciseLibraryMock curated={curated} featured={featured} />
          <BulletColumn
            heading="One library. Every programme. Every client."
            body="Search by name, filter by category, drop straight into Thursday's session. The same library powers programme building, the client portal demos and AI programme drafts — so the cueing stays consistent across every coach in the studio."
            bullets={[
              "10,000+ exercises curated for coaching, not gym influencers",
              "Filter by lower, upper, conditioning, mobility, equipment",
              "HD video demos with cues, regressions and progressions",
              "Upload your own exercises and videos — they sit alongside the library",
              "Record once, reuse across every client and programme",
              "Add to programme in one click — no copy-paste",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 04. Nutrition (the MFP-replacement section)
// -----------------------------------------------------------------------------

const NUTRITION_PARTS = [
  {
    n: "1",
    icon: BookOpen,
    title: "Build a library you trust",
    body: "Recipes, ingredients, meals and templates you've already approved. Nothing the AI suggests comes from outside this set.",
  },
  {
    n: "2",
    icon: Sparkles,
    title: "AI assembles the draft",
    body: "Set a client target — calories, macros, days, dietary rules — and REPs drafts a plan from your library only. Never a random food database.",
  },
  {
    n: "3",
    icon: Check,
    title: "You approve & assign",
    body: "Swap meals, edit portions, leave notes, sign off. Only approved plans reach the client — and every decision is logged on the record.",
  },
];

function NutritionSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Nutrition coaching"
          heading="AI drafts the meal plan. You approve the coaching decision."
          lede="Build your nutrition library once, then let REPs assemble client-ready plans from your approved recipes, calorie targets and coaching rules. Nothing reaches the client until you sign it off."
        />

        <div className="mt-10 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-3">
          {NUTRITION_PARTS.map(({ n, icon: Icon, title, body }, i) => (
            <>
              <div
                key={n}
                className="flex h-full flex-col rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-reps-orange/15 text-[12px] font-bold text-reps-orange">
                    {n}
                  </span>
                  <Icon className="size-4 text-white/70" />
                </div>
                <h3 className="mt-4 font-display text-[18px] font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                  {body}
                </p>
              </div>
              {i < NUTRITION_PARTS.length - 1 && (
                <div
                  key={`arrow-${n}`}
                  className="hidden items-center justify-center md:flex"
                  aria-hidden="true"
                >
                  <ArrowRight className="size-4 text-white/35" />
                </div>
              )}
            </>
          ))}
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <NutritionMock />
          <BulletColumn
            heading="Build your nutrition library once, then let REPs help assemble client-ready plans from your approved recipes, calorie targets and coaching rules."
            body="Coaches build the library. AI drafts the plan from your approved recipes only. You swap, edit and sign off — and every decision is logged on the client record alongside programmes, check-ins and progress."
            bullets={NUTRITION_BULLETS}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 05. Habits & wearables
// -----------------------------------------------------------------------------

function HabitsSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Habits &amp; wearables"
          heading="Sleep, steps and training data flow into the check-in — automatically."
          lede="Apple Health, Garmin, Whoop and Fitbit sync directly into the client's record. You see the week without asking 'how's sleep been?' Habits become trackable, patterns become visible, and the conversation moves from chasing data to coaching the person."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <HabitsMock />
          <BulletColumn
            heading="The week shows up on its own. You spend the call coaching."
            body="When sleep, steps, hydration and sessions sync from the wrist, you stop spending half the check-in chasing data. You start the call already knowing the week — and use the conversation to coach the response, not collect the inputs."
            bullets={HABITS_BULLETS}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 06. Check-ins
// -----------------------------------------------------------------------------

function CheckInsSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Client check-ins"
          heading="Check-ins turn coaching from a programme into a relationship."
          lede="A weekly cadence with goal review built in. Mood, energy, sleep, adherence, training feedback, nutrition and habit data — submitted by the client, reviewed in one inbox, with your response saved on their record."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <CheckInsInboxMock />
          <BulletColumn
            heading="One inbox. Every client's week, in order of priority."
            body="Check-ins replace the WhatsApp scroll with a structured weekly review. You see who's submitted, who's overdue, and where to focus first — without remembering who said what. Toggle between pending, replied and flagged."
            bullets={CHECKIN_BULLETS}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 07. Progress
// -----------------------------------------------------------------------------

function ProgressSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Progress tracking"
          heading="Clients stay engaged when they can see progress, not just feel it."
          lede="Strength, body composition, adherence and consent-based progress photos — all tracked against the same client record. Not a vibe, not a memory, not three different exports. Toggle the chart to see each lens."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <ProgressMock />
          <BulletColumn
            heading="Four lenses on one client. One source of truth."
            body="Lifts, weight, compliance and visible change — each told as a story over time, not a screenshot. Progress photos are encrypted, client-consented and never appear on your public profile."
            bullets={[
              "Strength: PBs, working weights and 1RM trends per lift",
              "Body: bodyweight and circumference trends with deltas",
              "Adherence: sessions completed, check-ins submitted, streaks",
              "Photos: opt-in, encrypted, client-only by default",
              "Milestones saved automatically — first PB, first 100 kg",
              "Shareable with the client in their portal — same numbers",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 08. Messaging
// -----------------------------------------------------------------------------

function MessagingSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Messaging"
          heading="One thread per client. Text, voice and form replies in the same place."
          lede="Stop running a WhatsApp / Instagram / text-message juggle for every client. REPs messaging is built into the client record — text, voice notes up to 3 minutes, and check-in form replies all live in one thread you can search."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <MessagingMock />
          <BulletColumn
            heading="The conversation, the context and the coaching — together."
            body="When the message thread, the check-in answers and the programme history all live together, you stop saying 'remind me again…' and start coaching the next thing. Voice notes give you back the human tone without screen time."
            bullets={MESSAGING_BULLETS}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 09. Client view
// -----------------------------------------------------------------------------

function ClientViewSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The client view"
          heading="Give clients a clear place to see what they need to do next."
          lede="A branded client portal — accessed in the browser by magic link, no app install — showing their programme, nutrition, next session, check-in, progress and your latest message. The same record, from their side."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <ClientPortalInteractiveMock />
          <BulletColumn
            heading="What the client sees, on purpose."
            body="The portal is intentionally small. Four things every week: what's next, my programme, my check-in, my progress. No social feed, no leaderboard, no noise — just enough to make the coaching tangible between sessions."
            bullets={[
              "Their current programme, week and next session",
              "Check-in form, pre-filled to last week's answers",
              "Progress they can see — lifts, weight, adherence",
              "Direct line to you, not a generic inbox",
              "Package and session status pulled from Operations",
              "Mobile-friendly browser portal — no app store, no install",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 10. Client record & notes
// -----------------------------------------------------------------------------

function ClientRecordSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Coaching notes &amp; client context"
          heading="Coach with context, not guesswork."
          lede="Open a client and see the full coaching picture: goals, training history, injuries, coach notes, check-in history, programme history, nutrition trends and a progress timeline. The continuity you wish you had after six months of growth."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-14">
          <BulletColumn
            heading="One record per client. Every session, every note."
            body="Operations holds the admin side — contact, bookings, payments, forms. Coaching adds the delivery side: programmes run, check-ins submitted, lifts tracked, meals logged, milestones hit, notes you took at 6am that you'd otherwise forget."
            bullets={[
              "Goals and original brief stored at the top",
              "Injury, screening and considerations always visible",
              "Coach notes timestamped and searchable",
              "Programme, nutrition and check-in history without scrolling chat",
              "Progress timeline — what changed, when, why",
              "Next-action prompt so nothing slips between sessions",
            ]}
          />
          <ClientRecordMock />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 11. Accountability (interactive flag inbox)
// -----------------------------------------------------------------------------

function AccountabilitySection() {
  const [scenario, setScenario] = useState<AccId>(ACC_SCENARIOS[0].id);
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Accountability &amp; next actions"
          heading="The best coaching systems show you who needs support before they disappear."
          lede="A needs-attention queue built from real coaching signals — not a generic to-do list. Overdue check-ins, low adherence, quiet clients, ending programmes, milestones to celebrate. Click any scenario below to see the flag fire."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <AccountabilityMock scenario={scenario} onChange={setScenario} />

          <div>
            <BlockHeading>Retention is built between sessions, not during them.</BlockHeading>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/75">
              Clients rarely cancel because of one bad week. They drift because the small signals
              — a missed check-in, a quiet ten days, a flat progress chart — went unanswered.
              REPs Coaching surfaces those signals while there's still time to respond.
            </p>
            <div className="mt-5 grid gap-2">
              {ACC_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScenario(s.id)}
                  aria-pressed={scenario === s.id}
                  className={`flex items-center gap-2.5 rounded-[16px] border px-4 py-2.5 text-left text-[13.5px] transition-colors ${
                    scenario === s.id
                      ? "border-reps-orange-border bg-reps-orange-soft/40 text-white"
                      : "border-reps-border bg-reps-panel/40 text-white/75 hover:bg-reps-panel/60"
                  }`}
                >
                  <Bell
                    className={`h-4 w-4 shrink-0 ${scenario === s.id ? "text-reps-orange" : "text-white/45"}`}
                  />
                  <span className="font-semibold">{s.label}</span>
                  <span className="ml-auto text-[11.5px] text-white/45">See flag</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 12. Automations
// -----------------------------------------------------------------------------

function AutomationsSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Automations"
          heading="The repeatable parts of coaching, on a schedule you wrote."
          lede="Onboarding sequences, re-engagement flows and session reminders — pre-built, editable per client, triggered by real coaching events. Not spray-and-pray. The repeatable bits run themselves so you spend your time on the bits that actually need a coach."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <AutomationsMock />
          <BulletColumn
            heading="Set it once, edit before it sends — never blasted."
            body="Every step is a draft you review. Welcome a new client without it feeling automated. Nudge a quiet client without it feeling robotic. Celebrate a PB without remembering whose week it was."
            bullets={AUTOMATIONS_BULLETS}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 13. Templates
// -----------------------------------------------------------------------------

function TemplatesSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Templates &amp; repeatable delivery"
          heading="Create a repeatable coaching standard without making every client feel generic."
          lede="Programme frameworks, nutrition plans, check-in formats, onboarding flows, automations and messaging — saved once, personalised per client. Quality stops depending on which morning you built it."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_CARDS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-[15.5px] font-bold text-white">{title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 14. AI assist
// -----------------------------------------------------------------------------

function AiAssistSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="AI assist"
          heading="AI drafts the first version. You coach the result."
          lede="No buzzwords. AI inside REPs drafts programmes from a client's goals and screening, summarises a week of check-ins so you can scan 14 clients in a minute, and suggests reply wording you can edit. Every output is a draft — nothing sends without you."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <AiAssistMock />
          <div>
            <BlockHeading>An assistant, not a substitute.</BlockHeading>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/75">
              Coaching judgement is yours. REPs AI handles the busywork — the first programme
              draft, the check-in triage, the reply that would have taken you ten minutes to write
              at midnight. You stay in the driver's seat.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Programme drafts from goals, screening and last block's results",
                "Weekly check-in summary across your whole client list",
                "Suggested reply wording — always editable, never auto-sent",
                "Trend spotting: 'three clients flat-lined this week'",
                "Built into the workspace, not a separate tool",
                "Off-switch per client and per coach if you want it off",
              ].map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 rounded-[16px] border border-reps-border bg-reps-panel/40 px-4 py-2.5 text-[13.5px] text-white/80"
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {b}
                </li>
              ))}
            </ul>
            <Link
              to="/features/ai"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/25 px-5 text-[13.5px] font-semibold text-white shadow-none hover:bg-white/10"
            >
              How REPs uses AI <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 15. Verified vs Pro
// -----------------------------------------------------------------------------

function TierComparisonSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Verified vs Pro"
          heading="Verified makes you findable. Pro lets you deliver."
          lede="Coaching is a Pro pillar. Verified gives you a trusted public profile, reviews and visibility — the front-of-house. Pro adds the full delivery stack: programmes, nutrition, habits, check-ins, progress, messaging, client view, automations and AI assist."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <TierCard
            badge="Verified"
            price="£99 / year"
            blurb="Public verified profile, directory presence, reviews and a basic enquiry inbox. No programme builder, nutrition, check-ins, progress tracking or client view."
            cta={{ to: "/features/visibility", label: "See what Verified covers" }}
          />
          <TierCard
            badge="Pro"
            price="£59 / month · Founding"
            blurb="Everything in Verified, plus the full Coaching workspace — programmes, exercise library, nutrition, habits & wearables, check-ins, progress, messaging, client view, accountability, automations and AI assist."
            highlighted
            cta={{ to: "/pricing", label: "See Pro pricing" }}
          />
        </div>

        <div className="mt-10 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/40">
          <div className="overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="grid grid-cols-[1fr_120px_120px] items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                <span>Coaching capability</span>
                <span className="text-center">Verified</span>
                <span className="text-center">Pro</span>
              </div>
              {COMPARISON_ROWS.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1fr_120px_120px] items-center px-5 py-3.5 text-[14px] text-white/80 ${
                    i % 2 === 0 ? "bg-white/[0.02]" : ""
                  }`}
                >
                  <span>{row.feature}</span>
                  <span className="text-center">
                    {row.verified ? (
                      <Check className="mx-auto h-4 w-4 text-reps-orange" />
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </span>
                  <span className="text-center">
                    {row.pro ? (
                      <CheckCircle2 className="mx-auto h-4 w-4 text-reps-orange" />
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 16. Use cases
// -----------------------------------------------------------------------------

function UseCasesSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Built for every coaching model"
          heading="What Coaching looks like for…"
          lede="The workspace stays the same. The delivery flexes to how you actually coach — 1:1, online, strength, transformation, small-group or studio team."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-4 font-display text-[16px] font-bold text-white">{title}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Shared bullet column (used by every mock-paired section)
// -----------------------------------------------------------------------------

function BulletColumn({
  heading,
  body,
  bullets,
}: {
  heading: string;
  body: string;
  bullets: string[];
}) {
  return (
    <div>
      <BlockHeading>{heading}</BlockHeading>
      <p className="mt-4 text-[14.5px] leading-relaxed text-white/75">{body}</p>
      <ul className="mt-6 space-y-2.5">
        {bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2.5 rounded-[16px] border border-reps-border bg-reps-panel/40 px-4 py-2.5 text-[13.5px] text-white/80"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
