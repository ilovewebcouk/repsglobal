import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  CreditCard,
  Eye,
  LayoutGrid,
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
import { FEATURES, FEATURE_GROUPS } from "@/components/features/feature-config";

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
      { title: "Join REPs — Get discovered, take bookings, grow your practice" },
      {
        name: "description",
        content:
          "REPs is where verified personal trainers, coaches and instructors get discovered, take bookings and run their business. See plans from free to founding Pro.",
      },
      { property: "og:title", content: "Join REPs — For Professionals" },
      {
        property: "og:description",
        content:
          "Free profile, Verified trust, Pro operating system. Founding pricing locked for life — before public launch.",
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

const PITCH = [
  {
    icon: Eye,
    title: "Get discovered",
    body: "Show up in the REPs directory the moment clients search for your specialism, city or goal.",
  },
  {
    icon: CreditCard,
    title: "Take bookings",
    body: "Stripe-powered payments, deposits and recurring memberships — no admin, no chasing invoices.",
  },
  {
    icon: LayoutGrid,
    title: "Run your practice",
    body: "Clients, programmes, check-ins, messaging and insights in one place. Built for fitness, not generic SaaS.",
  },
];

const GROUP_VISUAL: Record<string, { label: string }> = {
  visibility: { label: "Professional profile" },
  operations: { label: "Bookings calendar" },
  growth: { label: "Insights dashboard" },
};

const SHOWCASE = [
  {
    slug: "bookings" as const,
    title: "Bookings & calendar",
    body: "Two-way sync, deposits, reminders. No more no-shows.",
    label: "Bookings",
  },
  {
    slug: "clients" as const,
    title: "Clients CRM",
    body: "One record per client — sessions, notes, payments, programmes.",
    label: "Clients CRM",
  },
  {
    slug: "payments" as const,
    title: "Payments",
    body: "Stripe payouts, subscriptions, VAT-ready invoicing.",
    label: "Payments",
  },
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
    quote:
      "Deposits killed my no-show rate overnight. I get my Saturdays back.",
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
  { icon: Eye, title: "Visibility — Free.", body: "Every professional gets a free, claimable profile so clients can find you in the directory." },
  { icon: ShieldCheck, title: "Trust — Verified.", body: "Pay once a year to prove your credentials and unlock reviews and enquiries from clients." },
  { icon: LayoutGrid, title: "Operating system — Pro & up.", body: "Run bookings, clients, programmes and growth tools all in one place." },
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

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-reps-border">
        <img
          src={heroTrainer}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto grid max-w-[1240px] gap-12 px-6 py-20 lg:grid-cols-[1fr_1.15fr] lg:px-10 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> For professionals
            </span>
            <h1 className="mt-5 font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
              Grow a fitness practice
              <br />
              <span className="text-reps-orange">clients actually trust.</span>
            </h1>
            <p className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-white/70">
              REPs is where verified personal trainers, coaches and instructors get discovered,
              take bookings and run their business — all in one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                Create free profile <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/for-professionals"
                hash="pricing"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                See plans
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 text-[12px] text-white/60 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {TRUST_POINTS.map((t) => (
                <span key={t.label} className="flex items-center gap-2">
                  <t.icon className="h-4 w-4 text-reps-orange" /> {t.label}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:pl-4">
            <MockupPlaceholder label="Dashboard" />
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

      {/* ============ PITCH (3-up) ============ */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Why join REPs
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              One platform for the entire client journey.
            </h2>
            <p className="mt-3 max-w-[600px] text-[15px] text-white/65">
              Get discovered, take bookings and run your practice — without juggling six different tools.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PITCH.map((p) => (
              <div key={p.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[18px] font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SEE THE PLATFORM ============ */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              See the platform
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Not another coaching app. An operating system.
            </h2>
            <p className="mt-3 max-w-[600px] text-[15px] text-white/65">
              Real product views. Click through to any feature for the full deep-dive.
            </p>
          </div>
          <div className="mt-10 grid gap-8">
            {SHOWCASE.map((s, i) => (
              <div
                key={s.slug}
                className={`grid items-center gap-8 lg:grid-cols-[1.4fr_1fr] ${
                  i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
                }`}
              >
                <BrowserFrame>{s.visual}</BrowserFrame>
                <div>
                  <h3 className="font-display text-[24px] font-bold text-white lg:text-[30px]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[15px] text-white/70">{s.body}</p>
                  <Link
                    to="/features/$slug"
                    params={{ slug: s.slug }}
                    className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-reps-orange hover:underline"
                  >
                    Explore {s.title.toLowerCase()} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURE PILLARS ============ */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Everything you need
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Built for fitness pros, not generic SaaS.
            </h2>
          </div>
          <div className="mt-10 space-y-12">
            {FEATURE_GROUPS.map((group) => {
              const items = FEATURES.filter((f) => f.group === group.key);
              return (
                <div key={group.key}>
                  <div className="mb-5 flex items-center gap-3">
                    <h3 className="font-display text-[16px] font-bold uppercase tracking-wider text-white/90">
                      {group.label}
                    </h3>
                    <span className="text-[13px] text-white/55">{group.desc}</span>
                    <span aria-hidden className="h-px flex-1 bg-reps-border" />
                  </div>
                  <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {items.map((f) => (
                        <Link
                          key={f.slug}
                          to="/features/$slug"
                          params={{ slug: f.slug }}
                          className="group flex items-start gap-3 rounded-[16px] border border-reps-border bg-reps-panel p-4 transition-colors hover:border-reps-orange-border"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                            <f.icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold text-white group-hover:text-reps-orange">
                              {f.label}
                            </div>
                            <div className="mt-0.5 text-[12px] text-white/60">{f.oneLiner}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <BrowserFrame>{GROUP_VISUAL[group.key]}</BrowserFrame>
                  </div>
                </div>
              );
            })}
          </div>
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
              REPs isn't another coaching app. It's a public register, a trust layer and an operating system — priced so every professional can start free and grow.
            </p>
          </div>
          <PricingPlans />
        </div>
      </section>

      {/* ============ WHY PRICED THIS WAY ============ */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
          <div className="text-center">
            <h2 className="font-display text-[28px] font-bold text-white">Why REPs is priced this way</h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-white/65">
              A ladder, not a paywall — each tier maps to a different stage of your career.
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

      {/* ============ COMPARE ============ */}
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
