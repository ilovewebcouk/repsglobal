import { createFileRoute, Link } from "@tanstack/react-router";
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
  Sparkles,
  Target,
  Timer,
  Trophy,
  Users,
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
import {
  ClientPortalMock,
  ClientRecordMock,
  CoachingDashboardMock,
} from "@/components/marketing/CoachingMocks";
import { Separator } from "@/components/ui/separator";

import heroCoaching from "@/assets/hero-coaching-bg.jpg.asset.json";

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

const PROBLEM_FRAGMENTS = [
  { icon: Dumbbell, label: "Programmes in a workout app" },
  { icon: MessageSquare, label: "Check-ins on WhatsApp" },
  { icon: Camera, label: "Progress photos in camera rolls" },
  { icon: FileText, label: "Notes buried in DMs" },
];

const PROBLEM_ORGANISED = [
  "Programmes built in the same workspace as the client record",
  "Check-ins arrive in one inbox, scored against the goal",
  "Progress, adherence and PBs tracked against the client, not in your head",
  "Notes, history and next actions on one screen",
  "Templates so quality stays consistent without copy-paste",
  "Accountability surfaces clients before they go quiet",
];

const PROGRAMME_BULLETS = [
  "Block, week and session structure — not just a workout list",
  "Sets, reps, tempo, rest and exertion targets per exercise",
  "Video demos or links attached to every movement",
  "Client-specific adaptations stored on the programme",
  "Progression notes carried session to session",
  "Reusable templates so a new client doesn't start from a blank page",
];

const CHECKIN_BULLETS = [
  "Weekly cadence with goal review baked in",
  "Mood, energy, sleep and adherence on a simple scale",
  "Bodyweight or measurements with deltas vs last week",
  "Training feedback per session: easy / right / hard",
  "Habit and nutrition reflections (if you include them)",
  "Coach response and next action saved on the record",
];

const PROGRESS_CARDS = [
  {
    icon: LineChart,
    title: "Measurements",
    body: "Bodyweight and circumference tracked over time with weekly and monthly deltas.",
  },
  {
    icon: Dumbbell,
    title: "Strength progress",
    body: "1RM, working weights and PBs charted by lift — without spreadsheets.",
  },
  {
    icon: ClipboardCheck,
    title: "Adherence & attendance",
    body: "Sessions completed, check-ins submitted, programme compliance — not a vibe.",
  },
  {
    icon: Trophy,
    title: "Milestones & history",
    body: "First pull-up, first 100 kg, sub-25 5k — saved so the win is visible later.",
  },
];

const ACCOUNTABILITY_FLAGS = [
  { icon: Bell, title: "Check-in overdue", body: "Two weeks since last submission." },
  { icon: HeartPulse, title: "Low adherence", body: "Three sessions missed this block." },
  { icon: MessageSquare, title: "Quiet client", body: "No app activity in 10 days." },
  { icon: Timer, title: "Programme ending", body: "Less than a week left — review due." },
  { icon: ClipboardList, title: "Missing form", body: "Re-screening or update not returned." },
  { icon: Target, title: "Goal review", body: "Original goal date is approaching." },
  { icon: Trophy, title: "Milestone hit", body: "Client just hit a PB — celebrate it." },
  { icon: LineChart, title: "Flat progress", body: "No change across the last four weeks." },
];

const TEMPLATE_CARDS = [
  { icon: BookOpen, title: "Programme templates", body: "Block, week and session frameworks ready to clone and personalise." },
  { icon: ClipboardList, title: "Onboarding templates", body: "Welcome, expectations, screening and first-session prep — sent once, repeatable." },
  { icon: HeartPulse, title: "Check-in templates", body: "Weekly, monthly and post-block check-ins shaped for coaching, not generic surveys." },
  { icon: ClipboardCheck, title: "Assessment templates", body: "Movement screens, strength tests and re-tests with consistent fields." },
  { icon: Target, title: "Review templates", body: "Quarterly review and goal-reset frameworks to keep direction sharp." },
  { icon: MessageSquare, title: "Message templates", body: "Pre-written nudges, congrats and re-engagement messages — edited, not blasted." },
];

