import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  
  FileText,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Mail,
  MessageSquare,
  Receipt,
  RefreshCcw,
  Sparkles,
  StickyNote,
  UserCheck,
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
import { AnnotatedMock, type Callout } from "@/components/marketing/AnnotatedMock";
import { ProductBlock } from "@/components/marketing/ProductBlock";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { TierCard } from "@/components/marketing/TierCard";
import { Separator } from "@/components/ui/separator";

import heroOperations from "@/assets/hero-operations-bg.jpg.asset.json";

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

const DASHBOARD_CALLOUTS: Callout[] = [
  {
    x: "16%",
    y: "16%",
    title: "Today's sessions",
    body: "Every booking, consultation and assessment for the day — in the order they happen.",
  },
  {
    x: "84%",
    y: "20%",
    title: "New leads",
    body: "Enquiries from your profile, Shop Front and DMs — scored and ready to action.",
  },
  {
    x: "14%",
    y: "44%",
    title: "Pending forms",
    body: "PAR-Qs, consents and onboarding forms still waiting on a client signature.",
  },
  {
    x: "84%",
    y: "50%",
    title: "Unpaid invoices",
    body: "Late, failed or pending payments — surfaced before they become awkward.",
  },
  {
    x: "16%",
    y: "76%",
    title: "Upcoming bookings",
    body: "The next two weeks at a glance — confirmed, tentative and awaiting deposit.",
  },
  {
    x: "84%",
    y: "82%",
    title: "Tasks needing attention",
    body: "Follow up, chase, confirm, review — surfaced before something slips.",
  },
];

const PROBLEM_SCATTERED = [
  "Instagram DMs for enquiries",
  "WhatsApp threads for clients",
  "Google Forms for PAR-Qs",
  "Calendly for consultations",
  "Stripe links for payments",
  "Spreadsheet CRM, sort of",
  "Paper waivers in a folder",
  "Notes app for everything else",
];

const PROBLEM_ORGANISED = [
  "Every enquiry in one inbox, scored and tagged",
  "Bookings, consultations and recurring sessions in one calendar",
  "PAR-Qs, waivers and onboarding forms attached to the client",
  "Payments, packages and memberships visible on the dashboard",
  "Client records with history, notes and next step in one view",
  "Tasks and reminders flag what needs attention before it slips",
  "Documents and agreements stored against the right person",
  "Everything connected to your REPs profile and Shop Front",
];

const PIPELINE_STAGES = [
  { title: "New enquiry", body: "Captured from your profile, Shop Front, DMs or referral." },
  { title: "Consultation booked", body: "Discovery call or in-person meeting on the calendar." },
  { title: "Awaiting form", body: "PAR-Q, screening or goal-setting form still to complete." },
  { title: "Payment pending", body: "Package or first invoice sent — waiting on the client." },
  { title: "Onboarded", body: "Forms in, payment cleared, first session scheduled." },
  { title: "Follow-up needed", body: "Inactive, lapsed or overdue check-in — back on the list." },
];

const BOOKINGS_BULLETS = [
  "Consultations, assessments and intro calls",
  "1:1 sessions, group sessions and online calls",
  "Recurring bookings with one-tap reschedule",
  "Availability windows by service and venue",
  "Automated reminders and client confirmations",
];

const FORMS_LIST = [
  { title: "PAR-Q", body: "Standard physical activity readiness questionnaire." },
  { title: "Health screening", body: "Conditions, medications and red flags before the first session." },
  { title: "Consultation forms", body: "Goals, history, training experience and availability." },
  { title: "Goal-setting forms", body: "Outcome, timeline, motivation and review schedule." },
  { title: "Consent forms", body: "Photography, data, communication and session conduct consent." },
  { title: "Waivers", body: "Liability and assumption-of-risk waivers, signed and stored." },
  { title: "Onboarding questionnaires", body: "Lifestyle, nutrition, sleep, stress and starting baseline." },
  { title: "Client agreements", body: "Package terms, cancellation policy and rescheduling rules." },
];

const PAYMENTS_BULLETS = [
  "Paid consultations and one-off sessions",
  "Coaching packages and block bookings",
  "Memberships and recurring billing",
  "Payment status — paid, pending, failed",
  "Receipts and invoices issued automatically",
  "Package usage and renewal visibility",
];

const CLIENT_RECORD_BULLETS = [
  "Contact details and emergency contacts",
  "Forms, waivers and signed agreements",
  "Bookings, attendance and session history",
  "Payment status, package usage and renewal date",
  "Goals, training notes and key milestones",
  "Programme status — without the programme depth",
  "Review-request status and response history",
  "Communication history in one timeline",
];

