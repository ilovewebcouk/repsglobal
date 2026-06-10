import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Brain,
  Check,
  CheckCircle2,
  Lightbulb,
  ListChecks,
  Megaphone,
  PenTool,
  Shield,
  Store,
  Users,
  UserCheck,
  Utensils,
  Workflow,
  X,
  Zap,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { BlockHeading } from "@/components/marketing/BlockHeading";
import { AnnotatedMock, type Callout } from "@/components/marketing/AnnotatedMock";
import { ProductBlock } from "@/components/marketing/ProductBlock";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { TierCard } from "@/components/marketing/TierCard";
import { HeroOverlay } from "@/components/marketing/HeroOverlay";
import { LaptopFrame } from "@/components/marketing/LaptopFrame";
import { AiCommandCentreMock } from "@/components/marketing/AiCommandCentreMock";

import heroAi from "@/assets/hero-ai-bg.jpg.asset.json";

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

const PROBLEM_NOISE = [
  "12 enquiries you haven't replied to",
  "Six check-ins you haven't read",
  "Three clients quietly slipping",
  "A programme draft you keep putting off",
  "An invoice that failed last week",
  "A waiver still waiting on a signature",
  "Five DMs that need a real answer",
  "No clear sense of what matters most today",
];

const PROBLEM_SIGNAL = [
  "Today's needs-attention list, ranked by impact",
  "Six check-ins summarised into one card",
  "Three at-risk clients flagged with a drafted reply",
  "A 12-week programme drafted, ready to review",
  "Failed payment surfaced before it's awkward",
  "Outstanding forms chased automatically",
  "Hot leads scored and answered in your tone",
  "One clear next move for the week",
];

const WORKFLOW_STAGES = [
  { title: "Enquiries", body: "Scored by intent. Drafted reply waiting." },
  { title: "Onboarding", body: "Forms chased. Welcome flow personalised." },
  { title: "Check-ins", body: "Read, summarised, ranked by who needs you most." },
  { title: "Programmes", body: "Drafted in seconds from a one-line brief." },
  { title: "Nutrition", body: "Meal plans drafted. You review and approve." },
  { title: "Bookings", body: "Open slots suggested. Reminders timed for replies." },
  { title: "Payments", body: "Failures and renewals flagged before they slip." },
  { title: "Retention", body: "Risk alerts before a client ghosts." },
  { title: "Content", body: "Posts and captions drafted in your tone." },
  { title: "Next Move", body: "The single highest-leverage action this week." },
];

const ATTENTION_CALLOUTS: Callout[] = [
  {
    x: "16%",
    y: "18%",
    title: "What needs you first",
    body: "AI re-ranks your day by impact — the message that wins a client, the check-in that prevents a churn.",
  },
  {
    x: "84%",
    y: "20%",
    title: "Lead intent score",
    body: "Every enquiry rated hot, warm or cold from the signal in the message — not the order it arrived.",
  },
  {
    x: "14%",
    y: "46%",
    title: "Check-ins, summarised",
    body: "Six client check-ins reduced to a single card: who's on-track, who's drifting, who needs a reply.",
  },
  {
    x: "84%",
    y: "50%",
    title: "Risk alerts",
    body: "Adherence, mood and cadence watched in the background — and surfaced before the client ghosts.",
  },
  {
    x: "16%",
    y: "76%",
    title: "Drafted replies",
    body: "Every flagged item comes with a first-draft reply in your tone. You edit, approve, send.",
  },
  {
    x: "84%",
    y: "82%",
    title: "Next Move card",
    body: "One ranked action for the week — the call, the price change, the package to push.",
  },
];

const COMMAND_CALLOUTS: Callout[] = [
  {
    x: "20%",
    y: "20%",
    title: "Next Move · Monday",
    body: "A single highest-leverage action — drafted from your real numbers, not generic advice.",
  },
  {
    x: "80%",
    y: "24%",
    title: "Live status pill",
    body: "REPs AI runs in the background across your business — never a chat window you have to remember to open.",
  },
  {
    x: "20%",
    y: "62%",
    title: "Risk alert",
    body: "At-risk clients surfaced with a drafted check-in — ready to review and send.",
  },
  {
    x: "80%",
    y: "62%",
    title: "Programme writer",
    body: "Describe the client in one line. A 12-week plan drafted with sets, reps and video demos.",
  },
  {
    x: "50%",
    y: "92%",
    title: "Estimated impact",
    body: "Every suggestion shows the modelled outcome — so you can decide whether it's worth your time.",
  },
];