const USE_CASES = [
  { icon: Users, title: "Personal trainers", body: "Plan sessions, track attendance, record progress and keep client notes connected to the booking." },
  { icon: LayoutDashboard, title: "Online coaches", body: "Deliver programmes, collect check-ins, review progress and support clients remotely from one place." },
  { icon: Dumbbell, title: "Strength coaches", body: "Track lifts, training blocks, progression and athlete feedback without a spreadsheet stack." },
  { icon: LineChart, title: "Transformation coaches", body: "Manage weekly check-ins, measurements, habits and milestones with proper continuity." },
  { icon: ListChecks, title: "Small-group coaches", body: "Deliver structured programming while still tracking individual progress, not just the class." },
  { icon: Workflow, title: "Studio teams", body: "Keep coaching standards consistent across multiple coaches and shared clients." },
];

const COMPARISON_ROWS = [
  { feature: "Programme builder (block / week / session)", verified: false, pro: true },
  { feature: "Video demos and exercise library", verified: false, pro: true },
  { feature: "Client-specific adaptations & progressions", verified: false, pro: true },
  { feature: "Weekly check-ins with goal review", verified: false, pro: true },
  { feature: "Progress tracking (measurements, lifts, adherence)", verified: false, pro: true },
  { feature: "Client portal view", verified: false, pro: true },
  { feature: "Coaching notes & client history timeline", verified: false, pro: true },
  { feature: "Accountability & next-action queue", verified: false, pro: true },
  { feature: "Programme / check-in / message templates", verified: false, pro: true },
  { feature: "Verified public profile & reviews", verified: true, pro: true },
];

const FAQ_ITEMS = [
  {
    q: "Is REPs Coaching trying to replace Trainerize or TrueCoach?",
    a: "Functionally yes for delivery — programmes, check-ins, progress, client view, notes. The difference is REPs connects coaching delivery to the rest of your professional life: a verified public profile, enquiries, bookings and payments live on the same record. You stop running two tools that don't know about each other.",
  },
  {
    q: "Can clients use this without downloading an app?",
    a: "Yes. The client view is a browser portal accessed by magic link from their check-in email or invite. No app install required. A dedicated mobile app may follow later; the portal is the supported v1 experience.",
  },
  {
    q: "How flexible is the programme builder?",
    a: "Built for fitness, not a generic table. You set blocks, weeks and sessions; each exercise carries sets, reps, tempo, rest and an optional video. Programmes can be adapted per client, progressed week to week and saved as templates so you don't start from a blank page.",
  },
  {
    q: "Does it include nutrition coaching?",
    a: "Not as a full macro-tracking app. Check-ins include optional habit and nutrition reflection fields so the conversation is structured. If your coaching needs full nutrition delivery, pair REPs with a dedicated nutrition tool — REPs holds the client relationship, programming, check-ins and history.",
  },
  {
    q: "How does this work with multiple coaches in a studio?",
    a: "On Studio, every coach has their own caseload, programmes and check-ins, while shared clients carry one continuous record across the team. Coaching standards stay consistent because templates, programme frameworks and check-in formats are shared at studio level.",
  },
  {
    q: "Can I migrate from another coaching app?",
    a: "Yes. Import client contacts and basic history via CSV, recreate your programmes as templates (often faster than importing messy data), and carry on. The team can help with a structured migration for Pro and Studio accounts moving from Trainerize, TrueCoach or PT Distinction.",
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
          "Build programmes, manage check-ins, track progress and support every client from one connected coaching workspace — wired into your REPs profile, Shop Front and business operations. Included in REPs Pro.",
      },
      {
        property: "og:title",
        content: "Coaching — Deliver better coaching from one connected platform",
      },
      {
        property: "og:description",
        content:
          "Programmes, check-ins, progress tracking, client view and accountability — on the same record as your bookings and profile.",
      },
      { property: "og:image", content: heroCoaching.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/coaching" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/coaching" }],
  }),
  component: CoachingPage,
});

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

function CoachingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <Hero />

      <ProblemSection />
      <ProgrammeSection />
      <CheckInsSection />
      <ProgressSection />
      <ClientViewSection />
      <ClientRecordSection />
      <AccountabilitySection />
      <TemplatesSection />
      <AiCalloutSection />
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
        lede="Use REPs Pro to build programmes, manage check-ins, track progress and support every client from one connected coaching workspace."
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
            Build programmes, manage check-ins, track progress and support every client from the
            same workspace that powers your REPs profile, Shop Front and business operations.
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
// 1. Problem
// -----------------------------------------------------------------------------

function ProblemSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The fragmented coaching stack"
          heading="Most coaches don't struggle to coach. They struggle to deliver consistently."
          lede="Programmes in one app, check-ins in WhatsApp, progress photos in a camera roll, notes in DMs and accountability in your head. Your coaching shouldn't depend on scattered messages, screenshots and memory."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Today — scattered */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <X className="h-3 w-3" /> Today, without REPs Coaching
            </span>
            <BlockHeading className="mt-4">Four apps. One overwhelmed coach.</BlockHeading>
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
              The work happens, but the system that should hold it together doesn't exist —
              so clients slip, history disappears and quality depends on memory.
            </p>
          </div>

          {/* With REPs */}
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
// 2. Programme delivery
// -----------------------------------------------------------------------------

function ProgrammeSection() {
  return (
    <section
      id="programme-delivery"
      className="scroll-mt-24 border-b border-reps-border bg-reps-panel/15"
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Programme delivery"
          heading="Build structured coaching plans clients can actually follow."
          lede="A programme builder shaped for fitness, not a generic workout list. Block, week and session structure with sets, reps, tempo, rest and video demos — adapted per client and saved as templates so a new client never starts from a blank page."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <CoachingDashboardMock />

          <div>
            <BlockHeading>The coaching command centre, not a workout list.</BlockHeading>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/75">
              You open a client and see the whole block — where they are, what's next, how the
              last week went, what to progress. The programme lives next to the client record,
              not in a different app that doesn't know about your bookings or payments.
            </p>
            <ul className="mt-6 space-y-2.5">
              {PROGRAMME_BULLETS.map((b) => (
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
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 3. Check-ins
// -----------------------------------------------------------------------------

function CheckInsSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Client check-ins"
          heading="Check-ins turn coaching from a programme into a relationship."
          lede="A weekly cadence with goal review built in. Mood, energy, sleep, adherence, training feedback and habit reflection — submitted by the client, reviewed in one place, with your response saved on their record."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-14">
          {/* Mock check-in card */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
                <HeartPulse className="h-3 w-3" /> Weekly check-in · James
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-300">
                On track
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-[13px]">
              {[
                { l: "Goal", v: "Add 5 kg to back squat" },
                { l: "Adherence", v: "92% · 4 sessions / 4" },
                { l: "Mood", v: "8 / 10" },
                { l: "Sleep", v: "7 / 10 — slightly disturbed" },
                { l: "Energy", v: "8 / 10" },
                { l: "Bodyweight", v: "82.4 kg · −1.2 kg vs last week" },
              ].map((r) => (
                <div
                  key={r.l}
                  className="rounded-[14px] border border-reps-border/70 bg-reps-ink/40 px-3 py-2.5"
                >
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-white/45">
                    {r.l}
                  </p>
                  <p className="mt-1 font-medium text-white">{r.v}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[14px] border border-reps-border/70 bg-reps-ink/40 px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-white/45">
                Client feedback
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/80">
                "Felt strong on Tuesday — RDL went up. Knee was fine through Bulgarian split squats.
                Could probably push squat next session."
              </p>
            </div>

            <Separator className="my-5 bg-reps-border" />

            <div className="rounded-[14px] border border-reps-orange-border/60 bg-reps-orange-soft/30 px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-reps-orange">
                Coach response &amp; next action
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/85">
                Great week. Bumping Thursday squat to 122.5 kg × 5. Keep RPE notes — let's set the
                100 kg RDL benchmark next block.
              </p>
            </div>
          </div>

          <div>
            <BlockHeading>One inbox. Every client's week, in order of priority.</BlockHeading>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/75">
              Check-ins replace the WhatsApp scroll with a structured weekly review. You see
              who's submitted, who's overdue, and where to focus first — without remembering who
              said what.
            </p>
            <ul className="mt-6 space-y-2.5">
              {CHECKIN_BULLETS.map((b) => (
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
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 4. Progress tracking
// -----------------------------------------------------------------------------

function ProgressSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Progress tracking"
          heading="Clients stay engaged when they can see progress, not just feel it."
          lede="Measurements, strength, adherence and milestones — all tracked against the same client record. Not a vibe, not a memory, not three different exports. Just the line moving in the right direction."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRESS_CARDS.map(({ icon: Icon, title, body }) => (
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
// 5. Client view
// -----------------------------------------------------------------------------

function ClientViewSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The client view"
          heading="Give clients a clear place to see what they need to do next."
          lede="A branded client portal — accessed in the browser by magic link, no app install — showing their programme, next session, tasks, check-ins, progress and your latest message. The same record, from their side."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <ClientPortalMock />

          <div>
            <BlockHeading>What the client sees, on purpose.</BlockHeading>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/75">
              The portal is intentionally small. Three things every week: what's next, how I'm
              doing, what my coach said. No social feed, no leaderboard, no noise — just enough
              to make the coaching tangible between sessions.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                "Their current programme, week and next session",
                "Check-in form, pre-filled to last week's answers",
                "Progress they can see — lifts, weight, adherence",
                "Direct line to you, not a generic inbox",
                "Package and session status pulled from Operations",
                "Mobile-friendly, no app store, no install friction",
              ].map((b) => (
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
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 6. Client record & notes
// -----------------------------------------------------------------------------

function ClientRecordSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Coaching notes &amp; client context"
          heading="Coach with context, not guesswork."
          lede="Open a client and see the full coaching picture: goals, training history, injuries, coach notes, check-in history, programme history and a progress timeline. The continuity you wish you had after six months of growth."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-14">
          <div>
            <BlockHeading>One record per client. Every session, every note.</BlockHeading>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/75">
              Operations holds the admin side of the record — contact details, bookings, payments,
              forms. Coaching adds the delivery side: programmes run, check-ins submitted, lifts
              tracked, milestones hit, notes you took at 6am that you'd otherwise forget.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                "Goals and original brief stored at the top",
                "Injury, screening and considerations always visible",
                "Coach notes timestamped and searchable",
                "Programme and check-in history without scrolling chat",
                "Progress timeline — what changed, when, why",
                "Next-action prompt so nothing slips between sessions",
              ].map((b) => (
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

          <ClientRecordMock />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 7. Accountability
// -----------------------------------------------------------------------------

function AccountabilitySection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Accountability &amp; next actions"
          heading="The best coaching systems show you who needs support before they disappear."
          lede="A needs-attention queue built from real coaching signals — not a generic to-do list. Overdue check-ins, low adherence, quiet clients, ending programmes, milestones to celebrate. Surfaced before retention becomes a problem."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACCOUNTABILITY_FLAGS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-5"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-4 font-display text-[14.5px] font-bold text-white">{title}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[22px] border border-reps-border bg-reps-panel/60 p-7 lg:p-10">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <BlockHeading>Retention is built between sessions, not during them.</BlockHeading>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/75">
                Clients rarely cancel because of one bad week. They drift because the small signals
                — a missed check-in, a quiet ten days, a flat progress chart — went unanswered.
                REPs Coaching surfaces those signals while there's still time to respond.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 8. Templates
// -----------------------------------------------------------------------------

function TemplatesSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Templates &amp; repeatable delivery"
          heading="Create a repeatable coaching standard without making every client feel generic."
          lede="Programme frameworks, check-in formats, onboarding flows and messaging — saved once, personalised per client. Quality stops depending on which morning you built it."
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
// 9. AI callout (inline, not a full section)
// -----------------------------------------------------------------------------

function AiCalloutSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
        <div className="overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/60 p-7 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <BlockHeading>AI should support the coach, not replace the coach.</BlockHeading>
                <p className="mt-3 max-w-[640px] text-[14.5px] leading-relaxed text-white/75">
                  Summarised check-ins, flagged adherence trends, draft replies, suggested
                  follow-ups — AI lives across REPs as the operating layer, not a substitute for
                  coaching judgement. The coach decides; the system handles the busywork.
                </p>
              </div>
            </div>
            <Link
              to="/features/ai"
              className="inline-flex h-12 items-center gap-2 self-start rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10 lg:self-center"
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
// 10. Verified vs Pro
// -----------------------------------------------------------------------------

function TierComparisonSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Verified vs Pro"
          heading="Verified makes you findable. Pro lets you deliver."
          lede="Coaching is a Pro pillar. Verified gives you a trusted public profile, reviews and visibility — the front-of-house. Pro adds the full delivery stack: programmes, check-ins, progress, client view, notes and accountability."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <TierCard
            badge="Verified"
            price="£99 / year"
            blurb="Public verified profile, directory presence, reviews and a basic enquiry inbox. No programme builder, check-ins, progress tracking or client view."
            cta={{ to: "/features/visibility", label: "See what Verified covers" }}
          />
          <TierCard
            badge="Pro"
            price="£59 / month · Founding"
            blurb="Everything in Verified, plus the full Coaching workspace — programmes, check-ins, progress, client view, notes, accountability and templates."
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
// 11. Use cases
// -----------------------------------------------------------------------------

function UseCasesSection() {
  return (
    <section className="border-b border-reps-border">
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
