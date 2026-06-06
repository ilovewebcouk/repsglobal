import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Check,
  ClipboardCheck,
  Eye,
  Globe,
  Settings2,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { RegisterProof } from "@/components/marketing/RegisterProof";

import { TestimonialFeature } from "@/components/marketing/TestimonialFeature";
import { TestimonialTriad } from "@/components/marketing/TestimonialTriad";
import { ComparisonStrip } from "@/components/marketing/ComparisonStrip";
import { WeekWithReps } from "@/components/marketing/WeekWithReps";
import { StickyCtaPill } from "@/components/marketing/StickyCtaPill";
import { ForProsFaq } from "@/components/marketing/ForProsFaq";
import { HeroDeviceCluster } from "@/components/marketing/HeroDeviceCluster";
import { UseCaseTriad } from "@/components/marketing/UseCaseTriad";
import { ReplacedStackBoard } from "@/components/marketing/ReplacedStackBoard";
import { PressMarquee } from "@/components/marketing/PressMarquee";


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

type PillarCard = {
  num: string;
  icon: typeof Eye;
  name: string;
  desc: string;
  bullets: string[];
  to:
    | "/features/visibility"
    | "/features/shop-front"
    | "/features/operations"
    | "/features/coaching"
    | "/features/ai"
    | "/features/growth";
  accent?: boolean;
};

const PILLARS: PillarCard[] = [
  {
    num: "01",
    icon: Eye,
    name: "Visibility",
    desc: "Get found by the right clients on the register the public already searches.",
    bullets: [
      "Verified profile & badge",
      "Reviews on the public record",
      "Indexed by location & specialism",
      "Trust signals — insurance, CPD, qualifications",
    ],
    to: "/features/visibility",
  },
  {
    num: "02",
    icon: Globe,
    name: "Shop-front",
    desc: "Your own page at /c/your-name — your photo, your method, your tiers.",
    bullets: [
      "Outcome-led hero with verified badge",
      "Three-tier services with a 'Most popular' lane",
      "Foundation method & transformation proof",
      "Replaces your Wix or Squarespace site",
    ],
    to: "/features/shop-front",
    accent: true,
  },
  {
    num: "03",
    icon: Settings2,
    name: "Operations",
    desc: "Run your whole practice in one place — leads, bookings, payments, calendar.",
    bullets: [
      "Leads CRM with AI scoring & reply drafts",
      "Bookings & calendar with session types",
      "Payments, packages & subscriptions",
      "One client record across every tool",
    ],
    to: "/features/operations",
  },
  {
    num: "04",
    icon: ClipboardCheck,
    name: "Coaching",
    desc: "Deliver the actual coaching — programmes, check-ins, nutrition, portal.",
    bullets: [
      "Programme builder with video demos",
      "Check-ins with photos & metrics",
      "Nutrition tracking & messaging",
      "Premium client portal on web & mobile",
    ],
    to: "/features/coaching",
  },
  {
    num: "05",
    icon: Brain,
    name: "REPs AI",
    desc: "The AI operating layer — drafting work, scoring intent, ranking the next move.",
    bullets: [
      "Programmes drafted in seconds",
      "Check-ins summarised for you",
      "Leads scored, replies pre-written",
      "Next Move + churn-risk alerts",
    ],
    to: "/features/ai",
  },
  {
    num: "06",
    icon: TrendingUp,
    name: "Growth",
    desc: "The single move to grow your business this month — ranked by impact.",
    bullets: [
      "Cohort revenue & retention insights",
      "Churn risk & renewal forecasting",
      "Weekly Next Move card",
      "Content Studio for posts & lead magnets",
    ],
    to: "/features/growth",
  },
];

function ForProsPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />
      <StickyCtaPill />

      {/* HERO — full-bleed moody gym backdrop with device cluster */}
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

      {/* PRESS MARQUEE */}
      <PressMarquee />

      {/* REGISTER PROOF — what the public sees */}
      <section className="border-b border-reps-border bg-reps-ink">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <RegisterProof />
        </div>
      </section>

      {/* SIX PILLARS — the platform, summarised */}
      <section id="pillars" className="scroll-mt-24 border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              The platform
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
              Six pillars. One operating system.
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-white/70">
              Everything REPs ships, grouped into the six things a modern fitness business
              actually needs. Tap any pillar to see it in detail.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <Link
                key={p.name}
                to={p.to}
                className={
                  "group flex h-full flex-col rounded-[18px] border p-6 transition-colors " +
                  (p.accent
                    ? "border-reps-orange-border bg-reps-panel/80 hover:border-reps-orange"
                    : "border-reps-border bg-reps-panel/60 hover:border-reps-orange-border")
                }
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    Pillar {p.num}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-[22px] font-bold text-white group-hover:text-reps-orange">
                  {p.name}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{p.desc}</p>

                <ul className="mt-5 space-y-2.5 border-t border-reps-border/60 pt-5">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[13.5px] text-white/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                      {b}
                    </li>
                  ))}
                </ul>

                <span className="mt-6 inline-flex items-center gap-1 text-[13px] font-semibold text-reps-orange">
                  Explore {p.name} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE TESTIMONIAL */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <TestimonialFeature />
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

      {/* REPLACED STACK + TRIAD TESTIMONIALS */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
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

      {/* A WEEK WITH REPS */}
      <section className="border-b border-reps-border">
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
