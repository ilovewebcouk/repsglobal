import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Eye,
  Filter,
  Inbox,
  LineChart,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BrowserFrame } from "@/components/mockups/BrowserFrame";
import { MockupStage } from "@/components/marketing/MockupStage";

import { HeroHeading } from "@/components/marketing/HeroHeading";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { BlockHeading } from "@/components/marketing/BlockHeading";
import { FinalCta } from "@/components/marketing/FinalCta";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";

import { ProfileMockup, LeadsMockup } from "@/components/mockups/PlatformMockups";

import heroVisibility from "@/assets/hero-visibility-bg.jpg.asset.json";

export const Route = createFileRoute("/features/visibility")({
  head: () => ({
    meta: [
      { title: "Visibility for Fitness Professionals | REPs" },
      {
        name: "description",
        content:
          "Build a verified public profile, appear in REPs search, show credentials and reviews, and turn profile views into client enquiries.",
      },
      { property: "og:title", content: "Visibility for Fitness Professionals | REPs" },
      {
        property: "og:description",
        content:
          "Be found. Be trusted. Be booked. A verified REPs profile, search visibility, reviews and enquiry capture in one place.",
      },
      { property: "og:image", content: heroVisibility.url },
      { property: "og:url", content: "https://staging.repsuk.org/features/visibility" },
    ],
    links: [{ rel: "canonical", href: "https://staging.repsuk.org/features/visibility" }],
  }),
  component: VisibilityPillarPage,
});

/* ============================================================
   Page
   ============================================================ */

function VisibilityPillarPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />
      <Hero />
      <OutcomeCards />
      <ProfileTrustLayer />
      <DirectoryDiscovery />
      <ReviewsAndTrust />
      <ProfileOptimisation />
      <EnquiriesHandover />
      <VisibilityAnalytics />
      <ConnectingSections />
      <MarketingFaq
        heading="Visibility, in plain language."
        items={FAQ_ITEMS}
      />
      <FinalCta
        eyebrow={{ icon: Sparkles, label: "Be found. Be trusted. Be booked." }}
        heading="Build a profile clients can trust."
        lede="Join REPs to create a verified professional presence and connect your public profile to the platform that runs your business."
        primary={{ to: "/signup", label: "Join REPs" }}
        secondary={{ to: "/pricing", label: "See pricing" }}
      />
      <PublicFooter />
    </div>
  );
}

/* ============================================================
   1. Hero
   ============================================================ */

