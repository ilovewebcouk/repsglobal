import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Check,
  Eye,
  Gift,
  Heart,
  LineChart,
  MessageSquare,
  PoundSterling,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  Users,
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
import { Separator } from "@/components/ui/separator";

import heroGrowth from "@/assets/hero-growth-bg.jpg.asset.json";

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

const GROWTH_QUESTIONS = [
  "Which leads are converting?",
  "Which clients are becoming inactive?",
  "Which packages are performing best?",
  "Who is due a review request?",
  "Which clients could refer someone?",
  "Where is revenue coming from?",
  "What should I improve this month?",
  "What should I do next to grow?",
];

const RANKED_ACTIONS = [
  { impact: "High", label: "Ask Sarah J. for a review — 12-week milestone hit", tag: "Reviews" },
  { impact: "High", label: "Reactivate 4 dormant enquiries from last month", tag: "Reactivation" },
  { impact: "Med", label: "Offer renewal to James C. — package ends in 9 days", tag: "Retention" },
  { impact: "Med", label: "Follow up Priya K. — consultation 6 days ago, no reply", tag: "Conversion" },
  { impact: "Low", label: "Update Hybrid Coaching pricing — strongest seller this quarter", tag: "Revenue" },
];

const FUNNEL = [
  { label: "Enquiries", value: 42, pct: 100 },
  { label: "Consultations", value: 28, pct: 67 },
  { label: "Conversions", value: 16, pct: 38 },
];

const AT_RISK = [
  { name: "Megan R.", reason: "3 weeks since check-in" },
  { name: "Tom B.", reason: "Adherence dropped to 41%" },
  { name: "Alex P.", reason: "No reply to last 2 messages" },
];

const RENEWALS = [
  { name: "James C.", reason: "Ends in 9 days" },
  { name: "Sarah J.", reason: "Ends in 14 days" },
];

const PACKAGES = [
  { name: "Hybrid Coaching (12 wk)", clients: 11, mrr: "£2,420", trend: "+18%" },
  { name: "1:1 In-person (4×/mo)", clients: 7, mrr: "£1,540", trend: "+6%" },
  { name: "Online Programming", clients: 9, mrr: "£810", trend: "−4%" },
  { name: "Group Strength (small)", clients: 14, mrr: "£980", trend: "+11%" },
];

const FOLLOWUP_QUEUE = [
  { who: "Priya K.", note: "Booked a consultation 6 days ago — never replied", tag: "Dormant lead" },
  { who: "Marcus T.", note: "Finished 12-week plan — never re-booked", tag: "Lapsed client" },
  { who: "Hannah F.", note: "Reviewed goals 14 weeks ago — overdue", tag: "Goal review" },
  { who: "Old enquiry: Dan W.", note: "Asked about hybrid in January, never followed up", tag: "Old enquiry" },
];

const AI_ACTIONS = [
  { icon: MessageSquare, title: "Follow up this lead", body: "Priya K. — consultation 6 days ago, no reply." },
  { icon: Star, title: "Request a review", body: "Sarah J. just hit her 12-week milestone." },
  { icon: RefreshCcw, title: "Offer a renewal", body: "James C.'s package ends in 9 days." },
  { icon: RotateCcw, title: "Reactivate an old enquiry", body: "Dan W. — asked about hybrid in January." },
  { icon: Eye, title: "Improve a Shop Front section", body: "Your Hybrid service has the lowest enquire-rate." },
  { icon: Gift, title: "Create a referral prompt", body: "Megan R. — 6 months in, no referral asked." },
  { icon: PoundSterling, title: "Review a package", body: "Online Programming MRR down 4% this month." },
  { icon: Heart, title: "Check an inactive client", body: "Tom B. — adherence dropped to 41%." },
];

const USE_CASES = [
  {
    icon: Users,
    title: "Personal trainer",
    body: "See which packages convert, who's due a review, and who's about to drop off — before it costs you a client.",
  },
  {
    icon: LineChart,
    title: "Online coach",
    body: "Track conversion across the funnel, spot disengaged clients early, and time renewal offers without guessing.",
  },
  {
    icon: TrendingUp,
    title: "Transformation coach",
    body: "Turn finished programmes into reviews, referrals and re-signs — instead of letting wins disappear privately.",
  },
  {
    icon: Zap,
    title: "Strength coach",
    body: "Know who's adhering, who's stalled and who's ready to re-up — without scrolling six months of messages.",
  },
  {
    icon: UserCheck,
    title: "Small-group coach",
    body: "See attendance, retention and revenue per group — and which members are quietly disengaging.",
  },
  {
    icon: BadgeCheck,
    title: "Studio / team",
    body: "One business dashboard across the team — revenue, retention, reviews and the next growth move.",
  },
];

