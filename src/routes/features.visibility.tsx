import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Award,
  MessageSquare,
  Tag,
  Globe,
  Zap,
  X,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { PressMarquee } from "@/components/marketing/PressMarquee";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { BlockHeading } from "@/components/marketing/BlockHeading";
import { MockupStage } from "@/components/marketing/MockupStage";
import { DeviceMockup } from "@/components/marketing/DeviceMockup";
import { AnnotatedMock, type Callout } from "@/components/marketing/AnnotatedMock";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import heroVisibility from "@/assets/hero-visibility-bg.jpg.asset.json";

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

const PROFILE_CALLOUTS: Callout[] = [
  {
    x: "11%",
    y: "18%",
    title: "Verified badge",
    body: "Awarded after a human checks qualifications, insurance and DBS. Clients see it before anything else.",
  },
  {
    x: "84%",
    y: "22%",
    title: "Specialisms at a glance",
    body: "What you're best suited for — fat loss, postnatal, strength, rehab — not a wall of tags.",
  },
  {
    x: "16%",
    y: "48%",
    title: "Credentials on the record",
    body: "Recognised awarding-body qualifications, CPD and insurance — surfaced, not hidden in a PDF.",
  },
  {
    x: "82%",
    y: "56%",
    title: "Services & pricing",
    body: "Clear options and price ranges, so clients self-qualify before they get in touch.",
  },
  {
    x: "14%",
    y: "78%",
    title: "Reviews from real clients",
    body: "Aggregate rating plus written feedback. Only verified clients can post — you can reply.",
  },
  {
    x: "84%",
    y: "82%",
    title: "Enquire / contact CTA",
    body: "One clear action. Drops straight into your REPs inbox — no DMs, no missed leads.",
  },
];

const TRUST_SIGNALS = [
  {
    icon: ShieldCheck,
    title: "REPs Verified",
    body: "Identity and credentials checked by a human. Status, the public badge — and the only marker REPs guarantees.",
    accent: "emerald" as const,
  },
  {
    icon: Award,
    title: "Qualifications",
    body: "Recognised awarding-body qualifications shown on the record, named and dated. No mystery acronyms.",
  },
  {
    icon: Stethoscope,
    title: "Insurance",
    body: "Public-liability cover surfaced on the profile — checked annually so it never silently lapses.",
  },
  {
    icon: BadgeCheck,
    title: "Continuing professional development",
    body: "Recent CPD entries appear next to qualifications — proof you're still investing in your craft.",
  },
  {
    icon: Star,
    title: "Reviews",
    body: "Star rating plus written feedback from verified clients. Replies are public. Deletions aren't possible.",
  },
  {
    icon: Tag,
    title: "Specialisms",
    body: "Plain-language strengths — postnatal, older adults, rehab support, fat loss — so the right client recognises you.",
  },
];

const SEGMENTS = [
  { key: "pt", label: "Personal trainer", src: "/pro/james-carter", device: "laptop" as const, title: "PT profile" },
  { key: "online", label: "Online coach", src: "/professions/online-coach", device: "laptop" as const, title: "Online coach landing" },
  { key: "strength", label: "Strength coach", src: "/professions/strength-coach", device: "laptop" as const, title: "Strength coach landing" },
  { key: "pilates", label: "Pilates", src: "/professions/pilates-instructor", device: "laptop" as const, title: "Pilates instructor landing" },
  { key: "yoga", label: "Yoga", src: "/professions/yoga-teacher", device: "laptop" as const, title: "Yoga teacher landing" },
  { key: "group", label: "Group ex", src: "/professions/group-exercise", device: "laptop" as const, title: "Group exercise landing" },
  { key: "studio", label: "Studio team", src: "/c/james-wilson", device: "laptop" as const, title: "Studio shop-front" },
];

const COMPARISON_ROWS = [
  { feature: "Public verified profile", verified: true, pro: true },
  { feature: "Reviews from verified clients", verified: true, pro: true },
  { feature: "City + specialism landing pages", verified: true, pro: true },
  { feature: "Enquiry inbox", verified: true, pro: true },
  { feature: "Branded shop-front at /c/your-name", verified: false, pro: true },
  { feature: "Bookings, forms, payments", verified: false, pro: true },
  { feature: "Client CRM & onboarding", verified: false, pro: true },
  { feature: "Profile-views & enquiry analytics", verified: false, pro: true },
];

