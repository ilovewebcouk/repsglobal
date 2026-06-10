import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Briefcase, Sparkles, Users } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { FeaturedProCard, type FeaturedPro } from "@/components/public/FeaturedProCard";
import { HeroOverlay } from "@/components/marketing/HeroOverlay";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { BlockHeading } from "@/components/marketing/BlockHeading";
import { FinalCta } from "@/components/marketing/FinalCta";

import heroAsset from "@/assets/about/about-hero.jpg.asset.json";
import heritageAsset from "@/assets/about/about-heritage.jpg.asset.json";
import professionalsAsset from "@/assets/about/about-professionals.jpg.asset.json";
import independenceAsset from "@/assets/about/about-independence.jpg.asset.json";

import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About REPs — The professional platform for the modern fitness industry" },
      {
        name: "description",
        content:
          "REPs is building a new professional home for fitness professionals — combining public trust, professional visibility, education, reviews and business software in one connected platform.",
      },
      { property: "og:title", content: "About REPs" },
      {
        property: "og:description",
        content: "The professional platform for the modern fitness industry.",
      },
      { property: "og:image", content: heroAsset.url },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

/* ---------------------------------------------------------------- */
/* Static content                                                    */
/* ---------------------------------------------------------------- */

const STATS = [
  { v: "25,000+", k: "Verified professionals" },
  { v: "1M+", k: "Sessions booked" },
  { v: "120+", k: "Countries" },
  { v: "4.8★", k: "Average client rating" },
];

const PILLARS: Array<{ label: string; body: string; to: string }> = [
  {
    label: "Visibility",
    body: "Get found and trusted — a verified profile that shows your full picture.",
    to: "/features/visibility",
  },
  {
    label: "Shop Front",
    body: "A client-facing page that presents your services with clarity.",
    to: "/features/shop-front",
  },
  {
    label: "Operations",
    body: "Enquiries, bookings, forms, payments and admin in one place.",
    to: "/features/operations",
  },
  {
    label: "Coaching",
    body: "Programmes, nutrition, check-ins and progress tracking for real client work.",
    to: "/features/coaching",
  },
  {
    label: "REPs AI",
    body: "Surfaces what needs attention before it becomes a problem.",
    to: "/features/ai",
  },
  {
    label: "Growth",
    body: "Reviews, retention, reactivation and business performance.",
    to: "/features/growth",
  },
];

const FEATURED_PROS: FeaturedPro[] = [
  {
    name: "James Wilson",
    role: "Personal Trainer",
    city: "Shoreditch",
    rating: 5.0,
    reviews: 128,
    mode: "In-person & Online",
    tags: ["Strength", "Fat Loss", "Hypertrophy"],
    image: proJames,
  },
  {
    name: "Sophie Taylor",
    role: "Pilates Instructor",
    city: "Clapham",
    rating: 5.0,
    reviews: 96,
    mode: "In-person & Online",
    tags: ["Reformer", "Posture", "Pre & Postnatal"],
    image: proSophie,
  },
  {
    name: "Liam Roberts",
    role: "Strength Coach",
    city: "Hackney",
    rating: 4.9,
    reviews: 74,
    mode: "In-person",
    tags: ["Powerlifting", "Hypertrophy"],
    image: proDaniel,
  },
];

/* ---------------------------------------------------------------- */
/* Page                                                              */
/* ---------------------------------------------------------------- */

function AboutPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* 1. Cinematic hero ----------------------------------------- */}
      <section className="relative overflow-hidden">
        <img
          src={heroAsset.url}
          alt="A REPs-registered coach mid-cue inside a sunlit warehouse training floor."
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <HeroOverlay copySide="left" />
        <div className="relative mx-auto flex max-w-[1320px] flex-col items-start px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-24">
          <div className="max-w-[640px]">
            <MarketingHeroEyebrow icon={Sparkles}>About REPs</MarketingHeroEyebrow>
            <h1
              className="mt-5 font-display text-[44px] font-bold leading-[1.05] text-white animate-fade-in lg:text-[64px]"
              style={{ animationDelay: "80ms", animationDuration: "640ms" }}
            >
              The professional platform for the modern fitness industry.
            </h1>
            <p
              className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-white/80 animate-fade-in"
              style={{ animationDelay: "180ms", animationDuration: "560ms" }}
            >
              A new professional home for fitness professionals — combining public trust, visibility,
              education, reviews and business software in one connected platform.
            </p>
            <div
              className="mt-8 flex flex-wrap gap-3 animate-fade-in"
              style={{ animationDelay: "260ms", animationDuration: "560ms" }}
            >
              <Link
                to="/find-a-professional"
                className="inline-flex h-12 items-center rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Find a professional
              </Link>
              <Link
                to="/for-professionals"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
              >
                Join as a professional
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stat band (tight under hero) --------------------------- */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 pt-10 pb-16 lg:px-10 lg:pt-12 lg:pb-20">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-reps-border bg-reps-border lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.k} className="bg-reps-panel px-6 py-8 text-center">
                <div className="font-display text-[32px] font-bold leading-none text-white lg:text-[40px]">
                  {s.v}
                </div>
                <div className="mt-3 text-[12px] uppercase tracking-[0.14em] text-white/55 lg:tracking-[0.18em]">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Manifesto moment --------------------------------------- */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionEyebrow>Why REPs exists</SectionEyebrow>
          <div className="mt-6 space-y-4 font-display text-[32px] font-bold leading-[1.15] text-white lg:text-[52px] lg:leading-[1.1]">
            <p className="animate-fade-in" style={{ animationDelay: "0ms", animationDuration: "640ms" }}>
              The fitness industry has changed.
            </p>
            <p className="text-white/70 animate-fade-in" style={{ animationDelay: "120ms", animationDuration: "640ms" }}>
              Clients search, compare, read reviews and expect a clear route to enquire and start.
            </p>
            <p className="text-white/70 animate-fade-in" style={{ animationDelay: "240ms", animationDuration: "640ms" }}>
              Professionals juggle profiles, payments, bookings, programmes, check-ins and content
              across too many disconnected tools.
            </p>
            <p className="animate-fade-in" style={{ animationDelay: "360ms", animationDuration: "640ms" }}>
              REPs exists to bring that professional journey{" "}
              <span className="text-reps-orange">into one place.</span>
            </p>
          </div>
        </div>
      </section>

      {/* 4. A new kind of professional register -------------------- */}
      <section>
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-10 lg:py-28">
          <div>
            <SectionEyebrow>A new kind of register</SectionEyebrow>
            <SectionHeading className="mt-3">
              Heritage in the name. Modern in everything else.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
              The REPs name has long been associated with professional registration, standards and
              recognition in the fitness sector. Today, REPs is being rebuilt for the modern fitness
              industry.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              That means moving beyond a static register and creating a platform that reflects how
              fitness professionals actually work now: online and in person, independently and in
              teams, through coaching programmes, specialist services, public profiles and
              professional development.
            </p>
          </div>
          <div className="relative overflow-hidden">
            <div className="relative overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
              <img
                src={heritageAsset.url}
                alt="A REPs-registered trainer pauses on a wet dawn street after a hill session."
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_90%,rgba(255,122,0,0.20),transparent_70%)] blur-2xl"
            />
          </div>
        </div>
      </section>

      {/* 5. Built around trust — real proof ------------------------ */}
      <section className="bg-reps-panel/30">
        <div className="mx-auto grid max-w-[1320px] gap-12 px-6 py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:px-10 lg:py-28">
          <div>
            <SectionEyebrow>Built around trust</SectionEyebrow>
            <SectionHeading className="mt-3">
              A profile that proves more than a name.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
              A professional profile should do more than say someone is a trainer. It should help the
              public understand who they are, what they're qualified to do, what services they
              provide and why they may be suitable.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              REPs profiles support clearer professional presentation through qualifications,
              insurance status, CPD, reviews, specialist areas, service information and public
              contact routes.
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-white/55">
              The goal is simple: make it easier for clients to make informed decisions, and easier
              for professionals to prove their credibility.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3">
            {FEATURED_PROS.map((pro) => (
              <FeaturedProCard key={pro.name} pro={pro} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. More than a directory. More than software. ------------- */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[820px] text-center">
            <SectionEyebrow>What REPs is</SectionEyebrow>
            <SectionHeading className="mt-3">
              More than a directory. More than software.
            </SectionHeading>
          </div>
          <div className="mt-12 grid overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/30 lg:grid-cols-2">
            <div className="relative p-8 lg:p-12">
              <div className="flex items-center gap-3">
                <span className="font-display text-[13px] font-bold tracking-[0.18em] text-reps-orange">01</span>
                <span className="h-px flex-1 bg-reps-border" />
                <Users className="h-5 w-5 text-reps-orange" strokeWidth={1.75} />
              </div>
              <BlockHeading className="mt-5">For the public.</BlockHeading>
              <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
                A clearer way to find and compare qualified fitness professionals. Browse profiles,
                read honest reviews, understand services and take the next step with more confidence
                — wherever you train.
              </p>
            </div>
            <div className="relative border-t border-reps-border p-8 lg:border-l lg:border-t-0 lg:p-12">
              <div className="flex items-center gap-3">
                <span className="font-display text-[13px] font-bold tracking-[0.18em] text-reps-orange">02</span>
                <span className="h-px flex-1 bg-reps-border" />
                <Briefcase className="h-5 w-5 text-reps-orange" strokeWidth={1.75} />
              </div>
              <BlockHeading className="mt-5">For professionals.</BlockHeading>
              <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
                The infrastructure to build a credible profile, showcase services, collect reviews,
                manage enquiries, deliver coaching and grow a stronger business — in one connected
                platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Built for fitness professionals — zigzag --------------- */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:px-10 lg:py-28">
          <div className="order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
              <img
                src={professionalsAsset.url}
                alt="An online coach reviewing a client plan from a home studio."
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          {/* spacer kept for grid balance */}
          <div className="order-1 lg:order-2">
            <SectionEyebrow>Built for fitness professionals</SectionEyebrow>
            <SectionHeading className="mt-3">
              The system behind the listing.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
              REPs supports the people building real careers in fitness — personal trainers, gym
              instructors, online coaches, strength coaches, Pilates instructors, yoga teachers,
              specialist coaches, studio owners and education providers.
            </p>
            <ul className="mt-8 divide-y divide-reps-border border-y border-reps-border">
              {PILLARS.map((p) => (
                <li key={p.label}>
                  <Link
                    to={p.to}
                    className="group relative flex items-center gap-6 py-5 pl-4 transition-colors hover:bg-reps-panel/40 before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-reps-orange before:opacity-0 before:transition-opacity group-hover:before:opacity-100"
                  >
                    <span className="font-display text-[18px] font-bold text-white lg:text-[22px]">
                      {p.label}
                    </span>
                    <span className="flex-1 text-[13.5px] leading-snug text-white/55">
                      {p.body}
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-reps-orange" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 8. Built for independence --------------------------------- */}
      <section>
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-10 lg:py-28">
          <div>
            <SectionEyebrow>Built for independence</SectionEyebrow>
            <SectionHeading className="mt-3">
              A stronger foundation for independent operators.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
              Many fitness professionals are independent operators. They aren't backed by a head
              office, an admin team, a marketing department or a software budget.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              REPs is being built to give those professionals a stronger foundation: a public
              profile, a Shop Front, a place to manage enquiries, a system for bookings, payments
              and onboarding, tools for coaching delivery, and support for reviews, referrals, CPD
              and growth.
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-white/55">
              Look more credible. Operate more clearly. Build a business with more control.
            </p>
          </div>
          <div className="relative overflow-hidden">
            <div className="relative overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
              <img
                src={independenceAsset.url}
                alt="An independent personal trainer leaving a studio at dawn with a kit bag."
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_55%_at_50%_85%,rgba(255,122,0,0.18),transparent_70%)] blur-2xl"
            />
          </div>
        </div>
      </section>

      {/* 9. The future of REPs — horizon band ---------------------- */}
      <section className="relative overflow-hidden bg-reps-ink">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_120%,rgba(255,122,0,0.18),transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-reps-border to-transparent"
        />
        <div className="relative mx-auto max-w-[1100px] px-6 py-24 text-center lg:px-10 lg:py-32">
          <SectionEyebrow>The future of REPs</SectionEyebrow>
          <h2 className="mt-6 font-display text-[34px] font-bold leading-[1.15] text-white lg:text-[56px] lg:leading-[1.1]">
            A trusted public platform for clients.
            <br />
            A professional operating system for fitness professionals.
            <br />
            <span className="relative inline-block text-white">
              A{" "}
              <span className="relative">
                <span className="relative z-10">stronger ecosystem</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 z-0 h-[6px] rounded-full bg-reps-orange/70 lg:h-[10px]"
                />
              </span>{" "}
              for the industry.
            </span>
          </h2>
          <p className="mx-auto mt-8 max-w-[560px] text-[15.5px] leading-relaxed text-white/55">
            REPs is not trying to recreate the past — it's building the next version of professional
            infrastructure for the fitness industry.
          </p>
        </div>
      </section>

      {/* 10. Final CTA --------------------------------------------- */}
      <FinalCta
        eyebrow={null}
        heading="Build your professional presence with"
        headingAccent="REPs."
        lede="Whether you're looking for a trusted fitness professional or building your own career in fitness, REPs is designed to make the professional journey clearer."
        primary={{ to: "/for-professionals", label: "Join as a professional" }}
        secondary={{ to: "/find-a-professional", label: "Find a professional" }}
      />

      <PublicFooter />
    </div>
  );
}
