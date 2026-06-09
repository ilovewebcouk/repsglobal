import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  Calendar,
  Inbox,
  Workflow,
  Sparkles,
  Star,
  Globe,
  Zap,
  X,
  ShieldCheck,
  Award,
  Stethoscope,
  Tag,
  Palette,
  LayoutTemplate,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { BlockHeading } from "@/components/marketing/BlockHeading";
import { MockupStage } from "@/components/marketing/MockupStage";
import { DeviceMockup } from "@/components/marketing/DeviceMockup";
import { AnnotatedMock, type Callout } from "@/components/marketing/AnnotatedMock";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { TierCard } from "@/components/marketing/TierCard";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import coachJamesCoaching from "@/assets/coach-james-coaching.jpg";

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

const SHOPFRONT_CALLOUTS: Callout[] = [
  {
    x: "12%",
    y: "14%",
    title: "Outcome-led hero",
    body: "Your headline is the promise, not your name. One photo, one CTA, the proof that you deliver.",
  },
  {
    x: "84%",
    y: "20%",
    title: "Verified card",
    body: "REPs Verified badge, credentials and insurance — live-pulled from your standards record.",
  },
  {
    x: "14%",
    y: "45%",
    title: "Three tier services",
    body: "Online, Hybrid and In-person. Middle tier marked Most popular in your accent colour.",
  },
  {
    x: "82%",
    y: "52%",
    title: "Methodology",
    body: "Three numbered pillars in your voice — the reason clients pick you over a cheaper coach.",
  },
  {
    x: "16%",
    y: "76%",
    title: "Real transformations",
    body: "Verified client results with metric overlays. No stock smiles, no fake before-and-afters.",
  },
  {
    x: "84%",
    y: "84%",
    title: "Enquire panel",
    body: "Every CTA on the page lands here. Drops straight into your REPs leads pipeline — never your inbox.",
  },
];

const SERVICE_TYPES = [
  { title: "1:1 coaching", body: "Session structure, what's included, who it suits, price range or 'from' anchor." },
  { title: "Online coaching", body: "Programme cadence, check-in frequency, app/portal access, suitability filters." },
  { title: "Small-group training", body: "Group size, schedule, member journey, drop-in vs block options." },
  { title: "Assessments & screening", body: "Movement, strength, postural or readiness assessments — clearly priced." },
  { title: "Transformation programmes", body: "12-week, body-comp or rehab packages with milestones and pricing." },
  { title: "Sports performance", body: "Sport-specific blocks for runners, lifters, climbers, team-sport athletes." },
  { title: "Specialist services", body: "Pre/postnatal, older adults, rehab support, chronic-condition coaching." },
  { title: "Studio classes", body: "Class schedule, instructors, location, class-pack or membership options." },
  { title: "Gym memberships", body: "Tiered membership, access, contract length and onboarding details." },
];

const FLOW_STEPS = [
  {
    icon: Inbox,
    title: "Client clicks Enquire",
    body: "Every CTA on the Shop Front — hero, tier card, contact panel — opens the same locked enquiry form.",
  },
  {
    icon: Workflow,
    title: "Lands in your REPs pipeline",
    body: "Scored by AI, tagged by service and intent. No more leads lost between DMs and inbox.",
  },
  {
    icon: Calendar,
    title: "Booking or consultation confirmed",
    body: "Send a one-click booking link. Capture payment or hold a consultation call before money changes hands.",
  },
  {
    icon: CreditCard,
    title: "Onboarded as a client",
    body: "Welcome flow, intake form, programme assignment — handled inside REPs. They never leave the platform.",
  },
];

const CONNECTED_BULLETS = [
  "Enquiry forms branded to your accent colour, with the service preselected.",
  "Booking links for consultations, intro sessions or full programmes.",
  "Payments captured through your connected processor — no extra surcharge.",
  "Automated follow-up sequences for hot, warm and cold leads.",
  "Lead-to-client conversion shown on your dashboard — not a vanity metric.",
];

