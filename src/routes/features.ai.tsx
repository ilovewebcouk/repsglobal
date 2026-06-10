import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Cpu,
  Database,
  Dumbbell,
  Eye,
  Inbox,
  LineChart,
  ListChecks,
  Lock,
  MessageSquare,
  PencilLine,
  Salad,
  ScanLine,
  Shield,
  Sparkles,
  Star,
  Target,
  ToggleLeft,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { BlockHeading } from "@/components/marketing/BlockHeading";
import { TierCard } from "@/components/marketing/TierCard";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { HeroOverlay } from "@/components/marketing/HeroOverlay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import heroAi from "@/assets/hero-ai-bg.jpg.asset.json";

// =============================================================================
// Route
// =============================================================================

export const Route = createFileRoute("/features/ai")({
  head: () => ({
    meta: [
      {
        title:
          "REPs AI — The AI operating layer for fitness professionals",
      },
      {
        name: "description",
        content:
          "REPs AI helps you summarise client updates, draft next actions, review check-ins, support meal planning and stay on top of your fitness business — while keeping the professional in control. AI suggests. You decide.",
      },
      {
        property: "og:title",
        content: "REPs AI — The AI operating layer for fitness professionals",
      },
      {
        property: "og:description",
        content:
          "Embedded intelligence across your REPs profile, leads, clients, coaching, nutrition and workflow. AI suggests. You decide.",
      },
      { property: "og:image", content: heroAi.url },
      {
        property: "og:url",
        content: "https://repsglobal.lovable.app/features/ai",
      },
    ],
    links: [
      { rel: "canonical", href: "https://repsglobal.lovable.app/features/ai" },
    ],
  }),
  component: AiPillarPage,
});

// =============================================================================
// Page
// =============================================================================

function AiPillarPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <Hero />
      <ProblemSection />
      <AnatomySection />
      <WorkflowStrip />
      <DayInTheLifeSection />
      <AttentionSection />
      <CheckinsSection />
      <CoachingSection />
      <NutritionSection />
      <OperationsSection />
      <ProfileSection />
      <CommandCentreSection />
      <ControlSection />
      <NeverDoSection />
      <DataTrustStrip />
      <UseCasesSection />
      <TierComparisonSection />

      <MarketingFaq
        eyebrow="Common questions"
        heading="What REPs AI does — and what it deliberately doesn't."
        items={FAQ_ITEMS}
      />

      <FinalCta
        heading="Run your fitness business with"
        headingAccent=" clearer next actions."
        lede="Use REPs AI to summarise, draft, organise and act across your clients, coaching, nutrition and business workflow — while keeping you in control."
        primary={{ to: "/signup", label: "Start using REPs Pro" }}
        secondary={{ to: "/for-professionals", label: "Explore all features" }}
      />

      <PublicFooter />
    </div>
  );
}

// =============================================================================
// Hero — bespoke intelligence-layer composite
// =============================================================================

function Hero() {
  return (
    <section className="relative flex min-h-[680px] overflow-hidden lg:min-h-[820px]">
      <img
        src={heroAi.url}
        alt="REPs-verified coach reviewing AI-drafted client actions on a tablet at a premium boutique gym at dusk"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover object-center lg:object-right"
      />
      <HeroOverlay copySide="left" />

      <div className="relative mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-12 px-6 pt-24 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:pt-28 lg:pb-24">
        {/* Copy */}
        <div className="max-w-[680px]">
          <MarketingHeroEyebrow
            icon={Brain}
            style={{ animationDuration: "560ms", animationFillMode: "both" }}
          >
            REPs AI · The operating layer
          </MarketingHeroEyebrow>

          <h1
            className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[60px]"
            style={{
              animationDuration: "640ms",
              animationDelay: "80ms",
              animationFillMode: "both",
            }}
          >
            The AI operating layer for{" "}
            <span className="text-reps-orange">fitness professionals.</span>
          </h1>

          <p
            className="mt-6 max-w-[600px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{
              animationDuration: "640ms",
              animationDelay: "180ms",
              animationFillMode: "both",
            }}
          >
            Use REPs AI to summarise client updates, draft next actions, review
            check-ins, support meal planning, improve your profile and stay on
            top of the work that keeps your business moving.
          </p>

          <div
            className="mt-8 flex animate-fade-in flex-wrap gap-3"
            style={{
              animationDuration: "640ms",
              animationDelay: "260ms",
              animationFillMode: "both",
            }}
          >
            <Link
              to="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Start using REPs Pro <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#command-centre"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              See the command centre
            </a>
          </div>

          <ul
            className="mt-7 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70"
            style={{
              animationDuration: "640ms",
              animationDelay: "340ms",
              animationFillMode: "both",
            }}
          >
            <li className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-reps-orange" /> AI suggests. You
              decide.
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-reps-orange" /> Built around
              professional control
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Salad className="h-4 w-4 text-reps-orange" /> Nutrition drafts
              approved by the trainer
            </li>
          </ul>
        </div>

        {/* Bespoke intelligence-layer composite */}
        <div
          className="relative hidden animate-fade-in lg:block"
          style={{
            animationDuration: "640ms",
            animationDelay: "260ms",
            animationFillMode: "both",
          }}
        >
          <IntelligenceLayerComposite />
        </div>
      </div>
    </section>
  );
}

