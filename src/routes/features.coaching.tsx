import { createFileRoute, Link } from "@tanstack/react-router";
import { getCoachingExerciseShowcase } from "@/lib/exercisedb.functions";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Camera,
  Check,
  ClipboardList,
  Dumbbell,
  Eye,
  FileText,
  HeartPulse,
  LineChart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Store,
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
import { HeroOverlay } from "@/components/marketing/HeroOverlay";
import {
  AiAssistMock,
  CheckInsInboxMock,
  ClientPortalInteractiveMock,
  ExerciseLibraryMock,
  NutritionMock,
  ProgrammeMock,
  ProgressMock,
} from "@/components/marketing/coaching/InteractiveMocks";

import heroCoaching from "@/assets/hero-coaching-bg.jpg.asset.json";

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

const PROBLEM_FRAGMENTS = [
  { icon: Dumbbell, label: "Programmes in spreadsheets" },
  { icon: FileText, label: "Exercise demos sent as link dumps" },
  { icon: Utensils, label: "Meal ideas copy-pasted from old docs" },
  { icon: MessageSquare, label: "Check-ins lost in DMs" },
  { icon: Camera, label: "Progress photos in a camera roll" },
  { icon: Watch, label: "Sleep & sessions in another app" },
];

const PROBLEM_ORGANISED = [
  "Programmes, exercises and notes on one client record",
  "Nutrition library and meal plan templates you control",
  "Weekly check-ins arrive in one prioritised inbox",
  "Progress — lifts, body, adherence, photos — all in one timeline",
  "AI drafts the busywork; you review every output before it sends",
  "Coaching delivery wired to your REPs profile, Shop Front and bookings",
];

const PROGRAMME_BULLETS = [
  "Block, week and session structure — not a flat workout list",
  "Sets, reps, tempo, rest, load and exertion targets per exercise",
  "Coach notes and cues attached to the exercise, not the client memory",
  "Progression carried session to session — not re-typed each week",
  "Goal-linked, so every block ladders up to what the client signed up for",
  "Reusable templates so a new client never starts from a blank page",
];

const LIBRARY_BULLETS = [
  "Filter by body part, target muscle, equipment, difficulty or movement",
  "Cues, regressions and progressions on every exercise",
  "HD video demos so clients know what 'good' looks like",
  "Upload your own exercises and videos alongside the library",
  "Add to a session in one click — no copy-paste",
  "Same library powers your programmes, client view and AI drafts",
];

const CLIENT_VIEW_BULLETS = [
  "Today's session, with sets, reps and coach notes",
  "Exercise instructions and video demo on the same screen",
  "Mark complete, log load, leave session feedback",
  "Session history so they can see what they've done",
  "Mobile-friendly browser portal — no app store install",
  "Magic-link access from their check-in email — no extra password",
];

const PROGRESS_BULLETS = [
  "Strength: working weights and PB trends per lift",
  "Body: bodyweight and circumference trends with deltas",
  "Adherence: sessions completed, check-ins submitted, streaks",
  "Photos: opt-in, encrypted, client-only by default",
  "Weekly check-ins with mood, sleep, energy and training feedback",
  "Coach response and next action saved on the client record",
];

const NUTRITION_BULLETS = [
  "Meal plan templates you've built and approved",
  "Calorie and macro targets per client",
  "Dietary preferences, allergies and exclusions respected",
  "Shopping list and meal swaps generated from your library",
  "Habit targets — water, protein, steps — set per client",
  "Coach approval required before any plan reaches the client",
  "Client feedback and adherence tracked against the plan",
];

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
    title: "AI drafts the plan",
    body: "Set the client goal, calories, macros, days and dietary rules. REPs assembles a draft from your library only — never a random food database.",
  },
  {
    n: "3",
    icon: Check,
    title: "You review and sign off",
    body: "Swap meals, edit portions, add coach notes. Only approved plans reach the client — every decision logged on the record.",
  },
];