const PROOF_BLOCKS = [
  {
    icon: ShieldCheck,
    title: "Verified badge",
    body: "The REPs Verified mark — checked by a human, displayed at the top of your Shop Front.",
    accent: "emerald" as const,
  },
  {
    icon: Award,
    title: "Qualifications",
    body: "Recognised awarding-body qualifications shown on the page, named and dated. No mystery acronyms.",
  },
  {
    icon: BadgeCheck,
    title: "CPD",
    body: "Recent continuing-professional-development entries surface beside your qualifications.",
  },
  {
    icon: Tag,
    title: "Specialisms",
    body: "Plain-language strengths — postnatal, rehab, fat loss, strength — so the right client recognises you.",
  },
  {
    icon: Star,
    title: "Reviews",
    body: "Verified-client reviews mirrored from your directory profile. Public replies, no silent deletions.",
  },
  {
    icon: Stethoscope,
    title: "Insurance",
    body: "Public-liability cover surfaced on the page — checked annually so it never silently lapses.",
  },
];

const JOURNEY_STEPS = ["Discover", "Trust", "Understand offer", "Enquire", "Book / pay / onboard"];

const COMPARISON_ROWS = [
  { feature: "Public page at /c/your-name", verified: false, pro: true },
  { feature: "Services & tier cards", verified: false, pro: true },
  { feature: "Methodology & about section", verified: false, pro: true },
  { feature: "Verified reviews on the page", verified: false, pro: true },
  { feature: "Credentials & insurance display", verified: false, pro: true },
  { feature: "Enquiry form (branded)", verified: false, pro: true },
  { feature: "Booking & payments wired in", verified: false, pro: true },
  { feature: "Leads in your REPs pipeline", verified: false, pro: true },
];

const USE_CASES = [
  {
    title: "Personal trainer",
    body: "1:1 coaching, intro session, transformation block — with venues and times.",
  },
  {
    title: "Online coach",
    body: "Monthly online programme, check-in cadence, app access — fully remote.",
  },
  {
    title: "Strength coach",
    body: "Strength-block programming, technique sessions, competition prep.",
  },
  {
    title: "Pilates instructor",
    body: "Reformer or mat blocks, group classes, 1:1 sessions, studio venue.",
  },
  {
    title: "Yoga teacher",
    body: "Class schedule, workshops, retreats and private sessions.",
  },
  {
    title: "Small studio",
    body: "Class timetable, instructor roster, membership tiers and intro offer.",
  },
  {
    title: "Sports coach",
    body: "Sport-specific programmes for runners, lifters, climbers, team athletes.",
  },
  {
    title: "Specialist coach",
    body: "Pre/postnatal, rehab support, older adults, chronic-condition coaching.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Do I need design skills to build a Shop Front?",
    a: "No. The layout, typography, dark theme and mobile behaviour are designed once. You pick an accent colour, upload a hero photo, three transformations and a portrait, and write your method, tiers and bio. REPs handles the rest.",
  },
  {
    q: "Can I use my own brand colour?",
    a: "You pick an accent from the REPs palette — used for CTAs, ticks, badges and the hero glow. The rest of the page stays on the REPs dark theme so every Shop Front feels premium and consistent.",
  },
  {
    q: "Is the Shop Front separate from my directory profile?",
    a: "It's a separate public page at /c/your-name, connected to the same REPs record. Your verified badge, credentials, reviews and insurance status all read live from the same source — no duplication, no drift.",
  },
  {
    q: "What happens when someone clicks Enquire?",
    a: "They open the same locked enquiry flow shown on your directory profile. Their answers land in your REPs leads pipeline, scored by AI and tagged by the service they were viewing — not your personal inbox.",
  },
  {
    q: "Do I need Pro to publish a Shop Front?",
    a: "Yes. A branded Shop Front at /c/your-name is included in Pro (£59/month — Founding pricing) and Studio (£149/month). Verified gives you the public directory profile and an enquiry inbox, but not the dedicated Shop Front page.",
  },
  {
    q: "Can I share one URL on Instagram and WhatsApp?",
    a: "Yes — your Shop Front URL is /c/your-name. Replace your Linktree, your old Wix site and the half-dozen booking links with a single clean URL clients can act on.",
  },
];

// -----------------------------------------------------------------------------
// Route
// -----------------------------------------------------------------------------