const CHECKINS_BULLETS = [
  "Six client check-ins summarised into one card",
  "Headline change to make, in plain English",
  "Trends across weight, adherence, mood and sleep",
  "A drafted reply you can edit in seconds",
  "Flags for clients who need a real human conversation",
];

const PROGRAMMES_BULLETS = [
  "12-week plans drafted from a one-line brief",
  "Exercises, sets, reps and video demos auto-attached",
  "Progressions and deloads suggested, not enforced",
  "Templates learn from the programmes you actually publish",
  "Every draft is yours to edit, restructure or discard",
];

const NUTRITION_BULLETS = [
  "Meal plans drafted from goals, preferences and intolerances",
  "Macros and totals calculated, not guessed",
  "Swaps suggested when a client doesn't like a meal",
  "Shopping lists generated alongside the plan",
  "Every plan flagged for your review before it reaches the client",
];

const OPS_BULLETS = [
  "Hot leads scored and bumped to the top of your inbox",
  "First-draft replies written in your tone of voice",
  "Failed payments and renewals surfaced before they slip",
  "Form chases and reminder timing chosen for response, not noise",
  "Booking suggestions based on the slots clients actually take",
];

const PROFILE_BULLETS = [
  "Profile bio drafted from your specialisms and reviews",
  "Service descriptions tightened for clarity and search",
  "Review highlights summarised into trust quotes",
  "Shop Front sections suggested based on what converts",
  "On-brand copy across profile, Shop Front and posts",
];

const CONTROL_TILES = [
  {
    icon: Shield,
    title: "AI suggests. You decide.",
    body: "Every AI output is a draft. Nothing ships to a client without you reviewing and approving it.",
  },
  {
    icon: Utensils,
    title: "Nutrition stays your call.",
    body: "Meal plans are flagged for trainer review. AI does not give medical advice or override scope of practice.",
  },
  {
    icon: PenTool,
    title: "Your voice, not a robot's.",
    body: "Drafts learn from the messages and posts you actually publish — so replies sound like you, not a template.",
  },
  {
    icon: Lightbulb,
    title: "You can turn it off.",
    body: "Every AI surface can be disabled per area. Run REPs Pro without any AI assistance if you prefer.",
  },
];

const USE_CASES = [
  {
    icon: Users,
    title: "Solo personal trainer",
    body: "Stop drowning in admin. AI reads the check-ins, scores the leads and flags who needs you most this week.",
  },
  {
    icon: Workflow,
    title: "Online coach at scale",
    body: "Manage 60+ clients without losing the personal touch. AI summarises so you can spend time replying, not reading.",
  },
  {
    icon: ListChecks,
    title: "Small-group coach",
    body: "Programme drafts and content posts ready in seconds — so the admin doesn't eat your coaching hours.",
  },
  {
    icon: Store,
    title: "Studio or gym team",
    body: "Shared AI workspace across the team. Every coach sees the same risk alerts and Next Move cards.",
  },
  {
    icon: UserCheck,
    title: "Specialist coach",
    body: "Nutrition drafts, screening summaries and risk flags — always trainer-reviewed before reaching the client.",
  },
  {
    icon: Megaphone,
    title: "Content-led coach",
    body: "Posts, captions and lead magnets drafted on-brand from a one-line brief. You approve and ship.",
  },
];

const COMPARISON_ROWS: Array<{ feature: string; verified: boolean; pro: boolean }> = [
  { feature: "Public verified profile and reviews", verified: true, pro: true },
  { feature: "Basic enquiry inbox", verified: true, pro: true },
  { feature: "AI lead scoring and drafted replies", verified: false, pro: true },
  { feature: "AI check-in summaries", verified: false, pro: true },
  { feature: "AI programme writer", verified: false, pro: true },
  { feature: "AI meal-plan drafting (trainer-reviewed)", verified: false, pro: true },
  { feature: "AI client risk alerts", verified: false, pro: true },
  { feature: "Weekly Next Move cards", verified: false, pro: true },
  { feature: "AI content drafts in your tone", verified: false, pro: true },
  { feature: "AI profile and Shop Front suggestions", verified: false, pro: true },
];

