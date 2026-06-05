import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Apple,
  ArrowRight,
  Award,
  BadgeCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Globe,
  Heart,
  Laptop,
  MapPin,
  MessageCircle,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Target,
  Users,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroCoaching from "@/assets/home-hero-coaching.jpg.asset.json";
import ctaTrainers from "@/assets/cta-band.jpg";
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import { PressMarquee } from "@/components/marketing/PressMarquee";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "REPs — Find. Trust. Train. Transform." },
      {
        name: "description",
        content:
          "REPs connects you with verified fitness professionals you can trust to help you reach your goals.",
      },
      { property: "og:title", content: "REPs — Find. Trust. Train. Transform." },
      {
        property: "og:description",
        content:
          "Search verified personal trainers, Pilates instructors, nutritionists and coaches.",
      },
      { property: "og:url", content: "/" },
    ],
  }),
  component: HomeV2,
});

const goalChips = ["Fat loss", "Strength", "Mobility", "Pre/post-natal", "Rehab", "Sport-specific"];


const stats = [
  { icon: Users, value: "25,000+", label: "Verified Professionals" },
  { icon: Star, value: "50,000+", label: "Client Reviews" },
  { icon: Globe, value: "120+", label: "Countries Worldwide" },
  { icon: Calendar, value: "1M+", label: "Sessions Booked" },
];

const steps = [
  { icon: Search, t: "Search", body: "Tell us your goal, your city and how you want to train." },
  { icon: ShieldCheck, t: "Verify", body: "Every REP is qualified, insured and credential-checked." },
  { icon: Users, t: "Connect", body: "Read reviews, compare profiles, message your shortlist." },
  { icon: Target, t: "Transform", body: "Train with a coach who actually knows what they're doing." },
];

const specialisms = [
  { icon: Dumbbell, label: "Personal Trainer" },
  { icon: Activity, label: "Pilates" },
  { icon: Apple, label: "Nutritionist" },
  { icon: Target, label: "Strength Coach" },
  { icon: Heart, label: "Pre & Postnatal" },
  { icon: Stethoscope, label: "Rehab Specialist" },
  { icon: Users, label: "Sports Coach" },
  { icon: Laptop, label: "Online Coaching" },
];

const featuredPros = [
  { name: "James Carter", role: "Personal Trainer", location: "London, UK", rating: 5.0, reviews: 128, mode: "In-person & Online", image: proJames },
  { name: "Sophie Williams", role: "Pilates Instructor", location: "Manchester, UK", rating: 5.0, reviews: 96, mode: "In-person & Online", image: proSophie },
  { name: "Daniel Roberts", role: "Strength Coach", location: "Birmingham, UK", rating: 4.9, reviews: 74, mode: "In-person", image: proDaniel },
  { name: "Laura Mitchell", role: "Nutritionist", location: "Online", rating: 5.0, reviews: 112, mode: "Online", image: proLaura, online: true as const },
];

const outcomes = [
  {
    img: proJames,
    coach: "James Carter",
    headline: "Down 12kg in 6 months.",
    quote: "I'd tried every app. James gave me a plan I actually stuck to and a coach who held me to it.",
    name: "Mark, 38",
    metric: "12kg lost · 24-week plan",
  },
  {
    img: proSophie,
    coach: "Sophie Williams",
    headline: "Back to running pain-free.",
    quote: "After my second pregnancy I thought running was over. Sophie rebuilt my core and I'm doing 10ks again.",
    name: "Priya, 34",
    metric: "Post-natal · 12-week return",
  },
  {
    img: proDaniel,
    coach: "Daniel Roberts",
    headline: "Deadlift PB +40kg.",
    quote: "Programmed properly for the first time in my life. The progression was relentless and the results showed.",
    name: "Tom, 29",
    metric: "Strength · 16-week block",
  },
];

