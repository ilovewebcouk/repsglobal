import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Apple,
  ArrowRight,
  BadgeCheck,
  Bell,
  Brain,
  CalendarCheck,
  ChartLine,
  Check,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  Flag,
  Footprints,
  Gauge,
  HeartPulse,
  Image as ImageIcon,
  Inbox,
  Layers,
  LineChart,
  Mail,
  MessageSquare,
  Mic,
  Moon,
  NotebookPen,
  Power,
  RefreshCw,
  Repeat,
  Salad,
  Send,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserMinus,
  Users,
  UtensilsCrossed,
  Watch,
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
      { title: "Coaching — Deliver from one connected platform · REPs" },
      {
        name: "description",
        content:
          "Programmes, exercise library, nutrition, check-ins, habits, wearables, messaging, progress and automations — every delivery tool a world-class coach needs, in one workspace.",
      },
      { property: "og:title", content: "Coaching — One connected platform · REPs" },
      {
        property: "og:description",
        content:
          "Deliver training, nutrition, check-ins and progress from one connected coaching workspace.",
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

const FAQ_ITEMS = [
  {
    q: "Is REPs Coaching trying to replace Trainerize, PT Distinction and TrueCoach?",
    a: "For most coaches, yes. REPs covers programmes, exercise library, nutrition, habits, wearables, check-ins, progress tracking, messaging and a client portal — and ties them to the same client record as your public REPs profile and Shop Front. The difference is the connection: training, nutrition and check-ins live on one client record, not three.",
  },
  {
    q: "Does it actually replace MyFitnessPal for nutrition?",
    a: "Yes, for coaching use. Coach-set macros, food database, meal plans, photo logging and weekly compliance all live on the client record. Clients stop sending screenshots from another app, and you stop chasing data that should already be in your workspace.",
  },
  {
    q: "Which wearables does it sync with?",
    a: "Apple Health, Garmin, Whoop and Fitbit. Sleep, steps, hydration and training sessions flow into the client record, so check-ins arrive with the week already attached.",
  },
  {
    q: "Can clients use this without downloading an app?",
    a: "Yes. The client portal is a mobile-friendly browser experience accessed by magic link — no app install, no app store. Clients see their programme, nutrition, next session, check-in form, progress and the latest message from you.",
  },
  {
    q: "How does AI show up — is this another AI-hype product?",
    a: "AI inside REPs drafts the first version of a programme or a check-in summary, suggests reply wording, and spots adherence trends. Every output is a draft you review and approve. Nothing sends to a client without you. There is an off-switch per client and per coach.",
  },
  {
    q: "Can I migrate from Trainerize, TrueCoach or PT Distinction?",
    a: "Yes. We help Pro coaches bring across client records, programme templates and meal-plan structures. The goal is that your existing system of work moves with you — not that you start from a blank page.",
  },
];

const PROGRAMME_BULLETS = [
  "Block, week and session structure — not a workout list",
  "Sets, reps, tempo, rest, load and exertion targets per exercise",
  "10,000+ video demos from the exercise library",
  "Client-specific adaptations stored on the programme",
  "Progression notes carried session to session",
  "Reusable templates so a new client never starts blank",
];

const LIBRARY_BULLETS = [
  "10,000+ exercises curated for coaching",
  "Filter by lower, upper, conditioning, mobility, equipment",
  "HD video demos with cues, regressions and progressions",
  "Upload your own exercises and videos — first-class library items",
  "Record once, reuse across every client and programme",
  "Add to programme in one click — no copy-paste",
];

const WEARABLE_BULLETS = [
  "Sleep, steps and hydration tracked daily",
  "Apple Health, Garmin, Whoop and Fitbit sync — automatic",
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

const PROGRESS_LENSES: { icon: LucideIcon; label: string; value: string; sub: string }[] = [
  { icon: Dumbbell, label: "Strength", value: "+7.5 kg", sub: "Squat 5RM · 75 → 82.5 kg" },
  { icon: ChartLine, label: "Body", value: "−2.1 kg", sub: "Bodyweight · 6-wk pace 0.35 kg/wk" },
  { icon: Activity, label: "Adherence", value: "92%", sub: "11 of 12 sessions · streak 4 wks" },
  { icon: ImageIcon, label: "Photos", value: "Opt-in", sub: "Encrypted · client-only by default" },
];

const MESSAGING_BULLETS = [
  "One thread per client — text, voice and form replies",
  "Voice notes up to 3 minutes for cueing or context",
  "Check-in form replies appear inline with the conversation",
  "Search the whole history without scrolling chat apps",
  "Templated replies for common questions, edited per client",
  "Read receipts so you know what's landed",
];

const PORTAL_TILES: { icon: LucideIcon; label: string; sub: string }[] = [
  { icon: Zap, label: "What's next", sub: "Today's session, dated" },
  { icon: Dumbbell, label: "My programme", sub: "Week 6 · current phase" },
  { icon: CalendarCheck, label: "My check-in", sub: "Due Sunday · pre-filled" },
  { icon: ChartLine, label: "My progress", sub: "Lifts, weight, adherence" },
];

const PORTAL_BULLETS = [
  "Current programme, week and next session",
  "Check-in form pre-filled to last week's answers",
  "Progress they can see — lifts, weight, adherence",
  "Direct line to you, not a generic inbox",
  "Package and session status pulled from Operations",
  "Mobile-friendly browser portal — no app store, no install",
];

const NOTES_BULLETS = [
  "Goals and original brief stored at the top",
  "Injury, screening and considerations always visible",
  "Coach notes timestamped and searchable",
  "Programme, nutrition and check-in history without scrolling chat",
  "Progress timeline — what changed, when, why",
  "Next-action prompt so nothing slips between sessions",
];

const ACCOUNTABILITY_FLAGS: {
  icon: LucideIcon;
  label: string;
  trigger: string;
  action: string;
}[] = [
  {
    icon: Inbox,
    label: "Check-in overdue",
    trigger: "Sarah K. · weekly check-in · 2 days late",
    action: "Send pre-filled nudge",
  },
  {
    icon: ChartLine,
    label: "Low adherence",
    trigger: "Marcus T. · 3 sessions in 14 days · target 6",
    action: "Open client + draft message",
  },
  {
    icon: UserMinus,
    label: "Quiet client",
    trigger: "Priya R. · 10 days since last message",
    action: "Open thread + voice note",
  },
  {
    icon: Trophy,
    label: "Milestone hit",
    trigger: "Daniel S. · first 100 kg deadlift",
    action: "Celebrate + log milestone",
  },
  {
    icon: CalendarCheck,
    label: "Programme ending",
    trigger: "Helen J. · phase 3 ends in 6 days",
    action: "Plan next block",
  },
];

const AUTOMATIONS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Send,
    title: "Onboarding sequence",
    body: "Welcome, screening, first session prep — sent once, drafted for review.",
  },
  {
    icon: RefreshCw,
    title: "Re-engagement",
    body: "Surface clients who've gone quiet with a draft you edit before it sends.",
  },
  {
    icon: Bell,
    title: "Session reminders",
    body: "Pre-session reminders, check-in prompts and milestone messages on a schedule.",
  },
  {
    icon: Repeat,
    title: "Drip content",
    body: "Deliver the right material to the right client at the right week of their block.",
  },
];

