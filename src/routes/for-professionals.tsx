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
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { RegisterProof } from "@/components/marketing/RegisterProof";
import { TestimonialTriad } from "@/components/marketing/TestimonialTriad";
import { ComparisonStrip } from "@/components/marketing/ComparisonStrip";
import { StickyCtaPill } from "@/components/marketing/StickyCtaPill";
import { ForProsFaq } from "@/components/marketing/ForProsFaq";
import { HeroProductShowcase } from "@/components/marketing/HeroProductShowcase";
import { ReplacedStackBoard } from "@/components/marketing/ReplacedStackBoard";
import { PressMarquee } from "@/components/marketing/PressMarquee";

import heroGym from "@/assets/for-pros-hero-gym.jpg.asset.json";

export const Route = createFileRoute("/for-professionals")({
  head: () => ({
    meta: [
      { title: "The verified register for fitness professionals — since 2009 · REPs" },
      {
        name: "description",
        content:
          "Get found on the register clients have searched since 2009. Run the rest of your practice on the platform built around it — leads, bookings, programmes, payments and AI.",
      },
      { property: "og:title", content: "Join REPs — the verified register since 2009" },
      {
        property: "og:description",
        content: "The register that brings you clients, and the platform that runs your practice.",
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
                className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-reps-gold/40 bg-reps-panel/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-gold backdrop-blur"
                style={{ animationDuration: "560ms", animationFillMode: "both" }}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> The register · Since 2009
              </span>
              <h1
                className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[60px]"
                style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
              >
                Verified fitness professionals have lived here for{" "}
                <span className="text-reps-orange">17 years</span>.
                <br />
                Now the software lives here too.
              </h1>
              <p
                className="mt-6 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/75"
                style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
              >
                Get found on the verified register the public has searched since 2009. Run
                the rest of your practice on the platform built around it — leads,
                bookings, programmes, check-ins, payments and AI, all in one place.
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
                  See how it works
                </a>
              </div>
              <ul
                className="mt-7 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70"
                style={{ animationDuration: "640ms", animationDelay: "340ms", animationFillMode: "both" }}
              >
                <li className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-reps-orange" />
                  Verified register since 2009
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-reps-orange" />
                  Every feature in your tier included
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-reps-orange" />
                  Founding pricing — locked for life
                </li>
              </ul>
            </div>

            <div className="relative hidden md:block">
              <HeroProductShowcase />
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
              Act 1 · Get clients
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
              The register the public already searches.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              Other platforms give you software. REPs gives you software <em>and</em>{" "}
              clients — because the public already lands here when they're looking for
              a trusted pro.
            </p>
          </div>
          <div className="mt-10"><RegisterProof /></div>
        </div>
      </section>

      {/* ACT 2 — SIX PILLARS GRID (links to pillar pages for the deep dive) */}
      <section id="pillars" className="scroll-mt-24 border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="max-w-[720px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Act 2 · Run your practice
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
              Six pillars. One operating system.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              When clients arrive, REPs runs the rest. Every booking, programme,
              check-in and message wired into the same client record. Click any
              pillar to see how it works.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Eye, name: "Visibility", body: "Verified profile on the register the public already searches.", to: "/features/visibility" as const },
              { icon: Globe, name: "Shop-front", body: "Your own page at /c/your-name — your photo, your method, your tiers.", to: "/features/shop-front" as const, accent: true },
              { icon: Settings2, name: "Operations", body: "Leads, bookings, payments and your calendar in one place.", to: "/features/operations" as const },
              { icon: ClipboardCheck, name: "Coaching", body: "Programmes, check-ins and the full client record.", to: "/features/coaching" as const },
              { icon: Brain, name: "REPs AI", body: "Drafts, scores and flags so you stay ahead of the week.", to: "/features/ai" as const },
              { icon: TrendingUp, name: "Growth", body: "Content, reviews and reporting that compound over time.", to: "/features/growth" as const },
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

      {/* PRICING TEASER */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                Founding pricing
              </span>
              <h2 className="mt-3 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
                Three tiers. Every feature in yours, included.
              </h2>
              <p className="mt-3 max-w-[520px] text-[15px] leading-relaxed text-white/65">
                Verified £99/yr to be trusted. Pro £59/mo (Founding) to run your
                practice. Studio £149/mo to scale your team. Founding Pro pricing is
                locked for life — available only before public launch.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/pricing"
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[13.5px] font-semibold text-white hover:bg-reps-orange-hover"
                >
                  See pricing <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/compare"
                  className="inline-flex h-11 items-center rounded-[10px] border border-white/25 px-5 text-[13.5px] font-semibold text-white hover:bg-white/10"
                >
                  Compare platforms
                </Link>
              </div>
            </div>
            <ul className="grid gap-2 rounded-[18px] border border-reps-border bg-reps-panel/40 p-5 lg:p-6">
              {[
                "Verified · £99/yr — badge, profile, reviews on the register",
                "Pro · £59/mo Founding — shop-front, CRM, bookings, programmes, AI",
                "Studio · £149/mo — multi-trainer, classes, team roles, location pages",
              ].map((row) => (
                <li key={row} className="flex items-start gap-2.5 text-[13.5px] text-white/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  <span>{row}</span>
                </li>
              ))}
            </ul>
          </div>
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
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
