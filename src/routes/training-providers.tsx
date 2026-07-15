import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  FileBadge,
  GraduationCap,
  Layers,
  MessageSquareQuote,
  Printer,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HeroOverlay } from "@/components/marketing/HeroOverlay";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { PressMarquee } from "@/components/marketing/PressMarquee";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";

import heroAsset from "@/assets/training-providers/hero.jpg.asset.json";
import classroomAsset from "@/assets/training-providers/classroom.jpg.asset.json";
import badgeAsset from "@/assets/training-providers/badge.png.asset.json";
import level1 from "@/assets/certificates/level-1.png.asset.json";
import level2 from "@/assets/certificates/level-2.png.asset.json";
import level3 from "@/assets/certificates/level-3.png.asset.json";
import level4 from "@/assets/certificates/level-4.png.asset.json";
import { ORG_TIERS, CERTIFICATE_UNIT_PRICE_LABEL } from "@/lib/billing";

const TIER = ORG_TIERS.training_provider;

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Who is eligible to become a REPS-accredited training provider?",
    a: "Any organisation delivering fitness, wellness, movement, nutrition or coaching education whose courses can evidence learning outcomes, assessment method, tutor competency and appropriate insurance. We accept Ofqual-regulated qualifications, courses from recognised awarding bodies, and independent CPD delivered to a demonstrable standard.",
  },
  {
    q: "How long does accreditation take?",
    a: "Most course submissions are reviewed within 10 working days. Larger catalogues are batched — you can list a first course while the rest are in review.",
  },
  {
    q: "Is the £479 annual fee really unlimited courses?",
    a: "Yes. One annual membership covers unlimited accredited course listings, your provider website, digital badges, the reviews widget and directory placement. There are no per-course fees. Learner certificates are the only add-on at £15 each.",
  },
  {
    q: "Do you charge per learner or per certificate?",
    a: "Printed / PDF learner certificates issued through REPS are £15 each. Bulk pricing is available for cohorts of 50+ — just talk to us. Course listings, badges and reviews are all included in the annual fee.",
  },
  {
    q: "Who owns the learner data and certificates?",
    a: "You do. Every certificate is issued in your provider's name, verifiable on a public REPS-hosted URL, and your learner records stay yours. If you leave REPS your issued certificates remain valid and verifiable for their stated lifespan.",
  },
  {
    q: "Can I keep working with my existing awarding body?",
    a: "Yes. REPS accreditation sits alongside — not in place of — recognised awarding bodies. Many providers list the same course under both marks. The REPS badge signals CPD-quality and register-recognition to the 25,000+ pros on the register.",
  },
  {
    q: "Do you offer refunds or a trial?",
    a: "The annual fee is refundable within 30 days if we can't accredit at least one of your courses. After that, membership runs for the full year and does not auto-refund on cancellation.",
  },
  {
    q: "Is VAT included in the price?",
    a: "£479 is exclusive of VAT where applicable. UK-registered providers will receive a VAT invoice on subscription.",
  },
];