const TEMPLATES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Dumbbell,
    title: "Programme templates",
    body: "Block, week and session frameworks ready to clone and personalise.",
  },
  {
    icon: Salad,
    title: "Nutrition plan templates",
    body: "Macro splits and meal plans you can drop onto a client in one click.",
  },
  {
    icon: ClipboardList,
    title: "Onboarding templates",
    body: "Welcome, expectations, screening and first-session prep — sent once, repeatable.",
  },
  {
    icon: CalendarCheck,
    title: "Check-in templates",
    body: "Weekly, monthly and post-block check-ins shaped for coaching, not generic surveys.",
  },
  {
    icon: Workflow,
    title: "Automation templates",
    body: "Onboarding, re-engagement and reminder sequences ready to switch on.",
  },
  {
    icon: MessageSquare,
    title: "Message templates",
    body: "Pre-written nudges, congrats and re-engagement messages — edited, not blasted.",
  },
];

const AI_ASSISTS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Dumbbell,
    title: "Draft programmes",
    body: "First-pass programme from goals, screening and last block's results.",
  },
  {
    icon: NotebookPen,
    title: "Summarise check-ins",
    body: "Scan 14 clients in a minute — weekly digest across your whole roster.",
  },
  {
    icon: MessageSquare,
    title: "Suggest reply wording",
    body: "Drafts a reply tone you can edit. Never auto-sent.",
  },
  {
    icon: Activity,
    title: "Spot trends",
    body: "'Three clients flat-lined this week' — surfaced before you ask.",
  },
  {
    icon: Brain,
    title: "Built-in, not bolted on",
    body: "AI lives inside the workspace — not a separate tool you log into.",
  },
  {
    icon: Power,
    title: "Off-switch per client",
    body: "Turn AI off for a client or for your whole account whenever you want.",
  },
];

