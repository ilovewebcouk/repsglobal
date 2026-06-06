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
import { TestimonialTriad } from "@/components/marketing/TestimonialTriad";
import { ComparisonStrip } from "@/components/marketing/ComparisonStrip";
import { StickyCtaPill } from "@/components/marketing/StickyCtaPill";
import { ForProsFaq } from "@/components/marketing/ForProsFaq";
import { HeroDeviceCluster } from "@/components/marketing/HeroDeviceCluster";
import { ReplacedStackBoard } from "@/components/marketing/ReplacedStackBoard";
import { PressMarquee } from "@/components/marketing/PressMarquee";

import heroGym from "@/assets/for-pros-hero-gym.jpg.asset.json";

export const Route = createFileRoute("/for-professionals")({
  head: () => ({
    meta: [
      { title: "Get found. Get booked. Get paid. — REPs for Professionals" },
      {
        name: "description",
        content:
          "REPs is the verified register the public already searches — and the only tool you need to run the rest of your coaching practice. One platform. Every feature in your tier, included.",
      },
      { property: "og:title", content: "Join REPs — For Professionals" },
      {
        property: "og:description",
        content: "The register that brings you clients, and the tools to run the rest of your practice.",
      },
      { property: "og:url", content: "https://repsglobal.lovable.app/for-professionals" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/for-professionals" }],
  }),
  component: ForProsPage,
});

function ForProsPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />
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
                Get found. Get booked. Get paid.
                <br />
                <span className="text-reps-orange">Without four apps and a spreadsheet.</span>
              </h1>
              <p
                className="mt-6 max-w-[540px] animate-fade-in text-[16px] leading-relaxed text-white/75"
                style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
              >
                REPs is the verified register the public already searches — and the
                only tool you need to run the rest of your coaching practice. One
                platform. Every feature in your tier, included.
              </p>
              <div
                className="mt-8 flex animate-fade-in flex-wrap gap-3"
                style={{ animationDuration: "640ms", animationDelay: "260ms", animationFillMode: "both" }}
              >
                <Link
                  to="/signup"
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  Join REPs <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/features"
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
                >
                  Explore features
                </Link>
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
                  Up and running in an afternoon
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-reps-orange" />
                  Every feature in your tier — no paid add-ons
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

      {/* ACT 1 — REGISTER */}
      <section className="border-b border-reps-border bg-reps-ink">
        <div className="mx-auto max-w-[1320px] px-6 py-12 lg:px-10 lg:py-28">
          <div className="max-w-[720px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Act 1 · Get the clients
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
              The register the public already searches.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              Other apps give you software and tell you to "build an audience." REPs
              gives you software <em>and</em> clients — because the people looking for
              a verified coach already land here.
            </p>
          </div>
          <div className="mt-10"><RegisterProof /></div>
        </div>
      </section>

      {/* ACT 2 — SIX PILLARS GRID */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="max-w-[720px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Act 2 · Run the practice
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
              Six pillars. Everything you need to run the coaching part.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              When the client lands, REPs runs the rest. Bookings, programmes,
              check-ins and payments wired into one client record. Tap any pillar to
              see exactly how it works.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Eye, name: "Visibility", body: "Show up on the register clients already trust.", to: "/features/visibility" as const },
              { icon: Globe, name: "Shop-front", body: "Your own page at /c/your-name — photo, method, tiers.", to: "/features/shop-front" as const, accent: true },
              { icon: Settings2, name: "Operations", body: "Leads, bookings, payments and your calendar — one place.", to: "/features/operations" as const },
              { icon: ClipboardCheck, name: "Coaching", body: "Programmes, check-ins and the full client record.", to: "/features/coaching" as const },
              { icon: Brain, name: "REPs AI", body: "Reads check-ins. Drafts replies. Scores leads. Flags risks.", to: "/features/ai" as const },
              { icon: TrendingUp, name: "Growth", body: "The one move to grow this month — ranked by impact.", to: "/features/growth" as const },
            ].map((p) => (
              <Link
                key={p.name}
                to={p.to}
                className={
                  p.accent
                    ? "group rounded-[18px] border border-reps-orange-border bg-reps-orange-soft/40 p-5 transition-colors hover:border-reps-orange"
                    : "group rounded-[18px] border border-reps-border bg-reps-panel/60 p-5 transition-colors hover:border-reps-orange-border"
                }
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <p.icon className="h-4.5 w-4.5" />
                </span>
                <h3 className="mt-3 font-display text-[15px] font-bold uppercase tracking-wider text-white group-hover:text-reps-orange">
                  {p.name}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{p.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-white/55 group-hover:text-reps-orange">
                  See how it works <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* REPLACED STACK + TRIAD TESTIMONIALS */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <ReplacedStackBoard />
          <div className="mt-14">
            <div className="mb-8 max-w-[640px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                Real coaches. Real switches.
              </span>
              <h3 className="mt-3 font-display text-[24px] font-bold text-white lg:text-[30px]">
                The PTs and studio owners who already moved across.
              </h3>
            </div>
            <TestimonialTriad />
          </div>
        </div>
      </section>

      {/* PATTERN BREAK — GIANT STAT */}
      <section className="relative overflow-hidden border-b border-reps-border bg-reps-ink">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,122,0,0.16),transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-reps-orange/40 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-reps-orange/40 to-transparent"
        />
        <div className="relative mx-auto max-w-[1100px] px-6 py-28 text-center lg:px-10 lg:py-36">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
            Why the register matters
          </span>
          <div className="mt-8 flex items-baseline justify-center gap-2 leading-none">
            <span className="font-display text-[160px] font-bold tracking-tight text-white sm:text-[200px] lg:text-[280px]">
              1
            </span>
          </div>
          <p className="mx-auto mt-6 max-w-[760px] font-display text-[24px] font-bold leading-tight text-white lg:text-[34px]">
            One place the public actually looks for a verified coach.
          </p>
          <p className="mx-auto mt-5 max-w-[640px] text-[15.5px] leading-relaxed text-white/70">
            Not Instagram. Not a Google review you can't verify. Not "a mate of a mate
            who does PT." The register — built specifically so clients can find a
            qualified, insured coach they can trust before they hand over a card.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Get on the register <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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

      {/* PRICING — DISTINCT TREATMENT */}
      <PricingTeaser />

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
                Get on the register. Start tonight.
              </h2>
              <p className="mx-auto mt-3 max-w-[520px] text-[15px] text-white/70">
                Founding Pro pricing is only on the table before public launch. Every
                feature in your tier is included — no paid add-ons.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  to="/signup"
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  Join REPs <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
                >
                  See full pricing
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

/* ------------------------- Pricing teaser (distinct) ------------------------- */

type Tier = {
  key: "verified" | "pro" | "studio";
  name: string;
  price: string;
  period: string;
  blurb: string;
  bullets: string[];
  cta: string;
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    key: "verified",
    name: "Verified",
    price: "£99",
    period: "/year",
    blurb: "Get on the register. Get the badge. Get found.",
    bullets: ["Verified badge", "Public profile + reviews", "Listed in directory & city pages"],
    cta: "Get verified",
  },
  {
    key: "pro",
    name: "Pro",
    price: "£59",
    period: "/mo · Founding",
    blurb: "Run your whole 1-1 practice end-to-end.",
    bullets: [
      "Everything in Verified",
      "Shop-front at /c/your-name",
      "CRM, bookings, payments, programmes",
      "REPs AI — drafts, summaries, lead scoring",
    ],
    cta: "Start Pro",
    featured: true,
  },
  {
    key: "studio",
    name: "Studio",
    price: "£149",
    period: "/mo",
    blurb: "Scale a team and locations.",
    bullets: [
      "Everything in Pro",
      "Multi-trainer rosters & roles",
      "Classes, packages, memberships",
      "Location pages",
    ],
    cta: "Talk to us",
  },
];

function PricingTeaser() {
  return (
    <section className="relative overflow-hidden border-b border-reps-border bg-reps-ink">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(255,122,0,0.10),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
            <Sparkles className="h-3.5 w-3.5" /> Founding pricing
          </span>
          <h2 className="mt-5 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
            Three tiers. Pick the one you're at.
          </h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/70">
            Every feature in your tier is included — no paid add-ons. The Founding
            Pro price is locked for life, but only if you join before public launch.
          </p>
        </div>

        <div className="grid items-stretch gap-5 md:grid-cols-3 md:gap-4 lg:gap-6">
          {TIERS.map((t) => (
            <div
              key={t.key}
              className={
                t.featured
                  ? "relative flex flex-col rounded-[22px] border-2 border-reps-orange bg-gradient-to-b from-reps-panel to-reps-panel/70 p-8 ring-1 ring-reps-orange/30 lg:-translate-y-3 lg:scale-[1.03]"
                  : "relative flex flex-col rounded-[22px] border border-reps-border bg-reps-panel/60 p-7"
              }
            >
              {t.featured && (
                <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-reps-orange px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  <Star className="h-3 w-3 fill-white" /> Most popular
                </span>
              )}
              <h3 className="font-display text-[20px] font-bold text-white">{t.name}</h3>
              <p className="mt-1 text-[13px] text-white/60">{t.blurb}</p>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="font-display text-[40px] font-bold text-white">{t.price}</span>
                <span className="text-[13px] text-white/55">{t.period}</span>
              </div>
              {t.featured && (
                <span className="mt-2 inline-flex w-fit items-center rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-reps-orange">
                  Locked for life
                </span>
              )}
              <ul className="mt-6 flex-1 space-y-2.5 text-[13.5px]">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-white/80">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                      <Check className="h-3 w-3" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                to="/pricing"
                className={
                  t.featured
                    ? "mt-7 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                    : "mt-7 inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-white/20 text-[13px] font-semibold text-white shadow-none hover:bg-white/10"
                }
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-white/55">
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-reps-orange" /> Every feature in your tier — included</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-reps-orange" /> Cancel any time</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-reps-orange" /> Migration help included</span>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/compare"
            className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-reps-orange hover:underline"
          >
            Compare with Trainerize, MyPTHub & PT Distinction <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
