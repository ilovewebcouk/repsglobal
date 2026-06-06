import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Brain,
  Check,
  ClipboardCheck,
  Dumbbell,
  Eye,
  Globe,
  PenTool,
  ScanLine,
  Settings2,
  Sparkles,
  Star,
  TrendingUp,
  Wand2,
  Zap,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { RegisterProof } from "@/components/marketing/RegisterProof";

import { ProductBlock } from "@/components/marketing/ProductBlock";

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
        </div>
      </section>

      {/* PRESS MARQUEE — continuous R→L scroll on the same ink continuum as hero + Act 1 */}
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

      {/* VISIBILITY SHOWCASE */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <ProductBlock
            eyebrow="Verified profile"
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
            ctaLabel="See the profile"
            ctaHref="/features/visibility"
          />
        </div>
      </section>

      {/* ACT 2 — PILLARS */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="max-w-[720px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Act 2 · Run your practice
            </span>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
              Six pillars. One operating system.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              When clients arrive, REPs runs the rest. Built for fitness — every booking,
              programme, check-in and message wired into the same client record. Pro and
              Studio plans include a personalised shop-front at{" "}
              <span className="text-white">/c/your-name</span> — the page below shows what
              yours can look like.
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
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CHAPTER P1 — VISIBILITY */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="pt-20 lg:pt-24">
            <PillarChapter
              number={1}
              name="Visibility"
              promise="Be found by the clients already searching the register — and trusted before they even message you."
            />
          </div>
          <div className="py-20 lg:py-24">
            <ProductBlock
              eyebrow="Verified profile & reviews"
              title="Found on the register the public already searches."
              body="Your REPs profile is your front door — credentials, specialisms, insurance and real reviews, ranked in city and profession search across the verified register."
              bullets={[
                "Verified profile with credentials and specialisms",
                "Ranked in city and profession search across the register",
                "Reviews from real verified clients — not anonymous strangers",
                "Shareable profile preview link for socials and bios",
              ]}
              imageLabel="Register search results mockup"
              mockup={{ device: "laptop", src: "/find-a-professional", title: "Register search preview" }}
              ctaLabel="Explore Visibility"
              ctaHref="/features/visibility"
            />
          </div>
        </div>
      </section>

      {/* CHAPTER P2 — SHOP-FRONT */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="pt-20 lg:pt-24">
            <PillarChapter
              number={2}
              name="Shop-front"
              promise="A personalised page at /c/your-name that turns visitors into paying clients — built in, not bolted on."
            />
          </div>
          <div className="py-20 lg:py-24">
            <ProductBlock
              eyebrow="Personalised shop-front"
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
        </div>
      </section>

      {/* CHAPTER P3 — OPERATIONS (5 features) */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="pt-20 lg:pt-24">
            <PillarChapter
              number={3}
              name="Operations"
              promise="Leads, bookings, payments, CRM and messaging — every moving part of your practice in one place, wired to the same client record."
            />
          </div>

          <div className="py-20 lg:py-24">
            <ProductBlock
              eyebrow="Lead pipeline"
              title="Every enquiry tracked from first touch to first session."
              body="Slow replies cost you clients. REPs lands every lead with source, value, priority and follow-up date — and AI scores intent so the hot ones never wait."
              bullets={[
                "Pipeline view with source, value, priority and follow-up date",
                "AI lead scoring — intent ranked 1–10",
                "First-reply drafts in your tone of voice",
                "Conversion reporting from enquiry to paid client",
              ]}
              imageLabel="Leads pipeline mockup"
              mockup={{ device: "laptop", src: "/dashboard/leads", title: "Lead pipeline preview" }}
              ctaLabel="Explore Operations"
              ctaHref="/features/operations"
            />
          </div>

          <div className="pb-20 lg:pb-24">
            <ProductBlock
              eyebrow="Bookings & calendar"
              title="A calendar built for coaching, not Outlook."
              body="Availability, session types, deposits and reminders — two-way synced to your existing calendar so nothing double-books and nothing slips."
              bullets={[
                "Two-way sync with Google and Apple Calendar",
                "Session types with deposits, durations and locations",
                "Automated reminders that kill no-shows",
                "Online sessions with a one-tap join link",
              ]}
              imageLabel="Calendar mockup"
              mockup={{ device: "laptop", src: "/dashboard/calendar", title: "Calendar preview" }}
              ctaLabel="Explore Operations"
              ctaHref="/features/operations"
              reverse
            />
          </div>

          <div className="pb-20 lg:pb-24">
            <ProductBlock
              eyebrow="Payments & subscriptions"
              title="Get paid on time, every time."
              body="Card payments, packages and subscriptions powered by Stripe — REPs takes no cut of what your clients pay you. Per-client revenue, paid, pending and overdue at a glance."
              bullets={[
                "One-off, package and subscription billing",
                "Stripe payouts straight to your bank",
                "Automated invoices and overdue chasers",
                "REPs takes no cut of what your clients pay you",
              ]}
              imageLabel="Payments mockup"
              mockup={{ device: "laptop", src: "/dashboard/payments", title: "Payments preview" }}
              ctaLabel="Explore Operations"
              ctaHref="/features/operations"
            />
          </div>

          <div className="pb-20 lg:pb-24">
            <ProductBlock
              eyebrow="Clients CRM"
              title="One record per client. The whole story."
              body="Sessions, notes, programmes, payments, messages and check-ins on a single screen. The CRM the coaching apps don't have, wired to the coaching tools the CRMs don't have."
              bullets={[
                "Full client record with goals, programme and last check-in",
                "Lifetime value, renewal date and outstanding invoice surfaced",
                "Session notes, files and progress photos in one place",
                "Tags and segments for win-back, renewal and onboarding",
              ]}
              imageLabel="Clients CRM mockup"
              mockup={{ device: "laptop", src: "/dashboard/clients", title: "Clients CRM preview" }}
              ctaLabel="Explore Operations"
              ctaHref="/features/operations"
              reverse
            />
          </div>

          <div className="pb-20 lg:pb-24">
            <ProductBlock
              eyebrow="Client messaging"
              title="A focused inbox, separate from your personal phone."
              body="Every client thread in one tidy inbox — with context, history and AI-drafted replies on tap. Reclaim WhatsApp for your friends and family."
              bullets={[
                "Threaded inbox separate from your personal messages",
                "Client context — programme, last check-in, next session — beside every thread",
                "AI reply drafts in your tone of voice",
                "Read on web and mobile, replies stay in sync",
              ]}
              imageLabel="Messaging mockup"
              mockup={{ device: "phone", src: "/dashboard/messages", title: "Messaging preview" }}
              ctaLabel="Explore Operations"
              ctaHref="/features/operations"
            />
          </div>
        </div>
      </section>

      {/* FEATURE TESTIMONIAL (kept as rhythm-breaker between Operations and Coaching) */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
          <TestimonialFeature />
        </div>
      </section>

      {/* CHAPTER P4 — COACHING (3 features) */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="pt-20 lg:pt-24">
            <PillarChapter
              number={4}
              name="Coaching"
              promise="Programmes, check-ins and the client portal that makes your work feel premium — wired into the same client record as your bookings and payments."
            />
          </div>

          <div className="py-20 lg:py-24">
            <ProductBlock
              eyebrow="Programmes"
              title="Programmes your clients show off."
              body="Weeks, workouts, sets, reps, rest, RPE and video demos — built in a clean editor and assigned in one click. Or one-line brief in, 12-week plan out, drafted by REPs AI."
              bullets={[
                "Week-by-week structure with progression",
                "Curated exercise library with video demos",
                "One-click assignment, bulk edits across clients",
                "AI Programme Writer — drafted from a brief",
              ]}
              imageLabel="Programme builder mockup"
              mockup={{ device: "laptop", src: "/dashboard/programs", title: "Programme builder preview" }}
              ctaLabel="Explore Coaching"
              ctaHref="/features/coaching"
            />
          </div>

          <div className="pb-20 lg:pb-24">
            <ProductBlock
              eyebrow="Check-ins & progress"
              title="Reclaim your Sunday evenings."
              body="Adherence, sleep, stress, training, nutrition, measurements and photos summarised into one card per client — with a reply already drafted in your tone of voice."
              bullets={[
                "Single-screen check-in review per client",
                "AI Check-in Summariser — headline, change, ask",
                "Nutrition targets vs actuals with deltas",
                "Progress photos and measurements side-by-side",
              ]}
              imageLabel="Check-ins mockup"
              mockup={{ device: "laptop", src: "/dashboard/check-ins", title: "Check-in review preview" }}
              ctaLabel="Explore Coaching"
              ctaHref="/features/coaching"
              reverse
            />
          </div>

          <div className="pb-20 lg:pb-24">
            <ProductBlock
              eyebrow="Client portal"
              title="The app your clients tell their friends about."
              body="What your clients see matters as much as what you see. A premium-feeling portal — today's session, this week's targets, next booking, last message — wherever they open it."
              bullets={[
                "Client dashboard on web and mobile",
                "One-tap check-in with photos and metrics",
                "Bookings and payment history visible to the client",
                "Branded with your accent colour on Pro and Studio",
              ]}
              imageLabel="Client portal mockup"
              mockup={{ device: "phone", src: "/portal/today", title: "Client portal preview" }}
              ctaLabel="Explore Coaching"
              ctaHref="/features/coaching"
            />
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


      {/* CHAPTER P5 — REPS AI (HERO MOMENT) */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 pt-20 lg:px-10 lg:pt-24">
          <PillarChapter
            number={5}
            name="REPs AI"
            promise="An AI operating layer working across every pillar — drafting, scoring, summarising and ranking your next move."
          />
        </div>
      </section>
      <section className="relative overflow-hidden border-b border-reps-border bg-reps-panel/20">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(55%_50%_at_75%_40%,rgba(255,122,0,0.12),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-reps-orange-soft px-3 py-1 text-[12px] font-semibold text-reps-orange">
                <Wand2 className="h-3.5 w-3.5" /> REPs AI Operating System
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

      {/* CHAPTER P6 — GROWTH */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 pt-20 lg:px-10 lg:pt-24">
          <PillarChapter
            number={6}
            name="Growth"
            promise="Reviews, content and reporting that compound — every happy client makes the next one easier to win."
          />
        </div>
      </section>
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <ProductBlock
            eyebrow="Pillar 6 · Growth"
            title="Compound your reputation week after week."
            body="Reviews, content and reporting that build a flywheel — every happy client makes the next one easier to win. Your numbers, your proof and your story, all working together."
            bullets={[
              "Automated review collection from real verified clients",
              "Lead-magnet builder and content scheduler",
              "Weekly business report — revenue, retention, leads, reviews",
              "Benchmarks vs comparable pros in your city and specialism",
            ]}
            imageLabel="Growth reports mockup — coming soon"
            mockup={{ device: "laptop", src: "/dashboard/reports", title: "Growth reports preview" }}
            ctaLabel="Explore Growth"
            ctaHref="/features/growth"
          />
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