export const Route = createFileRoute("/features/shop-front")({
  head: () => ({
    meta: [
      {
        title: "Shop-front — Your fitness business website, built into REPs · REPs",
      },
      {
        name: "description",
        content:
          "A professional Shop Front for fitness pros — services, credentials, reviews, packages and booking options in one client-ready page, connected to your REPs enquiries, bookings and clients.",
      },
      {
        property: "og:title",
        content: "Shop-front — Your fitness business website, built into REPs",
      },
      {
        property: "og:description",
        content:
          "Bring your offer, proof, bookings, enquiries and client journey into one professional website page. Included in Pro and Studio.",
      },
      { property: "og:image", content: coachJamesCoaching },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/shop-front" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/shop-front" }],
  }),
  component: ShopFrontPage,
});

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

function ShopFrontPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <Hero />

      <ProblemSection />
      <AnatomySection />
      <ServicesSection />
      <FlowSection />
      <ProofSection />
      <PurposeBuiltSection />
      <TierComparisonSection />
      <UseCasesSection />

      <MarketingFaq
        eyebrow="Common questions"
        heading="What clients see, and what you control."
        items={FAQ_ITEMS}
      />

      <FinalCta
        heading="Build a Shop Front clients can"
        headingAccent="understand, trust and act on."
        lede="Create a professional website page connected to your REPs profile, services, bookings and client workflow."
        primary={{ to: "/signup", label: "Create your Shop Front" }}
        secondary={{ to: "/pricing", label: "Explore REPs Pro" }}
      />

      <PublicFooter />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Hero
// -----------------------------------------------------------------------------