const MATRIX_ROWS: { label: string; verified: boolean; pro: boolean }[] = [
  { label: "Programme builder (block / week / session)", verified: false, pro: true },
  { label: "Exercise library + 10,000+ video demos", verified: false, pro: true },
  { label: "Nutrition: macros, food log, meal plans", verified: false, pro: true },
  { label: "Habits + wearable sync (Apple / Garmin / Whoop)", verified: false, pro: true },
  { label: "Weekly check-ins with goal review", verified: false, pro: true },
  { label: "Progress tracking (strength, body, adherence, photos)", verified: false, pro: true },
  { label: "Messaging — text, voice notes, form replies", verified: false, pro: true },
  { label: "Client portal (browser, no app install)", verified: false, pro: true },
  { label: "Coaching notes & client history timeline", verified: false, pro: true },
  { label: "Accountability & next-action queue", verified: false, pro: true },
  { label: "Automations & onboarding sequences", verified: false, pro: true },
  { label: "AI assist for drafting and summaries", verified: false, pro: true },
  { label: "Verified public profile & reviews", verified: true, pro: true },
];

const USE_CASES = [
  {
    title: "Personal trainers",
    body: "Plan sessions, track attendance, deliver programmes and nutrition — all connected to the booking.",
  },
  {
    title: "Online coaches",
    body: "Run remote clients end-to-end: programmes, check-ins, nutrition, messaging and progress from one place.",
  },
  {
    title: "Strength coaches",
    body: "Block periodisation, RPE logging, PR tracking and athlete feedback without a spreadsheet stack.",
  },
  {
    title: "Transformation coaches",
    body: "Macros, weekly check-ins, measurements, photos and habits — with proper continuity.",
  },
  {
    title: "Small-group coaches",
    body: "Deliver structured programming while still tracking individual progress, not just the class.",
  },
  {
    title: "Studio teams",
    body: "Coaching standards stay consistent across multiple coaches and shared clients.",
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
      <ProgrammeSection />
      <ExerciseLibrarySection />
      <NutritionSection />
      <WearablesSection />
      <CheckinsSection />
      <ProgressSection />
      <MessagingSection />
      <PortalSection />
      <NotesSection />
      <AccountabilitySection />
      <AutomationsSection />
      <TemplatesSection />
      <AISection />
      <TierMatrixSection />
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
        <div className="max-w-[720px]">
          <MarketingHeroEyebrow
            icon={Workflow}
            style={{ animationDuration: "560ms", animationFillMode: "both" }}
          >
            Coaching · The client delivery layer of REPs Pro
          </MarketingHeroEyebrow>

          <h1
            className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[60px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            Deliver better coaching{" "}
            <span className="text-reps-orange">from one connected platform.</span>
          </h1>

          <p
            className="mt-6 max-w-[640px] animate-fade-in text-[16px] leading-relaxed text-white/80"
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
              href="#programme"
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

// =============================================================================
// 2. Problem split — Six apps vs One workspace
// =============================================================================

const SCATTERED_CHECKLIST = [
  "Programmes in a workout app",
  "Nutrition in MyFitnessPal",
  "Check-ins on WhatsApp",
  "Progress photos in camera rolls",
  "Sleep & steps in another app",
  "Notes buried in DMs",
];

const CONNECTED_CHECKLIST = [
  "Programmes built next to the client record",
  "Nutrition, macros and meals in the same workspace",
  "Sleep, steps and training data flow in from their wearable",
  "Check-ins arrive in one inbox, scored against the goal",
  "Messages, voice notes and form replies in one thread per client",
  "Accountability surfaces clients before they go quiet",
];

function ProblemSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The fragmented coaching stack"
          heading="Most coaches don't struggle to coach. They struggle to deliver consistently."
          lede="Programmes in Trainerize, nutrition in MyFitnessPal, check-ins in WhatsApp, sleep data on the watch, photos in a camera roll, notes in DMs, accountability in your head. Your coaching shouldn't depend on six apps and a good memory."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Scattered column */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <X className="h-3 w-3" /> Today, without REPs Coaching
            </span>
            <BlockHeading className="mt-4">Six apps. One overwhelmed coach.</BlockHeading>
            <ul className="mt-6 space-y-2.5">
              {SCATTERED_CHECKLIST.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 rounded-[16px] border border-reps-border/70 bg-reps-ink/60 px-4 py-3 text-[13.5px] text-white/70"
                >
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[13px] leading-relaxed text-white/55">
              The work happens, but the system that should hold it together doesn't exist — so
              clients slip, history disappears and quality depends on memory.
            </p>
          </div>

          {/* Connected column */}
          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
              <Check className="h-3 w-3" /> With REPs Coaching
            </span>
            <BlockHeading className="mt-4">One workspace. Every client connected.</BlockHeading>
            <ul className="mt-6 space-y-2.5">
              {CONNECTED_CHECKLIST.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 rounded-[16px] border border-reps-orange-border/60 bg-reps-orange-soft/30 px-4 py-3 text-[13.5px] text-white/85"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[13px] leading-relaxed text-white/70">
              Operations gets the client organised. Coaching helps you{" "}
              <span className="italic text-white">deliver the result.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Sarah ribbon — used above sections that walk through her record
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
// 3. Programme delivery
// =============================================================================

function ProgrammeSection() {
  return (
    <section id="programme" className="scroll-mt-24 border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SarahRibbon />
        <SectionHeader
          eyebrow="Programme delivery"
          heading="Build structured coaching plans clients can actually follow."
          lede="A programme builder shaped for fitness, not a generic workout list. Block, week and session structure with sets, reps, tempo, rest and load — adapted per client and saved as templates so a new client never starts from a blank page."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          {/* Bullet column */}
          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <BlockHeading>The coaching command centre, not a workout list.</BlockHeading>
            <ul className="mt-6 space-y-2.5 text-[14px] text-white/75">
              {PROGRAMME_BULLETS.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

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
                      <p className="text-[12.5px] text-white/55">
                        {row.scheme} · rest {row.rest}
                      </p>
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
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 4. Exercise library
// =============================================================================

function ExerciseLibrarySection() {
  const featured = exerciseLib.exercises.slice(0, 8);
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Exercise library"
          heading="10,000+ exercises with video demos — built into the programme builder."
          lede="Filter by movement, equipment or muscle group. Add to a programme in one click. Every exercise carries cues, regressions and progressions so the client knows what 'good' looks like — without you re-recording the same video ten times."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* Library mock */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px] font-semibold text-white">Exercise library</p>
              <span className="text-[12px] text-white/45">
                10,000+ exercises · 8 equipment types
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {["All", "Quads", "Hamstrings", "Glutes", "Back", "Chest", "Core", "Mobility"].map(
                (m, i) => (
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
                ),
              )}
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

          {/* Bullets */}
          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <BlockHeading>One library. Every programme. Every client.</BlockHeading>
            <p className="mt-3 text-[14px] leading-relaxed text-white/70">
              Search by name, filter by category, drop straight into Thursday's session. The same
              library powers programme building, the client portal demos and AI programme drafts —
              so cueing stays consistent across every coach in the studio.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] text-white/75">
              {LIBRARY_BULLETS.map((line) => (
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
// 5. NUTRITION — UNCHANGED (locked Sarah ribbon + Manual/Templates/AI triad + ApprovalStrip)
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
            list={[
              "Clone and personalise in seconds",
              "Tag by goal and dietary style",
              "Studio-wide template library",
            ]}
          />
          <MealModeCard
            badge="AI draft"
            icon={Sparkles}
            title="AI-assisted draft"
            body="AI drafts a plan from intake, goal, food preferences, allergies, schedule and cooking ability. You edit and approve."
            list={[
              "Draft in under 30 seconds",
              "Respects allergies and exclusions",
              "Always opens in edit mode",
            ]}
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
// 6. Habits & wearables
// =============================================================================

const WEARABLE_VENDORS = ["Apple Health", "Garmin", "Whoop", "Fitbit"];

function WearablesSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Habits & wearables"
          heading="Sleep, steps and training data flow into the check-in — automatically."
          lede="Apple Health, Garmin, Whoop and Fitbit sync directly into the client's record. You see the week without asking 'how's sleep been?' Habits become trackable, patterns become visible, and the conversation moves from chasing data to coaching the person."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-10">
          {/* Bullets + vendors */}
          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <BlockHeading>The week shows up on its own. You spend the call coaching.</BlockHeading>
            <p className="mt-3 text-[14px] leading-relaxed text-white/70">
              When sleep, steps, hydration and sessions sync from the wrist, you stop spending half
              the check-in chasing data. You start the call already knowing the week — and use the
              conversation to coach the response, not collect the inputs.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {WEARABLE_VENDORS.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1.5 rounded-full border border-reps-border bg-reps-ink/70 px-3 py-1.5 text-[12.5px] font-semibold text-white/75"
                >
                  <Watch className="h-3.5 w-3.5 text-reps-orange" />
                  {v}
                </span>
              ))}
            </div>

            <ul className="mt-6 space-y-2.5 text-[14px] text-white/75">
              {WEARABLE_BULLETS.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Weekly view mock */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Wearable summary · Sarah K. · Week 6
                </p>
                <p className="mt-1 text-[15px] font-semibold text-white">Auto-synced from Apple Health</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> On track
              </span>
            </div>

            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              <WearableTile icon={Moon} label="Sleep" value="7h 12m avg" sub="6 of 7 nights ≥ 7h" />
              <WearableTile icon={Footprints} label="Steps" value="8,940 / day" sub="Target 8,000" />
              <WearableTile icon={HeartPulse} label="Resting HR" value="58 bpm" sub="−3 vs week 1" />
              <WearableTile icon={Activity} label="Sessions" value="3 / 3" sub="Mon · Wed · Fri" />
            </ul>

            <div className="mt-5 rounded-[16px] border border-reps-orange-border/60 bg-reps-orange-soft/30 px-4 py-3">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
                Pattern surfaced
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-white/80">
                Sleep dropped to 5h 40m Thursday — followed by Friday squat session feedback "felt
                heavy". Same pattern in week 3.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WearableTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <li className="rounded-[16px] border border-reps-border bg-reps-ink/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
          {label}
        </p>
        <Icon className="h-4 w-4 text-reps-orange" />
      </div>
      <p className="mt-1.5 text-[15.5px] font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-[12px] text-white/55">{sub}</p>
    </li>
  );
}

// =============================================================================
// 7. Client check-ins
// =============================================================================

const INBOX_ITEMS: {
  initials: string;
  name: string;
  status: "pending" | "replied" | "flagged";
  meta: string;
}[] = [
  { initials: "SK", name: "Sarah K.", status: "pending", meta: "Week 6 · 145P · adherence 92%" },
  { initials: "MT", name: "Marcus T.", status: "flagged", meta: "Adherence 50% · low energy" },
  { initials: "PR", name: "Priya R.", status: "pending", meta: "Week 3 · first deload" },
  { initials: "DS", name: "Daniel S.", status: "replied", meta: "Reply sent · Tue 9:14am" },
  { initials: "HJ", name: "Helen J.", status: "pending", meta: "Phase 3 ends in 6 days" },
];

function CheckinsSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Client check-ins"
          heading="Check-ins turn coaching from a programme into a relationship."
          lede="A weekly cadence with goal review built in. Mood, energy, sleep, adherence, training feedback, nutrition and habit data — submitted by the client, reviewed in one inbox, with your response saved on their record."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* Inbox mock */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Check-in inbox · This week
                </p>
                <p className="mt-1 text-[15px] font-semibold text-white">
                  5 to review · ordered by priority
                </p>
              </div>
              <Inbox className="h-5 w-5 text-reps-orange" />
            </div>

            <div className="mt-4 flex gap-2">
              {["Pending (3)", "Replied (1)", "Flagged (1)"].map((tab, i) => (
                <button
                  key={tab}
                  type="button"
                  className={
                    i === 0
                      ? "rounded-full bg-reps-orange px-3 py-1 text-[12px] font-semibold text-white"
                      : "rounded-full border border-reps-border bg-reps-ink/60 px-3 py-1 text-[12px] font-semibold text-white/65 hover:bg-white/5"
                  }
                >
                  {tab}
                </button>
              ))}
            </div>

            <ul className="mt-5 space-y-2.5">
              {INBOX_ITEMS.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between rounded-[16px] border border-reps-border bg-reps-ink/70 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-bold text-reps-orange">
                      {c.initials}
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold text-white">{c.name}</p>
                      <p className="text-[12.5px] text-white/55">{c.meta}</p>
                    </div>
                  </div>
                  <CheckinStatus status={c.status} />
                </li>
              ))}
            </ul>
          </div>

          {/* Bullets */}
          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <BlockHeading>One inbox. Every client's week, in order of priority.</BlockHeading>
            <p className="mt-3 text-[14px] leading-relaxed text-white/70">
              Check-ins replace the WhatsApp scroll with a structured weekly review. You see who's
              submitted, who's overdue, and where to focus first — without remembering who said
              what.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] text-white/75">
              {CHECKIN_BULLETS.map((line) => (
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

function CheckinStatus({ status }: { status: "pending" | "replied" | "flagged" }) {
  if (status === "replied") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
        <CheckCircle2 className="h-3 w-3" /> Replied
      </span>
    );
  }
  if (status === "flagged") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold text-reps-orange">
        <Flag className="h-3 w-3" /> Flagged
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-border bg-reps-ink/70 px-2.5 py-1 text-[11px] font-medium text-white/70">
      <Mail className="h-3 w-3" /> Pending
    </span>
  );
}

// =============================================================================
// 8. Progress tracking — 4 lenses + stat grid
// =============================================================================

function ProgressSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SarahRibbon />
        <SectionHeader
          eyebrow="Progress tracking"
          heading="Clients stay engaged when they can see progress, not just feel it."
          lede="Strength, body composition, adherence and consent-based progress photos — all tracked against the same client record. Not a vibe, not a memory, not three different exports."
        />

        {/* 4 lens tabs */}
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRESS_LENSES.map((l) => {
            const Icon = l.icon;
            return (
              <div
                key={l.label}
                className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    {l.label}
                  </p>
                  <Icon className="h-4 w-4 text-reps-orange" />
                </div>
                <p className="mt-2 font-display text-[22px] font-bold text-white">{l.value}</p>
                <p className="mt-0.5 text-[12.5px] text-white/55">{l.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Detail stat grid w/ sparklines */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-5">
          {[
            {
              label: "Bodyweight trend",
              value: "−2.1 kg",
              sub: "6-week avg pace 0.35 kg/wk",
              icon: ChartLine,
            },
            {
              label: "Squat 5RM",
              value: "+7.5 kg",
              sub: "75 → 82.5 kg since week 1",
              icon: Dumbbell,
            },
            {
              label: "Workout adherence",
              value: "92%",
              sub: "11 of 12 sessions completed",
              icon: Activity,
            },
            {
              label: "Meal-plan adherence",
              value: "82%",
              sub: "Rolling 4-week average",
              icon: Apple,
            },
            {
              label: "Waist measurement",
              value: "−1.2 cm",
              sub: "Last 4 weeks",
              icon: Gauge,
            },
            { label: "Habits", value: "5 / 7", sub: "Best week to date", icon: Target },
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
          Progress photos are encrypted, client-consented and never appear on your public profile.
          REPs reports adherence and trend — outcomes belong to the coach–client relationship.
        </p>
      </div>
    </section>
  );
}

// =============================================================================
// 9. Messaging
// =============================================================================

function MessagingSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Messaging"
          heading="One thread per client. Text, voice and form replies in the same place."
          lede="Stop running a WhatsApp / Instagram / text-message juggle for every client. REPs messaging is built into the client record — text, voice notes up to 3 minutes, and check-in form replies all live in one thread you can search."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          {/* Bullets */}
          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <BlockHeading>The conversation, the context and the coaching — together.</BlockHeading>
            <p className="mt-3 text-[14px] leading-relaxed text-white/70">
              When the message thread, the check-in answers and the programme history all live
              together, you stop saying "remind me again..." and start coaching the next thing.
              Voice notes give you the human tone without screen time.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] text-white/75">
              {MESSAGING_BULLETS.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Thread mock */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-reps-orange-soft text-[13px] font-bold text-reps-orange">
                  SK
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-white">Sarah K.</p>
                  <p className="text-[12px] text-white/55">Week 6 · 3 unread</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                One thread
              </span>
            </div>

            <ul className="mt-5 space-y-3">
              <ThreadBubble
                from="client"
                kind="form"
                body="Check-in submitted · adherence 92% · mood 7 · sleep 6"
              />
              <ThreadBubble
                from="coach"
                body="Strong week. Holding programme — adding a faster Friday breakfast swap."
              />
              <ThreadBubble
                from="coach"
                kind="voice"
                body="Voice note · 1m 22s · 'Photo expectations at week 6 — listen 👇'"
              />
              <ThreadBubble
                from="client"
                body="Got it. Photos look the same to me but waist tape is down."
              />
            </ul>

            <div className="mt-5 flex items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink/70 px-3 py-2.5">
              <Mic className="h-4 w-4 text-reps-orange" />
              <p className="flex-1 text-[12.5px] text-white/55">
                Type a reply or hold to record up to 3 minutes
              </p>
              <button
                type="button"
                className="rounded-[8px] bg-reps-orange px-3 py-1 text-[12px] font-semibold text-white"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ThreadBubble({
  from,
  kind,
  body,
}: {
  from: "client" | "coach";
  kind?: "voice" | "form";
  body: string;
}) {
  const isCoach = from === "coach";
  return (
    <li className={`flex ${isCoach ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-[16px] px-4 py-2.5 text-[13px] leading-relaxed ${
          isCoach
            ? "bg-reps-orange-soft/40 text-white/90"
            : kind === "form"
            ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
            : "border border-reps-border bg-reps-ink/70 text-white/75"
        }`}
      >
        {kind === "voice" ? (
          <span className="inline-flex items-center gap-2">
            <Mic className="h-3.5 w-3.5" /> {body}
          </span>
        ) : kind === "form" ? (
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> {body}
          </span>
        ) : (
          body
        )}
      </div>
    </li>
  );
}

// =============================================================================
// 10. Client portal view
// =============================================================================

function PortalSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The client view"
          heading="Give clients a clear place to see what they need to do next."
          lede="A branded client portal — accessed in the browser by magic link, no app install — showing their programme, nutrition, next session, check-in, progress and your latest message. The same record, from their side."
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
                {PORTAL_TILES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <div
                      key={t.label}
                      className="rounded-[12px] border border-reps-border bg-reps-panel/60 p-3"
                    >
                      <Icon className="h-4 w-4 text-reps-orange" />
                      <p className="mt-2 text-[12.5px] font-semibold text-white">{t.label}</p>
                      <p className="mt-0.5 text-[11px] text-white/55">{t.sub}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="self-center rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <BlockHeading>What the client sees, on purpose.</BlockHeading>
            <p className="mt-3 text-[14px] leading-relaxed text-white/70">
              The portal is intentionally small. Four things every week: what's next, my programme,
              my check-in, my progress. No social feed, no leaderboard, no noise — just enough to
              make the coaching tangible between sessions.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] text-white/75">
              {PORTAL_BULLETS.map((line) => (
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
// 11. Coaching notes & client context
// =============================================================================

function NotesSection() {
  const timeline = [
    { when: "Week 6", what: "Check-in: on track. Programme held. Breakfast swap added." },
    { when: "Week 5", what: "Programme phase 2 started — squats 4×6 @ RPE 7." },
    { when: "Week 4", what: "Mid-block review: −1.6 kg, sleep variable. Caffeine cut after 2pm." },
    { when: "Week 2", what: "Meal plan adjusted: more flexible lunches; protein floor 145g." },
    { when: "Week 1", what: "Onboarding: history of yo-yo dieting; preference for evening training." },
    { when: "Day 0", what: "Intake: 76.7 kg, 83.2 cm waist. PAR-Q clear. No allergies." },
  ];
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Coaching notes & client context"
          heading="Coach with context, not guesswork."
          lede="Open a client and see the full coaching picture: goals, training history, injuries, coach notes, check-in history, programme history, nutrition trends and a progress timeline. The continuity you wish you had after six months of growth."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-10">
          {/* Profile card */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-6">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-[16px] bg-reps-orange-soft text-[18px] font-bold text-reps-orange">
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
                <div
                  key={k}
                  className="rounded-[12px] border border-reps-border bg-reps-ink/70 px-3 py-2.5"
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    {k}
                  </dt>
                  <dd className="mt-1 text-[13.5px] text-white/85">{v}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-6 space-y-2 text-[13.5px] text-white/75">
              {NOTES_BULLETS.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {line}
                </li>
              ))}
            </ul>
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
// 12. Accountability & next actions
// =============================================================================

function AccountabilitySection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Accountability & next actions"
          heading="The best coaching systems show you who needs support before they disappear."
          lede="A needs-attention queue built from real coaching signals — not a generic to-do list. Overdue check-ins, low adherence, ending programmes, milestones to celebrate."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          {/* Pull-line */}
          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <BlockHeading>Retention is built between sessions, not during them.</BlockHeading>
            <p className="mt-4 text-[14px] leading-relaxed text-white/70">
              Clients rarely cancel because of one bad week. They drift because the small signals
              — a missed check-in, a quiet ten days, a flat progress chart — went unanswered. REPs
              Coaching surfaces those signals while there's still time to respond.
            </p>
          </div>

          {/* Flag queue */}
          <ul className="space-y-3">
            {ACCOUNTABILITY_FLAGS.map((f) => {
              const Icon = f.icon;
              return (
                <li
                  key={f.label}
                  className="flex items-center gap-4 rounded-[16px] border border-reps-border bg-reps-panel/40 p-4"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-white">{f.label}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-white/55">{f.trigger}</p>
                  </div>
                  <button
                    type="button"
                    className="hidden shrink-0 items-center gap-1.5 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft/60 px-3 py-1.5 text-[12px] font-semibold text-reps-orange hover:bg-reps-orange-soft sm:inline-flex"
                  >
                    {f.action} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 13. Automations
// =============================================================================

function AutomationsSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Automations"
          heading="The repeatable parts of coaching, on a schedule you wrote."
          lede="Onboarding sequences, re-engagement flows and session reminders — pre-built, editable per client, triggered by real coaching events. The repeatable bits run themselves so you spend your time on the bits that actually need a coach."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AUTOMATIONS.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-4 text-[15px] font-semibold text-white">{a.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{a.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-[22px] border border-emerald-400/30 bg-emerald-500/10 p-7">
          <p className="font-display text-[22px] font-bold leading-[1.2] text-white lg:text-[26px]">
            Set it once, edit before it sends — never blasted.
          </p>
          <p className="mt-3 max-w-[760px] text-[14px] leading-relaxed text-white/70">
            Every step is a draft you review. Welcome a new client without it feeling automated.
            Nudge a quiet client without it feeling robotic. Celebrate a PB without remembering
            whose week it was.
          </p>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 14. Templates & repeatable delivery
// =============================================================================

function TemplatesSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Templates & repeatable delivery"
          heading="A repeatable coaching standard — without making every client feel generic."
          lede="Programme frameworks, nutrition plans, check-in formats, onboarding flows, automations and messaging — saved once, personalised per client. Quality stops depending on which morning you built it."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <li
                key={t.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-4 text-[15px] font-semibold text-white">{t.title}</p>
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
// 15. AI assist
// =============================================================================

function AISection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="AI assist"
          heading="AI drafts the first version. You coach the result."
          lede="No buzzwords. AI inside REPs drafts programmes from a client's goals and screening, summarises a week of check-ins so you can scan 14 clients in a minute, and suggests reply wording you can edit. Every output is a draft — nothing sends without you."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_ASSISTS.map((a) => {
            const Icon = a.icon;
            return (
              <li
                key={a.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-4 text-[15px] font-semibold text-white">{a.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{a.body}</p>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 rounded-[22px] border border-emerald-400/30 bg-emerald-500/10 p-7">
          <p className="font-display text-[22px] font-bold leading-[1.2] text-white lg:text-[26px]">
            An assistant, not a substitute.
          </p>
          <p className="mt-3 max-w-[760px] text-[14px] leading-relaxed text-white/70">
            Coaching judgement is yours. REPs AI handles the busywork — the first programme draft,
            the check-in triage, the reply that would have taken you ten minutes to write at
            midnight. You stay in the driver's seat.
          </p>
          <ol className="mt-6 flex flex-wrap items-center gap-2">
            {[
              { label: "AI drafts", icon: Sparkles },
              { label: "Coach reviews", icon: NotebookPen },
              { label: "Coach approves", icon: CheckCircle2, status: true as const },
              { label: "Client sees output", icon: Smartphone },
            ].map((s, i, arr) => {
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
                  {i < arr.length - 1 ? <ArrowRight className="h-3.5 w-3.5 text-white/30" /> : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 16. Verified vs Pro — matrix
// =============================================================================

function TierMatrixSection() {
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
            price="£99 / yr"
            blurb="Public verified profile, directory presence, reviews and a basic enquiry inbox. No programme builder, nutrition, check-ins, progress tracking or client view."
            cta={{ to: "/pricing", label: "See what Verified covers" }}
          />
          <TierCard
            badge="Pro · Founding £59 / mo"
            price="Includes Verified"
            blurb="Everything in Verified, plus the full Coaching workspace — programmes, exercise library, nutrition, habits & wearables, check-ins, progress, messaging, client view, accountability, automations and AI assist."
            cta={{ to: "/pricing", label: "See Pro pricing" }}
            highlighted
          />
        </div>

        {/* Capability matrix */}
        <div className="mt-10 overflow-x-auto rounded-[22px] border border-reps-border bg-reps-panel/40">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-reps-border text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                <th className="px-6 py-4">Coaching capability</th>
                <th className="w-[120px] px-4 py-4 text-center">Verified</th>
                <th className="w-[120px] px-4 py-4 text-center">Pro</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX_ROWS.map((row, i) => (
                <tr
                  key={row.label}
                  className={i % 2 === 1 ? "bg-reps-ink/30" : undefined}
                >
                  <td className="px-6 py-3.5 text-[13.5px] text-white/80">{row.label}</td>
                  <td className="px-4 py-3.5 text-center">
                    {row.verified ? (
                      <CheckCircle2 className="mx-auto h-4 w-4 text-reps-orange" />
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {row.pro ? (
                      <CheckCircle2 className="mx-auto h-4 w-4 text-reps-orange" />
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 17. Built for every coaching model
// =============================================================================

function UseCasesSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Built for every coaching model"
          heading="What Coaching looks like for…"
          lede="The workspace stays the same. The delivery flexes to how you actually coach — 1:1, online, strength, transformation, small-group or studio team."
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

// Keep Star reserved for future review/rating callouts so tree-shaking doesn't
// drop the import while we iterate on the page copy.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _reserved = { Star, LineChart };