const FAQ_ITEMS = [
  {
    q: "Will my profile rank at the top of search?",
    a: "REPs is designed to help clients search, compare and contact suitable professionals with more confidence — not to promise a top slot. A complete, verified profile with real reviews is consistently more discoverable than an empty one.",
  },
  {
    q: "Can I hide my profile if I'm fully booked?",
    a: "Yes. You can set your profile to private from your dashboard at any time. Existing clients keep their access; new enquiries pause.",
  },
  {
    q: "Who is allowed to leave a review?",
    a: "Only clients with a verified booking or session record on REPs can post a review. There are no anonymous drive-by ratings.",
  },
  {
    q: "Do I need Pro to be visible?",
    a: "No. Verified gives you the full public profile, reviews, directory placement and an enquiry inbox. Pro adds bookings, payments, a branded shop-front and the client management tools that turn enquiries into a working business.",
  },
  {
    q: "Is my REPs profile indexed by search engines?",
    a: "Yes. Verified profiles are public, indexable pages with proper metadata and structured data — so you're discoverable inside REPs and beyond it.",
  },
  {
    q: "Can I reply to reviews?",
    a: "Yes. Every review has a public reply thread so you can thank a client, add context, or address feedback in the open.",
  },
];

// -----------------------------------------------------------------------------
// Route
// -----------------------------------------------------------------------------