const TASK_CARDS = [
  { icon: Inbox, title: "Follow up new enquiry", body: "Hot enquiry waiting on a first reply." },
  { icon: FileText, title: "Chase incomplete form", body: "Client started a PAR-Q but didn't finish." },
  { icon: Calendar, title: "Confirm consultation", body: "Booked consultation needs a confirmation message." },
  { icon: Receipt, title: "Review unpaid payment", body: "Invoice overdue or card payment failed." },
  { icon: Mail, title: "Send onboarding link", body: "New client ready for the welcome flow." },
  { icon: MessageSquare, title: "Request review", body: "Long-standing client hasn't been asked yet." },
  { icon: UserCheck, title: "Check inactive client", body: "Two weeks without a session — check in." },
  { icon: BadgeCheck, title: "Renew CPD or profile", body: "Verification or CPD entry approaching expiry." },
];

const REPLACES_ITEMS = [
  "Form builder for PAR-Qs and waivers",
  "Standalone booking link",
  "Payment link and invoice tool",
  "Spreadsheet CRM and contact list",
  "Notes app for client history",
  "Manual reminder messages",
  "Scattered document folders",
  "Per-client folder system",
];

const STAYS_ITEMS = [
  "Your coaching tools — programmes, nutrition, check-ins live in the Coaching pillar",
  "Your tone of voice — every template starts as a draft you edit",
  "Your existing calendar — two-way sync with Google, Apple and Outlook",
  "Your payment processor — connect Stripe, payouts on its normal schedule",
];

const COMPARISON_ROWS: Array<{ feature: string; verified: boolean; pro: boolean }> = [
  { feature: "Public verified profile and reviews", verified: true, pro: true },
  { feature: "Basic enquiry inbox", verified: true, pro: true },
  { feature: "Lead pipeline with statuses", verified: false, pro: true },
  { feature: "Bookings page and calendar sync", verified: false, pro: true },
  { feature: "Deposits and payment capture", verified: false, pro: true },
  { feature: "PAR-Qs, waivers and onboarding forms", verified: false, pro: true },
  { feature: "Packages, memberships and recurring billing", verified: false, pro: true },
  { feature: "Client records with notes and history", verified: false, pro: true },
  { feature: "Tasks, reminders and next-action queue", verified: false, pro: true },
  { feature: "Follow-up sequences and review requests", verified: false, pro: true },
];

const USE_CASES = [
  {
    title: "Personal trainer",
    body: "Manage consultations, PAR-Qs, bookings, payment status and client records — without the apps stack.",
  },
  {
    title: "Online coach",
    body: "Capture enquiries, collect onboarding forms, organise payments and track client status worldwide.",
  },
  {
    title: "Small-group coach",
    body: "Manage recurring sessions, attendees, payments and follow-ups in one shared schedule.",
  },
  {
    title: "Studio or gym team",
    body: "Keep team enquiries, bookings and client admin in one shared workspace.",
  },
  {
    title: "Specialist coach",
    body: "Keep forms, notes, risk information and client history organised around each person.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Where do my leads go?",
    a: "Every enquiry — from your REPs profile, Shop Front, DMs or referral link — lands in one pipeline. Scored by intent, tagged by service, with a status and a next step. Nothing lives in your personal inbox.",
  },
  {
    q: "Can my clients book themselves?",
    a: "Yes. Share a booking link or let them book directly from your Shop Front. You set availability by service, venue and session length. Two-way calendar sync keeps your week clean.",
  },
  {
    q: "Do I have to use REPs for payments?",
    a: "No. You can run Operations without payments and keep using whatever you use today. If you do connect a processor like Stripe, payouts go on its normal schedule. REPs does not take a platform commission on your client payments — standard payment processing fees may apply.",
  },
  {
    q: "Can I keep using Google Calendar?",
    a: "Yes. REPs syncs both ways with Google, Apple and Outlook calendars. Bookings created in REPs appear in your calendar; busy time from your calendar blocks new bookings.",
  },
  {
    q: "What about my existing client list?",
    a: "Import contacts from a CSV or your current CRM. Match them to existing enquiries, attach historical notes, then carry on from one record per client instead of five places per client.",
  },
  {
    q: "Is Operations included in Verified or only Pro?",
    a: "Operations is a Pro feature. Verified gives you a trusted public profile, verification, visibility and reviews. Pro adds the operational system behind that profile — enquiries, bookings, forms, payments, client records and follow-ups.",
  },
];

// -----------------------------------------------------------------------------
// Route
// -----------------------------------------------------------------------------

