import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Apple,
  Award,
  BadgeCheck,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Globe,
  Heart,
  Laptop,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  Target,
  
  Users,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroCoaching from "@/assets/hero-coaching-moment.jpg";
import ctaTrainers from "@/assets/cta-band.jpg";
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import proLaura from "@/assets/pro-laura.jpg";

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
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});





const stats = [
  { icon: Users, value: "25,000+", label: "Verified Professionals" },
  { icon: Star, value: "50,000+", label: "Client Reviews" },
  { icon: Globe, value: "120+", label: "Countries Worldwide" },
  { icon: Calendar, value: "1M+", label: "Sessions Booked" },
  { icon: ShieldCheck, value: "100%", label: "REPs Verified" },
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
  {
    name: "James Carter",
    role: "Personal Trainer",
    location: "London, UK",
    rating: 5.0,
    reviews: 128,
    mode: "In-person & Online",
    image: proJames,
  },
  {
    name: "Sophie Williams",
    role: "Pilates Instructor",
    location: "Manchester, UK",
    rating: 5.0,
    reviews: 96,
    mode: "In-person & Online",
    image: proSophie,
  },
  {
    name: "Daniel Roberts",
    role: "Strength Coach",
    location: "Birmingham, UK",
    rating: 4.9,
    reviews: 74,
    mode: "In-person",
    image: proDaniel,
  },
  {
    name: "Laura Mitchell",
    role: "Nutritionist",
    location: "Online",
    rating: 5.0,
    reviews: 112,
    mode: "Online",
    image: proLaura,
    online: true,
  },
];

const popularSearches = [
  "Personal Trainer",
  "Pilates Instructor",
  "Nutritionist",
  "Strength Coach",
  "Pre & Postnatal",
  "Online Coaching",
];

