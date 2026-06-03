import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
  Brain,
  Calendar,
  ClipboardCheck,
  Dumbbell,
  PenTool,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wand2,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { FoundingBanner } from "@/components/pricing/FoundingBanner";
import { RegisterProof } from "@/components/marketing/RegisterProof";
import { ReplacesStrip } from "@/components/marketing/ReplacesStrip";
import { ProductBlock } from "@/components/marketing/ProductBlock";
import { PLANS } from "@/components/pricing/pricing-data";

import heroTrainer from "@/assets/hero-trainer.jpg";

import bbcSport from "@/assets/press/bbc-sport.svg.asset.json";
import gq from "@/assets/press/gq.svg.asset.json";
import mensHealth from "@/assets/press/mens-health.svg.asset.json";
import runnersWorld from "@/assets/press/runners-world.svg.asset.json";
import theTimes from "@/assets/press/the-times.svg.asset.json";
import womensFitness from "@/assets/press/womens-fitness.svg.asset.json";

export const Route = createFileRoute("/for-professionals")({
  head: () => ({
    meta: [
      { title: "Not just software. An AI operating system for fitness professionals — REPs" },
      {
        name: "description",
        content:
          "REPs is the verified register the public already searches — and the AI operating system that runs the rest of your fitness business. Better than Trainerize, MyPTHub or PT Distinction.",
      },
      { property: "og:title", content: "Join REPs — For Professionals" },
      {
        property: "og:description",
        content: "The register that brings you clients, and the AI operating system that runs your practice.",
      },
      { property: "og:url", content: "https://repsglobal.lovable.app/for-professionals" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/for-professionals" }],
  }),
  component: ForProsPage,
});

const TRUST_POINTS = [
  { icon: Users, label: "25,000+ verified pros" },
  { icon: Star, label: "4.8★ average rating" },
  { icon: ShieldCheck, label: "Verified register since 2009" },
  { icon: Calendar, label: "1M+ sessions booked" },
];

const PRESS = [
  { name: "The Times", url: theTimes.url },
  { name: "BBC Sport", url: bbcSport.url },
  { name: "Men's Health", url: mensHealth.url },
  { name: "Women's Fitness", url: womensFitness.url },
  { name: "Runner's World", url: runnersWorld.url },
  { name: "GQ", url: gq.url },
];

const AI_NARRATIVE = [
  {
    icon: Dumbbell,
    title: "Programmes, drafted in seconds",
    body: "One-line brief in, 12-week plan out — with the right exercises, sets and video demos.",
  },
  {
    icon: ClipboardCheck,
    title: "Check-ins, read for you",
    body: "Six check-ins summarised into one card: the headline, the change to make, who needs you.",
  },
  {
    icon: ScanLine,
    title: "Leads, scored and answered",
    body: "Every enquiry scored on intent, with a personalised first-draft reply ready to send.",
  },
  {
    icon: Sparkles,
    title: "Next Move, every Monday",
    body: "The single highest-leverage action this week — which package, which client, which day.",
  },
  {
    icon: AlertTriangle,
    title: "Risk, flagged before it churns",
    body: "AI watches adherence and tells you who's about to ghost — before they do.",
  },
  {
    icon: PenTool,
    title: "Content, on tap and on-brand",
    body: "Posts, captions and lead magnets drafted in your tone of voice from a one-line brief.",
  },
];

type SectionBlock = {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  imageLabel: string;
  ctaLabel: string;
  ctaHref: string;
};

const SECTION_BLOCKS: SectionBlock[] = [
  {
    eyebrow: "Verified profile",
    title: "Become the obvious choice in your area.",
    body:
      "Trust gets decided before they message you. Your profile shows the badge, the qualifications, the insurance, the reviews — backed by the UK's verified fitness register since 2009.",
    bullets: [
      "Verified badge backed by a 16-year register",
      "Qualifications, insurance and CPD shown live",
      "Reviews on the public record — not screenshotted on Instagram",
      "Indexed by location, specialism and price band",
    ],
    imageLabel: "Profile + directory mockup — screenshot coming",
    ctaLabel: "See the profile",
    ctaHref: "/features/visibility",
  },
  {
    eyebrow: "Leads CRM",
    title: "Stop losing the clients you've already won.",
    body:
      "Slow replies cost you clients. REPs lands every lead in one pipeline with source, value, priority and a follow-up date — and AI scores intent and drafts the first reply before you've opened the tab.",
    bullets: [
      "Pipeline stages from enquiry to booked consult",
      "Source tracking — know which channel pays",
      "Automated follow-up reminders, never another cold lead",
      "AI lead scoring and reply drafts ready to send",
    ],
    imageLabel: "Leads pipeline mockup — screenshot coming",
    ctaLabel: "See the pipeline",
    ctaHref: "/features/operations",
  },
  {
    eyebrow: "Client records",
    title: "One record. The whole client.",
    body:
      "Goals, programme, last check-in, next session, lifetime value, outstanding invoice — on one screen. The CRM the coaching apps don't have, wired to the coaching tools the CRMs don't have.",
    bullets: [
      "Full client record with adherence and progress",
      "Programme and nutrition snapshot at the top",
      "Notes, bookings and payments in the same view",
      "Lifetime value and renewal date surfaced",
    ],
    imageLabel: "Client record mockup — screenshot coming",
    ctaLabel: "Explore Coaching",
    ctaHref: "/features/coaching",
  },
  {
    eyebrow: "Bookings & payments",
    title: "Your schedule and your revenue, in one place.",
    body:
      "Once they're a client, the rest is logistics. Sessions, consults, online check-ins and classes on one calendar. Invoices, subscriptions, refunds and revenue on one ledger. Nothing held together with three tabs and a Google Sheet.",
    bullets: [
      "Calendar with availability and session types",
      "Stripe-powered payments and subscriptions — no per-booking commission, ever",
      "Live revenue, paid, pending and overdue",
      "Per-client invoice and payment history",
    ],
    imageLabel: "Bookings + payments mockup — screenshot coming",
    ctaLabel: "Explore Operations",
    ctaHref: "/features/operations",
  },
  {
    eyebrow: "Programmes",
    title: "Programmes your clients show off.",
    body:
      "Weeks, workouts, sets, reps, rest, RPE and video demos — built in a clean editor and assigned in one click. Or one-line brief in, 12-week plan out, drafted by REPs AI for you to edit.",
    bullets: [
      "Week-by-week structure with progression",
      "Curated exercise library with video demos",
      "One-click assignment, bulk edits across clients",
      "AI Programme Writer — drafted from a brief",
    ],
    imageLabel: "Programme builder mockup — screenshot coming",
    ctaLabel: "See the builder",
    ctaHref: "/features/coaching",
  },
  {
    eyebrow: "Check-ins",
    title: "Reclaim your Sunday evenings.",
    body:
      "Check-ins, read for you. Adherence, sleep, stress, training, nutrition, measurements and photos summarised into one card per client — with a reply already drafted in your tone of voice.",
    bullets: [
      "Single-screen check-in review per client",
      "AI Check-in Summariser — headline, change, ask",
      "Nutrition targets vs actuals with deltas",
      "Progress photos and measurements side-by-side",
    ],
    imageLabel: "Check-in review mockup — screenshot coming",
    ctaLabel: "Explore Coaching",
    ctaHref: "/features/coaching",
  },
  {
    eyebrow: "Client portal",
    title: "The app your clients tell their friends about.",
    body:
      "And what your clients see matters as much as what you see. A portal that looks like a premium product, not a beta. Today's session, this week's targets, next booking, last message — wherever they open it.",
    bullets: [
      "Client dashboard on web and mobile",
      "Programme, nutrition and check-ins in one tab each",
      "One-tap check-in with photos and metrics",
      "Bookings and payment history visible to the client",
    ],
    imageLabel: "Client portal mockup — screenshot coming",
    ctaLabel: "Explore Client Portal",
    ctaHref: "/features/coaching",
  },
  {
    eyebrow: "REPs AI",
    title: "Your business, with a head coach.",
    body:
      "And behind every screen, an operating layer. 14 AI capabilities working across programmes, check-ins, leads, risk and growth — drafting work, scoring intent, flagging churn, ranking the single move that pays this week. You stay the coach.",
    bullets: [
      "AI Programme Writer — 12-week plan from one brief",
      "AI Check-in Summariser — a stack of reviews into one card",
      "AI Client Risk Alerts — who's about to ghost",
      "Weekly Next Move — the action that pays this week",
    ],
    imageLabel: "AI Business Command Centre mockup — screenshot coming",
    ctaLabel: "Explore REPs AI",
    ctaHref: "/features/ai",
  },
  {
    eyebrow: "Next Move",
    title: "Monday morning. One card. One move.",
    body:
      "Not another dashboard you don't read. REPs ranks the highest-leverage action of the week — the price to raise, the client to renew, the package to launch — using your own numbers.",
    bullets: [
      "Weekly Next Move card — ranked by revenue impact",
      "Revenue, retention and renewal forecasting",
      "Profile views, enquiry-to-client conversion",
      "Content Studio — posts and lead magnets on tap",
    ],
    imageLabel: "Insights + growth mockup — screenshot coming",
    ctaLabel: "Explore Growth",
    ctaHref: "/features/growth",
  },
];



function useScrolledPast(threshold: number) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return past;
}

function ForProsPage() {
  const showStickyCta = useScrolledPast(680);
  const previewPlans = PLANS.filter((p) =>
    ["verified", "pro", "studio"].includes(p.tierKey),
  );

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-reps-border">
        <img
          src={heroTrainer}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/70 via-reps-ink/85 to-reps-ink" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_30%,rgba(255,122,0,0.18),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-[1240px] px-6 py-28 lg:px-10 lg:py-36">
          <div className="max-w-[860px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel/70 px-3 py-1 text-[12px] font-semibold text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> For professionals
            </span>
            <h1 className="mt-6 font-display text-[48px] font-bold leading-[1.02] text-white lg:text-[72px]">
              Not just software.
              <br />
              <span className="text-reps-orange">An AI operating system for fitness professionals.</span>
            </h1>
            <p className="mt-6 max-w-[640px] text-[17px] leading-relaxed text-white/75">
              REPs has been the fitness industry's verified register since 2009. Now it's also
              the AI operating system that runs your practice — programmes drafted, check-ins
              summarised, leads scored, risks flagged, next moves ranked.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                Get verified <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/features"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white backdrop-blur hover:bg-white/15"
              >
                Explore the platform
              </Link>
            </div>

            <div className="mt-12 grid max-w-[680px] grid-cols-2 gap-x-6 gap-y-3 text-[12.5px] text-white/65 sm:grid-cols-4">
              {TRUST_POINTS.map((t) => (
                <span key={t.label} className="flex items-center gap-2">
                  <t.icon className="h-4 w-4 text-reps-orange" /> {t.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRESS STRIP ============ */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
              As featured in
            </span>
            {PRESS.map((p) => (
              <img
                key={p.name}
                src={p.url}
                alt={p.name}
                className="h-5 brightness-0 invert opacity-80 lg:h-6"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============ ACT 1 — THE REGISTER ============ */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Act 1 · Get clients
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[42px]">
              The register the public already searches.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              Trainerize, MyPTHub and PT Distinction give you software. REPs gives you
              software <em>and</em> clients — because the public already lands here when
              they're looking for a trusted pro.
            </p>
          </div>
          <div className="mt-10">
            <RegisterProof />
          </div>
        </div>
      </section>

      {/* ============ ACT 2 — PLATFORM PILLARS ============ */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Act 2 · Run your practice
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[42px]">
              Five pillars. One operating system.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              When clients arrive, REPs runs the rest. Built for fitness — every booking,
              programme, check-in and message wired into the same client record.
            </p>
          </div>

          <div className="mt-10">
            <ReplacesStrip />
          </div>

          <div className="mt-16 space-y-20 lg:mt-20 lg:space-y-28">
            {SECTION_BLOCKS.map((b, i) => (
              <ProductBlock
                key={`${b.eyebrow}-${b.title}`}
                eyebrow={b.eyebrow}
                title={b.title}
                body={b.body}
                bullets={b.bullets}
                imageLabel={b.imageLabel}
                ctaLabel={b.ctaLabel}
                ctaHref={b.ctaHref}
                reverse={i % 2 === 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============ AI OPERATING LAYER ============ */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10">
          <div className="grid items-end gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-reps-orange-soft px-3 py-1 text-[12px] font-semibold text-reps-orange">
                <Wand2 className="h-3.5 w-3.5" /> REPs AI Operating System
              </span>
              <h2 className="mt-4 font-display text-[34px] font-bold leading-tight text-white lg:text-[48px]">
                The AI layer behind your fitness business.
              </h2>
              <p className="mt-4 max-w-[640px] text-[15.5px] leading-relaxed text-white/75">
                Six places REPs AI shows up across your day.
              </p>
            </div>
            <div className="rounded-[22px] border border-reps-orange-border bg-reps-orange-soft p-7">
              <Brain className="h-6 w-6 text-reps-orange" />
              <div className="mt-4 font-display text-[44px] font-bold leading-none text-reps-orange">
                14
              </div>
              <div className="mt-2 text-[12px] font-semibold uppercase tracking-wider text-white/70">
                AI capabilities across the platform
              </div>
              <Link
                to="/features/ai"
                className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-white hover:underline"
              >
                See all 14 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {AI_NARRATIVE.map((n) => (
              <div
                key={n.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <n.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">
                  {n.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ============ FINAL CTA ============ */}
      <section>
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="rounded-[24px] border border-reps-border bg-reps-panel p-10 text-center lg:p-14">
            <BadgeCheck className="mx-auto h-7 w-7 text-reps-orange" />
            <h2 className="mt-4 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
              Join 25,000+ verified pros.
            </h2>
            <p className="mx-auto mt-3 max-w-[520px] text-[15px] text-white/70">
              Founding pricing is locked for life — but only available before public launch.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                Join REPs <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STICKY CTA ============ */}
      <div
        aria-hidden={!showStickyCta}
        className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-300 ${
          showStickyCta ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto max-w-[1240px] px-4 pb-4 lg:px-10">
          <div className="flex items-center justify-between gap-3 rounded-[16px] border border-reps-border bg-reps-panel/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <TrendingUp className="hidden h-5 w-5 text-reps-orange sm:block" />
              <div className="text-[13px] text-white">
                <span className="font-semibold">Founding pricing locked for life.</span>{" "}
                <span className="hidden text-white/65 sm:inline">Before public launch.</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/pricing"
                className="hidden h-9 items-center rounded-[10px] border border-white/25 px-3 text-[12px] font-semibold text-white hover:bg-white/10 sm:inline-flex"
              >
                See pricing
              </Link>
              <Link
                to="/signup"
                className="inline-flex h-9 items-center gap-1 rounded-[10px] bg-reps-orange px-4 text-[12px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                Start free <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