export const Route = createFileRoute("/features/operations")({
  head: () => ({
    meta: [
      {
        title: "Operations — Run your fitness business from one organised workspace · REPs",
      },
      {
        name: "description",
        content:
          "Manage enquiries, bookings, forms, payments, client records and follow-ups in the same platform that powers your REPs profile and Shop Front. Included in REPs Pro.",
      },
      {
        property: "og:title",
        content: "Operations — Run your fitness business from one organised workspace",
      },
      {
        property: "og:description",
        content:
          "The back office for your fitness business. Leads, bookings, forms, payments, client records and tasks — connected to your REPs profile.",
      },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/operations" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/operations" }],
  }),
  component: OperationsPage,
});

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

function OperationsPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <Hero />

      <ProblemSection />
      <WorkspaceSection />
      <PipelineSection />
      <BookingsSection />
      <FormsSection />
      <PaymentsSection />
      <ClientRecordsSection />
      <TasksSection />
      <ReplacesSection />
      <TierComparisonSection />
      <UseCasesSection />

      <MarketingFaq
        eyebrow="Common questions"
        heading="What Operations covers, and how it fits."
        items={FAQ_ITEMS}
      />

      <FinalCta
        heading="Run the business behind your coaching with"
        headingAccent=" less admin and more control."
        lede="Manage enquiries, bookings, forms, payments and client records from the same platform that powers your REPs profile and Shop Front."
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
        src={heroOperations.url}
        alt="Personal trainer reviewing the day's bookings, leads and tasks on a dashboard"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover object-center lg:object-right"
      />
      {/* Mobile: flat dim for legibility. Desktop: directional gradient that protects copy on the left and leaves the trainer fully visible on the right. */}
      <div className="absolute inset-0 bg-reps-ink/55 lg:hidden" />
      <div
        aria-hidden
        className="absolute inset-0 hidden lg:block bg-[linear-gradient(90deg,rgba(10,10,12,0.88)_0%,rgba(10,10,12,0.7)_35%,rgba(10,10,12,0.25)_60%,rgba(10,10,12,0)_80%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(95%_75%_at_50%_45%,rgba(10,10,12,0.55),transparent_75%)] lg:bg-[radial-gradient(55%_85%_at_15%_55%,rgba(10,10,12,0.55),transparent_72%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(60%_50%_at_50%_15%,rgba(255,122,0,0.12),transparent_72%)] lg:bg-[radial-gradient(40%_45%_at_15%_20%,rgba(255,122,0,0.10),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-reps-ink/65 to-reps-ink lg:h-56 lg:via-reps-ink/70"
      />

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col justify-start px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-24">
        <div className="max-w-[680px]">
          <MarketingHeroEyebrow
            icon={LayoutDashboard}
            style={{ animationDuration: "560ms", animationFillMode: "both" }}
          >
            Operations · Your business back office
          </MarketingHeroEyebrow>

          <h1
            className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[60px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            Run your fitness business from{" "}
            <span className="text-reps-orange">one organised workspace.</span>
          </h1>

          <p
            className="mt-6 max-w-[600px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            Manage enquiries, bookings, forms, payments, client records and follow-ups in the same
            platform that powers your REPs profile and Shop Front — without stitching together five
            different apps.
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
              href="#workspace"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              See how operations works
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
              <Workflow className="h-4 w-4 text-reps-orange" /> Connected to your REPs profile
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
          eyebrow="The scattered admin stack"
          heading="Most fitness pros don't lose time coaching. They lose it switching apps."
          lede="Leads in Instagram. Bookings in Calendly. Forms in Google Drive. Payments in Stripe. Notes in your phone. Reminders in your head. Your business should not depend on remembering which app a client message came from."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Today — scattered */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <X className="h-3 w-3" /> Today, without REPs Operations
            </span>
            <BlockHeading className="mt-4">Eight tools. One overwhelmed coach.</BlockHeading>
            <ul className="mt-6 space-y-2.5">
              {PROBLEM_SCATTERED.map((line) => (
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
              Every tool earns its keep on its own. Together they leak leads, miss payments and
              hide the next action.
            </p>
          </div>

          {/* With REPs */}
          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
              <Check className="h-3 w-3" /> With REPs Operations
            </span>
            <BlockHeading className="mt-4">One workspace. Every step connected.</BlockHeading>
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
              The Shop Front helps clients <em>take action</em>. Operations keeps everything behind
              that action <em>organised</em>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 2. Workspace — AnnotatedMock of /dashboard
// -----------------------------------------------------------------------------

function WorkspaceSection() {
  return (
    <section
      id="workspace"
      className="scroll-mt-24 border-b border-reps-border bg-reps-panel/15"
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Inside the workspace"
          heading="One screen. Today's sessions, new leads, pending forms, unpaid invoices."
          lede="This is the REPs dashboard a Pro account opens to every morning — running live, not a static mock. Six things every coaching business needs to see first, in one place."
        />

        <div className="mt-12">
          <AnnotatedMock
            mockup={{
              device: "laptop",
              src: "/dashboard",
              title: "Live REPs Pro dashboard",
            }}
            callouts={DASHBOARD_CALLOUTS}
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/dashboard"
            target="_blank"
            className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
          >
            Open the live dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
          >
            See Pro pricing
          </Link>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 3. Pipeline — one place for every enquiry
// -----------------------------------------------------------------------------

function PipelineSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="One place for every enquiry"
          heading="Every lead with a status, a next step and a place to live."
          lede="Enquiries from your REPs profile, Shop Front, DMs and referrals land in one pipeline. You see exactly who's where — and what to do next — without searching six apps."
        />

        <div className="mt-12 overflow-x-auto pb-2">
          <ol className="grid min-w-[920px] grid-cols-6 gap-4 lg:min-w-0">
            {PIPELINE_STAGES.map((stage, i) => (
              <li
                key={stage.title}
                className="relative rounded-[18px] border border-reps-border bg-reps-panel/60 p-5"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                  Stage {i + 1}
                </span>
                <p className="mt-3 font-display text-[15px] font-bold text-white">{stage.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/70">{stage.body}</p>
                {i < PIPELINE_STAGES.length - 1 ? (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-white/30 lg:block" />
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10 rounded-[22px] border border-reps-border bg-reps-panel/60 p-7 lg:p-10">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <Workflow className="h-5 w-5" />
            </span>
            <div>
              <BlockHeading>Lead in. Client out. No copy-paste between tools.</BlockHeading>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/75">
                The same record carries forward from enquiry to onboarded client. Notes, forms,
                bookings and payments all attach to the same person — so the history is intact when
                you open them in three months and need to remember where you left off.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 4. Bookings
// -----------------------------------------------------------------------------

function BookingsSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Bookings and schedule"
          heading="Stop running your week through back-and-forth messages."
          lede="Give clients a clearer route to book, and give yourself a cleaner view of your week — without leaving the same workspace your enquiries, payments and records live in."
        />

        <div className="mt-12">
          <ProductBlock
            eyebrow="Bookings"
            title="A schedule that shows the whole week — not just one session at a time."
            body="Consultations, assessments, 1:1, group, recurring blocks and online calls — all in one calendar, with availability set by service and venue."
            bullets={BOOKINGS_BULLETS}
            imageLabel="REPs bookings dashboard"
            mockup={{
              device: "laptop",
              src: "/dashboard/bookings",
              title: "Live REPs bookings dashboard",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 5. Forms, waivers and onboarding
// -----------------------------------------------------------------------------

function FormsSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Forms, waivers and onboarding"
          heading="Collect what you need before the first session — and keep it on the client record."
          lede="No more printed PAR-Qs in a folder, no more Google Forms responses lost in a shared drive. Every form is signed digitally and attached to the client it belongs to."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-7 lg:p-10">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <ClipboardList className="h-5 w-5" />
            </span>
            <BlockHeading className="mt-4">
              Built around fitness, not generic form builders.
            </BlockHeading>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/75">
              Every form is pre-shaped for the fitness use case — readiness, screening, consent,
              waivers, goal-setting and onboarding. Edit the wording, keep the structure, send a
              link.
            </p>
            <Separator className="my-6 bg-reps-border" />
            <p className="text-[13.5px] leading-relaxed text-white/65">
              Once submitted, a form is timestamped, signed and stored against the client. If they
              ever ask, you can show exactly what they agreed to and when.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FORMS_LIST.map((f) => (
              <div
                key={f.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-5"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-reps-orange" />
                  <p className="font-display text-[15px] font-bold text-white">{f.title}</p>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-white/70">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 6. Payments and packages
// -----------------------------------------------------------------------------

function PaymentsSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Payments and packages"
          heading="Your services, bookings and payments shouldn't live in separate systems."
          lede="One-off sessions, coaching packages and memberships — all visible alongside the bookings and clients they belong to. No more cross-referencing Stripe with a spreadsheet to work out who's paid."
        />

        <div className="mt-12">
          <ProductBlock
            reverse
            eyebrow="Payments"
            title="See who's paid, who hasn't, and what's about to renew — at a glance."
            body="Take payments through your connected processor. Payouts land on its normal schedule. REPs does not take a platform commission on your client payments — standard payment processing fees may apply."
            bullets={PAYMENTS_BULLETS}
            imageLabel="REPs payments dashboard"
            mockup={{
              device: "laptop",
              src: "/dashboard/payments",
              title: "Live REPs payments dashboard",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 7. Client records and notes
// -----------------------------------------------------------------------------

function ClientRecordsSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Client records and notes"
          heading="Know exactly where each client stands — without scrolling through messages."
          lede="One record per client. Contact details, forms, bookings, payments, goals, notes and history — all in one view. The operational memory you wish you had after six months of growth."
        />

        <div className="mt-12">
          <ProductBlock
            eyebrow="Client record"
            title="The whole client, on one screen."
            body="Open a client and see contact details, forms, bookings, payment status, goals, notes and communication history — without switching apps. Programmes and check-ins live in the Coaching pillar; this view stays admin-focused on purpose."
            bullets={CLIENT_RECORD_BULLETS}
            imageLabel="REPs client record"
            mockup={{
              device: "laptop",
              src: "/dashboard/clients/james-carter",
              title: "Live REPs client record",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 8. Tasks, reminders and next actions
// -----------------------------------------------------------------------------

function TasksSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Tasks, reminders and next actions"
          heading="REPs should show you what needs attention before something slips."
          lede="The needs-attention queue. Built from real signals in your workspace — enquiries waiting, forms incomplete, payments overdue, clients gone quiet — not a generic to-do list."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TASK_CARDS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-4 font-display text-[15px] font-bold text-white">{title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/70">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[22px] border border-reps-border bg-reps-panel/60 p-7 lg:p-10">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <BlockHeading>An operating system, not a passive CRM.</BlockHeading>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/75">
                A CRM stores what already happened. Operations surfaces what hasn't happened yet —
                the reply you didn't send, the consultation that needs confirming, the package
                about to expire — so you act before clients have to chase you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 9. Replace the admin stack
// -----------------------------------------------------------------------------

function ReplacesSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Replace the admin stack"
          heading="Consolidate the disconnected admin stack most trainers build by accident."
          lede="Operations is not trying to be every tool. It's trying to remove the tools that exist only because nothing else joined them up."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <RefreshCcw className="h-3 w-3" /> What REPs replaces
            </span>
            <BlockHeading className="mt-4">Goodbye to the patchwork.</BlockHeading>
            <ul className="mt-6 space-y-2.5">
              {REPLACES_ITEMS.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5 rounded-[16px] border border-reps-border/70 bg-reps-ink/60 px-4 py-2.5 text-[13.5px] text-white/70"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
              <Sparkles className="h-3 w-3" /> What stays yours
            </span>
            <BlockHeading className="mt-4">Operations isn't trying to replace everything.</BlockHeading>
            <ul className="mt-6 space-y-3">
              {STAYS_ITEMS.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5 rounded-[16px] border border-reps-border/70 bg-reps-ink/40 px-4 py-3 text-[13.5px] leading-relaxed text-white/80"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[13.5px] leading-relaxed text-white/65">
              The goal is consolidation, not absolute replacement in every case.
            </p>
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
          heading="Verified gets you found. Pro runs the business behind the profile."
          lede="Operations is mainly a Pro pillar. Verified covers the public side — profile, verification, visibility, reviews. Pro adds the operational system behind it: enquiries, bookings, forms, payments, client records and follow-ups."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <TierCard
            badge="Verified"
            price="£99 / year"
            blurb="Public verified profile, directory presence, reviews and a basic enquiry inbox. No pipeline, bookings, forms, payments or client records."
            cta={{ to: "/features/visibility", label: "See what Verified covers" }}
          />
          <TierCard
            badge="Pro"
            price="£59 / month · Founding"
            blurb="Everything in Verified, plus the full Operations workspace — pipeline, bookings, forms, payments, client records, tasks and follow-ups."
            highlighted
            cta={{ to: "/pricing", label: "See Pro pricing" }}
          />
        </div>

        <div className="mt-10 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/40">
          <div className="overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="grid grid-cols-[1fr_120px_120px] items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                <span>Operations capability</span>
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
          eyebrow="Built for every kind of pro"
          heading="What Operations looks like for…"
          lede="The workspace stays the same. The workflow flexes to how you actually run your business — 1:1, online, in a studio or running a team."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((u) => {
            const Icon =
              u.title === "Personal trainer"
                ? Users
                : u.title === "Online coach"
                ? StickyNote
                : u.title === "Small-group coach"
                ? ListChecks
                : u.title === "Studio or gym team"
                ? LayoutDashboard
                : UserCheck;
            return (
              <div
                key={u.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-4 font-display text-[16px] font-bold text-white">{u.title}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{u.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
