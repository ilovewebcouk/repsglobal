import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Check,
  ClipboardCheck,
  Eye,
  Globe,
  LineChart,
  Settings2,
  Sparkles,
  TrendingUp,
  Wand2,
  Zap,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { RegisterProof } from "@/components/marketing/RegisterProof";

import { ProductBlock } from "@/components/marketing/ProductBlock";
import { TestimonialFeature } from "@/components/marketing/TestimonialFeature";
import { ComparisonStrip } from "@/components/marketing/ComparisonStrip";
import { AiCommandCentreMock } from "@/components/marketing/AiCommandCentreMock";
import { WeekWithReps } from "@/components/marketing/WeekWithReps";
import { StickyCtaPill } from "@/components/marketing/StickyCtaPill";
import { ForProsFaq } from "@/components/marketing/ForProsFaq";
import { HeroDeviceCluster } from "@/components/marketing/HeroDeviceCluster";
import { UseCaseTriad } from "@/components/marketing/UseCaseTriad";
import { ReplacedStackBoard } from "@/components/marketing/ReplacedStackBoard";
import { PressMarquee } from "@/components/marketing/PressMarquee";

import { PillarSubnav } from "@/components/marketing/PillarSubnav";
import { OperationsBento } from "@/components/marketing/OperationsBento";
import { CoachingScrollPanel } from "@/components/marketing/CoachingScrollPanel";
import { AiNoticedFeed } from "@/components/marketing/AiNoticedFeed";
import { PricingSnapshot } from "@/components/marketing/PricingSnapshot";
import { FinalCtaFounding } from "@/components/marketing/FinalCtaFounding";

import heroGym from "@/assets/for-pros-hero-gym.jpg.asset.json";

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

const PILLAR_MAP = [
  {
    id: "visibility",
    icon: Eye,
    name: "Visibility",
    body: "Verified profile on the register the public already searches.",
    stat: "Included on every tier",
    to: "/features/visibility" as const,
  },
  {
    id: "shop-front",
    icon: Globe,
    name: "Shop-front",
    body: "Your own page at /c/your-name — your photo, your method, your tiers.",
    stat: "Pro + Studio",
    to: "/features/shop-front" as const,
    accent: true,
  },
  {
    id: "operations",
    icon: Settings2,
    name: "Operations",
    body: "Leads, bookings, payments and messages — one client record.",
    stat: "4 features inside",
    to: "/features/operations" as const,
  },
  {
    id: "coaching",
    icon: ClipboardCheck,
    name: "Coaching",
    body: "Programmes, check-ins, nutrition, client record and portal.",
    stat: "5 features inside",
    to: "/features/coaching" as const,
  },
  {
    id: "ai",
    icon: Brain,
    name: "REPs AI",
    body: "An AI layer working across every pillar — drafts, scores, flags, ranks.",
    stat: "Pro + Studio",
    to: "/features/ai" as const,
  },
  {
    id: "growth",
    icon: TrendingUp,
    name: "Growth",
    body: "Insights and the single move that grows your business this month.",
    stat: "Pro + Studio",
    to: "/features/growth" as const,
  },
];

function ForProsPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />
      <PillarSubnav />
      <StickyCtaPill />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={heroGym.url}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover object-left"
        />
        <div className="absolute inset-0 bg-reps-ink/70 lg:bg-reps-ink/55" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(95%_75%_at_50%_45%,rgba(10,10,12,0.72),transparent_75%)] lg:bg-[radial-gradient(70%_85%_at_28%_55%,rgba(10,10,12,0.78),transparent_72%)]"
        />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-reps-ink/85 lg:block" />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(60%_50%_at_50%_15%,rgba(255,122,0,0.14),transparent_72%)] lg:bg-[radial-gradient(40%_45%_at_15%_20%,rgba(255,122,0,0.10),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-reps-ink/65 to-reps-ink lg:h-56 lg:via-reps-ink/70"
        />
        <div className="relative mx-auto max-w-[1320px] px-6 pb-24 pt-20 lg:px-10 lg:pb-32 lg:pt-24">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
            <div>
              <span
                className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-reps-border bg-reps-panel/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur"
                style={{ animationDuration: "560ms", animationFillMode: "both" }}
              >
                <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Verified · Trusted · Booked
              </span>
              <h1
                className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[64px]"
                style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
              >
                Not just software.
                <br />
                <span className="text-reps-orange">An AI operating system for fitness professionals.</span>
              </h1>
              <p
                className="mt-6 max-w-[540px] animate-fade-in text-[16px] leading-relaxed text-white/75"
                style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
              >
                REPs is built for fitness professionals who want to get found, win more
                clients, deliver better coaching and grow a sustainable business. One
                platform. Every tool. Powered by AI.
              </p>
              <div
                className="mt-8 flex animate-fade-in flex-wrap gap-3"
                style={{ animationDuration: "640ms", animationDelay: "260ms", animationFillMode: "both" }}
              >
                <Link
                  to="/signup"
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
                >
                  Join REPs <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#pillars"
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white backdrop-blur hover:bg-white/15"
                >
                  Explore the six pillars
                </a>
              </div>
              <ul
                className="mt-7 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70"
                style={{ animationDuration: "640ms", animationDelay: "340ms", animationFillMode: "both" }}
              >
                <li className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-reps-orange" />
                  Verified credentials
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-reps-orange" />
                  10-minute setup
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-reps-orange" />
                  Every feature included — no add-ons
                </li>
              </ul>
            </div>

            <div className="relative hidden md:block">
              <HeroDeviceCluster />
            </div>
          </div>
        </div>
      </section>

      <PressMarquee />

      {/* ACT 1 — REGISTER */}
      <section className="border-b border-reps-border bg-reps-ink">
        <div className="mx-auto max-w-[1320px] px-6 py-12 lg:px-10 lg:py-28">
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

      {/* PILLAR 1 — VISIBILITY */}
      <section id="visibility" className="scroll-mt-32 border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <ProductBlock
            eyebrow="Pillar 1 · Visibility"
            title="Become the obvious choice in your area."
            body="Trust gets decided before they message you. Your profile shows the badge, the qualifications, the insurance, the reviews — backed by the verified register since 2009."
            bullets={[
              "Verified badge backed by a 16-year register",
              "Qualifications, insurance and CPD shown live",
              "Reviews on the public record — not screenshotted on Instagram",
              "Indexed by location, specialism and price band",
            ]}
            imageLabel="Profile + directory mockup"
            mockup={{ device: "laptop", src: "/pro/james-carter", title: "Verified professional profile preview" }}
            ctaLabel="Explore Visibility"
            ctaHref="/features/visibility"
          />
        </div>
      </section>

      {/* ACT 2 — SIX-PILLAR MAP */}
      <section id="pillars" className="scroll-mt-32 border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="max-w-[720px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Act 2 · Run your practice
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
              Six pillars. One operating system.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              Six pillars, one platform — every booking, programme, check-in and message
              wired into the same client record. Some pillars contain multiple features —
              every one has its own section below.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PILLAR_MAP.map((p) => (
              <Link
                key={p.id}
                to={p.to}
                className={
                  p.accent
                    ? "group flex flex-col rounded-[18px] border border-reps-orange-border bg-reps-orange-soft/40 p-5 transition-colors hover:border-reps-orange"
                    : "group flex flex-col rounded-[18px] border border-reps-border bg-reps-panel/60 p-5 transition-colors hover:border-reps-orange-border"
                }
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <p.icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 font-display text-[15px] font-bold uppercase tracking-wider text-white group-hover:text-reps-orange">
                  {p.name}
                </h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-white/60">{p.body}</p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="font-semibold uppercase tracking-wider text-reps-orange">
                    {p.stat}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-white/40 transition-colors group-hover:text-reps-orange" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PILLAR 2 — SHOP-FRONT */}
      <section id="shop-front" className="scroll-mt-32 border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <ProductBlock
            eyebrow="Pillar 2 · Shop-front"
            title="The page that turns visitors into clients."
            body="Pro and Studio plans include a personalised shop-front at /c/your-name — your story, your method, your tiers, your proof. Designed to convert. Indexed by Google. Nothing to build, nothing to host."
            bullets={[
              "Outcome-led hero with your photo and verified badge",
              "Three-tier services with a 'Most popular' lane",
              "Foundation method, transformation proof, testimonials",
              "Replaces your Wix or Squarespace site — one less bill, one less login",
            ]}
            imageLabel="Coach shop-front mockup — /c/james-wilson"
            mockup={{ device: "laptop", src: "/c/james-wilson", title: "Coach shop-front live example" }}
            ctaLabel="See the live example"
            ctaHref="/c/james-wilson"
            reverse
          />
          <div className="mt-6 lg:ml-[calc(50%+1.75rem)]">
            <Link
              to="/features/shop-front"
              className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-white/70 hover:text-reps-orange"
            >
              Explore Shop-front <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* PILLAR 3 — OPERATIONS BENTO */}
      <section id="operations" className="scroll-mt-32 border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-[640px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                Pillar 3 · Operations
              </span>
              <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
                The practice runs itself.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/65">
                Leads, bookings, payments and messages — wired into one client record.
                Calendly, Stripe, Mailchimp and a CRM, replaced by one tool built for fitness.
              </p>
            </div>
            <Link
              to="/features/operations"
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink/60 px-5 text-[13.5px] font-semibold text-white hover:border-reps-orange-border"
            >
              Explore Operations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <OperationsBento />
        </div>
      </section>

      {/* FEATURE TESTIMONIAL */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <TestimonialFeature />
        </div>
      </section>

      {/* PILLAR 4 — COACHING (split-scroll) */}
      <section id="coaching" className="scroll-mt-32 border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-[640px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                Pillar 4 · Coaching
              </span>
              <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
                Programmes, check-ins, nutrition — all in one tool.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/65">
                The Trainerize-class coaching stack, wired into the same client record as
                your bookings, payments and messages. Scroll through the five things you'll
                actually use every week.
              </p>
            </div>
            <Link
              to="/features/coaching"
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink/60 px-5 text-[13.5px] font-semibold text-white hover:border-reps-orange-border"
            >
              Explore Coaching <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <CoachingScrollPanel />
        </div>
      </section>

      {/* COMPARISON */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
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

      {/* REPLACED STACK */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <ReplacedStackBoard />
        </div>
      </section>

      {/* USE CASES */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
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

      {/* PILLAR 5 — REPS AI MOMENT */}
      <section id="ai" className="relative scroll-mt-32 overflow-hidden border-b border-reps-border bg-reps-panel/20">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(55%_50%_at_75%_40%,rgba(255,122,0,0.12),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="mb-12 max-w-[720px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-reps-orange-soft px-3 py-1 text-[12px] font-semibold text-reps-orange">
              <Wand2 className="h-3.5 w-3.5" /> Pillar 5 · REPs AI Operating System
            </span>
            <h2 className="mt-4 font-display text-[36px] font-bold leading-tight text-white lg:text-[52px]">
              The AI layer behind your fitness business.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">
              An AI layer working across programmes, check-ins, leads, risk and growth —
              drafting work, scoring intent, flagging churn, ranking the single move that
              pays this week. You stay the coach.
            </p>
            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-reps-orange-border bg-reps-orange-soft px-4 py-2">
              <Brain className="h-5 w-5 text-reps-orange" />
              <span className="text-[12.5px] text-white/80">AI built into every paid tier — full suite on Pro and Studio</span>
            </div>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <AiCommandCentreMock />
            <AiNoticedFeed />
          </div>

          <div className="mt-10">
            <Link
              to="/features/ai"
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft px-5 text-[13.5px] font-semibold text-reps-orange hover:bg-reps-orange-soft/80"
            >
              Explore REPs AI <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* PILLAR 6 — GROWTH */}
      <section id="growth" className="scroll-mt-32 border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <ProductBlock
            eyebrow="Pillar 6 · Growth"
            title="The single move to grow your business this month."
            body="Revenue, retention, churn risk and renewal forecasting — surfaced as a Monday-morning card, not a dashboard you have to read. The compounding layer on top of everything else REPs does."
            bullets={[
              "Cohort revenue, churn risk and renewal forecasting at a glance",
              "Client risk alerts before adherence slides",
              "Weekly Next Move card — ranked by impact",
              "Content Studio: on-brand posts and lead magnets from a one-line brief",
            ]}
            imageLabel="Growth insights mockup"
            mockup={{ device: "laptop", src: "/dashboard/reports", title: "Growth insights preview" }}
            ctaLabel="Explore Growth"
            ctaHref="/features/growth"
          />
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel/60 px-3 py-1.5 text-[12.5px] text-white/70">
            <LineChart className="h-4 w-4 text-reps-orange" /> Full Growth suite included on Pro and Studio
          </div>
        </div>
      </section>

      {/* A WEEK WITH REPS */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
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

      {/* PRICING SNAPSHOT */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <PricingSnapshot />
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
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <FinalCtaFounding />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