export const Route = createFileRoute("/features/visibility")({
  head: () => ({
    meta: [
      { title: "Visibility — Get found by clients before they choose · REPs" },
      {
        name: "description",
        content:
          "Build a verified REPs profile clients can find, trust and contact. Public profile, directory presence, reviews, specialisms and an enquiry inbox in one place.",
      },
      { property: "og:title", content: "Visibility — REPs for Professionals" },
      {
        property: "og:description",
        content:
          "Be found before clients choose who to contact. Verified profile, reviews, directory placement and specialism pages.",
      },
      { property: "og:image", content: heroVisibility.url },
      { property: "og:url", content: "https://repsglobal.lovable.app/features/visibility" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features/visibility" }],
  }),
  component: VisibilityPage,
});

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

function VisibilityPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <Hero />
      <PressMarquee />

      <ProblemSection />
      <ProfileSection />
      <DiscoverySection />
      <TrustGridSection />
      <ReviewsSection />
      <SeoReachSection />
      <SegmentsSection />
      <TierComparisonSection />

      <MarketingFaq
        eyebrow="Common questions"
        heading="What clients see, and what you control."
        items={FAQ_ITEMS}
      />

      <FinalCta
        heading="Build a profile clients can find,"
        headingAccent="trust and contact."
        lede="Join the verified register and create a professional presence that works beyond social media."
        primary={{ to: "/signup", label: "Join REPs" }}
        secondary={{ to: "/pricing", label: "See pricing" }}
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
        src={heroVisibility.url}
        alt="Verified REPs trainer outside a premium boutique studio at dusk"
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
            Visibility · The verified register
          </MarketingHeroEyebrow>

          <h1
            className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[64px]"
            style={{ animationDuration: "640ms", animationDelay: "80ms", animationFillMode: "both" }}
          >
            Be found by clients looking for{" "}
            <span className="text-reps-orange">trusted fitness professionals.</span>
          </h1>

          <p
            className="mt-6 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/75"
            style={{ animationDuration: "640ms", animationDelay: "180ms", animationFillMode: "both" }}
          >
            Create a verified REPs profile that brings your credentials, reviews, specialisms and
            contact options into one public place clients can understand and act on — before they
            ever enter your coaching system.
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
            <a
              href="#profile"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
            >
              See how profiles work
            </a>
          </div>

          <ul
            className="mt-7 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70"
            style={{ animationDuration: "640ms", animationDelay: "340ms", animationFillMode: "both" }}
          >
            <li className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-reps-orange" /> Verified credentials
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-reps-orange" /> 10-minute setup
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-reps-orange" /> Every feature in your tier included
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
    <section className="border-t border-reps-border/60">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <SectionHeader
          eyebrow="The visibility problem"
          heading="Most professionals are scattered. Clients are left guessing."
          lede="Instagram bio, Linktree, an old website, screenshots in WhatsApp — prospects can't tell who's qualified, insured, experienced or actually right for them. REPs brings that trust layer into one professional profile."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Before — scattered */}
          <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              <X className="h-3 w-3" /> Today, without REPs
            </span>
            <BlockHeading className="mt-4">A scattered, unverifiable presence.</BlockHeading>
            <div className="mt-6 space-y-3">
              <ScatteredCard
                tag="Instagram bio"
                lines={["Coach · PT · Strength · DM for prices", "linkin.bio/coachjamie"]}
              />
              <ScatteredCard
                tag="Linktree"
                lines={["Book a call", "Join the Patreon", "WhatsApp me", "Old PDF programme"]}
              />
              <ScatteredCard
                tag="WhatsApp"
                lines={["“She's amazing, here's a screenshot of my macros 🙌”"]}
                italic
              />
            </div>
            <p className="mt-5 text-[13.5px] leading-relaxed text-white/55">
              No verified credentials. No insurance proof. Reviews trapped in DMs.
            </p>
          </div>

          {/* After — REPs */}
          <div className="rounded-[22px] border border-reps-orange-border bg-reps-panel/60 p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
              <Check className="h-3 w-3" /> With REPs
            </span>
            <BlockHeading className="mt-4">One verified professional record.</BlockHeading>
            <ul className="mt-6 space-y-3">
              {[
                "Verified badge — checked by a human",
                "Qualifications, insurance and CPD on the record",
                "Specialisms in plain language",
                "Reviews from verified clients (with replies)",
                "Services, pricing and an enquiry inbox",
                "Public, indexable URL you can share anywhere",
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-white/85"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[13.5px] leading-relaxed text-white/70">
              <span className="font-semibold text-white">The strategic difference:</span> most
              fitness software helps you manage clients <em>after</em> they sign up. REPs helps you
              become visible <em>before</em> they choose who to contact.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScatteredCard({
  tag,
  lines,
  italic,
}: {
  tag: string;
  lines: string[];
  italic?: boolean;
}) {
  return (
    <div className="rounded-[16px] border border-reps-border/70 bg-reps-ink/60 p-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/45">{tag}</p>
      <div className={`mt-2 space-y-1 text-[13.5px] text-white/70 ${italic ? "italic" : ""}`}>
        {lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. Profile anatomy
// -----------------------------------------------------------------------------

function ProfileSection() {
  return (
    <section id="profile" className="scroll-mt-24 border-t border-reps-border/60">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Your public REPs profile"
          heading="What clients see — and why they act on it."
          lede="Every element on a verified REPs profile is there to help a stranger trust you in under thirty seconds. Six call-outs you can point at."
        />

        <div className="mt-12">
          <AnnotatedMock
            mockup={{
              device: "laptop",
              src: "/pro/james-carter",
              title: "Verified professional profile",
            }}
            callouts={PROFILE_CALLOUTS}
          />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 3. Discovery
// -----------------------------------------------------------------------------

function DiscoverySection() {
  return (
    <section className="border-t border-reps-border/60 bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="How clients discover you"
          heading="The directory the public already uses to find a trusted professional."
          lede="REPs is designed to help clients search, compare and contact suitable professionals with more confidence — filtered by what actually matters."
        />

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <MockupStage variant="laptop">
            <DeviceMockup
              device="laptop"
              src="/find-a-professional"
              title="REPs directory search results"
            />
          </MockupStage>

          <div className="space-y-4">
            {[
              { icon: Search, title: "Filter by what matters", body: "Location, profession, specialism, services offered, in-person vs online — not vanity metrics." },
              { icon: ShieldCheck, title: "Verified-only by default", body: "Unverified accounts don't pollute the top of the page. You're not buried under noise." },
              { icon: Star, title: "Real-review ranking", body: "Reviews come from clients with a verified session record. They count toward how prospects rank you." },
              { icon: Tag, title: "Specialism-led shortlists", body: "Postnatal, rehab, strength, older adults — clients self-qualify before they enquire." },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-[16px] border border-reps-border bg-reps-panel/60 p-5"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-white">{title}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-white/65">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 4. Trust grid
// -----------------------------------------------------------------------------

function TrustGridSection() {
  return (
    <section className="border-t border-reps-border/60">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Trust signals that matter"
          heading="The six things clients check before they get in touch."
          lede="Verification, qualifications, insurance, CPD, reviews and specialisms — every one of them surfaced on your profile, not hidden behind a request."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_SIGNALS.map(({ icon: Icon, title, body, accent }) => {
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
                <p className="mt-4 text-[16px] font-semibold text-white">{title}</p>
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
// 5. Reviews
// -----------------------------------------------------------------------------

function ReviewsSection() {
  return (
    <section className="border-t border-reps-border/60 bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Turn reviews into public proof"
          heading="Your best client outcomes deserve more than a WhatsApp screenshot."
          lede="REPs requests a review 24 hours after a completed session and ties it to a verified client. Replies are public. Deletions aren't possible. That's why prospects believe what they read."
        />

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <MockupStage variant="laptop">
            <DeviceMockup
              device="laptop"
              src="/pro/james-carter#reviews"
              title="Reviews on the verified profile"
            />
          </MockupStage>

          <div className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-7">
            <BlockHeading>The authenticity rules.</BlockHeading>
            <Separator className="my-5 bg-reps-border" />
            <ul className="space-y-3.5">
              {[
                "Only verified clients with a session record can post.",
                "Auto-requested 24 hours after a completed booking.",
                "Star rating + written feedback. Replies are public.",
                "You can flag — you can't silently delete.",
                "Aggregate score feeds your directory ranking.",
                "Every review timestamped and shown in plain English.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[14.5px] text-white/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 6. SEO reach
// -----------------------------------------------------------------------------

function SeoReachSection() {
  return (
    <section className="border-t border-reps-border/60">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Found beyond REPs too"
          heading="A verified REPs profile is a public, indexable page."
          lede="Hundreds of city and specialism landing pages — “personal trainers in Manchester”, “pilates instructor in Brixton” — surface verified pros to the wider web. You inherit that distribution the day you join."
        />

        <div className="mt-12">
          <MockupStage variant="laptop">
            <DeviceMockup
              device="laptop"
              src="/in/manchester"
              title="City landing page — Manchester"
            />
          </MockupStage>
        </div>

        <p className="mx-auto mt-8 max-w-[680px] text-center text-[13.5px] leading-relaxed text-white/55">
          Every profile renders proper metadata and structured data, so search engines understand
          who you are, where you work and what you do.
        </p>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 7. Segments
// -----------------------------------------------------------------------------

function SegmentsSection() {
  const [active, setActive] = useState<string>(SEGMENTS[0].key);
  const current = SEGMENTS.find((s) => s.key === active) ?? SEGMENTS[0];

  return (
    <section className="border-t border-reps-border/60 bg-reps-panel/15">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Visibility for every professional"
          heading="One profile shape. Seven kinds of professional."
          lede="Personal trainers, online coaches, strength specialists, Pilates and yoga teachers, group-ex instructors and studio teams — the same verified record adapts to how each works."
        />

        <Tabs value={active} onValueChange={setActive} className="mt-10 w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {SEGMENTS.map((s) => (
              <TabsTrigger
                key={s.key}
                value={s.key}
                className="rounded-full border border-reps-border bg-reps-panel/60 px-4 py-2 text-[13px] font-semibold text-white/70 shadow-none data-[state=active]:border-reps-orange-border data-[state=active]:bg-reps-orange-soft data-[state=active]:text-reps-orange"
              >
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={active} forceMount className="mt-10">
            <MockupStage variant="laptop">
              <DeviceMockup
                key={current.key}
                device={current.device}
                src={current.src}
                title={current.title}
              />
            </MockupStage>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 8. Verified vs Pro
// -----------------------------------------------------------------------------

function TierComparisonSection() {
  return (
    <section className="border-t border-reps-border/60">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Verified vs Pro"
          heading="Verified makes you visible. Pro turns visibility into a working business."
          lede="Visibility is included in every tier. Pro layers on the tools that convert an enquiry into a paying client."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <TierCard
            badge="Verified"
            price="£99 / year"
            blurb="For professionals who want a trusted public register profile and enquiry inbox."
            cta={{ to: "/pricing", label: "Start with Verified" }}
          />
          <TierCard
            badge="Pro"
            price="£59 / month · Founding"
            blurb="Everything in Verified, plus bookings, payments, branded shop-front, CRM and client management."
            highlighted
            cta={{ to: "/features/shop-front", label: "See the Pro shop-front" }}
          />
        </div>

        <div className="mt-10 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/40">
          <div className="grid grid-cols-[1fr_120px_120px] items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
            <span>Visibility capability</span>
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
    </section>
  );
}

function TierCard({
  badge,
  price,
  blurb,
  cta,
  highlighted,
}: {
  badge: string;
  price: string;
  blurb: string;
  cta: { to: string; label: string };
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] p-7 ${
        highlighted
          ? "border border-reps-orange-border bg-reps-panel/70"
          : "border border-reps-border bg-reps-panel/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={
            highlighted
              ? "rounded-full bg-reps-orange px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
              : "rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange"
          }
        >
          {badge}
        </span>
        <span className="text-[12.5px] font-semibold text-white/55">{price}</span>
      </div>
      <p className="mt-4 text-[15.5px] leading-relaxed text-white/80">{blurb}</p>
      <Link
        to={cta.to}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/20 px-5 text-[13.5px] font-semibold text-white shadow-none hover:bg-white/10"
      >
        {cta.label} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