const FAQ_ITEMS = [
  {
    q: "Is REPs AI a chatbot?",
    a: "No. REPs AI is an operating layer that runs across your business — drafting, ranking, summarising and flagging in the background. It is not a chat window you have to remember to open.",
  },
  {
    q: "Does AI ever send anything to my clients without me?",
    a: "No. Every AI output is a draft. Replies, programmes, meal plans, posts and check-in responses all wait for you to review, edit and approve. Nothing reaches a client without your sign-off.",
  },
  {
    q: "Can REPs AI give nutrition or medical advice?",
    a: "Meal plans and nutrition suggestions are drafted for you to review against your client and your scope of practice. REPs AI does not provide medical advice and is not a substitute for a registered dietitian or clinician.",
  },
  {
    q: "Where does the AI get its signals from?",
    a: "From what already lives in your REPs workspace — enquiries, check-ins, bookings, payments, programmes and client notes. It is not pulling data from outside your account.",
  },
  {
    q: "Will the writing sound like me or like a generic AI?",
    a: "Drafts learn from the messages, posts and programmes you actually publish on REPs — so replies and content sound like you. The more you use it, the closer it gets.",
  },
  {
    q: "Can I turn AI off completely?",
    a: "Yes. Every AI surface can be disabled per area. You can run REPs Pro with no AI assistance at all, or switch it on only for the parts of your business where you want it.",
  },
  {
    q: "Is REPs AI included in Verified or only Pro?",
    a: "REPs AI is a Pro feature. Verified covers the public side — profile, verification, visibility and reviews. Pro adds the operating layer that drafts, ranks and flags across your business.",
  },
  {
    q: "Does REPs train AI models on my client data?",
    a: "Your client records are not used to train third-party AI models. AI runs against your data to help you — not to feed a wider model. Detail on data handling lives in our privacy policy.",
  },
];

// -----------------------------------------------------------------------------
// Route
// -----------------------------------------------------------------------------

export const Route = createFileRoute("/features/ai")({
  head: () => ({
    meta: [
      {
        title: "REPs AI — The AI operating layer for fitness professionals · REPs",
      },
      {
        name: "description",
        content:
          "Not a chatbot. REPs AI drafts your programmes, reads your check-ins, scores your leads, flags risks and ranks your next moves — across the whole REPs Pro workspace. Trainer-reviewed by design.",
      },
      {
        property: "og:title",
        content: "REPs AI — The AI operating layer for fitness professionals",
      },
      {
        property: "og:description",
        content:
          "AI that helps you make better decisions, work faster and stay on top of every client — without replacing the coach.",
      },
      { property: "og:image", content: heroAi.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/ai" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/ai" }],
  }),
  component: AIPage,
});

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

function AIPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <Hero />

      <ProblemSection />
      <WorkflowSection />
      <AttentionSection />
      <CheckinsSection />
      <ProgrammesSection />
      <NutritionSection />
      <OperationsSection />
      <ProfileSection />
      <CommandCentreSection />
      <ControlSection />
      <UseCasesSection />
      <TierComparisonSection />

      <MarketingFaq
        eyebrow="Common questions"
        heading="What REPs AI does — and what it deliberately doesn't."
        items={FAQ_ITEMS}
      />

      <FinalCta
        heading="Make better decisions, work faster, stay"
        headingAccent=" on top of every client."
        lede="REPs AI runs across your whole Pro workspace — drafting, ranking and flagging in the background. You stay the coach. The admin runs itself."
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
    <section className="relative flex min-h-[640px] overflow-hidden lg:min-h-[820px]">
      <img
        src={heroAi.url}
        alt="REPs-verified coach reviewing AI-drafted programmes and check-ins on a tablet at a premium boutique gym"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover object-center lg:object-right"
      />
      <HeroOverlay copySide="left" />

      <div className="relative mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-12 px-6 pt-24 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:px-10 lg:pt-28 lg:pb-24">
        <div className="max-w-[640px]">
          <MarketingHeroEyebrow
            icon={Brain}
            style={{ animationDuration: "560ms", animationFillMode: "both" }}
          >
            REPs AI · The operating layer
          </MarketingHeroEyebrow>

          <h1
            className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[60px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            The AI operating layer{" "}
            <span className="text-reps-orange">for fitness professionals.</span>
          </h1>

          <p
            className="mt-6 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            Not a chatbot. Not an AI personal trainer. REPs AI runs across your whole Pro
            workspace — drafting programmes, summarising check-ins, scoring leads, flagging
            risks and ranking your next move. You stay the coach. AI handles the noise.
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
              href="#attention"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              See how REPs AI works
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
              <Shield className="h-4 w-4 text-reps-orange" /> Trainer-reviewed by design
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-reps-orange" /> No extra add-ons
            </li>
          </ul>
        </div>

        <div
          className="animate-fade-in"
          style={{ animationDuration: "720ms", animationDelay: "260ms", animationFillMode: "both" }}
        >
          <LaptopFrame>
            <div className="absolute inset-0 overflow-hidden bg-reps-ink p-4 sm:p-6">
              <AiCommandCentreMock />
            </div>
          </LaptopFrame>
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
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The problem REPs AI solves"
          heading="Most fitness pros don't have a productivity problem. They have a signal problem."
          lede="The admin doesn't stop. Enquiries pile up, check-ins go unread, clients quietly slip. By Friday you can't tell what mattered. REPs AI exists to surface the signal — and draft the response — before something important goes missed."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <X className="h-3 w-3" /> Without REPs AI
            </span>
            <BlockHeading className="mt-4">Noise. All of it the same colour.</BlockHeading>
            <ul className="mt-6 space-y-2.5">
              {PROBLEM_NOISE.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5 rounded-[16px] border border-reps-border/70 bg-reps-ink/60 px-4 py-2.5 text-[13.5px] text-white/70"
                >
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[13.5px] leading-relaxed text-white/55">
              Everything urgent, nothing prioritised. The best coaches still miss the moment a
              client decides to leave.
            </p>
          </div>

          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
              <Check className="h-3 w-3" /> With REPs AI
            </span>
            <BlockHeading className="mt-4">Signal. Ranked. With a drafted next step.</BlockHeading>
            <ul className="mt-6 space-y-2.5">
              {PROBLEM_SIGNAL.map((line) => (
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
              AI suggests. You decide. Nothing ships to a client without your review.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 2. Workflow strip — 10 stages
// -----------------------------------------------------------------------------

function WorkflowSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Across the whole workspace"
          heading="One AI layer. Every part of your coaching business."
          lede="REPs AI isn't a feature you open. It runs across the entire Pro workspace — every stage of the day, drafting and ranking quietly in the background."
        />

        <div className="mt-12 overflow-x-auto pb-2">
          <ol className="grid min-w-[1280px] grid-cols-10 gap-3 lg:min-w-0">
            {WORKFLOW_STAGES.map((stage, i) => (
              <li
                key={stage.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-4"
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 font-display text-[14px] font-bold text-white">{stage.title}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">{stage.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 3. Client attention — AnnotatedMock
// -----------------------------------------------------------------------------

function AttentionSection() {
  return (
    <section id="attention" className="scroll-mt-24">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="What needs you, ranked"
          heading="Every morning, REPs AI tells you what to do first — and drafts it."
          lede="The dashboard a Pro account opens to: a ranked needs-attention list built from the real signal in your workspace. Not a generic to-do feed."
        />

        <div className="mt-12">
          <AnnotatedMock
            mockup={{
              device: "laptop",
              src: "/dashboard",
              title: "Live REPs Pro dashboard with AI ranking",
            }}
            callouts={ATTENTION_CALLOUTS}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 4. Check-ins
// -----------------------------------------------------------------------------

function CheckinsSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Check-ins and progress"
          heading="Six check-ins, read for you — without losing what matters."
          lede="REPs AI reads every check-in, pulls out the trend, drafts the reply and flags who actually needs a human conversation this week."
        />
        <div className="mt-12">
          <ProductBlock
            eyebrow="Check-ins"
            title="The change to make, the reply to send, the client who needs you most."
            body="Adherence, weight, mood, sleep and training notes summarised into one card per client. The headline up front. The detail one click away. A drafted reply waiting for your sign-off."
            bullets={CHECKINS_BULLETS}
            imageLabel="REPs AI check-in summary"
            mockup={{
              device: "laptop",
              src: "/dashboard",
              title: "REPs AI check-in summary",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 5. Programmes
// -----------------------------------------------------------------------------

function ProgrammesSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Programmes and coaching"
          heading="A 12-week plan, drafted in seconds. Yours to edit in minutes."
          lede="Describe the client in one line. REPs AI drafts a structured programme with the right exercises, sets, reps and video demos. You tweak the parts that matter and publish."
        />
        <div className="mt-12">
          <ProductBlock
            reverse
            eyebrow="Programme writer"
            title="The blank-page problem, gone. The coaching, still yours."
            body="AI handles the scaffolding — structure, progressions, exercise selection, demo videos. You bring the judgement — the why, the where to push, the where to ease off. The result is a plan that's faster to ship and unmistakably yours."
            bullets={PROGRAMMES_BULLETS}
            imageLabel="REPs AI programme writer"
            mockup={{
              device: "laptop",
              src: "/dashboard",
              title: "REPs AI programme writer",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 6. Nutrition
// -----------------------------------------------------------------------------

function NutritionSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Meal planning and nutrition"
          heading="Meal plans drafted for review — never published without you."
          lede="Goals, preferences, intolerances and history go in. A structured plan with macros, swaps and a shopping list comes out — every time flagged for your review before it reaches a client."
        />

        <div className="mt-12">
          <ProductBlock
            eyebrow="Nutrition drafts"
            title="Drafts. Trainer reviews. Trainer approves."
            body="REPs AI is not a registered dietitian. Nutrition drafts are starting points for trainers and qualified nutritionists to review against their client and their scope of practice — not advice to publish unread."
            bullets={NUTRITION_BULLETS}
            imageLabel="REPs AI nutrition draft"
            mockup={{
              device: "laptop",
              src: "/dashboard",
              title: "REPs AI nutrition draft",
            }}
          />

          <div className="mt-10 rounded-[22px] border border-reps-orange-border bg-reps-orange-soft/30 p-7 lg:p-8">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <BlockHeading>AI suggests. The professional decides.</BlockHeading>
                <p className="mt-3 text-[14.5px] leading-relaxed text-white/80">
                  REPs AI does not provide medical advice and is not a substitute for a registered
                  dietitian, clinician or qualified nutrition professional. Nutrition outputs are
                  drafts only and must be reviewed by a qualified trainer before being shared with
                  a client. Always work within your scope of practice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 7. Operations and admin
// -----------------------------------------------------------------------------

function OperationsSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Operations and admin"
          heading="The admin stops being your second job."
          lede="Lead scoring, drafted replies, payment chases, form follow-ups, booking suggestions — handled in the background so you can stay in the coaching."
        />
        <div className="mt-12">
          <ProductBlock
            reverse
            eyebrow="Admin assistance"
            title="The chase, the reminder, the reply — drafted, timed and ready to send."
            body="REPs AI watches your inbox, your bookings and your payments — surfaces what needs action, drafts the response, and times the chase for when a client is most likely to reply."
            bullets={OPS_BULLETS}
            imageLabel="REPs AI admin assistant"
            mockup={{
              device: "laptop",
              src: "/dashboard",
              title: "REPs AI admin assistant",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 8. Profile and Shop Front
// -----------------------------------------------------------------------------

function ProfileSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Profile and Shop Front"
          heading="Your storefront, written in your voice — not a templated AI blurb."
          lede="REPs AI tightens your bio, sharpens your service copy and surfaces the review quotes that earn trust — so your profile and Shop Front work harder without sounding generic."
        />
        <div className="mt-12">
          <ProductBlock
            eyebrow="Profile and Shop Front"
            title="The copy that converts — drafted from the words you already publish."
            body="Drafts learn from your real reviews, your real client outcomes and your real tone of voice. So the storefront sounds like you, not a templated assistant."
            bullets={PROFILE_BULLETS}
            imageLabel="REPs AI profile suggestions"
            mockup={{
              device: "laptop",
              src: "/dashboard",
              title: "REPs AI profile suggestions",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 9. AI Command Centre — full-bleed AnnotatedMock
// -----------------------------------------------------------------------------

function CommandCentreSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The AI Command Centre"
          heading="One screen. Every AI suggestion. Every estimated impact."
          lede="The Command Centre is where REPs AI shows its hand — the Next Move, the risk alerts, the drafted programmes and replies — with a modelled impact next to every suggestion, so you can decide what's worth your time."
        />

        <div className="relative mt-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-12 rounded-[28px] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(255,122,0,0.18),transparent_70%)] blur-2xl"
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div className="relative">
              <LaptopFrame>
                <div className="absolute inset-0 overflow-hidden bg-reps-ink p-4 sm:p-6">
                  <AiCommandCentreMock />
                </div>
              </LaptopFrame>
              <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
                {COMMAND_CALLOUTS.map((c, i) => (
                  <span
                    key={i}
                    className="absolute hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-reps-orange text-[12px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(255,122,0,0.55)] ring-2 ring-reps-ink sm:inline-flex"
                    style={{ top: c.y, left: c.x }}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            </div>
            <ol className="flex flex-col gap-4">
              {COMMAND_CALLOUTS.map((c, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-[16px] border border-reps-border bg-reps-panel/60 p-4"
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
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 10. Human control and professional boundaries
// -----------------------------------------------------------------------------

function ControlSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Human control and boundaries"
          heading="AI suggests. The professional decides."
          lede="REPs AI is built to give qualified fitness professionals leverage — not to replace them, automate around them or push them beyond their scope of practice."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {CONTROL_TILES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-7"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Icon className="h-5 w-5" />
              </span>
              <BlockHeading className="mt-4">{title}</BlockHeading>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/75">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[22px] border border-reps-border bg-reps-panel/60 p-7 lg:p-10">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <BlockHeading>An operating layer, not an autopilot.</BlockHeading>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/75">
                The point of REPs AI is to give you back the hour you lose to admin every day — not
                to send messages, write programmes or push nutrition advice to your clients without
                you. Every output is reviewable. Every surface is optional. You are still the coach
                on the record.
              </p>
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
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Built for every kind of pro"
          heading="What REPs AI looks like for…"
          lede="The operating layer stays the same. The leverage flexes to how you actually run your business."
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
// 12. Verified vs Pro
// -----------------------------------------------------------------------------

function TierComparisonSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Verified vs Pro"
          heading="Verified gets you found. Pro gives you the AI operating layer."
          lede="REPs AI is a Pro pillar. Verified covers the public side — profile, verification, visibility, reviews. Pro adds the operating layer: ranking, drafting, summarising and flagging across your business."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <TierCard
            badge="Verified"
            price="£99 / year"
            blurb="Public verified profile, directory presence, reviews and a basic enquiry inbox. No AI ranking, drafting, programme writing or risk alerts."
            cta={{ to: "/features/visibility", label: "See what Verified covers" }}
          />
          <TierCard
            badge="Pro"
            price="£59 / month · Founding"
            blurb="Everything in Verified, plus the full REPs AI operating layer — Next Move cards, check-in summaries, programme drafts, nutrition drafts, risk alerts and on-brand content."
            highlighted
            cta={{ to: "/pricing", label: "See Pro pricing" }}
          />
        </div>

        <div className="mt-10 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/40">
          <div className="overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="grid grid-cols-[1fr_120px_120px] items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                <span>AI capability</span>
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
                      <Check className="mx-auto h-4 w-4 text-reps-orange" />
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/pricing"
            className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[13.5px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
          >
            See Pro pricing <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/for-professionals"
            className="inline-flex h-11 items-center rounded-[10px] border border-white/25 px-5 text-[13.5px] font-semibold text-white shadow-none hover:bg-white/10"
          >
            Explore all features
          </Link>
        </div>
      </div>
    </section>
  );
}