const AI_USES = [
  "Drafts a training block from goals, screening and last block's results",
  "Suggests regressions and progressions when a client struggles or plateaus",
  "Adapts a session around the equipment the client actually has today",
  "Summarises a week of check-ins so you can scan 14 clients in a minute",
  "Drafts client feedback you edit before sending — never auto-sent",
  "Generates meal plan drafts from your nutrition library, not the open web",
  "Suggests habit targets sized to the client's current week",
  "Flags clients who need attention before they go quiet",
];

const CONNECTED_TILES = [
  {
    icon: Eye,
    title: "Visibility",
    body: "Verified profile and search presence so the right clients find you.",
    to: "/features/visibility" as const,
  },
  {
    icon: Store,
    title: "Shop Front",
    body: "Your services, packages and offer presented as a real product page.",
    to: "/features/shop-front" as const,
  },
  {
    icon: Workflow,
    title: "Operations",
    body: "Enquiries, forms, bookings, payments and admin on the same record.",
    to: "/features/operations" as const,
  },
];

const FAQ_ITEMS = [
  {
    q: "Is this a replacement for Trainerize, TrueCoach or PT Distinction?",
    a: "For coaching delivery — yes. Programme builder with a structured exercise library, nutrition planning, weekly check-ins, progress tracking, client view and an AI assistant. The difference is REPs connects coaching delivery to the rest of your professional life: profile, enquiries, bookings and payments live on the same record.",
  },
  {
    q: "What does the nutrition feature actually do — and what does it not do?",
    a: "It helps a qualified fitness professional build meal plan templates, set calorie and macro targets, respect dietary preferences and exclusions, and assemble client-ready plans from a library you control. AI helps draft, you stay in control, the client sees only what you've signed off. It is not medical nutrition, treatment planning, disease-specific dieting, eating-disorder support or dietitian-level advice. Anything outside your professional scope is out of scope for the tool.",
  },
  {
    q: "How does AI show up — is this another AI-hype product?",
    a: "No. AI inside REPs drafts the first version and you coach the result. It drafts programmes, summarises check-ins, suggests reply wording and generates meal plan drafts from your library. Every output is a draft for you to review — nothing reaches the client without you signing it off.",
  },
  {
    q: "Where does the exercise library come from?",
    a: "REPs ships with a structured library of exercises with video demos, filtered by body part, muscle, equipment, difficulty, goal and movement pattern. You can also upload your own exercises and videos so your cueing stays consistent across every client.",
  },
  {
    q: "Do clients need to install an app?",
    a: "No. The client view is a browser portal accessed by magic link from their check-in or invite email. They see today's session, their programme, their nutrition plan, their progress and a direct line to you — without downloading anything.",
  },
  {
    q: "Which tier is this on?",
    a: "Coaching is included in REPs Pro and Studio. Verified gives you a public profile and discoverability, but the coaching workspace — programme builder, nutrition planning, check-ins, progress, client view and AI assistant — sits in Pro.",
  },
];

// -----------------------------------------------------------------------------
// Route
// -----------------------------------------------------------------------------

