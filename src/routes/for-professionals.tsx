import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  CreditCard,
  Eye,
  GraduationCap,
  LayoutGrid,
  LineChart,
  MessageSquare,
  Search,
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

import heroTrainer from "@/assets/hero-trainer.jpg";
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";

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
      { property: "og:url", content: "/for-professionals" },
    ],
    links: [{ rel: "canonical", href: "/for-professionals" }],
  }),
  component: ForProsPage,
});

const TRUST_POINTS = [
  { icon: Users, label: "25,000+ verified pros" },
  { icon: Star, label: "4.8★ average rating" },
  { icon: ShieldCheck, label: "Verified register since 2009" },
  { icon: Calendar, label: "1M+ sessions booked" },
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

const FEATURE_GROUPS = [
  {
    label: "Visibility",
    items: [
      { icon: BadgeCheck, title: "Verified profile that ranks", body: "Qualifications, insurance and reviews checked once — surface forever in search." },
      { icon: Search, title: "Directory placement", body: "Appear in city, specialism and goal-based search across REPs." },
      { icon: Star, title: "Client reviews", body: "Verified reviews from real bookings build long-term trust." },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: Calendar, title: "Bookings & calendar", body: "Sync availability, manage sessions, reduce no-shows with reminders + deposits." },
      { icon: CreditCard, title: "Payments without admin", body: "Stripe payouts, invoices and recurring memberships in one place." },
      { icon: MessageSquare, title: "Client messaging", body: "Focused inbox for client conversations, with AI quick replies when you're slammed." },
    ],
  },
  {
    label: "Growth",
    items: [
      { icon: LineChart, title: "Insights that grow you", body: "Bookings, retention and revenue — plus the next move to make this month." },
      { icon: GraduationCap, title: "CPD on rails", body: "Log CPD points, upload certificates and stay current — REPs handles the paperwork." },
      { icon: Sparkles, title: "AI Business Command Centre", body: "Lead-pipeline, content studio and automations on Business and Studio tiers." },
    ],
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
      "Within two months of joining REPs I was fully booked. The verification matters — clients arrive ready to commit because they already trust the badge.",
    name: "James Carter",
    role: "Level 4 PT · London",
  },
  {
    img: proSophie,
    quote:
      "I used to juggle three apps for bookings, payments and check-ins. REPs replaced all of it and grew my online cohort by 40%.",
    name: "Sophie Williams",
    role: "Pilates Instructor · Manchester",
  },
  {
    img: proLaura,
    quote:
      "The Founding Pro pricing is unreal value. The CRM alone has paid for itself ten times over.",
    name: "Laura Mitchell",
    role: "Nutritionist · Online",
  },
];

const WHY_PRICED = [
  { icon: Eye, title: "Visibility — Free.", body: "Every professional gets a free, claimable profile so clients can find you in the directory." },
  { icon: ShieldCheck, title: "Trust — Verified.", body: "Pay once a year to prove your credentials and unlock reviews and enquiries from clients." },
  { icon: LayoutGrid, title: "Operating system — Pro & up.", body: "Run bookings, clients, programmes and growth tools all in one place." },
];

function ForProsPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-reps-border">
        <img
          src={heroTrainer}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto grid max-w-[1240px] gap-12 px-6 py-24 lg:grid-cols-[1.3fr_1fr] lg:px-10 lg:py-32">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> For professionals
            </span>
            <h1 className="mt-5 font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
              Grow a fitness practice
              <br />
              <span className="text-reps-orange">clients actually trust.</span>
            </h1>
            <p className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-white/70">
              REPs is where verified personal trainers, coaches and instructors get discovered, take bookings and
              run their business — all in one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/for-professionals"
                hash="pricing"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                See plans <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/signup"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
              >
                Create free profile
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 text-[12px] text-white/60 sm:grid-cols-4">
              {TRUST_POINTS.map((t) => (
                <span key={t.label} className="flex items-center gap-2">
                  <t.icon className="h-4 w-4 text-reps-orange" /> {t.label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-reps-border bg-reps-panel p-6">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Earnings calculator
            </div>
            <h3 className="mt-2 font-display text-[20px] font-bold text-white">
              What a Pro plan can return
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

      {/* ============ FEATURE DEEP-DIVE ============ */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Everything you need
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Built for fitness pros, not generic SaaS.
            </h2>
          </div>
          <div className="mt-10 space-y-10">
            {FEATURE_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="font-display text-[16px] font-bold uppercase tracking-wider text-white/90">
                    {group.label}
                  </h3>
                  <span aria-hidden className="h-px flex-1 bg-reps-border" />
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  {group.items.map((f) => (
                    <div key={f.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                        <f.icon className="h-5 w-5" />
                      </span>
                      <h4 className="mt-4 font-display text-[16px] font-bold text-white">{f.title}</h4>
                      <p className="mt-2 text-[13px] leading-relaxed text-white/65">{f.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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

      {/* ============ TESTIMONIALS ============ */}
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
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <article key={t.name} className="flex flex-col rounded-[22px] border border-reps-border bg-reps-panel p-7">
                <Star className="h-5 w-5 fill-reps-orange text-reps-orange" />
                <p className="mt-4 font-display text-[17px] leading-snug text-white">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <img src={t.img} alt="" className="h-11 w-11 rounded-full object-cover" />
                  <div>
                    <div className="text-[14px] font-semibold text-white">{t.name}</div>
                    <div className="text-[12px] text-white/55">{t.role}</div>
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

      {/* ============ FINAL CTA ============ */}
      <section>
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="relative overflow-hidden rounded-[24px] border border-reps-border bg-reps-panel p-10 text-center lg:p-14">
            <img
              src={proDaniel}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/70 via-reps-ink/85 to-reps-ink" />
            <div className="relative">
              <h2 className="font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
                Join 25,000+ verified pros.
              </h2>
              <p className="mx-auto mt-3 max-w-[520px] text-[15px] text-white/70">
                Founding pricing is locked for life — but only available before public launch.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  to="/signup"
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  Join REPs <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/for-professionals"
                  hash="pricing"
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
                >
                  See plans
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
