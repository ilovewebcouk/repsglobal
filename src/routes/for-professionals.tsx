import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  LineChart,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { FoundingBanner } from "@/components/pricing/FoundingBanner";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { PricingCompare } from "@/components/pricing/PricingCompare";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { MockupPlaceholder } from "@/components/mockups/MockupPlaceholder";
import { ActIntro } from "@/components/marketing/ActIntro";
import { RegisterProof } from "@/components/marketing/RegisterProof";
import { ProductBlock } from "@/components/marketing/ProductBlock";
import { CompetitorCompare } from "@/components/marketing/CompetitorCompare";

import heroTrainer from "@/assets/hero-trainer.jpg";
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";

import bbcSport from "@/assets/press/bbc-sport.svg.asset.json";
import gq from "@/assets/press/gq.svg.asset.json";
import mensHealth from "@/assets/press/mens-health.svg.asset.json";
import runnersWorld from "@/assets/press/runners-world.svg.asset.json";
import theTimes from "@/assets/press/the-times.svg.asset.json";
import womensFitness from "@/assets/press/womens-fitness.svg.asset.json";

export const Route = createFileRoute("/for-professionals")({
  head: () => ({
    meta: [
      { title: "Join REPs — The register, the trust layer, the operating system" },
      {
        name: "description",
        content:
          "REPs has been the fitness industry's verified register since 2009. Now it's also the operating system you run your practice on — bookings, clients, programmes, payments and insights. Better than Trainerize, MyPTHub or PT Distinction.",
      },
      { property: "og:title", content: "Join REPs — For Professionals" },
      {
        property: "og:description",
        content:
          "The register that brings you clients, and the operating system that runs your practice. Founding pricing locked for life.",
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

const STEPS = [
  { n: "01", t: "Create your profile", body: "Tell us about your specialisms, services and rates. Takes about 8 minutes." },
  { n: "02", t: "Get verified", body: "Upload qualifications, insurance and any CPD. Our team reviews within 24 hours." },
  { n: "03", t: "Open for bookings", body: "Connect Stripe, switch on your calendar, and start getting matched with clients." },
];

const TESTIMONIALS = [
  {
    img: proJames,
    quote:
      "Within two months of joining REPs I was fully booked. Clients arrive ready to commit because they already trust the badge.",
    name: "James Carter",
    role: "Level 4 PT · London",
    stat: "Fully booked in 2 months",
  },
  {
    img: proSophie,
    quote:
      "I used to juggle three apps for bookings, payments and check-ins. REPs replaced all of it and grew my online cohort by 40%.",
    name: "Sophie Williams",
    role: "Pilates Instructor · Manchester",
    stat: "Online cohort +40%",
  },
  {
    img: proLaura,
    quote:
      "The Founding Pro pricing is unreal value. The CRM alone has paid for itself ten times over.",
    name: "Laura Mitchell",
    role: "Nutritionist · Online",
    stat: "10× ROI on subscription",
  },
  {
    img: proDaniel,
    quote: "Deposits killed my no-show rate overnight. I get my Saturdays back.",
    name: "Daniel Pereira",
    role: "Strength Coach · Bristol",
    stat: "No-shows ~0%",
  },
  {
    img: proJames,
    quote:
      "The Monday 'next move' card is like having a business coach on tap. Single best feature.",
    name: "Marcus Bell",
    role: "Online Coach · Leeds",
    stat: "+24% revenue YoY",
  },
  {
    img: proSophie,
    quote:
      "I get my evenings back. Quiet hours kick in at 8pm and I'm not on my phone any more.",
    name: "Aoife Murphy",
    role: "Pre-natal Specialist · Dublin",
    stat: "9 hours saved / week",
  },
];

const WHY_PRICED = [
  {
    icon: BadgeCheck,
    title: "Visibility — Free.",
    body: "Every professional gets a free, claimable profile so clients can find you in the directory.",
  },
  {
    icon: ShieldCheck,
    title: "Trust — Verified.",
    body: "Pay once a year to prove your credentials and unlock reviews and enquiries from clients.",
  },
  {
    icon: LineChart,
    title: "Operating system — Pro & up.",
    body: "Run bookings, clients, programmes and growth tools all in one place.",
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

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* ============ CINEMATIC HERO ============ */}
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
            <h1 className="mt-6 font-display text-[48px] font-bold leading-[1.02] text-white lg:text-[76px]">
              The register the industry trusts.
              <br />
              <span className="text-reps-orange">The platform that runs your practice.</span>
            </h1>
            <p className="mt-6 max-w-[640px] text-[17px] leading-relaxed text-white/75">
              REPs has been the fitness industry's verified register since 2009. Now it's also
              the operating system you run your business on — bookings, clients, programmes,
              payments and insights. One platform. One credential.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                Create free profile <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/for-professionals"
                hash="pricing"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white backdrop-blur hover:bg-white/15"
              >
                See plans
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

      {/* ============ TWO-ACT INTRO ============ */}
      <section className="border-b border-reps-border">
        <div className="mx-auto grid max-w-[1240px] gap-6 px-6 py-16 md:grid-cols-2 lg:px-10">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Act 1 · Get clients
            </div>
            <h2 className="mt-3 font-display text-[24px] font-bold leading-snug text-white lg:text-[28px]">
              The register that brings the public to you.
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-white/65">
              Every other coaching app makes you bring your own clients. REPs is the one
              place the public already searches when they want a trusted pro.
            </p>
          </div>
          <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              Act 2 · Run your practice
            </div>
            <h2 className="mt-3 font-display text-[24px] font-bold leading-snug text-white lg:text-[28px]">
              The operating system that runs everything after.
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-white/65">
              Bookings, payments, clients, programmes, check-ins, messaging and insights —
              in one place, built for fitness, not generic SaaS.
            </p>
          </div>
        </div>
      </section>

      {/* ============ ACT 1 — THE REGISTER ============ */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10">
          <ActIntro
            act="Act 1"
            kicker="Get clients"
            eyebrow="The Register"
            title="The industry register since 2009. The only platform clients actively search."
            body="Trainerize, MyPTHub and PT Distinction give you software. REPs gives you software and clients — because the public already lands here when they're looking for a trusted pro."
          />

          <div className="mt-12">
            <RegisterProof />
          </div>

          <div className="mt-14">
            <MockupPlaceholder label="Public directory · where clients land" aspect="wide" />
            <p className="mt-3 text-center text-[12px] uppercase tracking-[0.18em] text-white/40">
              This is where the public lands.
            </p>
          </div>
        </div>
      </section>

      {/* ============ ACT 2 — THE OPERATING SYSTEM ============ */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10">
          <ActIntro
            act="Act 2"
            kicker="Run your practice"
            eyebrow="The Operating System"
            title="When clients arrive, REPs runs the rest."
            body="One platform replaces six. Built for fitness, not generic SaaS — and every workflow is wired into the same client record."
          />

          <div className="mt-16 space-y-20">
            <ProductBlock
              eyebrow="Bookings & payments"
              title="Kill no-shows. Get paid on time."
              body="Two-way calendar sync, deposits at booking, automatic reminders, Stripe payouts and recurring memberships — without juggling Calendly, Stripe and an invoicing app."
              bullets={[
                "Deposits collected at booking, no-shows drop to near zero",
                "Recurring memberships and packages with one Stripe connection",
                "Two-way Google / Apple calendar sync",
              ]}
              imageLabel="Bookings & calendar"
              ctaLabel="Explore bookings & payments"
              ctaSlug="bookings"
            />

            <ProductBlock
              reverse
              eyebrow="Clients, programmes & check-ins"
              title="One record per client. Everything else attached."
              body="Sessions, notes, payments, programmes, weekly check-ins and progress photos — all on one timeline. The Trainerize-class coaching app, with a public-facing profile and a credential attached."
              bullets={[
                "Programme builder with video exercise library",
                "Weekly check-in forms, photos and measurements on a tidy timeline",
                "Adherence and retention surfaced — not buried in a CSV",
              ]}
              imageLabel="Client record & programme builder"
              ctaLabel="Explore the client CRM"
              ctaSlug="clients"
            />

            <ProductBlock
              eyebrow="Client portal & messaging"
              title="A branded space for your clients. A focused inbox for you."
              body="Clients get a clean portal for today's session, their programme, nutrition and check-ins. You get a focused inbox separate from your personal phone — with quiet hours that actually stick."
              bullets={[
                "Branded portal — web and mobile, no app store wrestling",
                "Inbox separate from WhatsApp, with quiet hours and templates",
                "Clients see exactly what they need today — and nothing else",
              ]}
              imageLabel="Client portal & inbox"
              ctaLabel="Explore the client portal"
              ctaSlug="messaging"
            />
          </div>
        </div>
      </section>

      {/* ============ GROWTH LAYER ============ */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
                Growth · Insights & AI
              </span>
              <h2 className="mt-2 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
                The next move to grow this month.
              </h2>
              <p className="mt-3 max-w-[520px] text-[15px] text-white/70">
                A Monday-morning card tells you the single highest-leverage action this week —
                which clients are drifting, which package is converting, which day to open up
                for new bookings. Not a dashboard you have to read. A coach for your business.
              </p>
              <Link
                to="/features/$slug"
                params={{ slug: "insights" }}
                className="mt-5 inline-flex items-center gap-1 text-[14px] font-semibold text-reps-orange hover:underline"
              >
                Explore insights & AI <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8">
              <div className="font-display text-[56px] font-bold leading-none text-reps-orange">
                +24%
              </div>
              <div className="mt-2 text-[13px] font-semibold uppercase tracking-wider text-white/70">
                Average revenue YoY
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-white/85">
                "The Monday 'next move' card is like having a business coach on tap. Single
                best feature."
              </p>
              <div className="mt-4 text-[12px] text-white/55">
                Marcus Bell · Online Coach · Leeds
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ COMPETITOR COMPARISON ============ */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10">
          <CompetitorCompare />
        </div>
      </section>

      {/* ============ EARNINGS CALCULATOR ============ */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_1.1fr] lg:px-10">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              The maths
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              What a Pro plan returns.
            </h2>
            <p className="mt-3 max-w-[520px] text-[15px] text-white/70">
              A typical Founding Pro running 12 sessions a week at £45 with 84% retention
              clears around £2,160 a month after the REPs take.
            </p>
            <ul className="mt-5 space-y-2 text-[14px] text-white/80">
              {[
                "Founding Pro at £29/mo — locked for life",
                "15% platform take on bookings (Stripe fees included)",
                "Annual saves you 2 months vs monthly",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[22px] border border-reps-border bg-reps-panel p-6">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Earnings calculator
            </div>
            <h3 className="mt-2 font-display text-[20px] font-bold text-white">
              Sample Pro inputs
            </h3>
            <div className="mt-4 space-y-3 text-[13px]">
              {[
                ["Sessions / week", "12"],
                ["Avg. price", "£45"],
                ["Retention", "84%"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-ink px-4 py-3"
                >
                  <span className="text-white/65">{k}</span>
                  <span className="font-semibold text-white">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[16px] border border-reps-orange/40 bg-reps-orange-soft p-5">
              <div className="text-[12px] text-white/70">Projected monthly revenue</div>
              <div className="mt-1 font-display text-[34px] font-bold text-reps-orange">£2,160</div>
              <div className="text-[11px] text-white/60">After 15% platform take</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <h2 className="font-display text-[28px] font-bold text-white">Get started in 3 steps</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="font-display text-[28px] font-bold text-reps-orange">{s.n}</span>
                <h3 className="mt-2 font-display text-[18px] font-bold text-white">{s.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SOCIAL PROOF ============ */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              From the register
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              REPs professionals, in their words.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <article
                key={t.name}
                className="flex flex-col rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <div className="inline-flex w-fit items-center gap-1 rounded-full bg-reps-orange-soft px-2 py-0.5 text-[11px] font-semibold text-reps-orange">
                  <Sparkles className="h-3 w-3" />
                  {t.stat}
                </div>
                <Star className="mt-3 h-4 w-4 fill-reps-orange text-reps-orange" />
                <p className="mt-2 font-display text-[15px] leading-snug text-white">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <img src={t.img} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <div className="text-[13px] font-semibold text-white">{t.name}</div>
                    <div className="text-[11px] text-white/55">{t.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="border-b border-reps-border scroll-mt-24">
        <div className="border-b border-reps-border bg-reps-panel/40">
          <FoundingBanner />
        </div>
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Pricing
            </span>
            <h2 className="mt-5 font-display text-[36px] font-bold leading-tight text-white lg:text-[48px]">
              Free to list. Verified to be trusted.
              <br />
              Pro to run your business.
            </h2>
            <p className="mx-auto mt-4 max-w-[620px] text-[15px] text-white/65">
              REPs isn't another coaching app. It's a public register, a trust layer and an
              operating system — priced so every professional can start free and grow.
            </p>
          </div>
          <PricingPlans />
        </div>
      </section>

      {/* ============ WHY PRICED THIS WAY ============ */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
          <div className="text-center">
            <h2 className="font-display text-[28px] font-bold text-white">
              A ladder, not a paywall.
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-white/65">
              Each tier maps to a different stage of your career.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {WHY_PRICED.map((c) => (
              <div key={c.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                  <c.icon className="h-4 w-4" />
                </span>
                <h3 className="mt-4 font-display text-[16px] font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMPARE PLANS ============ */}
      <section id="compare" className="border-b border-reps-border scroll-mt-24">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
          <PricingCompare />
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="border-b border-reps-border bg-reps-panel/30 scroll-mt-24">
        <div className="mx-auto max-w-[820px] px-6 py-20 lg:px-10">
          <PricingFAQ />
        </div>
      </section>

      {/* ============ FINAL CTA + LEAD CAPTURE ============ */}
      <section>
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-[24px] border border-reps-border bg-reps-panel p-10 lg:p-12">
              <h2 className="font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
                Join 25,000+ verified pros.
              </h2>
              <p className="mt-3 max-w-[480px] text-[15px] text-white/70">
                Founding pricing is locked for life — but only available before public launch.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/signup"
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
                >
                  Join REPs <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/for-professionals"
                  hash="pricing"
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white hover:bg-white/10"
                >
                  See plans
                </Link>
              </div>
            </div>
            <DemoForm />
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
          <div className="flex items-center justify-between gap-3 rounded-[16px] border border-reps-border bg-reps-panel/95 px-4 py-3 shadow-[0_-12px_40px_rgba(0,0,0,0.4)] backdrop-blur">
            <div className="flex items-center gap-3">
              <BadgeCheck className="hidden h-5 w-5 text-reps-orange sm:block" />
              <div className="text-[13px] text-white">
                <span className="font-semibold">Founding pricing locked for life.</span>{" "}
                <span className="hidden text-white/65 sm:inline">Before public launch.</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/for-professionals"
                hash="pricing"
                className="hidden h-9 items-center rounded-[10px] border border-white/25 px-3 text-[12px] font-semibold text-white hover:bg-white/10 sm:inline-flex"
              >
                See plans
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

function DemoForm() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="rounded-[24px] border border-reps-border bg-reps-panel p-8 lg:p-10"
    >
      <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
        Talk to us
      </span>
      <h3 className="mt-2 font-display text-[22px] font-bold leading-tight text-white">
        Book a 10-min platform tour.
      </h3>
      <p className="mt-1.5 text-[13px] text-white/65">
        See REPs with one of our team. No commitment, no pitch — just a walk through the product.
      </p>

      {submitted ? (
        <div className="mt-6 rounded-[16px] border border-reps-orange-border bg-reps-orange-soft p-5 text-[14px] text-white">
          Thanks — we'll be in touch within one working day to book a slot.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <input
            required
            placeholder="Your name"
            className="h-11 w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[14px] text-white placeholder:text-white/40 focus:border-reps-orange-border focus:outline-none"
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="h-11 w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[14px] text-white placeholder:text-white/40 focus:border-reps-orange-border focus:outline-none"
          />
          <select
            required
            defaultValue=""
            className="h-11 w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[14px] text-white focus:border-reps-orange-border focus:outline-none"
          >
            <option value="" disabled className="text-white/40">
              Your discipline
            </option>
            <option>Personal Trainer</option>
            <option>Pilates Instructor</option>
            <option>Yoga Teacher</option>
            <option>Nutritionist</option>
            <option>Strength Coach</option>
            <option>Other</option>
          </select>
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
          >
            Book a tour <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-[11px] text-white/45">
            We'll only use this to schedule your tour. No marketing spam.
          </p>
        </div>
      )}
    </form>
  );
}