function Hero() {
  return (
    <section className="relative flex overflow-hidden min-h-[640px] lg:min-h-[820px]">
      <img
        src={heroVisibility.url}
        alt="Verified REPs trainer standing outside a premium boutique studio at dusk"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover object-center lg:object-right"
      />
      <div className="absolute inset-0 bg-reps-ink/55 lg:bg-reps-ink/30" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(95%_75%_at_50%_45%,rgba(10,10,12,0.62),transparent_75%)] lg:bg-[radial-gradient(60%_90%_at_18%_55%,rgba(10,10,12,0.82),transparent_72%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(60%_50%_at_50%_15%,rgba(255,122,0,0.14),transparent_72%)] lg:bg-[radial-gradient(40%_45%_at_15%_20%,rgba(255,122,0,0.12),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-reps-ink/65 to-reps-ink lg:h-56 lg:via-reps-ink/70"
      />

      <div className="relative mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-12 px-6 pt-24 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-10 lg:pt-28 lg:pb-24">
        <div className="max-w-[640px]">
          <span
            className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-reps-border bg-reps-panel/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur"
            style={{ animationDuration: "560ms", animationFillMode: "both" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Visibility
          </span>
          <HeroHeading
            className="mt-6 animate-fade-in"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            Get found by clients who are{" "}
            <span className="text-reps-orange">ready to choose</span> a fitness
            professional.
          </HeroHeading>
          <p
            className="mt-6 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/75"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            REPs gives you a verified public profile, search visibility, reviews,
            credentials and enquiry tools so clients can understand who you are,
            what you offer and why they can trust you.
          </p>
          <div
            className="mt-8 flex animate-fade-in flex-wrap gap-3"
            style={{ animationDuration: "640ms", animationDelay: "260ms", animationFillMode: "both" }}
          >
            <Link
              to="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Join REPs <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              See pricing
            </Link>
          </div>
          <ul
            className="mt-7 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70"
            style={{ animationDuration: "640ms", animationDelay: "340ms", animationFillMode: "both" }}
          >
            <li className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-reps-orange" /> Verified credentials
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-reps-orange" /> Public search presence
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Inbox className="h-4 w-4 text-reps-orange" /> Enquiries you can act on
            </li>
          </ul>
        </div>

        <div className="hidden lg:block">
          <VisibilityHeroMockup />
        </div>
      </div>
    </section>
  );
}

/* Hero mock-up: search + result cards + selected profile preview */
function VisibilityHeroMockup() {
  return (
    <div className="relative">
      <MockupStage variant="laptop">
        <BrowserFrame url="repsuk.org/find">
          <div className="bg-reps-ink p-4">
            {/* Search bar */}
            <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel/60 p-2">
              <div className="flex flex-1 items-center gap-2 rounded-[10px] bg-reps-ink/60 px-3 py-2">
                <Search className="h-4 w-4 text-white/55" />
                <span className="text-[13px] text-white/85">Personal trainer</span>
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-[10px] bg-reps-ink/60 px-3 py-2">
                <MapPin className="h-4 w-4 text-white/55" />
                <span className="text-[13px] text-white/85">Manchester · 3 mi</span>
              </div>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Verified only", "In-person", "Strength", "1:1"].map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-full border border-reps-border bg-reps-panel/50 px-2.5 py-1 text-[11px] text-white/70"
                >
                  <Filter className="h-3 w-3" /> {f}
                </span>
              ))}
            </div>

            {/* Result cards */}
            <div className="mt-3 grid gap-2">
              {[
                { name: "James Carter", spec: "Strength · 1:1", rating: "4.9", city: "Manchester · 1.2 mi" },
                { name: "Sophie Lin", spec: "Online · Hybrid", rating: "4.8", city: "Manchester · 2.0 mi" },
              ].map((p, i) => (
                <div
                  key={p.name}
                  className={
                    "flex items-center gap-3 rounded-[18px] border p-3 " +
                    (i === 0
                      ? "border-reps-orange-border bg-reps-orange-soft/40"
                      : "border-reps-border bg-reps-panel/60")
                  }
                >
                  <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-reps-orange-soft to-reps-panel" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13.5px] font-semibold text-white">{p.name}</span>
                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-white/65">
                      <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                      {p.rating} · {p.spec}
                    </div>
                    <div className="mt-0.5 text-[11px] text-white/55">{p.city}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-[10px] border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/85">
                    View <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              ))}
            </div>

            {/* Selected profile preview */}
            <div className="mt-3 rounded-[18px] border border-reps-border bg-reps-panel p-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-reps-orange to-reps-orange-pressed" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-semibold text-white">James Carter</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  </div>
                  <div className="text-[11.5px] text-white/65">Personal Trainer · Manchester</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Strength", "Fat loss", "Hybrid coaching"].map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] text-white/75"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[12.5px] font-semibold text-white shadow-none"
              >
                Enquire <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </BrowserFrame>
      </MockupStage>
    </div>
  );
}

/* ============================================================
   2. Outcome cards
   ============================================================ */

const OUTCOMES = [
  {
    icon: BadgeCheck,
    title: "Public REPs profile",
    body:
      "A professional profile that shows who you are, where you work, what you offer and how clients can contact you.",
  },
  {
    icon: Sparkles,
    title: "Verified trust signals",
    body:
      "Show verification status, credentials, insurance and CPD signals where clients are making their decision.",
  },
  {
    icon: Star,
    title: "Reviews on the public record",
    body:
      "Collect and display client reviews that build confidence before a prospect gets in touch.",
  },
  {
    icon: Search,
    title: "Search by location and specialism",
    body:
      "Appear in searches by profession, location, training type, goal and specialist area.",
  },
  {
    icon: Inbox,
    title: "Enquiry capture",
    body:
      "Turn profile visitors into leads through clear calls to action and structured enquiry routes.",
  },
] as const;

function OutcomeCards() {
  return (
    <section className="border-t border-reps-border/60">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[720px]">
          <SectionEyebrow>What clients see</SectionEyebrow>
          <SectionHeading className="mt-3">
            Everything clients need to trust you before they enquire.
          </SectionHeading>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.map((o) => (
            <div
              key={o.title}
              className="flex flex-col rounded-[18px] border border-reps-border bg-reps-panel p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <o.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-[17px] font-bold text-white">
                {o.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">
                {o.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   3. Profile trust layer (50/50)
   ============================================================ */

function ProfileTrustLayer() {
  return (
    <section className="border-t border-reps-border/60 bg-reps-panel/15">
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-10 lg:py-28">
        <div>
          <SectionEyebrow>Your profile</SectionEyebrow>
          <BlockHeading as="h2" className="mt-3">
            Your profile becomes your trust layer.
          </BlockHeading>
          <p className="mt-4 max-w-[520px] text-[15.5px] leading-relaxed text-white/70">
            Your REPs profile should do more than list your name. It should show
            clients your professional status, your qualifications, your services,
            your reviews and the next step to work with you.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Verified profile status",
              "Qualifications and professional details",
              "Services and specialist areas",
              "Reviews and ratings",
              "Clear enquiry CTA",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[14.5px] text-white/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" /> {b}
              </li>
            ))}
          </ul>
        </div>
        <MockupStage variant="laptop">
          <BrowserFrame url="repsuk.org/pro/james-carter">
            <ProfileMockup />
          </BrowserFrame>
        </MockupStage>
      </div>
    </section>
  );
}

/* ============================================================
   4. Directory discovery (50/50)
   ============================================================ */

function DirectoryDiscovery() {
  return (
    <section className="border-t border-reps-border/60">
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10 lg:py-28">
        <MockupStage variant="laptop">
          <BrowserFrame url="repsuk.org/find">
            <DirectorySearchMockup />
          </BrowserFrame>
        </MockupStage>
        <div>
          <SectionEyebrow>Discovery</SectionEyebrow>
          <BlockHeading as="h2" className="mt-3">
            Be visible where clients are already searching.
          </BlockHeading>
          <p className="mt-4 max-w-[520px] text-[15.5px] leading-relaxed text-white/70">
            REPs connects public search intent with professional profiles. Clients
            can search by location, profession, coaching type, goal and trust
            signals, then compare professionals before making contact.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Profession-based search",
              "Location and postcode search",
              "Online, in-person and hybrid filtering",
              "Specialist area filtering",
              "Verified profile filtering",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[14.5px] text-white/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" /> {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function DirectorySearchMockup() {
  return (
    <div className="space-y-4 bg-reps-ink p-5">
      <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr_auto]">
        <div className="flex items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel/60 px-3 py-2.5">
          <Search className="h-4 w-4 text-white/55" />
          <span className="text-[13px] text-white/85">Personal trainer</span>
        </div>
        <div className="flex items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel/60 px-3 py-2.5">
          <MapPin className="h-4 w-4 text-white/55" />
          <span className="text-[13px] text-white/85">Manchester · M1</span>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none"
        >
          Search
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["Verified only", "Online", "In-person", "Hybrid", "Strength", "Pre/post-natal"].map((f) => (
          <span
            key={f}
            className="inline-flex items-center gap-1 rounded-full border border-reps-border bg-reps-panel/50 px-2.5 py-1 text-[11px] text-white/70"
          >
            {f}
          </span>
        ))}
      </div>
      <div className="grid gap-2">
        {[
          { name: "James Carter", spec: "Strength · 1:1 · Hybrid", rating: "4.9", reviews: 47 },
          { name: "Sophie Lin", spec: "Online · Group", rating: "4.8", reviews: 32 },
          { name: "Laura Bennett", spec: "Pre/post-natal", rating: "5.0", reviews: 21 },
        ].map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-3 rounded-[18px] border border-reps-border bg-reps-panel/60 p-3"
          >
            <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-reps-orange-soft to-reps-panel" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[13.5px] font-semibold text-white">{p.name}</span>
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-white/65">
                <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                {p.rating} · {p.reviews} reviews · {p.spec}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 rounded-[8px] border border-white/15 px-2 py-1 text-[10.5px] font-semibold text-white/75">
                Save
              </span>
              <span className="inline-flex items-center gap-1 rounded-[8px] bg-reps-orange px-2 py-1 text-[10.5px] font-semibold text-white">
                View profile
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   5. Reviews & trust
   ============================================================ */

function ReviewsAndTrust() {
  return (
    <section className="border-t border-reps-border/60 bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <SectionEyebrow>Trust</SectionEyebrow>
            <SectionHeading className="mt-3">
              Make trust visible before the first conversation.
            </SectionHeading>
            <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-white/70">
              Clients do not just want a trainer. They want confidence. REPs helps
              professionals show reviews, standards and public trust signals in
              one place.
            </p>
          </div>
          <ReviewsTrustCard />
        </div>
      </div>
    </section>
  );
}

function ReviewsTrustCard() {
  return (
    <div className="rounded-[22px] border border-reps-border bg-reps-panel p-6 lg:p-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-reps-orange-soft">
            <Star className="h-5 w-5 fill-reps-orange text-reps-orange" />
          </div>
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Reviews summary
            </div>
            <div className="font-display text-[22px] font-bold text-white">
              4.9 <span className="text-[13px] font-medium text-white/55">/ 5 · 47 reviews</span>
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
          <BadgeCheck className="h-3 w-3" /> Verified reviews
        </span>
      </div>

      <div className="mt-5 space-y-1.5">
        {[
          { stars: 5, pct: 86 },
          { stars: 4, pct: 11 },
          { stars: 3, pct: 2 },
          { stars: 2, pct: 1 },
          { stars: 1, pct: 0 },
        ].map((r) => (
          <div key={r.stars} className="flex items-center gap-3">
            <span className="w-8 text-[11.5px] text-white/65">{r.stars}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-reps-orange"
                style={{ width: `${r.pct}%` }}
              />
            </div>
            <span className="w-9 text-right text-[11.5px] text-white/55">{r.pct}%</span>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[16px] border border-reps-border bg-reps-ink/50 p-4">
        <div className="flex items-center gap-2 text-[12px] text-reps-orange">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
          ))}
          <span className="text-white/55">· verified client</span>
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/85">
          “Genuinely the most professional coach I&apos;ve worked with. The
          check-ins are sharp and the programme actually fits my week.”
        </p>
        <div className="mt-2 text-[11.5px] text-white/55">A.M. · 12-week client</div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-[11.5px] text-white/45">Example view</span>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-white/20 bg-white/5 px-3 text-[12px] font-semibold text-white shadow-none"
        >
          <Send className="h-3.5 w-3.5" /> Request review
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   6. Profile optimisation
   ============================================================ */

function ProfileOptimisation() {
  return (
    <section className="border-t border-reps-border/60">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <SectionEyebrow>Improve over time</SectionEyebrow>
            <SectionHeading className="mt-3">
              Know what your profile needs next.
            </SectionHeading>
            <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-white/70">
              A professional profile should improve over time. REPs can show what
              is missing, what could increase trust and what helps your profile
              look more complete to clients.
            </p>
          </div>
          <ProfileOptimisationMockup />
        </div>
      </div>
    </section>
  );
}

function ProfileOptimisationMockup() {
  const tasks = [
    { label: "Add qualification (L4 Strength)", done: false },
    { label: "Upload insurance certificate", done: false },
    { label: "Add service: Online coaching", done: false },
    { label: "Request reviews from recent clients", done: false },
    { label: "Improve specialist areas", done: true },
    { label: "Publish profile updates", done: true },
  ];
  return (
    <div className="rounded-[22px] border border-reps-border bg-reps-panel p-6 lg:p-7">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Profile strength
          </div>
          <div className="mt-1 font-display text-[24px] font-bold text-white">
            72<span className="text-[14px] font-medium text-white/55">/100</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold text-reps-orange">
          <Target className="h-3 w-3" /> 4 actions to 90+
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-reps-orange" style={{ width: "72%" }} />
      </div>

      <ul className="mt-6 space-y-2.5">
        {tasks.map((t) => (
          <li
            key={t.label}
            className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-ink/40 px-3.5 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span
                className={
                  "flex h-5 w-5 items-center justify-center rounded-full border " +
                  (t.done
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                    : "border-white/20 bg-white/5 text-transparent")
                }
              >
                <Check className="h-3 w-3" />
              </span>
              <span
                className={
                  "text-[13.5px] " + (t.done ? "text-white/55 line-through" : "text-white/90")
                }
              >
                {t.label}
              </span>
            </div>
            {!t.done && (
              <span className="text-[11px] font-semibold text-reps-orange">Start →</span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 text-[11.5px] text-white/45">Example view</div>
    </div>
  );
}

/* ============================================================
   7. Enquiries and lead handover (50/50)
   ============================================================ */

function EnquiriesHandover() {
  return (
    <section className="border-t border-reps-border/60 bg-reps-panel/15">
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10 lg:py-28">
        <MockupStage variant="laptop">
          <BrowserFrame url="repsuk.org/dashboard/leads">
            <LeadsMockup />
          </BrowserFrame>
        </MockupStage>
        <div>
          <SectionEyebrow>From view to enquiry</SectionEyebrow>
          <BlockHeading as="h2" className="mt-3">
            Turn profile views into organised enquiries.
          </BlockHeading>
          <p className="mt-4 max-w-[520px] text-[15.5px] leading-relaxed text-white/70">
            When someone contacts you through REPs, the enquiry should not
            disappear into an inbox. It should become a lead you can follow up,
            qualify and convert.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Source recorded — REPs profile vs shop-front vs referral",
              "Interest, location and preferred training type captured",
              "Follow-up dates and lead status in one pipeline",
              "Move to consultation in a single click",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[14.5px] text-white/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" /> {b}
              </li>
            ))}
          </ul>
          <Link
            to="/features/operations"
            className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-reps-orange hover:underline"
          >
            See Operations <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   8. Visibility analytics
   ============================================================ */

function VisibilityAnalytics() {
  return (
    <section className="border-t border-reps-border/60">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <SectionEyebrow>Performance</SectionEyebrow>
            <SectionHeading className="mt-3">
              Understand how your profile is performing.
            </SectionHeading>
            <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-white/70">
              REPs can help professionals understand profile views, search
              appearances, enquiries and review growth, so visibility becomes
              something you can improve.
            </p>
          </div>
          <ProfileAnalyticsMockup />
        </div>
      </div>
    </section>
  );
}

function ProfileAnalyticsMockup() {
  const tiles = [
    { label: "Profile views", value: "1,284", delta: "+18% wk", icon: Eye },
    { label: "Search appearances", value: "3,902", delta: "+11% wk", icon: Search },
    { label: "Enquiries", value: "27", delta: "+6 wk", icon: Inbox },
    { label: "Reviews", value: "47", delta: "+3 mo", icon: Star },
  ];
  return (
    <div className="rounded-[22px] border border-reps-border bg-reps-panel p-6 lg:p-7">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Visibility overview
          </div>
          <div className="mt-1 font-display text-[20px] font-bold text-white">Last 30 days</div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
          <TrendingUp className="h-3 w-3" /> Trending up
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-[16px] border border-reps-border bg-reps-ink/40 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] uppercase tracking-wider text-white/55">
                {t.label}
              </span>
              <t.icon className="h-4 w-4 text-reps-orange" />
            </div>
            <div className="mt-2 font-display text-[24px] font-bold text-white">{t.value}</div>
            <div className="mt-0.5 text-[11.5px] text-emerald-300">{t.delta}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[16px] border border-reps-border bg-reps-ink/40 p-4">
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-white/85">Profile completion</span>
          <span className="font-semibold text-white">72%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-reps-orange" style={{ width: "72%" }} />
        </div>
        <div className="mt-3 flex items-center gap-2 text-[12px] text-white/75">
          <LineChart className="h-3.5 w-3.5 text-reps-orange" />
          Suggested next: add a Level 4 specialism to lift search appearances.
        </div>
      </div>

      <div className="mt-4 text-[11.5px] text-white/45">Example view</div>
    </div>
  );
}

/* ============================================================
   9. How Visibility connects
   ============================================================ */

const CONNECTORS = [
  {
    title: "Operations",
    body:
      "Manage leads, bookings, clients and payments once someone enquires.",
    to: "/features/operations" as const,
    icon: Inbox,
  },
  {
    title: "Coaching",
    body:
      "Deliver programmes, check-ins, nutrition and client progress once they become a client.",
    to: "/features/coaching" as const,
    icon: Users,
  },
  {
    title: "REPs AI",
    body:
      "Use AI support for lead scoring, next steps, risk alerts and growth recommendations.",
    to: "/features/ai" as const,
    icon: Sparkles,
  },
  {
    title: "Growth",
    body:
      "Use profile performance, reviews and business insights to grow over time.",
    to: "/features/growth" as const,
    icon: TrendingUp,
  },
];

function ConnectingSections() {
  return (
    <section className="border-t border-reps-border/60 bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="max-w-[720px]">
          <SectionEyebrow>Connected platform</SectionEyebrow>
          <SectionHeading className="mt-3">
            Visibility is only the first step.
          </SectionHeading>
          <p className="mt-4 max-w-[600px] text-[15px] leading-relaxed text-white/70">
            Your verified profile feeds straight into the platform that runs the
            rest of your business — from the first enquiry through coaching and
            long-term growth.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CONNECTORS.map((c) => (
            <Link
              key={c.title}
              to={c.to}
              className="group flex h-full flex-col rounded-[18px] border border-reps-border bg-reps-panel p-5 transition-colors hover:border-reps-orange-border"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-[16px] font-bold text-white group-hover:text-reps-orange">
                {c.title}
              </h3>
              <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-white/65">
                {c.body}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange">
                Explore <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   10. FAQ
   ============================================================ */

const FAQ_ITEMS = [
  {
    q: "Is Visibility the same as a directory listing?",
    a: "No. A directory listing is only part of it. REPs Visibility combines your public profile, verification signals, reviews, search presence and enquiry routes.",
  },
  {
    q: "Will REPs guarantee enquiries?",
    a: "No. REPs does not guarantee leads or bookings. The platform is designed to help professionals present trust, improve visibility and make it easier for clients to enquire.",
  },
  {
    q: "Can clients search by location?",
    a: "Yes. The public search experience is designed around profession, location, training type and relevant trust signals.",
  },
  {
    q: "Can I show my qualifications and CPD?",
    a: "Yes. Your REPs profile can show professional details, qualifications, insurance and CPD-related signals where relevant.",
  },
  {
    q: "Does this connect to the rest of the platform?",
    a: "Yes. Visibility connects into the wider REPs platform so enquiries can become leads, consultations, clients and ongoing coaching relationships.",
  },
];
