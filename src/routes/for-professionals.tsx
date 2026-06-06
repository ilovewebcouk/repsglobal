import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Brain,
  Check,
  ClipboardCheck,
  Dumbbell,
  PenTool,
  ScanLine,
  Sparkles,
  Star,
  Wand2,
  Zap,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { RegisterProof } from "@/components/marketing/RegisterProof";

import { ProductBlock } from "@/components/marketing/ProductBlock";
import { PhoneFrame } from "@/components/marketing/PhoneFrame";
import { ScaledFrame } from "@/components/marketing/DeviceMockup";
import { TestimonialFeature } from "@/components/marketing/TestimonialFeature";
import { TestimonialTriad } from "@/components/marketing/TestimonialTriad";
import { AiCommandCentreMock } from "@/components/marketing/AiCommandCentreMock";
import { StickyCtaPill } from "@/components/marketing/StickyCtaPill";
import { ForProsFaq } from "@/components/marketing/ForProsFaq";
import { HeroDeviceCluster } from "@/components/marketing/HeroDeviceCluster";
import { UseCaseTriad } from "@/components/marketing/UseCaseTriad";
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
        {/* Legibility overlay — stronger base wash on mobile (copy spans full width), lighter on desktop */}
        <div className="absolute inset-0 bg-reps-ink/70 lg:bg-reps-ink/55" />
        {/* Mobile: centred vignette darkens the whole copy zone. Desktop: focused darken behind the left copy column only. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(95%_75%_at_50%_45%,rgba(10,10,12,0.72),transparent_75%)] lg:bg-[radial-gradient(70%_85%_at_28%_55%,rgba(10,10,12,0.78),transparent_72%)]"
        />
        {/* Right-edge fade — only meaningful on desktop where the device cluster sits on the right */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-reps-ink/85 lg:block" />
        {/* Soft brand glow — slightly stronger and re-centred on mobile to balance the frame */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(60%_50%_at_50%_15%,rgba(255,122,0,0.14),transparent_72%)] lg:bg-[radial-gradient(40%_45%_at_15%_20%,rgba(255,122,0,0.10),transparent_70%)]"
        />
        {/* Hero floor seal — shorter on mobile (compact hero), longer on desktop (smoother resolve into Act 1) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-reps-ink/65 to-reps-ink lg:h-56 lg:via-reps-ink/70"
        />
        <div className="relative mx-auto max-w-[1320px] px-6 pb-24 pt-20 lg:px-10 lg:pb-32 lg:pt-24">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
            {/* Left: copy */}
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
                <Link
                  to="/features"
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white backdrop-blur hover:bg-white/15"
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
                  10-minute setup
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-reps-orange" />
                  Every feature included — no add-ons
                </li>
              </ul>
            </div>

            {/* Right: device cluster — hidden on small screens */}
            <div className="relative hidden md:block">
              <HeroDeviceCluster />
            </div>
          </div>

          {/* Mobile-only hero visual — small phone preview so visitors see the product above the fold */}
          <div className="mt-10 flex justify-center md:hidden">
            <div className="relative w-[200px]">
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-[24px] bg-[radial-gradient(60%_55%_at_50%_40%,rgba(255,122,0,0.25),transparent_70%)] blur-2xl"
              />
              <PhoneFrame>
                <ScaledFrame src="/portal/today" scale={0.32} title="REPs client portal preview" />
              </PhoneFrame>
            </div>
          </div>
        </div>
      </section>

      {/* PRESS MARQUEE — continuous R→L scroll on the same ink continuum as hero + Act 1 */}
      <PressMarquee />


      {/* WHY COACHES SWITCH — competitive proof */}
      <section className="border-b border-reps-border bg-reps-ink">

        <div className="mx-auto max-w-[1320px] px-6 py-12 lg:px-10 lg:py-28">
          <div className="max-w-[720px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Why coaches switch
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
              Software that also brings you clients.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              Trainerize, MyPTHub and PT Distinction give you software. REPs gives you software{" "}
              <em>and</em> the clients to fill it — because the public already lands here when they're searching for a trusted pro.
            </p>
          </div>
          <div className="mt-10"><RegisterProof /></div>
        </div>
      </section>


      {/* PILLAR 1 — VISIBILITY */}
      <section className="border-b border-reps-border">
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
            imageLabel="Profile + directory mockup — screenshot coming"
            mockup={{ device: "laptop", src: "/pro/james-carter", title: "Verified professional profile preview" }}
            ctaLabel="Explore Visibility"
            ctaHref="/features/visibility"
          />
        </div>
      </section>

      {/* PILLAR 2 — SHOP-FRONT */}
      <section className="border-b border-reps-border">
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
            ctaLabel="Explore Shop-front"
            ctaHref="/features/shop-front"
            reverse
          />
        </div>
      </section>

      {/* PILLAR 3 — OPERATIONS (leads + bookings + payments) */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <ProductBlock
            eyebrow="Pillar 3 · Operations"
            title="Leads, bookings and payments — one tool."
            body="Every enquiry lands in one pipeline with source, value and a follow-up date. Sessions, consults and classes share one calendar. Invoices, subscriptions and revenue share one ledger. REPs takes no cut of what your clients pay you."
            bullets={[
              "Leads pipeline from enquiry to booked consult, with AI scoring",
              "Calendar with availability, session types and online consults",
              "Card payments and subscriptions — no booking commission",
              "Live revenue, paid, pending and overdue at a glance",
            ]}
            imageLabel="Operations mockup — leads + calendar + payments"
            mockup={{ device: "laptop", src: "/dashboard/leads", title: "Operations preview" }}
            ctaLabel="Explore Operations"
            ctaHref="/features/operations"
          />
        </div>
      </section>

      {/* PILLAR 4 — COACHING (TABBED) */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="mb-10 max-w-[720px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Pillar 4 · Coaching
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Programmes, check-ins, the full client record — and the client app they love.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              One tool for what you see and what your clients see. Programme builder, check-ins
              and history on your side; a premium portal on web and mobile on theirs.
            </p>
          </div>
          <PillarTabs />
          <div className="mt-8">
            <Link
              to="/features/coaching"
              className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-white/70 hover:text-reps-orange"
            >
              Explore Coaching <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURE TESTIMONIAL */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <TestimonialFeature />
        </div>
      </section>

      {/* PILLAR 5 — REPS AI (HERO MOMENT) */}
      <section className="relative overflow-hidden border-b border-reps-border bg-reps-panel/20">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(55%_50%_at_75%_40%,rgba(255,122,0,0.12),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-reps-orange-soft px-3 py-1 text-[12px] font-semibold text-reps-orange">
                <Wand2 className="h-3.5 w-3.5" /> Pillar 5 · REPs AI
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

      {/* PILLAR 6 — GROWTH */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <ProductBlock
            eyebrow="Pillar 6 · Growth"
            title="The work that compounds, done for you."
            body="Growth isn't a campaign — it's the loop. Content drafted in your tone, review requests sent at the right moment, reporting that tells you what's actually moving, and a single Next Move ranked for you every Monday."
            bullets={[
              "Posts, captions and lead magnets drafted on-brand",
              "Review requests on autopilot after a milestone session",
              "Reporting that shows what's compounding — not vanity metrics",
              "Next Move every Monday — the single highest-leverage action",
            ]}
            imageLabel="Growth dashboard mockup — Next Move + reporting"
            mockup={{ device: "laptop", src: "/dashboard", title: "Growth dashboard preview" }}
            ctaLabel="Explore Growth"
            ctaHref="/features/growth"
            reverse
          />
        </div>
      </section>


      {/* TRIAD TESTIMONIALS */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="mb-8 max-w-[640px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Loved by working pros
            </span>
            <h2 className="mt-3 font-display text-[28px] font-bold text-white lg:text-[36px]">
              Coaches who made the switch.
            </h2>
          </div>
          <TestimonialTriad />
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
