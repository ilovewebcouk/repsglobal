import { createFileRoute, Link } from "@tanstack/react-router";
import {
  
  ArrowRight,
  BadgeCheck,
  Brain,
  Check,
  ClipboardCheck,
  Dumbbell,
  Sparkles,
  Star,
  Wand2,
  Zap,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { RegisterProof } from "@/components/marketing/RegisterProof";
import { VerificationMoment } from "@/components/marketing/VerificationMoment";
import proJames from "@/assets/pro-james.jpg";

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
    links: [
      { rel: "canonical", href: "https://repsglobal.lovable.app/for-professionals" },
      // Preload the LCP hero image — biggest single perceived-performance win on this page.
      { rel: "preload", as: "image", href: heroGym.url, fetchpriority: "high" },
    ],
  }),
  component: ForProsPage,
});



const AI_HERO_CAPS = [
  {
    icon: Dumbbell,
    title: "Programmes, drafted in seconds",
    body: "One-line brief in, 12-week plan out — exercises, sets, video demos, ready to tweak.",
    example: "\"12-week hypertrophy for a 38yo runner, 3x/week, bad left knee\" → full plan in ~8s",
  },
  {
    icon: ClipboardCheck,
    title: "Check-ins, read for you",
    body: "Six client check-ins summarised into one card: headline, what changed, what to ask next.",
    example: "6 entries → 1 card: \"Sleep down 18%. Ask about work stress before Friday's session.\"",
  },
  {
    icon: Sparkles,
    title: "Next Move, every Monday",
    body: "The single highest-leverage action this week — ranked by impact on retention and revenue.",
    example: "This week: \"Re-engage 3 clients who missed last week — projected +£420 MRR.\"",
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
          loading="eager"
          fetchPriority="high"
          decoding="async"
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
        <div className="relative mx-auto max-w-[1320px] px-6 pb-20 pt-20 lg:px-10 lg:pb-20 lg:pt-24">
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
                  to="/features/visibility"
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



      {/* WHY COACHES SWITCH — competitive proof */}
      <section className="border-b border-reps-border bg-reps-ink">

        <div className="mx-auto max-w-[1320px] px-6 pt-10 pb-16 lg:px-10 lg:pt-16 lg:pb-20">
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


      {/* VERIFICATION MOMENT — your public credential */}
      <VerificationMoment
        audience="professional"
        pro={{
          name: "James Carter",
          role: "Personal Trainer",
          location: "London",
          photo: proJames,
          slug: "james-carter",
          verifiedId: "REPS-2024-08147",
          lastVerified: "Mar 2026",
          renewsOn: "Mar 2027",
        }}
      />

      {/* PILLAR 1 — VISIBILITY */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 pt-16 pb-24 lg:px-10 lg:pt-20 lg:pb-28">
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
            imageLabel="Verified professional profile on the public register"
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
            imageLabel="Personalised coach shop-front with three service tiers"
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
            body="Every enquiry lands in one pipeline with source, value and a follow-up date. Sessions, consults and classes share one calendar. Invoices, subscriptions and revenue share one ledger."
            bullets={[
              "Leads pipeline from enquiry to booked consult, with AI scoring",
              "Calendar with availability, session types and online consults",
              "Card payments and subscriptions — every payment goes to you, no REPs cut",
              "Live revenue, paid, pending and overdue at a glance",
            ]}
            imageLabel="Leads pipeline, calendar and payments in one view"
            mockup={{ device: "laptop", src: "/dashboard/leads", title: "Operations preview" }}
            ctaLabel="Explore Operations"
            ctaHref="/features/operations"
          />
        </div>
      </section>

      {/* PILLAR 4 — COACHING */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <ProductBlock
            eyebrow="Pillar 4 · Coaching"
            title="Programmes, check-ins and the full client record — in one tool."
            body="One platform for what you see and what your clients see. Programme builder, check-ins and history on your side; a premium portal on web and mobile on theirs."
            bullets={[
              "Programme builder with week-by-week progression and video demos",
              "AI check-in summariser — six check-ins into one card per client",
              "Full client record: programme, adherence, payments and LTV in one view",
              "Branded client portal on web and mobile — included, not an add-on",
            ]}
            imageLabel="Programme builder, check-ins and the full client record"
            mockup={{ device: "laptop", src: "/dashboard/programs", title: "Coaching preview" }}
            ctaLabel="Explore Coaching"
            ctaHref="/features/coaching"
            reverse
          />
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
        <div className="relative mx-auto max-w-[1320px] px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-20">
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

          <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {AI_HERO_CAPS.map((c) => (
              <div key={c.title} className="flex flex-col rounded-[18px] border border-reps-border bg-reps-panel/60 p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-reps-orange-soft">
                  <c.icon className="h-5 w-5 text-reps-orange" />
                </div>
                <div className="mt-4 text-[16px] font-semibold text-white">{c.title}</div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{c.body}</p>
                <div className="mt-4 rounded-[12px] border border-reps-orange-border/40 bg-reps-orange-soft/30 px-4 py-3 text-[12.5px] leading-relaxed text-white/80">
                  {c.example}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[12.5px] text-white/55">
            Plus risk flags across your full client list — included in every paid tier.
          </p>
        </div>
      </section>

      {/* PILLAR 6 — GROWTH */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 pt-20 pb-24 lg:px-10 lg:pt-20 lg:pb-28">
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
            imageLabel="Growth dashboard with Next Move and weekly reporting"
            mockup={{ device: "laptop", src: "/dashboard", title: "Growth dashboard preview" }}
            ctaLabel="Explore Growth"
            ctaHref="/features/growth"
            reverse
          />
        </div>
      </section>


      {/* PRICING ANCHOR — compact 3-tier strip so visitors know the price without leaving */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="mb-10 max-w-[680px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Pricing
            </span>
            <h2 className="mt-3 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              Three tiers. Every feature in your tier included — no paid add-ons.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                name: "Verified",
                price: "£99",
                cadence: "/ year",
                tagline: "Your verified profile on the register the public already searches.",
                href: "/pricing",
              },
              {
                name: "Pro",
                price: "£59",
                cadence: "/ month",
                tagline: "Shop-front, operations, coaching and the AI layer that runs the rest.",
                href: "/pricing",
                featured: true,
                badge: "Founding — locked for life",
              },
              {
                name: "Studio",
                price: "£149",
                cadence: "/ month",
                tagline: "Multi-coach team, shared client base, studio-level reporting.",
                href: "/pricing",
              },
            ].map((t) => (
              <div
                key={t.name}
                className={`relative rounded-[18px] border p-6 ${
                  t.featured
                    ? "border-reps-orange-border bg-reps-orange-soft/40 shadow-[0_0_0_1px_rgba(255,122,0,0.25),0_30px_80px_-40px_rgba(255,122,0,0.45)]"
                    : "border-reps-border bg-reps-panel/60"
                }`}
              >
                {t.badge && (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full border border-reps-orange-border bg-reps-ink px-3 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-reps-orange">
                    <Star className="h-3 w-3 fill-reps-orange" /> {t.badge}
                  </span>
                )}
                <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  {t.name}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-[36px] font-bold text-white">{t.price}</span>
                  <span className="text-[13px] text-white/60">{t.cadence}</span>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">{t.tagline}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1 text-[14px] font-semibold text-reps-orange hover:underline"
            >
              See full pricing and what's included <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
                Verified profile live today. Set up in 10 minutes.
              </h2>
              <p className="mx-auto mt-3 max-w-[540px] text-[15px] text-white/70">
                Join the register the public already searches — and the AI operating system that runs the rest of your business. Founding Pro pricing locked for life, available only before public launch.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  to="/compare"
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
                >
                  Compare platforms <ArrowRight className="h-4 w-4" />
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