const trustPillars = [
  { icon: ShieldCheck, title: "Verified Professionals", body: "Every REP is qualified, insured and credential-checked. No exceptions." },
  { icon: Award, title: "Standards & CPD", body: "Ongoing education so the people coaching you stay current." },
  { icon: MessageCircle, title: "Real Client Reviews", body: "Reviews come from real bookings — no fake five-stars, no review farms." },
  { icon: Globe, title: "Global Community", body: "120+ countries. One global standard for exercise professionals." },
];

function HomeV2() {
  return (
    <div className="min-h-screen bg-reps-ivory">
      <PublicHeader variant="transparent" />



      {/* ============ HERO (locked) ============ */}
      <section className="relative isolate overflow-hidden bg-reps-black text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* Desktop: image anchored right, dark wash on the left so the copy column stays readable. Mobile/tablet: solid black, no image. */}
          <div className="absolute inset-0 hidden lg:block">
            <img
              src={heroCoaching.url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(11,13,16,0.78) 0%, rgba(11,13,16,0.6) 32%, rgba(11,13,16,0.25) 52%, rgba(11,13,16,0) 65%), linear-gradient(to bottom, rgba(11,13,16,0) 30%, rgba(11,13,16,0.35) 100%)",

              }}
            />




          </div>
        </div>


        <div className="mx-auto max-w-[1320px] px-6 pb-16 pt-[140px] lg:px-10 lg:pb-24 lg:pt-[160px]">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_minmax(0,440px)] lg:items-center lg:gap-16">
            <div>
              <h1
                className="animate-rise-in font-display text-[56px] font-bold leading-[0.92] tracking-[-0.035em] text-white sm:text-[72px] lg:text-[88px]"
                style={{ animationDelay: "120ms" }}
              >
                Find a coach
                <br />
                <span className="text-reps-orange">worth trusting.</span>
              </h1>
              <p
                className="animate-rise-in mt-6 max-w-[520px] text-[18px] font-light leading-relaxed text-white/75"
                style={{ animationDelay: "220ms" }}
              >
                25,000+ verified fitness professionals. Real qualifications. Real reviews.
                <span className="text-white"> Real results — in 30 seconds.</span>
              </p>

              <form
                onSubmit={(e) => e.preventDefault()}
                className="animate-rise-in mt-8 flex flex-col gap-2 rounded-[22px] border border-white/10 bg-reps-ink/60 p-2 backdrop-blur-md sm:flex-row sm:items-stretch sm:gap-0 sm:p-1.5"
                style={{ animationDelay: "320ms" }}
              >
                <label className="group flex flex-1 items-center gap-3 rounded-[16px] px-4 py-3 transition-colors focus-within:bg-white/5">
                  <Search className="h-4 w-4 shrink-0 text-reps-orange" aria-hidden />
                  <input
                    type="text"
                    placeholder="Search coaches, goals, specialisms"
                    aria-label="What do you want to train?"
                    className="w-full bg-transparent text-[15px] font-medium text-white placeholder:text-white/50 focus:outline-none"
                  />
                </label>
                <span aria-hidden className="hidden h-8 w-px self-center bg-white/10 sm:block" />
                <label className="group flex items-center gap-3 rounded-[16px] px-4 py-3 transition-colors focus-within:bg-white/5 sm:w-[200px]">
                  <MapPin className="h-4 w-4 shrink-0 text-white/60" aria-hidden />
                  <input
                    type="text"
                    placeholder="London"
                    aria-label="Where?"
                    className="w-full bg-transparent text-[15px] font-medium text-white placeholder:text-white/50 focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-[12px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,122,0,0.6)] transition-all hover:bg-reps-orange-dark hover:shadow-[0_14px_38px_-10px_rgba(255,122,0,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <Search className="h-4 w-4" aria-hidden />
                  Find your coach
                </button>
              </form>

              <div
                className="animate-rise-in mt-5 flex flex-wrap gap-2"
                style={{ animationDelay: "420ms" }}
              >
                {goalChips.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className="inline-flex h-9 items-center rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-[13px] font-medium text-white/85 transition-colors hover:border-reps-orange-border hover:bg-[rgba(255,122,0,0.08)] hover:text-white"
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div
                className="animate-rise-in mt-7 flex items-center gap-4"
                style={{ animationDelay: "520ms" }}
              >
                <div className="flex items-center -space-x-3">
                  {[proJames, proSophie, proDaniel, proLaura].map((src, i) => (
                    <span key={i} className="inline-block size-10 overflow-hidden rounded-full ring-2 ring-reps-black">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </span>
                  ))}
                </div>
                <div className="text-[13px] leading-snug text-white/70">
                  <div>
                    Trusted by <strong className="font-semibold text-white">25,000+</strong> clients worldwide
                  </div>
                  <div className="mt-0.5">
                    <Star className="mr-1 inline h-3.5 w-3.5 fill-reps-orange text-reps-orange align-[-2px]" aria-hidden />
                    <strong className="font-semibold text-white">4.9</strong>
                    <span className="mx-1.5 text-white/40">·</span>
                    <strong className="font-semibold text-white">50,000+</strong> verified reviews
                  </div>
                </div>
              </div>
            </div>
            <div aria-hidden />
          </div>
        </div>
      </section>

      {/* ============ PRESS STRIP — editorial wordmarks (canonical) ============ */}
      <PressMarquee />

      {/* ============ SOCIAL PROOF RAIL ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-10 lg:px-10">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-reps-stone bg-reps-stone sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-start gap-2 bg-reps-warm-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-reps-ivory text-reps-orange">
                  <s.icon className="h-5 w-5" />
                </span>
                <div className="font-display text-[30px] font-bold leading-none text-reps-charcoal lg:text-[36px]">
                  {s.value}
                </div>
                <div className="text-[13px] text-reps-muted-light">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS (4 steps) ============ */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[680px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">How it works</span>
            <h2 className="mt-2 font-display text-[34px] font-bold leading-tight text-reps-charcoal lg:text-[42px]">
              Find the right coach in four steps.
            </h2>
            <p className="mt-3 text-[15px] text-reps-muted-light">
              Every REPs professional clears the same bar — qualifications, insurance and CPD — so you start with a shortlist of people you can actually trust.
            </p>
          </div>
          <div className="relative mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.t} className="relative flex flex-col rounded-[18px] border border-reps-stone bg-reps-ivory p-6">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-muted-light">
                  Step 0{i + 1}
                </span>
                <span className="mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-reps-warm-white text-reps-orange">
                  <s.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 font-display text-[19px] font-bold text-reps-charcoal">{s.t}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-reps-muted-light">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ EXPLORE BY SPECIALISM ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[260px_1fr]">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Explore by</div>
              <h2 className="mt-1 font-display text-[34px] font-bold leading-tight text-reps-charcoal">Specialism</h2>
              <p className="mt-2 max-w-[220px] text-[14px] text-reps-muted-light">
                Find the right expert for your goals.
              </p>
              <Link
                to="/find-a-professional"
                className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-reps-stone bg-reps-warm-white px-4 py-2.5 text-[13px] font-medium text-reps-charcoal shadow-none transition-colors hover:bg-reps-ivory"
              >
                View all specialisms <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-4 lg:grid-cols-8">
              {specialisms.map((sp) => (
                <button
                  key={sp.label}
                  type="button"
                  className="group flex flex-col items-center gap-3 text-center transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white text-reps-charcoal transition-all group-hover:border-reps-orange/40 group-hover:text-reps-orange">
                    <sp.icon className="h-7 w-7" strokeWidth={1.6} />
                  </span>
                  <span className="text-[13px] font-medium text-reps-charcoal">{sp.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURED PROFESSIONALS ============ */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Hand-picked</span>
              <h2 className="mt-1 font-display text-[30px] font-bold leading-tight text-reps-charcoal lg:text-[34px]">
                Featured REPs Professionals
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/find-a-professional"
                className="text-[14px] font-medium text-reps-charcoal underline-offset-4 hover:underline"
              >
                View all
              </Link>
              <div className="hidden gap-2 sm:flex">
                <button type="button" aria-label="Previous" className="flex h-9 w-9 items-center justify-center rounded-full border border-reps-stone bg-reps-ivory text-reps-charcoal shadow-none transition-colors hover:bg-reps-warm-white">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Next" className="flex h-9 w-9 items-center justify-center rounded-full border border-reps-stone bg-reps-ivory text-reps-charcoal shadow-none transition-colors hover:bg-reps-warm-white">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
            {featuredPros.map((p) => (
              <Link
                key={p.name}
                to="/pro/$slug"
                params={{ slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }}
                className="group block w-[78%] shrink-0 snap-center overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel text-white shadow-[var(--reps-shadow-card)] transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img src={p.image} alt={`${p.name} — ${p.role}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-reps-panel via-reps-panel/70 to-transparent" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-reps-green/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
                    <BadgeCheck className="h-3 w-3" />
                    REPs Verified
                  </span>
                </div>
                <div className="space-y-2 px-4 pb-4 pt-3">
                  <div>
                    <h3 className="font-display text-[18px] font-bold leading-tight text-white">{p.name}</h3>
                    <div className="text-[13px] text-white/65">{p.role}</div>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[13px] ${p.online ? "text-reps-blue" : "text-white/65"}`}>
                    <MapPin className="h-3.5 w-3.5" />
                    {p.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] text-reps-orange">
                    <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
                    <span className="font-semibold text-white">{p.rating.toFixed(1)}</span>
                    <span className="text-white/55">({p.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 text-[12px] text-white/55">
                    <Laptop className="h-3.5 w-3.5" />
                    {p.mode}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ OUTCOMES (new emotional layer) ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[680px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Real results</span>
            <h2 className="mt-2 font-display text-[34px] font-bold leading-tight text-reps-charcoal lg:text-[42px]">
              Outcomes from people who train with REPs.
            </h2>
            <p className="mt-3 text-[15px] text-reps-muted-light">
              These aren't testimonials. They're outcomes — measured, dated and tied to a real coach.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {outcomes.map((o) => (
              <article key={o.name} className="overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={o.img} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-reps-ink/85 via-reps-ink/40 to-transparent p-4 text-white">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
                      {o.metric}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-[22px] font-bold leading-tight text-reps-charcoal">{o.headline}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-reps-charcoal/75">"{o.quote}"</p>
                  <div className="mt-5 flex items-center justify-between border-t border-reps-stone pt-4 text-[12px]">
                    <span className="font-semibold text-reps-charcoal">{o.name}</span>
                    <span className="text-reps-muted-light">with {o.coach}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY TRUST REPs ============ */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Why REPs</span>
              <h2 className="mt-2 font-display text-[34px] font-bold leading-tight text-reps-charcoal lg:text-[42px]">
                We set the bar every fitness professional should clear.
              </h2>
              <p className="mt-4 text-[15px] text-reps-muted-light">
                The fitness industry doesn't have a regulator. REPs is the closest thing it has — a global register of verified, insured, continuously-educated exercise professionals.
              </p>
              <Link
                to="/standards"
                className="mt-6 inline-flex items-center gap-2 rounded-[10px] border border-reps-charcoal/15 bg-transparent px-4 py-2.5 text-[13px] font-semibold text-reps-charcoal shadow-none transition-colors hover:bg-reps-ivory"
              >
                Read the REPs standard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {trustPillars.map((c) => (
                <article key={c.title} className="flex flex-col gap-3 rounded-[18px] border border-reps-stone bg-reps-ivory p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-reps-warm-white text-reps-orange">
                    <c.icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <h3 className="font-display text-[17px] font-bold text-reps-charcoal">{c.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-reps-muted-light">{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ EDITORIAL QUOTE ============ */}
      <section className="relative isolate overflow-hidden bg-reps-black text-white">
        <img src={heroCoaching.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-black/60 via-reps-ink/85 to-reps-black" />
        <div className="relative mx-auto max-w-[960px] px-6 py-24 text-center lg:px-10 lg:py-32">
          <Quote className="mx-auto h-8 w-8 text-reps-orange" />
          <p className="mt-6 font-display text-[28px] font-bold leading-tight text-white sm:text-[36px] lg:text-[44px]">
            "The world's register of verified fitness professionals — so you never have to guess who you're trusting your body with."
          </p>
          <p className="mt-6 text-[13px] uppercase tracking-[0.18em] text-white/55">REPs — Since 2009</p>
        </div>
      </section>

      {/* ============ PROFESSIONAL CTA BAND ============ */}
      <section className="bg-reps-ivory py-16 lg:py-20">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="relative isolate overflow-hidden rounded-[24px] bg-reps-ink text-white shadow-[var(--reps-shadow-card)]">
            <div className="relative w-full md:absolute md:inset-0">
              <img src={ctaTrainers} alt="" className="aspect-[4/3] w-full object-cover object-center md:aspect-auto md:h-full md:object-top lg:object-center" loading="lazy" />
              <div
                className="absolute inset-0 hidden md:block"
                style={{ backgroundImage: "linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(11,13,16,0.45) 60%, #0B0D10 88%)" }}
              />
              <div
                className="absolute inset-0 hidden lg:block"
                style={{ backgroundImage: "linear-gradient(to right, #0B0D10 0%, rgba(11,13,16,0.95) 25%, rgba(11,13,16,0.55) 38%, rgba(11,13,16,0) 50%)" }}
              />
            </div>
            <div className="relative px-6 py-10 md:min-h-[480px] md:px-10 md:py-12 lg:min-h-[440px] lg:px-14 lg:py-14">
              <div className="max-w-[520px]">
                <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                  <Sparkles className="h-3 w-3 fill-reps-orange" /> For professionals
                </span>
                <h2 className="mt-4 font-display text-[28px] font-bold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-[32px] lg:text-[38px]">
                  Are you a fitness professional?
                </h2>
                <p className="mt-3 max-w-[420px] text-[14.5px] leading-relaxed text-white/85">
                  Join 25,000+ verified pros. Get discovered, take bookings and run your practice — all in one place.
                </p>
                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {["Verified profile that ranks", "Stripe-powered bookings", "Clients, CRM & messaging", "CPD on rails"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[14px] text-white">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-reps-orange/70 text-reps-orange">
                        <Star className="h-3 w-3 fill-reps-orange" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to="/for-professionals"
                    className="inline-flex h-[48px] items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-dark"
                  >
                    Become a REPs Pro <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/pricing"
                    className="inline-flex h-[48px] items-center rounded-[10px] border border-white/30 px-6 text-[14.5px] font-semibold text-white shadow-none transition-colors hover:bg-white/10"
                  >
                    See plans
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CLOSER ============ */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10 lg:py-24">
          <h2 className="font-display text-[36px] font-bold leading-[0.98] tracking-[-0.02em] text-reps-charcoal sm:text-[48px] lg:text-[64px]">
            Find. Trust. Train.
            <br />
            <span className="text-reps-orange">Transform.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[520px] text-[15px] text-reps-muted-light">
            Whether you want to train or you're a coach who wants to grow — start with REPs.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/find-a-professional"
              className="inline-flex h-[52px] items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[15px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-dark"
            >
              Find a coach <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/for-professionals"
              className="inline-flex h-[52px] items-center rounded-[10px] border border-reps-charcoal/20 px-7 text-[15px] font-semibold text-reps-charcoal shadow-none transition-colors hover:bg-reps-ivory"
            >
              Become a pro
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