export const Route = createFileRoute("/features/coaching")({
  head: () => ({
    meta: [
      {
        title: "Coaching — Structured training & nutrition plans · REPs",
      },
      {
        name: "description",
        content:
          "Coach clients with structured training and nutrition plans from one connected coaching workspace. Programme builder, exercise library, AI-assisted nutrition, check-ins, progress tracking and a client view — included in REPs Pro.",
      },
      {
        property: "og:title",
        content: "Coach clients with structured training and nutrition plans — REPs",
      },
      {
        property: "og:description",
        content:
          "Programme builder, exercise library, coach-reviewed nutrition, check-ins, progress and a client view — every coaching delivery tool, in one workspace.",
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
      <ClientViewSection />
      <ProgressSection />
      <NutritionSection />
      <AiAssistSection />
      <ConnectedSection />

      <MarketingFaq
        eyebrow="Common questions"
        heading="What Coaching covers, and how it fits."
        items={FAQ_ITEMS}
      />

      <FinalCta
        heading="Deliver training and nutrition coaching"
        headingAccent="from one connected workspace."
        lede="Build programmes, assign workouts, support nutrition and track client progress inside REPs Pro."
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
        <div className="max-w-[720px]">
          <MarketingHeroEyebrow
            icon={Dumbbell}
            style={{ animationDuration: "560ms", animationFillMode: "both" }}
          >
            Coaching · Training, nutrition &amp; progress
          </MarketingHeroEyebrow>

          <h1
            className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[60px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            Coach clients with structured{" "}
            <span className="text-reps-orange">training and nutrition plans.</span>
          </h1>

          <p
            className="mt-6 max-w-[620px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            Build programmes, assign workouts, support nutrition, track progress and keep every
            client moving toward their goal — from one connected coaching workspace that also
            powers your REPs profile, Shop Front and bookings.
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
              href="#programme-builder"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              See the workspace
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
              <Zap className="h-4 w-4 text-reps-orange" /> No paid add-ons
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
          heading="Most coaches deliver training and nutrition across too many disconnected tools."
          lede="Programmes live in spreadsheets. Exercise demos are sent as link dumps. Meal ideas get copied from old documents. Check-ins happen in DMs. Progress photos, notes and targets are scattered everywhere. REPs brings coaching delivery into one system."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <X className="h-3 w-3" /> Today, without REPs Coaching
            </span>
            <BlockHeading className="mt-4">Six tools. One overwhelmed coach.</BlockHeading>
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
              clients slip, history disappears, and quality depends on memory.
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
              Operations runs the business. Coaching{" "}
              <em>delivers the result.</em>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 02. Programme builder
// -----------------------------------------------------------------------------

function ProgrammeSection({
  featured,
}: {
  featured: Awaited<ReturnType<typeof getCoachingExerciseShowcase>>["featured"];
}) {
  return (
    <section id="programme-builder" className="scroll-mt-24 border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Programme builder"
          heading="Build the plan once, then adjust it as the client progresses."
          lede="A programme builder shaped for coaching, not a generic workout list. Block, week and session structure with sets, reps, tempo, rest and load — adapted per client and saved as templates so a new client never starts from a blank page."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <ProgrammeMock featured={featured} />
          <BulletColumn
            heading="The coaching command centre, not a workout list."
            body="Open a client and see the whole block — where they are, what's next, how the last week went, what to progress. The programme lives next to the client record, not in an app that doesn't know about your bookings or payments."
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
          heading="A structured exercise library, built into the programme builder."
          lede="Filter by body part, target muscle, equipment, difficulty or movement pattern. Every exercise carries cues, regressions and progressions so the client knows what 'good' looks like — without you re-recording the same video ten times."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <ExerciseLibraryMock curated={curated} featured={featured} />
          <BulletColumn
            heading="One library. Every programme. Every client."
            body="Search by name, filter by category, drop straight into Thursday's session. The same library powers programme building, the client view and AI programme drafts — so the cueing stays consistent across every client."
            bullets={LIBRARY_BULLETS}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 04. Client workout delivery
// -----------------------------------------------------------------------------

function ClientViewSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Client workout delivery"
          heading="Clients shouldn't have to search through messages to know what to do next."
          lede="A browser-based client view showing today's session, exercise instructions, sets and reps, your coach notes, and a clean way to log the work. No app install, no extra password — just a magic link from their check-in email."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <ClientPortalInteractiveMock />
          <BulletColumn
            heading="What the client sees, on purpose."
            body="The view is intentionally small. What's next, my programme, my nutrition, my progress, a direct line to my coach. No social feed, no leaderboard, no noise — just enough to make the coaching tangible between sessions."
            bullets={CLIENT_VIEW_BULLETS}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 05. Progress tracking & check-ins
// -----------------------------------------------------------------------------

function ProgressSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Progress tracking &amp; check-ins"
          heading="Clients stay engaged when they can see progress, not just feel it."
          lede="Strength, body composition, adherence, photos, sleep, energy and weekly check-ins — all tracked against the same client record. Not a vibe, not a memory, not three different exports. One inbox, one timeline, one source of truth."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <div className="grid gap-6">
            <ProgressMock />
            <CheckInsInboxMock />
          </div>
          <BulletColumn
            heading="The week shows up on its own. You spend the call coaching."
            body="Check-ins replace the WhatsApp scroll with a structured weekly review. Progress lenses — strength, body, adherence, photos — each told as a story over time, not a screenshot. You start the call already knowing the week."
            bullets={PROGRESS_BULLETS}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 06. Nutrition coaching
// -----------------------------------------------------------------------------

function NutritionSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Nutrition coaching"
          heading="AI helps draft the plan. The coach stays in control."
          lede="Create coach-reviewed nutrition guidance, meal plan templates and client habit targets based on goals, preferences and your professional scope. Nothing reaches the client until you sign it off."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <NutritionMock />
          <BulletColumn
            heading="Coach-reviewed, never auto-sent."
            body="Build a nutrition library you trust, set the client's targets and dietary rules, and let REPs draft a plan from your approved set. You swap meals, edit portions and sign off before anything reaches the client."
            bullets={NUTRITION_BULLETS}
          />
        </div>

        <div className="mt-14 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-3">
          {NUTRITION_PARTS.flatMap(({ n, icon: Icon, title, body }, i) => {
            const card = (
              <div
                key={n}
                className="flex h-full flex-col rounded-[16px] border border-reps-border bg-reps-panel/40 p-5"
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
            );
            if (i === NUTRITION_PARTS.length - 1) return [card];
            return [
              card,
              <div
                key={`arrow-${n}`}
                className="hidden items-center justify-center md:flex"
                aria-hidden="true"
              >
                <ArrowRight className="size-4 text-white/35" />
              </div>,
            ];
          })}
        </div>

        <p className="mx-auto mt-10 max-w-[760px] rounded-[16px] border border-reps-border bg-reps-ink/60 p-5 text-[13px] leading-relaxed text-white/60">
          <ShieldCheck className="mr-2 inline h-4 w-4 -translate-y-0.5 text-white/55" />
          REPs nutrition tools are designed for qualified fitness professionals working within
          their scope of practice. They are not intended for medical or clinical nutrition,
          treatment of conditions, disease-specific dieting or eating-disorder support — those
          remain the remit of registered dietitians and other regulated professionals.
        </p>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 07. AI coaching assistant
// -----------------------------------------------------------------------------

function AiAssistSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="AI coaching assistant"
          heading="A coaching assistant, not a replacement coach."
          lede="No hype. AI inside REPs handles the busywork — first drafts, summaries, suggested wording, plan drafts — so you spend more time on the parts that need a coach. Every output is a draft for you to review."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
          <AiAssistMock />
          <div>
            <BlockHeading>An assistant, not a substitute.</BlockHeading>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/75">
              Coaching judgement is yours. REPs AI drafts a programme, summarises a week of
              check-ins, suggests reply wording and generates a meal plan from your library — then
              hands it back for you to review, edit and sign off.
            </p>
            <ul className="mt-5 space-y-2.5">
              {AI_USES.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 rounded-[16px] border border-reps-border bg-reps-panel/40 px-4 py-2.5 text-[13.5px] text-white/80"
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
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
// 08. Connected to the full REPs platform
// -----------------------------------------------------------------------------

function ConnectedSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="One connected platform"
          heading="Coaching is one pillar of a complete platform — not a tool stuck on the side."
          lede="A client can find you through Visibility, understand your offer through Shop Front, enquire and onboard through Operations, and receive structured coaching through this workspace — all on the same record."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTED_TILES.map(({ icon: Icon, title, body, to }) => (
            <Link
              key={title}
              to={to}
              className="group rounded-[18px] border border-reps-border bg-reps-panel/60 p-6 transition-colors hover:border-reps-orange-border hover:bg-reps-panel"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-[16px] font-bold text-white">{title}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{body}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-reps-orange">
                Explore {title.toLowerCase()} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Shared bullet column
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
      <ul className="mt-5 space-y-2.5">
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

// Suppress unused-import lint warnings for icons that may be reintroduced
void LineChart;
void HeartPulse;
void ClipboardList;