const COMPARISON_ROWS: Array<{ feature: string; verified: boolean; pro: boolean }> = [
  { feature: "Public verified profile and reviews", verified: true, pro: true },
  { feature: "Review collection on profile", verified: true, pro: true },
  { feature: "Business growth dashboard", verified: false, pro: true },
  { feature: "Revenue, MRR and package insights", verified: false, pro: true },
  { feature: "Lead conversion funnel", verified: false, pro: true },
  { feature: "Retention and churn-risk signals", verified: false, pro: true },
  { feature: "Review-request prompts", verified: false, pro: true },
  { feature: "Referral prompts and milestones", verified: false, pro: true },
  { feature: "Reactivation and follow-up queue", verified: false, pro: true },
  { feature: "AI growth recommendations", verified: false, pro: true },
];

const FAQ_ITEMS = [
  {
    q: "Is Growth a marketing or ads page?",
    a: "No. Growth is about improving the business you already have — retention, conversion, reviews, referrals and revenue visibility. It is not about SEO, social media or paid ads. Getting found is covered by Visibility; converting visitors is covered by Shop Front.",
  },
  {
    q: "How is Growth different from Operations?",
    a: "Operations runs the day-to-day — enquiries, bookings, forms, payments, client records. Growth turns that activity into business insight: what's converting, what's slipping, who's at risk, where revenue is moving and what to do about it next.",
  },
  {
    q: "Where do the growth numbers come from?",
    a: "From the activity already happening inside your REPS Pro account — enquiries, consultations, bookings, payments, packages, reviews and client engagement. No extra tracking, no extra apps to wire up.",
  },
  {
    q: "Do I have to act on every recommendation?",
    a: "No. Growth surfaces the next moves, ranked by impact. You decide which ones to take this week. The point is to stop missing the obvious ones — not to add more to your list.",
  },
  {
    q: "Will this help me get more clients?",
    a: "Indirectly, yes — through reviews, referrals, better conversion of the enquiries you already have and re-engaging clients you'd otherwise lose. For new audience reach, see Visibility and Shop Front.",
  },
  {
    q: "Is Growth included in Verified or only Pro?",
    a: "Growth is a Pro feature. Verified gives you a trusted public profile and review collection. Pro adds the business dashboard, conversion insights, retention signals, referral prompts, reactivation queue and AI growth actions behind it.",
  },
];

// -----------------------------------------------------------------------------
// Route
// -----------------------------------------------------------------------------

export const Route = createFileRoute("/features/growth")({
  head: () => ({
    meta: [
      {
        title: "Growth — Grow a stronger fitness business with clearer decisions · REPS",
      },
      {
        name: "description",
        content:
          "REPS Pro turns your client activity into business growth — retention, reviews, referrals, reactivation and revenue insights. See what's working, fix what's slipping.",
      },
      {
        property: "og:title",
        content: "Growth — Grow a stronger fitness business with clearer decisions",
      },
      {
        property: "og:description",
        content:
          "Improve revenue, retention, reviews, referrals and business performance — the growth layer behind REPS Pro.",
      },
      { property: "og:image", content: heroGrowth.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/growth" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/growth" }],
  }),
  component: GrowthPage,
});

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

function GrowthPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <Hero />

      <ProblemSection />
      <DashboardSection />
      <ConversionSection />
      <RetentionSection />
      <ReviewsReferralsSection />
      <PackagesSection />
      <ReactivationSection />
      <AiActionsSection />
      <UseCasesSection />
      <TierComparisonSection />

      <MarketingFaq
        eyebrow="Common questions"
        heading="What Growth covers, and what it doesn't."
        items={FAQ_ITEMS}
      />

      <FinalCta
        heading="Grow with better visibility, better follow-up and"
        headingAccent=" clearer business decisions."
        lede="Use REPS Pro to track what matters, keep clients engaged and turn more opportunities into growth."
        primary={{ to: "/signup", label: "Start using REPS Pro" }}
        secondary={{ to: "/pricing", label: "See Pro pricing" }}
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
        src={heroGrowth.url}
        alt="REPS-verified studio owner reviewing her business growth dashboard"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover object-center lg:object-right"
      />
      <HeroOverlay copySide="left" />

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col justify-start px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-24">
        <div className="max-w-[680px]">
          <MarketingHeroEyebrow
            icon={TrendingUp}
            style={{ animationDuration: "560ms", animationFillMode: "both" }}
          >
            Growth · Business performance, not marketing fluff
          </MarketingHeroEyebrow>

          <h1
            className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[60px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            Grow a stronger fitness business with{" "}
            <span className="text-reps-orange">clearer decisions.</span>
          </h1>

          <p
            className="mt-6 max-w-[600px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            Use REPS Pro to understand your leads, clients, revenue, reviews, referrals and
            retention — so you can see what's working, what needs attention, and what to do next.
          </p>

          <div
            className="mt-8 flex animate-fade-in flex-wrap gap-3"
            style={{ animationDuration: "640ms", animationDelay: "260ms", animationFillMode: "both" }}
          >
            <Link
              to="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Start using REPS Pro <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#dashboard"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              Explore growth tools
            </a>
          </div>

          <ul
            className="mt-7 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70"
            style={{ animationDuration: "640ms", animationDelay: "340ms", animationFillMode: "both" }}
          >
            <li className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-reps-orange" /> REPS Pro
            </li>
            <li className="inline-flex items-center gap-1.5">
              <LineChart className="h-4 w-4 text-reps-orange" /> Built on your real activity
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-reps-orange" /> AI growth recommendations
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
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The growth gap"
          heading="Most fitness pros are busy. Not many can say exactly what's growing the business."
          lede="You have clients, messages, bookings and payments. What you often don't have is a clear view of conversion, retention, follow-up, reviews, referrals and revenue. The result is a business that runs — but never quite improves."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:items-start">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-7 lg:p-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
              <Sparkles className="h-3 w-3" /> The growth question
            </span>
            <BlockHeading className="mt-4">You cannot improve what you cannot see.</BlockHeading>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/75">
              Operations keeps the business running. Coaching delivers the results. Growth is the
              layer that helps you understand which parts of your business are working, which are
              slipping, and where the next opportunity is hiding in plain sight.
            </p>
            <Separator className="my-6 bg-reps-border" />
            <p className="text-[13.5px] leading-relaxed text-white/65">
              Growth is not a marketing page. It is not SEO, social media or paid ads. It is the
              business-performance layer that sits on top of the activity you already have inside
              REPS Pro.
            </p>
          </div>

          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
              Questions Growth answers
            </span>
            <ul className="mt-5 space-y-2">
              {GROWTH_QUESTIONS.map((q) => (
                <li
                  key={q}
                  className="flex items-start gap-2.5 rounded-[16px] border border-reps-border/70 bg-reps-ink/60 px-4 py-2.5 text-[13.5px] text-white/80"
                >
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {q}
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
// 2. Growth dashboard — centrepiece (inline mock)
// -----------------------------------------------------------------------------

function KpiTile({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <div className="rounded-[16px] border border-reps-border bg-reps-ink/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-2 font-display text-[22px] font-bold leading-none text-white">{value}</p>
      {trend ? (
        <p
          className={`mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold ${
            trend.startsWith("−") ? "text-white/55" : "text-emerald-300"
          }`}
        >
          {!trend.startsWith("−") ? <ArrowUpRight className="h-3 w-3" /> : null}
          {trend}
        </p>
      ) : null}
    </div>
  );
}

function DashboardSection() {
  return (
    <section id="dashboard" className="scroll-mt-24 bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The growth dashboard"
          heading="One screen. Revenue, retention, conversion, reviews and the next move."
          lede="The centrepiece of REPS Pro Growth. Built from the activity already happening in your account — bookings, payments, packages, clients and reviews — surfaced as the numbers and next actions that actually move the business."
        />

        <div className="mt-12 rounded-[22px] border border-reps-border bg-reps-panel/60 p-5 lg:p-8">
          {/* Top KPI row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KpiTile label="MRR" value="£5,750" trend="+12%" />
            <KpiTile label="Active clients" value="41" trend="+3" />
            <KpiTile label="New leads (30d)" value="42" trend="+9" />
            <KpiTile label="Conversion" value="38%" trend="+4%" />
            <KpiTile label="Retention (90d)" value="86%" trend="+2%" />
            <KpiTile label="Avg client value" value="£140" trend="+£8" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            {/* Ranked actions */}
            <div className="rounded-[18px] border border-reps-orange-border bg-reps-orange-soft/30 p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <p className="font-display text-[15px] font-bold text-white">
                  This month's growth actions
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-reps-orange">
                  <Sparkles className="h-3 w-3" /> Ranked by impact
                </span>
              </div>
              <ol className="mt-4 space-y-2.5">
                {RANKED_ACTIONS.map((a, i) => (
                  <li
                    key={a.label}
                    className="flex items-start gap-3 rounded-[16px] border border-reps-border bg-reps-ink/70 px-4 py-3"
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[11px] font-bold text-reps-orange">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] leading-snug text-white/85">{a.label}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] ${
                            a.impact === "High"
                              ? "bg-reps-orange-soft text-reps-orange"
                              : a.impact === "Med"
                                ? "bg-white/10 text-white/75"
                                : "bg-white/5 text-white/55"
                          }`}
                        >
                          {a.impact} impact
                        </span>
                        <span className="rounded-full border border-reps-border bg-reps-ink/60 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/60">
                          {a.tag}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Funnel + reviews/referrals */}
            <div className="flex flex-col gap-5">
              <div className="rounded-[18px] border border-reps-border bg-reps-ink/60 p-5">
                <p className="font-display text-[14px] font-bold text-white">
                  Lead-to-client funnel (30d)
                </p>
                <ul className="mt-4 space-y-3">
                  {FUNNEL.map((row) => (
                    <li key={row.label}>
                      <div className="flex items-center justify-between text-[12.5px] text-white/70">
                        <span>{row.label}</span>
                        <span className="font-semibold text-white/85">{row.value}</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-reps-orange"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[16px] border border-reps-border bg-reps-ink/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    Reviews collected
                  </p>
                  <p className="mt-2 font-display text-[22px] font-bold text-white">7</p>
                  <p className="mt-1 text-[11.5px] text-emerald-300">+3 this month</p>
                </div>
                <div className="rounded-[16px] border border-reps-border bg-reps-ink/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    Referrals requested
                  </p>
                  <p className="mt-2 font-display text-[22px] font-bold text-white">4</p>
                  <p className="mt-1 text-[11.5px] text-white/55">2 turned into enquiries</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer: at-risk + renewals */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[18px] border border-reps-border bg-reps-ink/60 p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-[14px] font-bold text-white">Clients at risk</p>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/55">
                  3 flagged
                </span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {AT_RISK.map((c) => (
                  <li
                    key={c.name}
                    className="rounded-full border border-reps-border bg-reps-panel/40 px-3 py-1.5 text-[12px] text-white/80"
                  >
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-white/55"> · {c.reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[18px] border border-emerald-400/30 bg-emerald-500/10 p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-[14px] font-bold text-white">Renewals due</p>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                  Opportunity
                </span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {RENEWALS.map((c) => (
                  <li
                    key={c.name}
                    className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-[12px] text-white/85"
                  >
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-white/65"> · {c.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[12px] text-white/45">
          Illustrative figures — your dashboard reflects your own account activity.
        </p>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 3. Lead conversion insights
// -----------------------------------------------------------------------------

function ConversionSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Lead conversion insights"
          heading="See where enquiries become clients — and where they drop off."
          lede="Connects the activity in Shop Front and Operations into a single funnel. You stop guessing which step is leaking and start fixing the one that actually costs you clients."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-7 lg:p-9">
            <p className="font-display text-[15px] font-bold text-white">
              Funnel: last 30 days
            </p>
            <ul className="mt-5 space-y-4">
              {FUNNEL.map((row) => (
                <li key={row.label}>
                  <div className="flex items-center justify-between text-[13px] text-white/75">
                    <span>{row.label}</span>
                    <span className="font-semibold text-white/90">{row.value}</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-reps-orange"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <Separator className="my-6 bg-reps-border" />
            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              <div className="rounded-[16px] border border-reps-border bg-reps-ink/60 px-3 py-2.5">
                <p className="text-white/55">Follow-ups overdue</p>
                <p className="mt-1 font-display text-[18px] font-bold text-white">5</p>
              </div>
              <div className="rounded-[16px] border border-reps-border bg-reps-ink/60 px-3 py-2.5">
                <p className="text-white/55">Lost leads (30d)</p>
                <p className="mt-1 font-display text-[18px] font-bold text-white">8</p>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7 lg:p-9">
            <BlockHeading>Growth starts at the conversion step.</BlockHeading>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/75">
              Growth starts by understanding where enquiries become clients, and where they drop
              off. A funnel that loses half its leads at the consultation step is a very different
              problem from a funnel that loses them at the price conversation.
            </p>
            <ul className="mt-6 space-y-2.5 text-[13.5px] text-white/80">
              {[
                "Enquiries received vs replied",
                "Consultations booked vs attended",
                "Consultations converted to clients",
                "Best-performing services by conversion",
                "Lost leads with reason (where given)",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
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
// 4. Retention & client risk
// -----------------------------------------------------------------------------

function RetentionSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Retention and client risk"
          heading="The easiest growth is often keeping the clients you already have."
          lede="Retention quietly drives more revenue than acquisition. Growth surfaces the early signals — missed check-ins, dropping adherence, packages ending, overdue reviews — so you act before a quiet client becomes a lost one."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-7">
            <BlockHeading>Signals that predict churn.</BlockHeading>
            <ul className="mt-5 space-y-2.5 text-[13.5px] text-white/80">
              {[
                "Inactive clients (no session this month)",
                "Missed or skipped check-ins",
                "Low adherence to current plan",
                "Package ending soon",
                "No recent progress update",
                "Review or goal-review overdue",
                "Renewal opportunity due",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-7">
            <div className="flex items-center justify-between">
              <p className="font-display text-[15px] font-bold text-white">Clients to check in on</p>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                Sample view
              </span>
            </div>
            <ul className="mt-5 space-y-3">
              {[
                ...AT_RISK,
                { name: "Hannah F.", reason: "Goal review 14 weeks overdue" },
                { name: "Marcus T.", reason: "Finished 12-week plan, no re-book" },
              ].map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between rounded-[16px] border border-reps-border bg-reps-ink/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-white">{c.name}</p>
                    <p className="text-[12.5px] text-white/60">{c.reason}</p>
                  </div>
                  <span className="rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-reps-orange">
                    Action
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

// -----------------------------------------------------------------------------
// 5. Reviews & referrals
// -----------------------------------------------------------------------------

function ReviewsReferralsSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Reviews and referrals"
          heading="Your best client outcomes should create more trust — not disappear into private messages."
          lede="Visibility shows the world your reviews. Growth makes sure those reviews — and the referrals that follow them — actually get asked for at the right moment."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Star, title: "Review request prompts", body: "Surfaced when a client hits a milestone or finishes a plan — not at random." },
            { icon: Gift, title: "Referral prompts", body: "Triggered for happy, long-term clients who haven't been asked yet." },
            { icon: Heart, title: "Client milestones", body: "12-week marks, transformation moments, training anniversaries — captured, not lost." },
            { icon: Sparkles, title: "Success moments", body: "Personal bests, goal hits and big wins flagged as testimonial opportunities." },
            { icon: MessageSquare, title: "Testimonial opportunities", body: "Convert a happy message into a public review with one tap." },
            { icon: TrendingUp, title: "Reputation growth", body: "Watch your review count, recency and rating climb together — month over month." },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <c.icon className="h-4 w-4" />
              </span>
              <p className="mt-4 font-display text-[15px] font-bold text-white">{c.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/70">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 6. Packages & revenue
// -----------------------------------------------------------------------------

function PackagesSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Packages and revenue"
          heading="See which services are actually driving the business forward."
          lede="Not every package earns its keep. Growth shows which ones bring in the most revenue, which are quietly declining, and which clients are about to renew or roll off — so pricing and packaging decisions stop being guesswork."
        />

        <div className="mt-12 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/60">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[1.4fr_0.6fr_0.7fr_0.6fr] items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                <span>Package</span>
                <span className="text-center">Clients</span>
                <span className="text-right">MRR</span>
                <span className="text-right pr-1">90-day trend</span>
              </div>
              {PACKAGES.map((p, i) => (
                <div
                  key={p.name}
                  className={`grid grid-cols-[1.4fr_0.6fr_0.7fr_0.6fr] items-center px-5 py-4 text-[14px] text-white/85 ${
                    i % 2 === 0 ? "bg-white/[0.02]" : ""
                  }`}
                >
                  <span className="font-semibold text-white">{p.name}</span>
                  <span className="text-center text-white/70">{p.clients}</span>
                  <span className="text-right font-display font-bold text-white">{p.mrr}</span>
                  <span
                    className={`text-right pr-1 font-semibold ${
                      p.trend.startsWith("−") ? "text-white/55" : "text-emerald-300"
                    }`}
                  >
                    {p.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <KpiTile label="Recurring revenue" value="£5,750" trend="+12%" />
          <KpiTile label="One-off payments (30d)" value="£1,240" />
          <KpiTile label="Expiring packages (30d)" value="6" />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 7. Reactivation & follow-up
// -----------------------------------------------------------------------------

function ReactivationSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Reactivation and follow-up"
          heading="Find the people worth following up — before the opportunity is gone."
          lede="Most lost revenue isn't a bad lead — it's a good lead that never got a second message. Growth keeps the people worth chasing in one ranked queue, so nothing valuable disappears into the scroll."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <BlockHeading>Worth a second message.</BlockHeading>
            <ul className="mt-5 space-y-2.5 text-[13.5px] text-white/80">
              {[
                "Dormant leads",
                "Inactive clients",
                "Old enquiries",
                "Clients who completed a plan",
                "Clients who stopped checking in",
                "Clients due a goal review",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-7">
            <p className="font-display text-[15px] font-bold text-white">Follow-up queue</p>
            <ul className="mt-5 space-y-3">
              {FOLLOWUP_QUEUE.map((row) => (
                <li
                  key={row.who}
                  className="rounded-[16px] border border-reps-border bg-reps-ink/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13.5px] font-semibold text-white">{row.who}</p>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/60">
                      {row.tag}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] text-white/65">{row.note}</p>
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
// 8. AI growth recommendations
// -----------------------------------------------------------------------------

function AiActionsSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="AI growth recommendations"
          heading="Growth shouldn't depend on remembering every opportunity manually."
          lede="REPS AI scans your real account activity and ranks the moves with the most business impact this week — the lead worth following up, the client worth re-engaging, the review worth asking for now."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AI_ACTIONS.map(({ icon: Icon, title, body }) => (
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

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/features/ai"
            className="inline-flex h-12 items-center gap-2 rounded-[10px] border border-white/25 bg-white/5 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/15"
          >
            How REPS AI works <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 9. Growth for different business models
// -----------------------------------------------------------------------------

function UseCasesSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Built for every kind of business"
          heading="What Growth looks like for…"
          lede="The same dashboard, shaped to how you actually run your business. Growth flexes with the model — 1:1, online, transformation, strength, small group or studio."
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
// 10. Verified vs Pro
// -----------------------------------------------------------------------------

function TierComparisonSection() {
  return (
    <section className="bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Verified vs Pro"
          heading="Verified gets you trusted. Pro grows the business behind the profile."
          lede="Growth is a Pro pillar. Verified gives you the public credibility, visibility and review collection. Pro adds the growth system — insights, retention signals, conversion data, referral prompts, reactivation queue and AI growth actions."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <TierCard
            badge="Verified"
            price="£99 / year"
            blurb="Public verified profile, directory presence and review collection. No business dashboard, no conversion insights, no retention or growth tooling."
            cta={{ to: "/features/visibility", label: "See what Verified covers" }}
          />
          <TierCard
            badge="Pro"
            price="£59 / month · Founding"
            blurb="Everything in Verified, plus the full Growth layer — dashboard, conversion, retention, reviews, referrals, reactivation and AI growth recommendations."
            highlighted
            cta={{ to: "/pricing", label: "See Pro pricing" }}
          />
        </div>

        <div className="mt-10 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/40">
          <div className="overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="grid grid-cols-[1fr_120px_120px] items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                <span>Growth capability</span>
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
