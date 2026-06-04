import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  ClipboardCheck,
  Dumbbell,
  Eye,
  PenTool,
  ScanLine,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wand2,
  Calendar,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { RegisterProof } from "@/components/marketing/RegisterProof";

import { ProductBlock } from "@/components/marketing/ProductBlock";
import { PillarTabs } from "@/components/marketing/PillarTabs";
import { TestimonialFeature } from "@/components/marketing/TestimonialFeature";
import { TestimonialTriad } from "@/components/marketing/TestimonialTriad";
import { ComparisonStrip } from "@/components/marketing/ComparisonStrip";
import { AiCommandCentreMock } from "@/components/marketing/AiCommandCentreMock";
import { WeekWithReps } from "@/components/marketing/WeekWithReps";
import { StickyCtaPill } from "@/components/marketing/StickyCtaPill";
import { ForProsFaq } from "@/components/marketing/ForProsFaq";
import { HeroDeviceCluster } from "@/components/marketing/HeroDeviceCluster";
import { UseCaseTriad } from "@/components/marketing/UseCaseTriad";
import { ReplacedStackBoard } from "@/components/marketing/ReplacedStackBoard";

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
          "REPs is the verified register the public already searches — and the AI operating system that runs the rest of your fitness business.",
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

const PRESS = [
  { name: "The Times", url: theTimes.url },
  { name: "BBC Sport", url: bbcSport.url },
  { name: "Men's Health", url: mensHealth.url },
  { name: "Women's Fitness", url: womensFitness.url },
  { name: "Runner's World", url: runnersWorld.url },
  { name: "GQ", url: gq.url },
];

const AI_CAPS = [
  { icon: Dumbbell, title: "Programmes, drafted in seconds", body: "One-line brief in, 12-week plan out — exercises, sets, video demos." },
  { icon: ClipboardCheck, title: "Check-ins, read for you", body: "Six check-ins summarised into one card: headline, change, ask." },
  { icon: ScanLine, title: "Leads, scored and answered", body: "Every enquiry scored on intent, first-draft reply ready to send." },
  { icon: Sparkles, title: "Next Move, every Monday", body: "The single highest-leverage action this week — ranked by impact." },
  { icon: AlertTriangle, title: "Risk, flagged before it churns", body: "Adherence watched — REPs tells you who's about to ghost." },
  { icon: PenTool, title: "Content, on tap and on-brand", body: "Posts, captions and lead magnets drafted in your tone of voice." },
];

function ForProsPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />
      <StickyCtaPill />

      {/* HERO — split with device cluster */}
      <section className="relative overflow-hidden border-b border-reps-border">
        <img src={heroTrainer} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/85 via-reps-ink/92 to-reps-ink" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(55%_55%_at_20%_30%,rgba(255,122,0,0.22),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-[1240px] px-6 pb-24 pt-20 lg:px-10 lg:pb-32 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
            {/* Left: copy */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Verified · Trusted · Booked
              </span>
              <h1 className="mt-6 font-display text-[44px] font-bold leading-[1.05] text-white lg:text-[64px]">
                Not just software.
                <br />
                <span className="text-reps-orange">An AI operating system for fitness professionals.</span>
              </h1>
              <p className="mt-6 max-w-[540px] text-[16px] leading-relaxed text-white/75">
                REPs is built for fitness professionals who want to get found, win more
                clients, deliver better coaching and grow a sustainable business. One
                platform. Every tool. Powered by AI.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/signup"
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
                >
                  Join REPs <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/features"
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white backdrop-blur hover:bg-white/15"
                >
                  Explore features
                </Link>
              </div>
            </div>

            {/* Right: device cluster — hidden on small screens */}
            <div className="relative hidden md:block">
              <HeroDeviceCluster />
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="relative border-t border-reps-border/60 bg-reps-ink/60 backdrop-blur">
          <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-x-6 gap-y-3 px-6 py-5 text-[12.5px] text-white/65 sm:grid-cols-4 lg:px-10">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-reps-orange" /> Verified register heritage</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-reps-orange" /> Built for fitness pros</span>
            <span className="flex items-center gap-2"><Star className="h-4 w-4 text-reps-orange" /> Reviews on the public record</span>
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-reps-orange" /> Bookings, payments, coaching in one</span>
          </div>
        </div>
      </section>

      {/* PRESS */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">As featured in</span>
            {PRESS.map((p) => (
              <img key={p.name} src={p.url} alt={p.name} className="h-5 brightness-0 invert opacity-80 lg:h-6" loading="lazy" />
            ))}
          </div>
        </div>
      </section>

      {/* ACT 1 — REGISTER */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="max-w-[720px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Act 1 · Get clients
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
              The register the public already searches.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              Trainerize, MyPTHub and PT Distinction give you software. REPs gives you software{" "}
              <em>and</em> clients — because the public already lands here when they're looking for a trusted pro.
            </p>
          </div>
          <div className="mt-10"><RegisterProof /></div>
        </div>
      </section>

      {/* VISIBILITY SHOWCASE */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <ProductBlock
            eyebrow="Verified profile"
            title="Become the obvious choice in your area."
            body="Trust gets decided before they message you. Your profile shows the badge, the qualifications, the insurance, the reviews — backed by the UK's verified register since 2009."
            bullets={[
              "Verified badge backed by a 16-year register",
              "Qualifications, insurance and CPD shown live",
              "Reviews on the public record — not screenshotted on Instagram",
              "Indexed by location, specialism and price band",
            ]}
            imageLabel="Profile + directory mockup — screenshot coming"
            mockup={{ device: "laptop", src: "/pro/james-carter", title: "Verified professional profile preview" }}
            ctaLabel="See the profile"
            ctaHref="/features/visibility"
          />
        </div>
      </section>

      {/* ACT 2 — PILLARS */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="max-w-[720px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Act 2 · Run your practice
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
              Five pillars. One operating system.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              When clients arrive, REPs runs the rest. Built for fitness — every booking,
              programme, check-in and message wired into the same client record.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: Eye, name: "Visibility", body: "Verified profile on the register the public already searches." },
              { icon: Settings2, name: "Operations", body: "Leads, bookings, payments and your calendar in one place." },
              { icon: ClipboardCheck, name: "Coaching", body: "Programmes, check-ins and the full client record." },
              { icon: Brain, name: "REPs AI", body: "Drafts, scores and flags so you stay ahead of the week." },
              { icon: TrendingUp, name: "Growth", body: "Content, reviews and reporting that compound over time." },
            ].map((p) => (
              <div
                key={p.name}
                className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <p.icon className="h-4.5 w-4.5" />
                </span>
                <h3 className="mt-3 font-display text-[15px] font-bold uppercase tracking-wider text-white">
                  {p.name}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PILLAR 1 — LEADS */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <ProductBlock
            eyebrow="Pillar 1 · Leads CRM"
            title="Stop losing the clients you've already won."
            body="Slow replies cost you clients. REPs lands every lead in one pipeline with source, value, priority and a follow-up date — and AI scores intent and drafts the first reply before you've opened the tab."
            bullets={[
              "Pipeline stages from enquiry to booked consult",
              "Source tracking — know which channel pays",
              "Automated follow-up reminders, never another cold lead",
              "AI lead scoring and reply drafts ready to send",
            ]}
            imageLabel="Leads pipeline mockup — screenshot coming"
            mockup={{ device: "laptop", src: "/dashboard/leads", title: "Leads pipeline preview" }}
            ctaLabel="See the pipeline"
            ctaHref="/features/operations"
          />
        </div>
      </section>

      {/* PILLAR 2 — COACHING (TABBED) */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="mb-10 max-w-[720px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Pillar 2 · Coaching
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Programmes, check-ins and the full client record — in one tool.
            </h2>
          </div>
          <PillarTabs />
        </div>
      </section>

      {/* FEATURE TESTIMONIAL */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10 lg:py-24">
          <TestimonialFeature />
        </div>
      </section>

      {/* PILLAR 3 — BOOKINGS & PAYMENTS */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <ProductBlock
            eyebrow="Pillar 3 · Bookings & payments"
            title="Your schedule and your revenue, in one place."
            body="Once they're a client, the rest is logistics. Sessions, consults, online check-ins and classes on one calendar. Invoices, subscriptions, refunds and revenue on one ledger."
            bullets={[
              "Calendar with availability and session types",
              "Card payments and subscriptions — REPs takes no cut of what your clients pay you",
              "Live revenue, paid, pending and overdue",
              "Per-client invoice and payment history",
            ]}
            imageLabel="Bookings + payments mockup — screenshot coming"
            mockup={{ device: "laptop", src: "/dashboard/calendar", title: "Bookings and calendar preview" }}
            ctaLabel="Explore Operations"
            ctaHref="/features/operations"
            reverse
          />
        </div>
      </section>

      {/* PILLAR 4 — CLIENT PORTAL */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <ProductBlock
            eyebrow="Pillar 4 · Client portal"
            title="The app your clients tell their friends about."
            body="What your clients see matters as much as what you see. A portal that looks like a premium product, not a beta. Today's session, this week's targets, next booking, last message — wherever they open it."
            bullets={[
              "Client dashboard on web and mobile",
              "Programme, nutrition and check-ins in one tab each",
              "One-tap check-in with photos and metrics",
              "Bookings and payment history visible to the client",
            ]}
            imageLabel="Client portal mockup — screenshot coming"
            mockup={{ device: "phone", src: "/portal/today", title: "Client portal preview" }}
            ctaLabel="Explore Client Portal"
            ctaHref="/features/coaching"
          />
        </div>
      </section>

      {/* COMPARISON */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="mx-auto mb-10 max-w-[680px] text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              The honest comparison
            </span>
            <h2 className="mt-3 font-display text-[28px] font-bold text-white lg:text-[36px]">
              What you actually get for your money.
            </h2>
          </div>
          <ComparisonStrip />
        </div>
      </section>

      {/* REPLACED STACK + TRIAD TESTIMONIALS */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <ReplacedStackBoard />
          <div className="mt-14">
            <div className="mb-8 max-w-[640px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                Loved by working pros
              </span>
              <h3 className="mt-3 font-display text-[24px] font-bold text-white lg:text-[30px]">
                Coaches who made the switch.
              </h3>
            </div>
            <TestimonialTriad />
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="mb-10 max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Who it's for
            </span>
            <h2 className="mt-3 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              Built for every serious fitness professional.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              One platform, three ways to run a fitness business. Pick the shape that fits you.
            </p>
          </div>
          <UseCaseTriad />
        </div>
      </section>


      {/* PILLAR 5 — REPS AI (HERO MOMENT) */}
      <section className="relative overflow-hidden border-b border-reps-border bg-reps-panel/20">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(55%_50%_at_75%_40%,rgba(255,122,0,0.12),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-reps-orange-soft px-3 py-1 text-[12px] font-semibold text-reps-orange">
                <Wand2 className="h-3.5 w-3.5" /> Pillar 5 · REPs AI Operating System
              </span>
              <h2 className="mt-4 font-display text-[36px] font-bold leading-tight text-white lg:text-[52px]">
                The AI layer behind your fitness business.
              </h2>
              <p className="mt-4 max-w-[560px] text-[15.5px] leading-relaxed text-white/75">
                An AI layer working across programmes, check-ins, leads, risk and
                growth — drafting work, scoring intent, flagging churn, ranking the
                single move that pays this week. You stay the coach.
              </p>
              <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-reps-orange-border bg-reps-orange-soft px-4 py-2">
                <Brain className="h-5 w-5 text-reps-orange" />
                <span className="text-[12.5px] text-white/80">AI assistance included in every paid tier</span>
              </div>
              <div className="mt-6">
                <Link
                  to="/features/ai"
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft px-5 text-[13.5px] font-semibold text-reps-orange hover:bg-reps-orange-soft/80"
                >
                  Explore AI <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <AiCommandCentreMock />
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {AI_CAPS.map((c) => (
              <div key={c.title} className="rounded-[16px] border border-reps-border bg-reps-panel/60 p-5">
                <c.icon className="h-5 w-5 text-reps-orange" />
                <div className="mt-3 text-[14.5px] font-semibold text-white">{c.title}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* A WEEK WITH REPS */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="mb-10 max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              A week with REPs
            </span>
            <h2 className="mt-3 font-display text-[28px] font-bold text-white lg:text-[36px]">
              Monday to Friday, ranked and ready.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              The five things REPs surfaces every week so you spend your time coaching, not catching up.
            </p>
          </div>
          <WeekWithReps />
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[820px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="mb-8">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">FAQ</span>
            <h2 className="mt-3 font-display text-[28px] font-bold text-white lg:text-[36px]">
              The straight answers.
            </h2>
          </div>
          <ForProsFaq />
        </div>
      </section>

      {/* FINAL CTA */}
      <section>
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="relative overflow-hidden rounded-[24px] border border-reps-border bg-gradient-to-br from-reps-panel via-reps-panel to-reps-ink p-10 text-center lg:p-16">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,122,0,0.18),transparent_70%)]"
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                <Star className="h-3 w-3 fill-reps-orange" /> Founding pricing — locked for life
              </span>
              <h2 className="mt-5 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
                Join the verified register.
              </h2>
              <p className="mx-auto mt-3 max-w-[520px] text-[15px] text-white/70">
                Founding Pro pricing is available only before public launch.
                Every feature in your tier is included — no paid add-ons.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
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
                <Link
                  to="/compare"
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white hover:bg-white/10"
                >
                  Compare platforms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