function HomePage() {
  return (
    <div className="min-h-screen bg-reps-ivory">
      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden bg-reps-ink text-white">
        {/* Mobile: full-bleed image with bottom ramp for legibility */}
        <div className="absolute inset-0 -z-10 lg:hidden">
          <img
            src={heroCoaching}
            alt=""
            className="h-full w-full object-cover [object-position:60%_center]"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, rgba(11,13,16,0.65) 0%, rgba(11,13,16,0.45) 35%, rgba(11,13,16,0.92) 80%, #0B0D10 100%)",
            }}
          />
        </div>

        {/* Desktop: editorial portrait pinned to the right half */}
        <div className="absolute inset-y-0 right-0 -z-10 hidden w-[58%] lg:block xl:w-[55%]">
          <img
            src={heroCoaching}
            alt=""
            className="h-full w-full object-cover [object-position:50%_center]"
          />
          {/* Soft left feather so the portrait dissolves into the dark canvas */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, #0B0D10 0%, rgba(11,13,16,0.85) 18%, rgba(11,13,16,0.15) 42%, rgba(11,13,16,0) 60%)",
            }}
          />
          {/* Bottom seam to ink so it never bleeds into the ivory stats strip */}
          <div className="absolute inset-x-0 bottom-0 h-[160px] bg-gradient-to-t from-reps-ink to-transparent" />
        </div>

        <PublicHeader variant="transparent" />

        <div className="mx-auto max-w-[1320px] px-6 pb-20 pt-[140px] lg:px-10 lg:pb-28 lg:pt-[160px]">
          <div className="max-w-[680px]">
            <h1 className="font-display text-[52px] font-bold leading-[0.98] tracking-[-0.02em] text-white sm:text-[64px] lg:text-[72px]">
              Find. Trust. Train.
              <br />
              Transform.
            </h1>

            <p className="mt-5 max-w-[520px] text-[17px] leading-relaxed text-white/80">
              The world's register of verified fitness professionals. Real qualifications, real
              reviews, real results.
            </p>

            {/* Hero search bar */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-8 flex flex-col gap-2 rounded-[22px] border border-white/10 bg-reps-ink/70 p-2 backdrop-blur-md sm:flex-row sm:items-stretch sm:gap-0 sm:p-1.5"
            >
              <label className="group flex flex-1 items-center gap-3 rounded-[16px] px-4 py-3 transition-colors focus-within:bg-white/5">
                <Search className="h-4 w-4 shrink-0 text-reps-orange" aria-hidden />
                <input
                  type="text"
                  placeholder="Try 'pilates near me' or 'strength coach London'"
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
                className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-[12px] bg-reps-orange px-6 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Search className="h-4 w-4" aria-hidden />
                Find my coach
              </button>
            </form>

            {/* Popular searches — single row on lg+ */}
            <div className="mt-6 flex flex-wrap gap-2 lg:flex-nowrap">
              {popularSearches.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-[13px] font-medium text-white/85 transition-colors hover:border-reps-orange-border hover:bg-[rgba(255,122,0,0.08)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Four-pillar trust strip — contained chip, 2x2 on mobile, single row on lg+ */}
            <div className="mt-7 sm:mt-8 inline-flex max-w-full rounded-[16px] border border-white/10 bg-reps-ink/55 px-4 py-3 backdrop-blur-md lg:rounded-full lg:px-5 lg:py-2.5">
              <div className="grid w-full grid-cols-2 gap-x-5 gap-y-2 text-[12.5px] text-white/85 lg:flex lg:items-center lg:gap-5 lg:text-[13px]">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 shrink-0 fill-reps-orange text-reps-orange" aria-hidden />
                  <span><strong className="font-semibold text-white">4.9</strong> average rating</span>
                </div>
                <span aria-hidden className="hidden h-3 w-px bg-white/15 lg:block" />
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 shrink-0 text-reps-gold" aria-hidden />
                  <span><strong className="font-semibold text-white">25,000+</strong> verified pros</span>
                </div>
                <span aria-hidden className="hidden h-3 w-px bg-white/15 lg:block" />
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
                  <span><strong className="font-semibold text-white">120+</strong> countries</span>
                </div>
                <span aria-hidden className="hidden h-3 w-px bg-white/15 lg:block" />
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-reps-green" aria-hidden />
                  <span>Qualifications &amp; insurance checked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ============ STATS STRIP ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-6 lg:px-10">
          <div className="grid grid-cols-2 gap-4 rounded-[22px] border border-reps-stone bg-reps-warm-white p-4 sm:grid-cols-3 lg:grid-cols-5 lg:p-5">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-reps-ivory text-reps-charcoal">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-display text-[24px] font-bold leading-none text-reps-charcoal">
                    {s.value}
                  </div>
                  <div className="mt-1 text-[13px] text-reps-muted-light">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ EXPLORE BY SPECIALISM ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-[260px_1fr]">
            <div>
              <div className="text-[13px] font-medium uppercase tracking-wider text-reps-muted-light">
                Explore by
              </div>
              <h2 className="mt-1 font-display text-[34px] font-bold leading-tight text-reps-charcoal">
                Specialism
              </h2>
              <p className="mt-2 max-w-[220px] text-[14px] text-reps-muted-light">
                Find the right expert
                <br />
                for your goals
              </p>
              <button
                type="button"
                className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-reps-stone bg-reps-warm-white px-4 py-2.5 text-[13px] font-medium text-reps-charcoal transition-colors hover:bg-reps-ivory"
              >
                View all specialisms
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {specialisms.map((sp) => (
                <button
                  key={sp.label}
                  type="button"
                  className="group flex flex-col items-center gap-3 text-center"
                >
                  <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white text-reps-charcoal transition-all group-hover:border-reps-charcoal/30 group-hover:shadow-sm">
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
      <section className="bg-reps-ivory pb-14">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[28px] font-bold leading-tight text-reps-charcoal lg:text-[32px]">
              Featured REPs Professionals
            </h2>
            <div className="flex items-center gap-4">
              <Link
                to="/find-a-professional"
                className="text-[14px] font-medium text-reps-charcoal underline-offset-4 hover:underline"
              >
                View all professionals
              </Link>
              <div className="hidden gap-2 sm:flex">
                <button
                  type="button"
                  aria-label="Previous"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white text-reps-charcoal transition-colors hover:bg-reps-ivory"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-reps-stone bg-reps-warm-white text-reps-charcoal transition-colors hover:bg-reps-ivory"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredPros.map((p) => (
              <Link
                key={p.name}
                to="/pro/$slug"
                params={{ slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }}
                className="group block overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel text-white shadow-[var(--reps-shadow-card)] transition-transform hover:-translate-y-0.5"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={p.image}
                    alt={`${p.name} — ${p.role}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    width={512}
                    height={640}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-reps-panel via-reps-panel/70 to-transparent" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-reps-green/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-reps-green ring-1 ring-reps-green/30">
                    <BadgeCheck className="h-3 w-3" />
                    REPs Verified
                  </span>
                </div>
                <div className="space-y-2 px-4 pb-4 pt-3">
                  <div>
                    <h3 className="font-display text-[18px] font-bold leading-tight text-white">
                      {p.name}
                    </h3>
                    <div className="text-[13px] text-white/65">{p.role}</div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-[13px] ${p.online ? "text-reps-blue" : "text-white/65"}`}
                  >
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

      {/* ============ HOW REPs WORKS ============ */}
      <section className="bg-reps-warm-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="text-center">
            <h2 className="font-display text-[30px] font-bold leading-tight text-reps-charcoal lg:text-[34px]">
              How REPs works
            </h2>
            <p className="mt-2 text-[15px] text-reps-muted-light">
              Finding the right professional is simple
            </p>
          </div>

          <div className="relative mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Search, title: "Search", body: "Tell us what you need and where" },
              {
                icon: ShieldCheck,
                title: "Verify",
                body: "We check qualifications, insurance & standards",
              },
              {
                icon: Users,
                title: "Connect",
                body: "Review profiles, read reviews and connect",
              },
              { icon: Target, title: "Achieve", body: "Train, improve and reach your goals" },
            ].map((step, i, arr) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-reps-stone bg-reps-ivory text-reps-charcoal">
                  <step.icon className="h-7 w-7" strokeWidth={1.6} />
                </span>
                <h3 className="mt-5 font-display text-[18px] font-bold text-reps-charcoal">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[200px] text-[13px] leading-relaxed text-reps-muted-light">
                  {step.body}
                </p>
                {i < arr.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute left-[calc(50%+50px)] top-[36px] hidden h-px w-[calc(100%-100px)] border-t border-dashed border-reps-stone lg:block"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY TRUST REPs ============ */}
      <section className="bg-reps-ivory">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="text-center">
            <h2 className="font-display text-[30px] font-bold leading-tight text-reps-charcoal lg:text-[34px]">
              Why trust REPs?
            </h2>
            <p className="mt-2 text-[15px] text-reps-muted-light">
              We set the standard for fitness professionals
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "Verified Professionals",
                body: "All REPs are qualified, insured and verified.",
              },
              {
                icon: Award,
                title: "Standards & CPD",
                body: "Ongoing education to keep skills and knowledge up to date.",
              },
              {
                icon: MessageCircle,
                title: "Client Reviews",
                body: "Real feedback from real clients you can trust.",
              },
              {
                icon: Globe,
                title: "Global Community",
                body: "A worldwide network committed to excellence in fitness.",
              },
            ].map((c) => (
              <article
                key={c.title}
                className="flex flex-col gap-3 rounded-[18px] border border-reps-stone bg-reps-warm-white p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-reps-stone text-reps-charcoal">
                  <c.icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <h3 className="font-display text-[17px] font-bold text-reps-charcoal">
                  {c.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-reps-muted-light">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PROFESSIONAL CTA ============ */}
      <section className="bg-reps-ivory pb-20">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="relative isolate overflow-hidden rounded-[24px] bg-reps-ink text-white shadow-[var(--reps-shadow-card)]">
            {/* Background image: inline on mobile, absolutely positioned ≥md */}
            <div className="relative w-full md:absolute md:inset-0">
              <img
                src={ctaTrainers}
                alt=""
                className="aspect-[4/3] w-full object-cover object-center md:aspect-auto md:h-full md:object-top lg:object-center"
                loading="lazy"
              />
              {/* Shaped overlay: only covers the copy area, leaves trainers clear.
                  Mobile: image stacks above solid ink panel — no overlay needed.
                  Tablet: bottom-weighted ramp (trainers top, copy bottom).
                  Desktop: left-weighted ramp (copy left, trainers right). */}
              <div
                className="absolute inset-0 hidden md:block"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(11,13,16,0.45) 60%, #0B0D10 88%)",
                }}
              />
              <div
                className="absolute inset-0 hidden lg:block"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #0B0D10 0%, rgba(11,13,16,0.95) 25%, rgba(11,13,16,0.55) 38%, rgba(11,13,16,0) 50%)",
                }}
              />
            </div>

            {/* Foreground copy */}
            <div className="relative px-6 py-8 md:min-h-[480px] md:px-10 md:py-12 lg:min-h-[440px] lg:px-14 lg:py-14">
              <div className="max-w-[520px]">
                <h2 className="font-display text-[26px] font-bold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-[28px] lg:text-[34px]">
                  Are you a fitness professional?
                </h2>
                <p className="mt-3 max-w-[420px] text-[14.5px] leading-relaxed text-white/85">
                  Join REPs and connect with clients who are looking for professionals they can
                  trust.
                </p>

                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                  {[
                    "Get verified and stand out",
                    "Build trust with client reviews",
                    "Grow your professional reputation",
                    "Access resources & CPD",
                    "Be part of a global community",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[14px] text-white">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-reps-orange/70 text-reps-orange">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className="mt-7 inline-flex h-[48px] items-center justify-center rounded-[10px] bg-reps-orange px-6 text-[14.5px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
                >
                  Join REPs today
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