export const Route = createFileRoute("/training-providers")({
  head: () => ({
    meta: [
      { title: "Training Providers — Get REPS-accredited · REPS" },
      {
        name: "description",
        content:
          "Get your courses REPS-accredited. Unlimited course listings, digital badge, review widget, certificate printing. £479/year. Certificates £15 each.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Become a REPS-accredited Training Provider" },
      {
        property: "og:description",
        content:
          "Unlimited accredited courses, digital badge, reviews widget, directory placement. £479/year. Certificates £15 each.",
      },
      { property: "og:url", content: "https://repsuk.org/training-providers" },
      {
        property: "og:image",
        content: `https://repsuk.org${heroAsset.url}`,
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Become a REPS-accredited Training Provider" },
      {
        name: "twitter:description",
        content:
          "Unlimited accredited courses, digital badge, reviews widget, directory placement. £479/year.",
      },
    ],
    links: [{ rel: "canonical", href: "https://repsuk.org/training-providers" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "REPS-accredited Training Provider Membership",
          description:
            "Annual membership for fitness and wellness training providers. Unlimited accredited course listings, provider website, digital badge, review collection widget and learner certificate issuance.",
          brand: { "@type": "Organization", name: "REPS" },
          offers: {
            "@type": "Offer",
            price: "479.00",
            priceCurrency: "GBP",
            url: "https://repsuk.org/training-providers",
            availability: "https://schema.org/InStock",
            priceValidUntil: "2027-12-31",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: TrainingProvidersPage,
});

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function TrustChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-border bg-reps-panel/70 px-3 py-1.5 text-[12px] font-medium text-white/80 backdrop-blur">
      <CheckCircle2 className="h-3.5 w-3.5 text-reps-orange" />
      {children}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-7 transition-colors hover:bg-reps-panel/60">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-reps-orange-border bg-reps-orange-soft">
        <Icon className="h-5 w-5 text-reps-orange" />
      </div>
      <h3 className="mt-5 font-display text-[19px] font-bold leading-tight text-white">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-white/70">{body}</p>
    </div>
  );
}

const FEATURES = [
  {
    icon: BookOpen,
    title: "Unlimited accredited course listings",
    body: "Submit as many courses as you like — one flat annual fee. Each approved course gets its own detail page, badge and directory placement.",
  },
  {
    icon: Building2,
    title: "Public provider website",
    body: "A polished, mobile-first landing page at repsuk.org/t/your-brand with your courses, reviews, enquiry form and verification badge.",
  },
  {
    icon: Users,
    title: "Directory + homepage carousel",
    body: "Featured in the searchable training-provider directory and rotated through the REPS homepage carousel seen by 25,000+ pros.",
  },
  {
    icon: BadgeCheck,
    title: "Digital REPS-accredited badge",
    body: "Embed the accredited badge on your own website, marketing PDFs and course pages — every badge links back to your live REPS profile for instant proof.",
  },
  {
    icon: MessageSquareQuote,
    title: "Verified learner reviews",
    body: "Collect verified reviews from actual course graduates. Widget + score badge to embed on your site — a Trustpilot-style trust layer, but exclusive to fitness education.",
  },
  {
    icon: Printer,
    title: "Certificate printing & PDFs",
    body: "Issue branded, verifiable REPS certificates to your learners. Printable PDF + public verification URL. £15 per certificate, bulk pricing for large cohorts.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function TrainingProvidersPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroAsset.url}
          alt="REPS-accredited coach teaching a training-provider cohort"
          width={1600}
          height={1008}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <HeroOverlay copySide="left" />
        <div className="relative mx-auto flex min-h-[620px] max-w-[1320px] flex-col justify-start px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-24">
          <div className="max-w-[620px]">
            <MarketingHeroEyebrow icon={GraduationCap} style={{ animationDelay: "0ms" }}>
              For training providers
            </MarketingHeroEyebrow>
            <h1
              className="mt-5 animate-fade-in font-display text-[38px] font-bold leading-[1.05] text-white lg:text-[60px]"
              style={{ animationDelay: "80ms" }}
            >
              Get your courses{" "}
              <span className="text-reps-orange">REPS-accredited</span>.
              <br />
              Get seen by 25,000+ pros.
            </h1>
            <p
              className="mt-5 max-w-[540px] animate-fade-in text-[16px] leading-relaxed text-white/80"
              style={{ animationDelay: "180ms" }}
            >
              One annual membership. Unlimited accredited course listings, a
              polished provider website, digital badge, verified reviews and
              printable learner certificates — all in one place.
            </p>
            <div
              className="mt-7 flex animate-fade-in flex-wrap gap-3"
              style={{ animationDelay: "260ms" }}
            >
              <Link
                to="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Apply to become a provider <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#included"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
              >
                See what's included
              </a>
            </div>
            <div
              className="mt-6 flex animate-fade-in flex-wrap gap-2"
              style={{ animationDelay: "340ms" }}
            >
              <TrustChip>Unlimited courses</TrustChip>
              <TrustChip>Digital badge + widget</TrustChip>
              <TrustChip>Verifiable certificates</TrustChip>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-10 lg:px-10 lg:py-12">
          <div className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
            <Stat label="Pros on the register" value="25,000+" />
            <Stat label="Verified reviews collected" value="120,000+" />
            <Stat label="Certificates issued" value="48,000+" />
            <Stat label="Avg. course rating" value="4.8 / 5" />
          </div>
        </div>
        <PressMarquee />
      </section>

      {/* WHAT'S INCLUDED */}
      <section id="included" className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>What's included</SectionEyebrow>
            <SectionHeading className="mt-3">
              Everything a training provider needs — one flat annual fee.
            </SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              No paid add-ons, no per-course fees, no per-listing surcharge.
              Just unlimited accredited courses and every feature you need to
              recruit, train and certify learners.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* BADGE + WEBSITE 50/50 */}
      <section className="border-b border-reps-border bg-reps-panel/15">
        <div className="mx-auto grid max-w-[1320px] gap-14 px-6 py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
          <div className="flex flex-col justify-center">
            <SectionEyebrow>Digital badge + widget</SectionEyebrow>
            <SectionHeading className="mt-3">
              A trust mark that links straight back to your live REPS profile.
            </SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              Embed the REPS-accredited badge on your website, learner emails,
              PDFs and social. Every badge is a live link — clicking through
              takes prospective learners to your verified profile with your
              courses, reviews and accreditation date.
            </p>
            <ul className="mt-6 space-y-3 text-[14.5px] text-white/80">
              {[
                "One-click embed snippet — no code",
                "Verifies in real time against the REPS register",
                "Comes with light + dark variants and static PDFs",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,122,0,0.22),transparent_72%)]" />
            <img
              src={badgeAsset.url}
              alt="REPS-accredited training provider digital badge"
              width={520}
              height={520}
              loading="lazy"
              className="relative h-auto w-full max-w-[440px] drop-shadow-[0_20px_50px_rgba(255,122,0,0.25)]"
            />
          </div>
        </div>
      </section>

      {/* REVIEWS WIDGET */}
      <section className="border-b border-reps-border">
        <div className="mx-auto grid max-w-[1320px] gap-14 px-6 py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
          <div className="order-2 flex items-center justify-center lg:order-1">
            <ReviewsWidgetMock />
          </div>
          <div className="order-1 flex flex-col justify-center lg:order-2">
            <SectionEyebrow>Verified reviews</SectionEyebrow>
            <SectionHeading className="mt-3">
              A Trustpilot-grade review layer — built for fitness education.
            </SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              REPS invites every learner to review your course when they receive
              their certificate. Reviews are gated to verified graduates, and
              your score powers a badge you can embed anywhere.
            </p>
            <ul className="mt-6 space-y-3 text-[14.5px] text-white/80">
              {[
                "Only verified learners can review — no drive-by ratings",
                "Score badge + full widget embed for your website",
                "Reply publicly, flag issues, escalate to REPS moderation",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 fill-reps-orange text-reps-orange" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CERTIFICATES */}
      <section className="border-b border-reps-border bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[760px] text-center">
            <SectionEyebrow>Learner certificates</SectionEyebrow>
            <SectionHeading className="mt-3">
              Issue REPS-verifiable certificates in minutes.
            </SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              Every certificate is printed to your brand, signed by REPS, and
              carries a public verification URL. Learners can prove their
              accreditation anywhere — for life.
            </p>
            <p className="mt-3 text-[13.5px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
              {CERTIFICATE_UNIT_PRICE_LABEL} per certificate · bulk pricing for cohorts of 50+
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[level1, level2, level3, level4].map((cert, i) => (
              <div
                key={cert.url}
                className="group overflow-hidden rounded-[18px] border border-reps-border bg-reps-ink p-5 transition-transform hover:-translate-y-1"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-[12px] bg-white">
                  <img
                    src={cert.url}
                    alt={`REPS Level ${i + 1} certificate template`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-4 text-[12px] font-semibold uppercase tracking-wider text-white/55">
                  Level {i + 1}
                </p>
                <p className="mt-1 text-[15px] font-semibold text-white">
                  REPS-accredited certificate
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div>
              <SectionEyebrow>How it works</SectionEyebrow>
              <SectionHeading className="mt-3">
                From application to your first accredited course in weeks — not months.
              </SectionHeading>
              <ol className="mt-8 space-y-6">
                {[
                  {
                    n: "01",
                    t: "Apply",
                    b: "Tell us about your business and the courses you deliver. Takes about 10 minutes.",
                  },
                  {
                    n: "02",
                    t: "Course review",
                    b: "Our education team reviews your learning outcomes, assessment method, tutor competency and insurance.",
                  },
                  {
                    n: "03",
                    t: "Get accredited",
                    b: "Approved courses go live on your provider profile and the REPS directory, with the accredited badge.",
                  },
                  {
                    n: "04",
                    t: "Issue certificates + collect reviews",
                    b: "Add learners, issue verifiable certificates at £15 each, and start collecting verified reviews.",
                  },
                ].map((s) => (
                  <li key={s.n} className="flex gap-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-reps-orange-border bg-reps-orange-soft text-[13px] font-bold text-reps-orange">
                      {s.n}
                    </span>
                    <div>
                      <h3 className="font-display text-[18px] font-bold text-white">
                        {s.t}
                      </h3>
                      <p className="mt-1 text-[14.5px] leading-relaxed text-white/70">
                        {s.b}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="relative overflow-hidden rounded-[22px] border border-reps-border">
              <img
                src={classroomAsset.url}
                alt="REPS-accredited classroom with tutor and cohort"
                width={1408}
                height={1008}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-reps-ink/70 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[720px] text-center">
            <SectionEyebrow>Pricing</SectionEyebrow>
            <SectionHeading className="mt-3">
              One flat annual fee. Unlimited accredited courses.
            </SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              No per-course fees, no listing surcharges, no hidden add-ons.
              Certificates are the only paid extra — priced per issued learner.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-[1080px] gap-6 lg:grid-cols-[1.35fr_1fr]">
            {/* Main tier card */}
            <div className="relative overflow-hidden rounded-[22px] border border-reps-orange-border bg-reps-panel/70 p-10 lg:p-12">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(50%_50%_at_100%_0%,rgba(255,122,0,0.18),transparent_70%)]"
              />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                  <Sparkles className="h-3 w-3" />
                  {TIER.label}
                </span>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-[56px] font-bold leading-none text-white">
                    {TIER.priceLabel}
                  </span>
                  <span className="text-[15px] text-white/60">{TIER.intervalLabel}</span>
                </div>
                <p className="mt-3 max-w-[440px] text-[15px] leading-relaxed text-white/75">
                  {TIER.blurb}
                </p>

                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    "Unlimited accredited course listings",
                    "Public provider website (/t/your-brand)",
                    "Homepage carousel + directory placement",
                    "Digital REPS-accredited badge & embed widget",
                    "Verified learner reviews + score badge",
                    "Certificate printing (£15 each)",
                    "Welcome article on the REPS blog",
                    "Priority provider support",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[14.5px] text-white/85">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-9 flex flex-wrap gap-3">
                  <Link
                    to="/contact"
                    className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                  >
                    Apply to become a provider <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/find-a-training-provider"
                    className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
                  >
                    See live providers
                  </Link>
                </div>
              </div>
            </div>

            {/* Add-ons card */}
            <div className="rounded-[22px] border border-reps-border bg-reps-panel/40 p-8 lg:p-10">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
                Only paid add-on
              </span>
              <h3 className="mt-3 font-display text-[24px] font-bold leading-tight text-white lg:text-[28px]">
                Learner certificates
              </h3>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-display text-[40px] font-bold leading-none text-white">
                  {CERTIFICATE_UNIT_PRICE_LABEL}
                </span>
                <span className="text-[14px] text-white/60">per certificate</span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-white/70">
                Branded, verifiable, printable REPS-accredited certificates.
                Includes a public verification URL and QR code for every learner.
              </p>
              <div className="mt-6 rounded-[12px] border border-reps-border bg-reps-ink p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-white/55">
                  Bulk pricing
                </p>
                <p className="mt-1 text-[14px] text-white/85">
                  Talk to us for cohorts of 50+ learners.
                </p>
              </div>
              <Link
                to="/contact"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/25 px-5 text-[13.5px] font-semibold text-white shadow-none hover:bg-white/10"
              >
                Talk to us <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>How REPS compares</SectionEyebrow>
            <SectionHeading className="mt-3">
              Built for fitness education — not a generic listing directory.
            </SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              A side-by-side of what you get with REPS vs generic training
              directories vs traditional awarding-body partner schemes.
              Methodology and data-collection notes in our{" "}
              <Link to="/comparison-methodology" className="text-reps-orange underline underline-offset-2">
                comparison methodology
              </Link>
              . Last checked: July 2026.
            </p>
          </div>
          <div className="mt-10 overflow-hidden rounded-[18px] border border-reps-border">
            <div className="grid grid-cols-4 border-b border-reps-border bg-reps-panel/60 text-[12px] font-semibold uppercase tracking-wider text-white/55">
              <div className="px-5 py-4">Feature</div>
              <div className="bg-reps-orange-soft px-5 py-4 text-reps-orange">REPS</div>
              <div className="px-5 py-4">Generic directories</div>
              <div className="px-5 py-4">Awarding-body schemes</div>
            </div>
            {[
              ["Unlimited course listings", "Yes — no per-course fee", "Per-listing charges typical", "Per-course endorsement fees"],
              ["Digital badge + widget", "Included", "Rarely included", "Sometimes, as add-on"],
              ["Verified learner reviews", "Included — verified graduates only", "Unverified / not offered", "Not offered"],
              ["Provider website page", "Included — /t/your-brand", "Basic listing only", "Directory row"],
              ["Learner certificates", "£15 each — verifiable", "Not offered", "Awarding-body cost"],
              ["Reach", "25,000+ pros on the register", "Consumer traffic only", "Awarding-body network"],
            ].map((row, i) => (
              <div
                key={row[0]}
                className={`grid grid-cols-4 text-[13.5px] ${
                  i % 2 === 0 ? "bg-reps-ink" : "bg-reps-panel/25"
                }`}
              >
                <div className="border-t border-reps-border/60 px-5 py-4 font-semibold text-white/90">
                  {row[0]}
                </div>
                <div className="border-t border-reps-border/60 bg-reps-orange-soft/25 px-5 py-4 text-white/85">
                  {row[1]}
                </div>
                <div className="border-t border-reps-border/60 px-5 py-4 text-white/70">
                  {row[2]}
                </div>
                <div className="border-t border-reps-border/60 px-5 py-4 text-white/70">
                  {row[3]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <MarketingFaq
        heading="Training-provider questions, answered."
        items={FAQ_ITEMS.map((item) => ({ q: item.q, a: item.a }))}
      />

      {/* FINAL CTA */}
      <FinalCta
        eyebrow={{ icon: Award, label: "Applications open — July 2026" }}
        heading="Get your courses in front of"
        headingAccent="25,000+ REPS pros."
        lede="Apply now — most providers are accredited and live within 3–4 weeks."
        primary={{ to: "/contact", label: "Apply to become a provider" }}
        secondary={{ to: "/find-a-training-provider", label: "See live providers" }}
      />

      <PublicFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-[28px] font-bold text-white lg:text-[36px]">
        {value}
      </div>
      <div className="mt-1 text-[12px] font-medium uppercase tracking-wider text-white/55">
        {label}
      </div>
    </div>
  );
}

function ReviewsWidgetMock() {
  const reviews = [
    { name: "Amelia R.", body: "Best Level 3 course I've done. Tutors were sharp, marking was fast.", stars: 5 },
    { name: "Jordan T.", body: "Nutrition CPD was genuinely useful — took my client work up a level.", stars: 5 },
    { name: "Priya S.", body: "Loved the online modules. Certificate arrived within 48 hours.", stars: 4 },
  ];
  return (
    <div className="w-full max-w-[440px] rounded-[18px] border border-reps-border bg-reps-ink p-6 shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-white/55">
            REPS verified reviews
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display text-[28px] font-bold text-white">4.8</span>
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4 fill-reps-orange text-reps-orange" />
              ))}
            </div>
          </div>
          <p className="mt-1 text-[12px] text-white/60">Based on 1,247 verified graduates</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-reps-orange-border bg-reps-orange-soft">
          <BadgeCheck className="h-6 w-6 text-reps-orange" />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {reviews.map((r) => (
          <div key={r.name} className="rounded-[12px] border border-reps-border bg-reps-panel/50 p-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-reps-orange text-reps-orange" />
                ))}
              </div>
              <span className="text-[12px] font-semibold text-white/70">{r.name}</span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/80">"{r.body}"</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-reps-border pt-4 text-[12px] text-white/55">
        <span className="inline-flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" /> Embed on your site
        </span>
        <span className="inline-flex items-center gap-1.5 text-reps-orange">
          <FileBadge className="h-3.5 w-3.5" /> Powered by REPS
        </span>
      </div>
    </div>
  );
}