/**
 * Bespoke hero visual. NOT the standard AiCommandCentreMock-in-laptop.
 * A dim REPs dashboard in the back, three semi-transparent AI suggestion
 * cards floating in front, each connected by a hairline arc to the row it
 * is acting on. Approve / Edit / Dismiss controls visible on one card.
 */
function IntelligenceLayerComposite() {
  return (
    <div className="relative isolate">
      {/* warm glow */}
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[24px] bg-[radial-gradient(60%_55%_at_50%_35%,rgba(255,122,0,0.22),transparent_70%)] blur-2xl"
      />

      {/* Dim dashboard plate */}
      <div className="relative rounded-[22px] border border-reps-border bg-reps-panel/55 p-4 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)] backdrop-blur">
        {/* chrome */}
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-reps-orange shadow-[0_0_8px_rgba(255,122,0,0.8)]" />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/70">
              REPs · Today
            </span>
          </div>
          <span className="text-[10.5px] text-white/40">Mon 09:14</span>
        </div>

        {/* Underlying rows (dim, with target dots) */}
        <ul className="space-y-2">
          {DASHBOARD_ROWS.map((r) => (
            <li
              key={r.label}
              className="relative flex items-center justify-between rounded-[12px] border border-reps-border/70 bg-reps-ink/55 px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5 text-[12px] text-white/55">
                <r.icon className="h-3.5 w-3.5 text-white/45" />
                <span className="font-medium text-white/75">{r.label}</span>
                <span className="text-white/40">· {r.meta}</span>
              </div>
              {r.target ? (
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full bg-reps-orange shadow-[0_0_10px_rgba(255,122,0,0.9)]"
                />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-white/30" />
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Floating AI suggestion cards */}
      <SuggestionCard
        className="absolute -right-4 top-4 w-[260px] rotate-[2deg]"
        tone="orange"
        icon={MessageSquare}
        label="Suggested reply"
        title="Reply drafted for Maya R."
        body="Empathetic check-in noting her low sleep and 3-day adherence dip."
        showActions
      />
      <SuggestionCard
        className="absolute -left-6 top-1/2 w-[240px] -translate-y-1/2 -rotate-[3deg]"
        tone="neutral"
        icon={Salad}
        label="Meal plan draft"
        title="Lean cut · 1,950 kcal"
        body="Drafted from Tom's goals + allergies. Trainer review required."
      />
      <SuggestionCard
        className="absolute -right-6 bottom-2 w-[250px] rotate-[1.5deg]"
        tone="neutral"
        icon={AlertTriangle}
        label="At-risk client"
        title="Jordan K. — adherence 41%"
        body="Three sessions missed. Last check-in 11 days ago."
      />
    </div>
  );
}

const DASHBOARD_ROWS = [
  { icon: Inbox, label: "12 new enquiries", meta: "2 hot leads", target: true },
  {
    icon: ClipboardCheck,
    label: "6 check-ins this week",
    meta: "3 need a reply",
    target: true,
  },
  { icon: Salad, label: "Tom · meal plan", meta: "ending Sunday", target: true },
  {
    icon: TrendingUp,
    label: "Maya · adherence trend",
    meta: "down 2 weeks",
    target: false,
  },
  {
    icon: Users,
    label: "Jordan K.",
    meta: "no contact 11d",
    target: false,
  },
  {
    icon: Star,
    label: "8 clients eligible",
    meta: "for a review request",
    target: false,
  },
];

function SuggestionCard({
  className,
  tone,
  icon: Icon,
  label,
  title,
  body,
  showActions,
}: {
  className?: string;
  tone: "orange" | "neutral";
  icon: typeof MessageSquare;
  label: string;
  title: string;
  body: string;
  showActions?: boolean;
}) {
  return (
    <div
      className={`rounded-[16px] border p-3.5 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.85)] backdrop-blur ${
        tone === "orange"
          ? "border-reps-orange-border bg-gradient-to-br from-reps-orange-soft to-reps-panel/95"
          : "border-reps-border bg-reps-panel/95"
      } ${className ?? ""}`}
    >
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 text-[13px] font-bold text-white">{title}</div>
      <p className="mt-1 text-[11.5px] leading-snug text-white/65">{body}</p>
      {showActions ? (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="rounded-[8px] bg-reps-orange px-2 py-1 text-[10.5px] font-semibold text-white">
            Approve
          </span>
          <span className="rounded-[8px] border border-white/20 px-2 py-1 text-[10.5px] font-semibold text-white/85">
            Edit
          </span>
          <span className="rounded-[8px] border border-white/15 px-2 py-1 text-[10.5px] font-semibold text-white/60">
            Dismiss
          </span>
        </div>
      ) : null}
    </div>
  );
}

// =============================================================================
// 1. Problem
// =============================================================================

function ProblemSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The problem"
          heading="Most trainers don't need more apps. They need a clearer view of what needs attention."
          lede="Leads go cold. Check-ins pile up. Client notes become scattered. Meal plans take too long to build. Progress trends are missed. Reviews are forgotten. Follow-ups depend on memory. REPs AI turns the information already inside the platform into practical next actions."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PROBLEM_TILES.map((t) => (
            <div
              key={t.title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-panel text-white/55">
                <t.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-[18px] font-bold text-white">
                {t.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">
                {t.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-[760px] text-[17px] leading-snug text-white/85">
          The value of AI is not another chat box.{" "}
          <span className="text-reps-orange">
            It is knowing what to do next.
          </span>
        </p>
      </div>
    </section>
  );
}

const PROBLEM_TILES = [
  {
    icon: Inbox,
    title: "Leads go cold",
    body: "Enquiries pile up across DMs, your profile and email. The hottest ones get lost in the noise.",
  },
  {
    icon: ClipboardList,
    title: "Check-ins pile up",
    body: "Six clients submitted updates this week. By Friday you've forgotten what the first one said.",
  },
  {
    icon: Brain,
    title: "Trends get missed",
    body: "Adherence is slipping. Mood is dropping. By the time you notice, the client is already drifting.",
  },
];

// =============================================================================
// 2. Anatomy of an AI suggestion — the page's signature moment
// =============================================================================

function AnatomySection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Anatomy of an AI suggestion"
          heading="Every AI suggestion shows its working."
          lede="You see what it read, what it noticed and what it drafted — then you approve, edit or dismiss. Nothing reaches a client without you."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:gap-10">
          {/* The card */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-6 lg:p-8">
            <div className="grid gap-5 lg:grid-cols-4">
              <AnatomyZone
                step={1}
                label="What it read"
                tint="neutral"
              >
                <p className="text-[12.5px] italic leading-relaxed text-white/70">
                  &ldquo;Tough week. Sleep has been awful. Skipped Wednesday's
                  session, did Friday on autopilot. Food's been okay-ish.
                  Honestly losing motivation.&rdquo;
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Maya R. · Check-in #14
                </p>
              </AnatomyZone>

              <AnatomyZone
                step={2}
                label="What it noticed"
                tint="neutral"
              >
                <ul className="space-y-1.5 text-[12.5px] text-white/80">
                  <li className="flex items-start gap-1.5">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-reps-orange" />
                    Mood down 2 consecutive weeks
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-reps-orange" />
                    Adherence 54% (was 82%)
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-reps-orange" />
                    Sleep flagged 3 weeks running
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-reps-orange" />
                    Motivation language: at-risk
                  </li>
                </ul>
              </AnatomyZone>

              <AnatomyZone
                step={3}
                label="What it drafted"
                tint="neutral"
              >
                <p className="text-[12.5px] leading-relaxed text-white/80">
                  &ldquo;Maya — appreciate you being honest. Let's pull
                  Wednesday's session back this week and keep the rest light.
                  I'll add a sleep check to Monday's plan. You've still showed
                  up — that matters.&rdquo;
                </p>
              </AnatomyZone>

              <AnatomyZone
                step={4}
                label="You decide"
                tint="orange"
              >
                <div className="flex flex-wrap gap-1.5">
                  <Badge className="rounded-[8px] bg-reps-orange text-white hover:bg-reps-orange-hover">
                    Approve
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-[8px] border-white/25 text-white"
                  >
                    Edit
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-[8px] border-white/15 text-white/60"
                  >
                    Dismiss
                  </Badge>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-white/50">
                  Logged to Maya's client record with timestamp and source.
                </p>
              </AnatomyZone>
            </div>
          </div>

          {/* Principle column */}
          <div className="flex flex-col justify-center gap-5 rounded-[22px] border border-reps-orange-border bg-reps-orange-soft/40 p-7">
            <Sparkles className="h-7 w-7 text-reps-orange" />
            <BlockHeading>AI suggests. You decide.</BlockHeading>
            <p className="text-[14.5px] leading-relaxed text-white/80">
              REPs AI never sends to a client by itself. Every draft, summary
              and alert is a working document for you to approve, edit or
              dismiss — with the source it came from attached.
            </p>
            <ul className="space-y-2 text-[13.5px] text-white/75">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                Source-linked: every suggestion shows what it read
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                Audit log on every approve / edit / dismiss
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                Per-client AI toggle if a client opts out
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnatomyZone({
  step,
  label,
  tint,
  children,
}: {
  step: number;
  label: string;
  tint: "neutral" | "orange";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative rounded-[16px] border p-4 ${
        tint === "orange"
          ? "border-reps-orange-border bg-reps-orange-soft/40"
          : "border-reps-border bg-reps-ink/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
            tint === "orange"
              ? "bg-reps-orange text-white"
              : "bg-reps-orange-soft text-reps-orange"
          }`}
        >
          {step}
        </span>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/55">
          {label}
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

// =============================================================================
// 3. Workflow strip
// =============================================================================

const WORKFLOW_STAGES = [
  { stage: "Profile", help: "Spot gaps and suggest stronger copy" },
  { stage: "Shop Front", help: "Improve service descriptions and CTAs" },
  { stage: "Leads", help: "Score intent and draft first replies" },
  { stage: "Onboarding", help: "Summarise intake forms and flag missing info" },
  { stage: "Coaching", help: "Turn notes into structured session plans" },
  { stage: "Nutrition", help: "Draft meal plans for trainer approval" },
  { stage: "Check-ins", help: "Summarise weekly updates into 3 lines" },
  { stage: "Progress", help: "Surface trends across mood, sleep, adherence" },
  { stage: "Reviews", help: "Suggest which clients to ask, and when" },
  { stage: "Retention", help: "Flag clients drifting before they cancel" },
];

function WorkflowStrip() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Across the whole journey"
          heading="AI support at every stage of the REPs workflow."
          lede="REPs AI isn't a side panel bolted onto one screen. It's connected to every stage of how a fitness professional finds, signs and serves clients."
        />

        <div className="mt-12 -mx-6 overflow-x-auto px-6 pb-2 lg:-mx-10 lg:px-10">
          <ol className="flex min-w-max items-stretch gap-2">
            {WORKFLOW_STAGES.map((s, i) => (
              <li key={s.stage} className="flex items-stretch gap-2">
                <div className="flex w-[220px] flex-col rounded-[16px] border border-reps-border bg-reps-panel/40 p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-reps-orange-soft text-[11px] font-bold text-reps-orange">
                      {i + 1}
                    </span>
                    <span className="text-[13px] font-bold text-white">
                      {s.stage}
                    </span>
                  </div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-white/65">
                    {s.help}
                  </p>
                </div>
                {i < WORKFLOW_STAGES.length - 1 ? (
                  <span
                    aria-hidden
                    className="flex items-center self-center text-white/25"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 4. Day in the life — before / with REPs AI
// =============================================================================

const TIMELINE = [
  {
    time: "06:45",
    before: "Wake to 14 unread DMs. No idea which to answer first.",
    after: "Inbox ranked. 2 hot leads at the top with drafted replies.",
  },
  {
    time: "09:10",
    before: "Three check-ins from yesterday still unread.",
    after: "Three check-ins summarised. One flagged at-risk for human reply.",
  },
  {
    time: "12:00",
    before: "Half-write a meal plan between sessions. Save for later.",
    after: "Draft meal plan waiting for review. Allergies + prefs already in.",
  },
  {
    time: "15:30",
    before: "Notice Maya hasn't logged in. Make a mental note.",
    after: "Maya flagged adherence 54%. Drafted check-in queued.",
  },
  {
    time: "18:00",
    before: "Forget to ask Tom for the review he offered.",
    after: "Review request suggested for Tom — one click to send.",
  },
  {
    time: "21:00",
    before: "Re-read the day. Open six tabs. Close laptop overwhelmed.",
    after: "One view: 4 approvals, 2 drafts, 1 risk. Done in 10 minutes.",
  },
];

function DayInTheLifeSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Day in the life"
          heading="Monday at 9am — before, and with REPs AI."
          lede="Same coach, same six clients, same business. One day spent reacting to noise. One spent acting on a ranked list."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Before */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <X className="h-3 w-3" /> Without REPs AI
            </span>
            <BlockHeading className="mt-4">Reactive. Scattered. Late.</BlockHeading>
            <ol className="mt-6 space-y-2.5">
              {TIMELINE.map((t) => (
                <li
                  key={t.time}
                  className="flex items-start gap-3 rounded-[12px] border border-reps-border/70 bg-reps-ink/55 px-4 py-2.5"
                >
                  <span className="font-mono text-[11px] font-semibold text-white/40">
                    {t.time}
                  </span>
                  <span className="text-[13px] leading-snug text-white/70">
                    {t.before}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* With */}
          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
              <Check className="h-3 w-3" /> With REPs AI
            </span>
            <BlockHeading className="mt-4">Ranked. Drafted. Done.</BlockHeading>
            <ol className="mt-6 space-y-2.5">
              {TIMELINE.map((t) => (
                <li
                  key={t.time}
                  className="flex items-start gap-3 rounded-[12px] border border-reps-orange-border/60 bg-reps-orange-soft/30 px-4 py-2.5"
                >
                  <span className="font-mono text-[11px] font-semibold text-reps-orange">
                    {t.time}
                  </span>
                  <span className="text-[13px] leading-snug text-white/85">
                    {t.after}
                  </span>
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
// Shared 50/50 capability block
// =============================================================================

function CapabilityBlock({
  eyebrow,
  heading,
  bullets,
  strong,
  reverse,
  mock,
}: {
  eyebrow: string;
  heading: string;
  bullets: string[];
  strong: React.ReactNode;
  reverse?: boolean;
  mock: React.ReactNode;
}) {
  return (
    <div
      className={`grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14 ${
        reverse ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div>
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <BlockHeading className="mt-3">{heading}</BlockHeading>
        <ul className="mt-6 space-y-2.5">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2.5 text-[14px] leading-relaxed text-white/80"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
              {b}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[14px] leading-relaxed text-white/65">
          {strong}
        </p>
      </div>
      <div>{mock}</div>
    </div>
  );
}

// =============================================================================
// 5. Client attention
// =============================================================================

const ATTENTION_SIGNALS = [
  { label: "Check-in overdue", meta: "Maya R. · 4d late" },
  { label: "Low adherence", meta: "Jordan K. · 41%" },
  { label: "Missed session", meta: "Tom B. · Wednesday" },
  { label: "No progress update", meta: "Alex S. · 12d" },
  { label: "Meal plan ending soon", meta: "Priya D. · Sunday" },
  { label: "Client inactive", meta: "Sam H. · 18d" },
  { label: "Goal review due", meta: "Nat L. · this week" },
  { label: "Review request opportunity", meta: "Chris O. · post-PB" },
];

function AttentionSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <CapabilityBlock
          eyebrow="Client attention"
          heading="See who needs attention first."
          bullets={[
            "Surface clients drifting before they go quiet",
            "Rank by urgency, not who messaged you last",
            "Combine adherence, mood, check-in cadence and missed sessions",
            "One-click open the client record for context",
            "Drafted check-in ready when you need it",
            "Snooze, dismiss or escalate per signal",
          ]}
          strong={
            <>
              REPs AI helps you{" "}
              <span className="text-white">
                spot the client who needs support before they disappear.
              </span>
            </>
          }
          mock={<AttentionMock />}
        />
      </div>
    </section>
  );
}

function AttentionMock() {
  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
          <Eye className="h-3.5 w-3.5" /> Attention · ranked
        </span>
        <span className="text-[11px] text-white/45">8 clients</span>
      </div>
      <ul className="mt-4 space-y-2">
        {ATTENTION_SIGNALS.map((s, i) => (
          <li
            key={s.label}
            className="flex items-center justify-between rounded-[12px] border border-reps-border/70 bg-reps-ink/55 px-3.5 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-reps-orange-soft text-[10.5px] font-bold text-reps-orange">
                {i + 1}
              </span>
              <span className="text-[12.5px] font-semibold text-white">
                {s.label}
              </span>
              <span className="text-[11.5px] text-white/45">· {s.meta}</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-white/35" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================================
// 6. Check-ins & progress
// =============================================================================

function CheckinsSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <CapabilityBlock
          eyebrow="Check-ins & progress"
          heading="Turn client updates into clear coaching actions."
          reverse
          bullets={[
            "Summarise weekly check-ins into 3 lines",
            "Pull out mood, energy, sleep and adherence trends",
            "Identify repeated barriers across weeks",
            "Compare notes against the client's stated goals",
            "Suggest review points worth raising",
            "Draft coach feedback for review",
            "Highlight missing information to ask about",
            "Organise progress notes into the client record",
          ]}
          strong={
            <>
              The coach stays responsible for the final response and decision.{" "}
              <span className="text-white">
                AI supports the coach, not instead of the coach.
              </span>
            </>
          }
          mock={<CheckinMock />}
        />
      </div>
    </section>
  );
}

function CheckinMock() {
  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
          <ClipboardCheck className="h-3.5 w-3.5" /> Summary · 6 check-ins
        </span>
        <span className="text-[11px] text-white/45">Week 14</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {[
          { k: "Adherence", v: "76%", t: "down 4pts" },
          { k: "Avg sleep", v: "6.4h", t: "flat" },
          { k: "Mood", v: "3.8 / 5", t: "up 0.2" },
        ].map((m) => (
          <div
            key={m.k}
            className="rounded-[12px] border border-reps-border/70 bg-reps-ink/55 p-3"
          >
            <p className="text-[10.5px] uppercase tracking-wider text-white/45">
              {m.k}
            </p>
            <p className="mt-1 font-display text-[18px] font-bold text-white">
              {m.v}
            </p>
            <p className="text-[11px] text-white/55">{m.t}</p>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-2 text-[12.5px] text-white/75">
        <li className="flex items-start gap-2">
          <LineChart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
          Two clients flagged: sleep below 6h, 3 weeks running.
        </li>
        <li className="flex items-start gap-2">
          <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
          Maya's goal review is due — adherence trend suggests rescope.
        </li>
        <li className="flex items-start gap-2">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
          Three replies drafted — open queue to approve.
        </li>
      </ul>
    </div>
  );
}

// =============================================================================
// 7. Programmes & coaching delivery
// =============================================================================

function CoachingSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <CapabilityBlock
          eyebrow="Programmes & coaching delivery"
          heading="Draft faster. Coach with more context."
          bullets={[
            "Turn assessment notes into programme considerations",
            "Suggest session structures for review",
            "Draft progression notes between blocks",
            "Create alternative exercise options on demand",
            "Summarise the client's training history at a glance",
            "Identify clients due for progression or review",
            "Turn coaching notes into structured next steps",
          ]}
          strong={
            <span className="text-white">
              AI gives the trainer a starting point, not the final answer.
            </span>
          }
          mock={<ProgrammeMock />}
          reverse
        />
      </div>
    </section>
  );
}

function ProgrammeMock() {
  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
          <Dumbbell className="h-3.5 w-3.5" /> Programme draft
        </span>
        <span className="text-[11px] text-white/45">For your review</span>
      </div>
      <p className="mt-3 text-[13px] font-semibold text-white">
        12-week hypertrophy · 4 sessions/wk · intermediate
      </p>
      <p className="mt-1 text-[12px] text-white/55">
        Built from Tom's history, equipment access and stated goals.
      </p>
      <ul className="mt-4 space-y-1.5 text-[12px] text-white/75">
        {[
          "48 sessions drafted with progression rules",
          "Video demos attached to every exercise",
          "3 alternative options per main lift",
          "Deload week pre-scheduled at week 5",
        ].map((b) => (
          <li key={b} className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <span className="rounded-[8px] bg-reps-orange px-2.5 py-1 text-[11px] font-semibold text-white">
          Open in editor
        </span>
        <span className="rounded-[8px] border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white/80">
          Compare to last block
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// 8. Nutrition + safety
// =============================================================================

function NutritionSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <CapabilityBlock
          eyebrow="Meal planning & nutrition support"
          heading="AI-assisted meal planning, approved by the trainer."
          bullets={[
            "Draft meal plans from client goals and onboarding",
            "Suggest meals from your existing meal library",
            "Account for preferences, allergies and exclusions",
            "Create meal swaps in one tap",
            "Generate a shopping list per week",
            "Summarise nutrition check-ins",
            "Flag possible safety considerations to review",
            "Suggest adjustments for trainer review",
          ]}
          strong={
            <span className="text-white">
              AI drafts. The trainer reviews. The trainer approves.
            </span>
          }
          mock={<NutritionMock />}
        />

        <Alert className="mx-auto mt-12 max-w-[920px] rounded-[16px] border-amber-400/40 bg-amber-500/10 text-amber-100">
          <AlertTriangle className="h-4 w-4 text-amber-300" />
          <AlertTitle className="text-amber-100">Safety note</AlertTitle>
          <AlertDescription className="text-amber-100/80">
            REPs AI supports fitness coaching workflows. It should not be used
            to diagnose, treat medical conditions or replace advice from an
            appropriately qualified healthcare or nutrition professional where
            required.
          </AlertDescription>
        </Alert>
      </div>
    </section>
  );
}

function NutritionMock() {
  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
          <Salad className="h-3.5 w-3.5" /> Meal plan · draft
        </span>
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10.5px] font-semibold text-amber-200">
          Awaiting trainer approval
        </span>
      </div>
      <p className="mt-3 text-[13px] font-semibold text-white">
        Lean cut · 1,950 kcal · 5 meals/day
      </p>
      <p className="mt-1 text-[12px] text-white/55">
        Built from Tom's prefs · no shellfish · gluten-free
      </p>
      <ul className="mt-4 space-y-1.5 text-[12px] text-white/75">
        {[
          "Breakfast · Greek yoghurt bowl · 420 kcal",
          "Lunch · chicken & rice · 540 kcal",
          "Snack · whey + apple · 220 kcal",
          "Dinner · salmon & sweet potato · 580 kcal",
          "Evening · cottage cheese · 190 kcal",
        ].map((m) => (
          <li key={m} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
            {m}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <span className="rounded-[8px] bg-reps-orange px-2.5 py-1 text-[11px] font-semibold text-white">
          Review &amp; approve
        </span>
        <span className="rounded-[8px] border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white/80">
          Generate swaps
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// 9. Operations & admin
// =============================================================================

function OperationsSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <CapabilityBlock
          eyebrow="Operations & admin"
          heading="Reduce the admin work around every client."
          reverse
          bullets={[
            "Enquiry summaries with intent scoring",
            "Lead follow-up drafts ready to send",
            "Onboarding summaries from intake forms",
            "Missing form & waiver reminders",
            "Client note organisation across sessions",
            "Session recap drafts",
            "Task suggestions ranked by impact",
            "Review request prompts at the right moment",
            "Renewal & package-end reminders as context",
            "A daily next-action list, ranked",
          ]}
          strong={
            <span className="text-white">
              AI should remove friction from the work around coaching, not
              create another thing to manage.
            </span>
          }
          mock={<OpsMock />}
        />
      </div>
    </section>
  );
}

function OpsMock() {
  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
        <ListChecks className="h-3.5 w-3.5" /> Today · ranked
      </div>
      <ol className="mt-4 space-y-2 text-[12.5px] text-white/80">
        {[
          { t: "Reply to 2 hot leads (drafts ready)", m: "Est. 6 min" },
          { t: "Approve 3 check-in replies", m: "Est. 4 min" },
          { t: "Review Tom's meal plan draft", m: "Est. 3 min" },
          { t: "Send review request to Chris O.", m: "1 click" },
          { t: "Renewal nudge to Priya (ends Sun)", m: "Drafted" },
        ].map((row, i) => (
          <li
            key={row.t}
            className="flex items-center justify-between rounded-[12px] border border-reps-border/70 bg-reps-ink/55 px-3.5 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-reps-orange-soft text-[10.5px] font-bold text-reps-orange">
                {i + 1}
              </span>
              <span className="font-medium text-white">{row.t}</span>
            </div>
            <span className="text-[11px] text-white/45">{row.m}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// =============================================================================
// 10. Profile & Shop Front
// =============================================================================

function ProfileSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <CapabilityBlock
          eyebrow="Profile & Shop Front"
          heading="Improve the way clients understand your business."
          bullets={[
            "Improve profile copy line by line",
            "Suggest missing services worth listing",
            "Rewrite service descriptions for clarity",
            "Improve FAQs based on real client questions",
            "Suggest stronger calls to action",
            "Identify incomplete profile areas",
            "Create clearer Shop Front sections",
            "Draft client-friendly explanations of packages",
          ]}
          strong={
            <span className="text-white">
              REPs AI can help make your public presence clearer, more complete
              and easier for clients to understand.
            </span>
          }
          mock={<ProfileMock />}
          reverse
        />
      </div>
    </section>
  );
}

function ProfileMock() {
  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
        <PencilLine className="h-3.5 w-3.5" /> Profile suggestions
      </div>
      <ul className="mt-4 space-y-3 text-[12.5px]">
        <li className="rounded-[12px] border border-reps-border/70 bg-reps-ink/55 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
            Headline
          </p>
          <p className="mt-1 text-white/55 line-through">Personal Trainer</p>
          <p className="mt-1 font-semibold text-white">
            Strength &amp; fat-loss coach for women in their 30s
          </p>
        </li>
        <li className="rounded-[12px] border border-reps-border/70 bg-reps-ink/55 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
            Missing service
          </p>
          <p className="mt-1 text-white/85">
            Add a £19 intro session — 3 clients asked this month.
          </p>
        </li>
        <li className="rounded-[12px] border border-reps-border/70 bg-reps-ink/55 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
            CTA
          </p>
          <p className="mt-1 text-white/55 line-through">Get in touch</p>
          <p className="mt-1 font-semibold text-white">
            Book a free 15-min fit call
          </p>
        </li>
      </ul>
    </div>
  );
}

// =============================================================================
// 11. AI Command Centre
// =============================================================================

const COMMAND_CARDS = [
  {
    icon: ClipboardCheck,
    title: "3 check-ins need review",
    body: "Replies drafted. Approve, edit or dismiss in one pass.",
  },
  {
    icon: Inbox,
    title: "2 leads need follow-up",
    body: "Both scored hot. Personalised first reply ready.",
  },
  {
    icon: Salad,
    title: "1 meal plan awaiting approval",
    body: "Tom B. · lean cut · allergies accounted for.",
  },
  {
    icon: TrendingUp,
    title: "4 clients · low adherence",
    body: "All under 60% this week. Drafted nudges queued.",
  },
  {
    icon: Target,
    title: "1 progress review due",
    body: "Maya R. · 12-week milestone hit this Friday.",
  },
  {
    icon: PencilLine,
    title: "2 profile improvements",
    body: "Stronger headline + missing intro service to list.",
  },
  {
    icon: Star,
    title: "3 review opportunities",
    body: "Post-PB, post-transformation, post-renewal moments.",
  },
];

function CommandCentreSection() {
  return (
    <section id="command-centre">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="AI Command Centre"
          heading="Your next actions, brought into one view."
          lede="Every signal across leads, check-ins, coaching, nutrition, retention and your public profile — ranked, drafted and ready for one decision."
        />

        <div className="mt-12 rounded-[22px] border border-reps-border bg-reps-panel/40 p-5 lg:p-7">
          <div className="flex items-center justify-between px-1 pb-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-reps-orange shadow-[0_0_8px_rgba(255,122,0,0.8)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                REPs AI · Command centre
              </span>
            </div>
            <span className="text-[11px] text-white/45">Updated 09:14</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COMMAND_CARDS.map((c) => (
              <div
                key={c.title}
                className="rounded-[16px] border border-reps-border bg-reps-panel p-4"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <c.icon className="h-4.5 w-4.5" />
                </span>
                <h3 className="mt-3 text-[14.5px] font-bold text-white">
                  {c.title}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">
                  {c.body}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {[
                    "Review",
                    "Draft reply",
                    "Open client",
                    "Approve",
                    "Create task",
                    "Dismiss",
                  ].map((a) => (
                    <span
                      key={a}
                      className="rounded-[8px] border border-white/15 px-2 py-0.5 text-[10.5px] font-semibold text-white/70"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 12. Human control & professional boundaries
// =============================================================================

const CONTROL_PRINCIPLES = [
  {
    icon: Sparkles,
    title: "AI suggestions are drafts",
    body: "Nothing leaves your account as a client-facing message without your approval.",
  },
  {
    icon: UserCheck,
    title: "Trainers approve client-facing outputs",
    body: "Every reply, plan and summary is reviewed before it reaches a client.",
  },
  {
    icon: AlertTriangle,
    title: "Safety flags are surfaced clearly",
    body: "Medical, clinical and high-risk topics are flagged for human review, not auto-resolved.",
  },
  {
    icon: BadgeCheck,
    title: "AI does not replace your judgement",
    body: "Programme, nutrition and coaching decisions stay with the qualified professional.",
  },
];

function ControlSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Built around professional control"
          heading="Professional judgement stays with the professional."
          lede="REPs AI does not automatically make high-impact decisions for the trainer. Edit, ignore or dismiss any suggestion — and the audit trail records every step."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {CONTROL_PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-[16px] font-bold text-white">
                {p.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/65">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-[760px] text-[17px] leading-snug text-white/85">
          AI should{" "}
          <span className="text-reps-orange">
            make professional judgement easier to apply
          </span>
          , not replace it.
        </p>
      </div>
    </section>
  );
}

// =============================================================================
// 13. Lines REPs AI won't cross
// =============================================================================

const NEVER_DO = [
  {
    icon: MessageSquare,
    title: "Send anything to clients without you approving it",
  },
  {
    icon: AlertTriangle,
    title: "Diagnose, prescribe or treat medical or clinical conditions",
  },
  {
    icon: Brain,
    title:
      "Replace your coaching judgement on programme or nutrition decisions",
  },
  {
    icon: Lock,
    title:
      "Train on your client records to improve other people's models",
  },
];

function NeverDoSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Where we draw the line"
          heading="Lines REPs AI won't cross."
          lede="The most important AI decisions are the ones we deliberately don't make for you."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {NEVER_DO.map((n) => (
            <div
              key={n.title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-panel text-white/55">
                <X className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-[15px] font-bold leading-snug text-white">
                {n.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 14. Data & trust strip
// =============================================================================

const TRUST_CHIPS = [
  { icon: Cpu, label: "EU infrastructure" },
  { icon: Database, label: "You own your data" },
  { icon: Lock, label: "No training on your records" },
  { icon: ListChecks, label: "Audit log on every action" },
  { icon: ToggleLeft, label: "Per-client AI toggle" },
  { icon: Trash2, label: "Delete on request" },
];

function DataTrustStrip() {
  return (
    <section className="bg-reps-panel/30">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
        <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-7 lg:p-9">
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-10">
            <div>
              <SectionEyebrow>Data &amp; trust</SectionEyebrow>
              <BlockHeading className="mt-3">
                Your clients' trust is your business. We treat it like ours.
              </BlockHeading>
            </div>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {TRUST_CHIPS.map((c) => (
                <li
                  key={c.label}
                  className="flex items-center gap-2.5 rounded-[12px] border border-reps-border bg-reps-ink/60 px-3.5 py-2.5"
                >
                  <c.icon className="h-4 w-4 shrink-0 text-reps-orange" />
                  <span className="text-[12.5px] font-semibold text-white/85">
                    {c.label}
                  </span>
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
// 15. Use cases
// =============================================================================

const USE_CASES = [
  {
    icon: UserCheck,
    title: "Personal trainers",
    body: "Summarise check-ins, draft client feedback and keep programme reviews on track.",
  },
  {
    icon: ScanLine,
    title: "Online coaches",
    body: "Manage high-volume check-ins, nutrition drafts, adherence alerts and client follow-ups.",
  },
  {
    icon: Dumbbell,
    title: "Strength coaches",
    body: "Track progress trends, review training notes and identify athletes due for progression.",
  },
  {
    icon: Target,
    title: "Transformation coaches",
    body: "Connect meal planning, habits, progress, measurements and weekly accountability.",
  },
  {
    icon: Users,
    title: "Studio teams",
    body: "Keep client standards consistent across multiple coaches with shared next actions.",
  },
  {
    icon: Zap,
    title: "New professionals",
    body: "Use AI to structure workflows, draft professional copy and stay organised from day one.",
  },
];

function UseCasesSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Use cases"
          heading="One operating layer. Many professional workflows."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((u) => (
            <div
              key={u.title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <u.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-[17px] font-bold text-white">
                {u.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                {u.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// 16. Verified vs Pro
// =============================================================================

function TierComparisonSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Verified vs Pro"
          heading="REPs AI is a Pro feature."
          lede="Verified gets you a trusted, visible profile. Pro adds the AI operating layer across your coaching, nutrition, operations, Shop Front, client records, check-ins and business workflow."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <TierCard
            badge="Verified"
            price="£99 / year"
            blurb="A trusted, verified REPs profile with visibility, reviews and the public chrome that helps clients find and trust you. AI tools are not included on this tier."
            cta={{ to: "/pricing", label: "See Verified" }}
          />
          <TierCard
            highlighted
            badge="Pro · Recommended"
            price="£59 / month · Founding"
            blurb="Everything in Verified, plus the full REPs AI operating layer: check-in summaries, drafted replies, attention alerts, meal plan drafts, programme support, profile improvements and your daily command centre."
            cta={{ to: "/pricing", label: "Start using REPs Pro" }}
          />
        </div>

        <Separator className="mx-auto mt-12 max-w-[760px] bg-reps-border/60" />
        <p className="mx-auto mt-8 max-w-[760px] text-center text-[13.5px] leading-relaxed text-white/55">
          Every feature in your tier is included — no paid AI add-ons, no
          per-suggestion fees.
        </p>
      </div>
    </section>
  );
}

// =============================================================================
// FAQ
// =============================================================================

const FAQ_ITEMS = [
  {
    q: "Who is in control of what AI sends to my clients?",
    a: "You are. REPs AI drafts replies, plans and summaries, but nothing is sent to a client without your explicit approval. Every output shows what it read, what it noticed and what it drafted so you can edit or dismiss it.",
  },
  {
    q: "What data does REPs AI use?",
    a: "Only the data already inside your REPs account — your check-ins, client records, profile, leads and notes. We do not pull from third-party services unless you connect them, and we never train other people's models on your records.",
  },
  {
    q: "Can my clients see the AI drafts?",
    a: "No. Drafts only exist inside your professional view until you approve them. From the client's perspective, they receive your reply, your plan, your feedback — written or approved by you.",
  },
  {
    q: "Can I turn AI off for an individual client?",
    a: "Yes. There's a per-client AI toggle on every client record. Turning it off stops REPs AI from generating any drafts or suggestions for that client.",
  },
  {
    q: "Is AI-generated nutrition advice safe?",
    a: "REPs AI supports fitness coaching workflows by drafting meal plans for the trainer to review and approve. It is not a substitute for advice from an appropriately qualified healthcare or nutrition professional, and high-risk cases are flagged for human review.",
  },
  {
    q: "Are AI-drafted programmes accurate?",
    a: "Programme drafts are a starting point built from the client's history, goals and equipment access. The qualified professional is responsible for the final programme — the AI does not replace your judgement.",
  },
  {
    q: "Do I need to be on Pro to use REPs AI?",
    a: "Yes. REPs AI is included in the Pro tier and above. Verified is for professionals who want a trusted profile, verification, visibility and reviews without the AI layer.",
  },
  {
    q: "How is this different from using ChatGPT?",
    a: "ChatGPT is a blank chat box. REPs AI is connected to your clients, leads, check-ins, nutrition and profile — so the suggestions are about the actual humans in your business, with the source attached, and the approve / edit / dismiss controls built in.",
  },
];