function Hero() {
  return (
    <section className="relative flex min-h-[640px] overflow-hidden lg:min-h-[780px]">
      <img
        src={coachJamesCoaching}
        alt="REPs Pro-tier trainer coaching a client through a dumbbell row in a premium gym"
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

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col justify-start px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-24">
        <div className="max-w-[640px]">
          <MarketingHeroEyebrow
            icon={Sparkles}
            style={{ animationDuration: "560ms", animationFillMode: "both" }}
          >
            Shop-front · Your client-facing page
          </MarketingHeroEyebrow>

          <h1
            className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[64px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            Your fitness business website,{" "}
            <span className="text-reps-orange">built into REPs.</span>
          </h1>

          <p
            className="mt-6 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/80"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            A professional Shop Front that shows your services, credentials, reviews, packages and
            booking options in one client-ready page — connected to your enquiries, bookings and
            clients inside REPs.
          </p>

          <div
            className="mt-8 flex animate-fade-in flex-wrap gap-3"
            style={{ animationDuration: "640ms", animationDelay: "260ms", animationFillMode: "both" }}
          >
            <Link
              to="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Create your Shop Front <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#anatomy"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              See how it works
            </a>
          </div>

          <ul
            className="mt-7 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70"
            style={{ animationDuration: "640ms", animationDelay: "340ms", animationFillMode: "both" }}
          >
            <li className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-reps-orange" /> Pro &amp; Studio
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-reps-orange" /> 10-minute setup
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-reps-orange" /> Connected to your REPs workflow
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 1. Problem
// -----------------------------------------------------------------------------

function ProblemSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="The scattered setup"
          heading="Most fitness pros don't have a website. They have a tangle."
          lede="Instagram bio. Linktree. An old Wix site. A Google Form. A Calendly link. A Stripe payment link. WhatsApp messages. Google reviews somewhere else. Clients have to work too hard to understand the offer — and most don't bother."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Before — scattered */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <X className="h-3 w-3" /> Today, without a Shop Front
            </span>
            <BlockHeading className="mt-4">Eight tools. One confused client.</BlockHeading>
            <ul className="mt-6 space-y-2.5">
              {[
                "Instagram bio with one cramped link",
                "Linktree with eight competing CTAs",
                "Old Wix site nobody updates",
                "Google Form for enquiries",
                "Calendly for consultations",
                "Stripe link for payments",
                "WhatsApp for everything else",
                "Google reviews on a separate page",
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5 rounded-[16px] border border-reps-border/70 bg-reps-ink/60 px-4 py-2.5 text-[13.5px] text-white/70"
                >
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[13.5px] leading-relaxed text-white/55">
              The journey breaks on every step. Most prospects drop out before they ever click Book.
            </p>
          </div>

          {/* After — REPs */}
          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
              <Check className="h-3 w-3" /> With a REPs Shop Front
            </span>
            <BlockHeading className="mt-4">One URL. One clear offer. One workflow.</BlockHeading>
            <ul className="mt-6 space-y-3">
              {[
                "One link: /c/your-name — shareable everywhere",
                "Services, packages and prices on the page",
                "Verified badge, credentials and insurance built in",
                "Reviews from real clients shown next to the offer",
                "Enquire, book and pay without leaving the page",
                "Every lead lands in your REPs pipeline — not your inbox",
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-white/80"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[13.5px] leading-relaxed text-white/70">
              Visibility gets you found. The Shop Front helps clients <em>decide</em> and{" "}
              <em>take action</em>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 2. Anatomy
// -----------------------------------------------------------------------------

function AnatomySection() {
  return (
    <section id="anatomy" className="scroll-mt-24 border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Anatomy of a Shop Front"
          heading="An actual REPs Shop Front — six things every client checks."
          lede="This isn't a template preview. It's a fully-built Pro-tier page running on REPs right now. Open it in a new tab and scroll, or read the call-outs below."
        />

        <div className="mt-12">
          <AnnotatedMock
            mockup={{
              device: "laptop",
              src: "/c/james-wilson",
              title: "Live REPs Pro Shop Front for James Wilson",
            }}
            callouts={SHOPFRONT_CALLOUTS}
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/c/$slug"
            params={{ slug: "james-wilson" }}
            target="_blank"
            className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
          >
            Open the live example <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
          >
            See Pro pricing
          </Link>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 3. Sell services clearly
// -----------------------------------------------------------------------------

function ServicesSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Sell services clearly"
          heading="Stop sending clients to a vague bio. Send them to a page that explains the offer."
          lede="Tier cards, packages, programmes and price anchors — built into the page so prospects self-qualify before they ever enquire."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_TYPES.map((s) => (
            <div
              key={s.title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-6"
            >
              <p className="font-display text-[17px] font-bold text-white">{s.title}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 4. Flow — enquiry → booking → payment → CRM
// -----------------------------------------------------------------------------

function FlowSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Enquire · Book · Pay · Onboard"
          heading="When someone clicks Enquire, they don't disappear into your inbox."
          lede="Every CTA on your Shop Front connects to the same REPs workflow your existing clients already use. Lead in, client out — without copying anything between four different tools."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {FLOW_STEPS.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className="relative rounded-[18px] border border-reps-border bg-reps-panel/60 p-6"
            >
              <span className="absolute right-5 top-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                Step {i + 1}
              </span>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-[16px] font-bold text-white">{title}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[22px] border border-reps-border bg-reps-panel/60 p-7 lg:p-10">
          <BlockHeading>What's wired into the flow.</BlockHeading>
          <Separator className="my-5 bg-reps-border" />
          <ul className="grid gap-3 md:grid-cols-2">
            {CONNECTED_BULLETS.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-white/80"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 5. Proof built into the page
// -----------------------------------------------------------------------------

function ProofSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Proof built into the page"
          heading="Your website shouldn't just look good. It should prove why clients can trust you."
          lede="The Shop Front pulls live from your REPs standards record — every credential, every review, every CPD entry. Visibly. Without you maintaining a second copy."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROOF_BLOCKS.map(({ icon: Icon, title, body, accent }) => {
            const isVerified = accent === "emerald";
            return (
              <div
                key={title}
                className={
                  isVerified
                    ? "rounded-[18px] border border-emerald-400/30 bg-emerald-500/[0.06] p-6"
                    : "rounded-[18px] border border-reps-border bg-reps-panel/60 p-6"
                }
              >
                <span
                  className={
                    isVerified
                      ? "inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                      : "inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange"
                  }
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-[16px] font-bold text-white">{title}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{body}</p>
                {isVerified ? (
                  <Badge
                    variant="outline"
                    className="mt-4 border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                  >
                    The headline marker
                  </Badge>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 6. Purpose-built, not a blank page
// -----------------------------------------------------------------------------

function PurposeBuiltSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Purpose-built for fitness pros"
          heading="Designed around the client journey — not a blank page."
          lede="Generic builders give you a blank canvas and a thousand templates. REPs gives you a page already designed around how a stranger becomes a paying client."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-14">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-7 lg:p-10">
            <BlockHeading>A page built around the client journey.</BlockHeading>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/70">
              Every section on a REPs Shop Front exists to move someone one step further down this
              journey. Nothing decorative. Nothing optional. Nothing missing.
            </p>

            <ol className="mt-7 space-y-3">
              {JOURNEY_STEPS.map((step, i) => (
                <li
                  key={step}
                  className="flex items-center gap-4 rounded-[16px] border border-reps-border bg-reps-ink/40 px-4 py-3"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[13px] font-bold text-reps-orange">
                    {i + 1}
                  </span>
                  <span className="text-[14.5px] font-semibold text-white">{step}</span>
                  {i < JOURNEY_STEPS.length - 1 ? (
                    <ArrowRight className="ml-auto h-4 w-4 text-white/35" />
                  ) : (
                    <Check className="ml-auto h-4 w-4 text-reps-orange" />
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-5">
            <div className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <LayoutTemplate className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-[16px] font-bold text-white">
                Generic builders give you templates.
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                Webflow, Wix and Squarespace start with a blank page. You spend weeks deciding
                fonts, sections, mobile breakpoints — and end up with a static brochure.
              </p>
            </div>
            <div className="rounded-[18px] border border-reps-orange-border bg-reps-orange-soft/30 p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange text-white">
                <Palette className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-[16px] font-bold text-white">
                REPs gives you the journey, already designed.
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/80">
                Hero, tier services, methodology, proof, transformations, reviews, enquiry — in
                the right order, with the right copy prompts, wired into your REPs workflow.
              </p>
            </div>
            <div className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Globe className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-[16px] font-bold text-white">
                One link. /c/your-name.
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                Replace your Linktree, your old Wix and your six booking links with a single,
                clean URL clients can act on.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 7. Verified vs Pro
// -----------------------------------------------------------------------------

function TierComparisonSection() {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Verified vs Pro"
          heading="Verified makes you visible. Pro publishes your Shop Front."
          lede="A branded Shop Front at /c/your-name is a Pro and Studio feature. Verified still gives you the directory profile, verified credentials, reviews and an enquiry inbox — but not the dedicated client-facing page."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <TierCard
            badge="Verified"
            price="£99 / year"
            blurb="Public verified profile, directory presence, reviews and an enquiry inbox. No dedicated Shop Front page."
            cta={{ to: "/features/visibility", label: "See what Verified covers" }}
          />
          <TierCard
            badge="Pro"
            price="£59 / month · Founding"
            blurb="Everything in Verified, plus a branded Shop Front, bookings, payments, CRM and client management."
            highlighted
            cta={{ to: "/pricing", label: "See Pro pricing" }}
          />
        </div>

        <div className="mt-10 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/40">
          <div className="overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="grid grid-cols-[1fr_120px_120px] items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                <span>Shop Front capability</span>
                <span className="text-center">Verified</span>
                <span className="text-center">Pro</span>
              </div>
              {COMPARISON_ROWS.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1fr_120px_120px] items-center px-5 py-3.5 text-[14px] text-white/80 ${
                    i % 2 === 0 ? "bg-white/[0.02]" : ""
                  }`}
                >
                  <span>{row.feature}</span>
                  <span className="text-center">
                    {row.verified ? (
                      <Check className="mx-auto h-4 w-4 text-reps-orange" />
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </span>
                  <span className="text-center">
                    {row.pro ? (
                      <Check className="mx-auto h-4 w-4 text-reps-orange" />
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 8. Use cases
// -----------------------------------------------------------------------------

function UseCasesSection() {
  return (
    <section className="border-b border-reps-border bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Built for every kind of pro"
          heading="What your Shop Front looks like for…"
          lede="The structure stays the same. The offer flexes to how you work — whether you're 1:1, online, in a studio or running a team."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map((u) => (
            <div
              key={u.title}
              className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-6"
            >
              <p className="font-display text-[16px] font-bold text-white">{u.title}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{u.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
