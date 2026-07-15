import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileBadge,
  FileCheck2,
  GraduationCap,
  Layers,
  Link2,
  MessageSquareQuote,
  Newspaper,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Users,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HeroOverlay } from "@/components/marketing/HeroOverlay";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";

import heroAsset from "@/assets/training-providers/hero.jpg.asset.json";
import badgeAsset from "@/assets/training-providers/badge.png.asset.json";
import certificateAsset from "@/assets/training-providers/certificate-of-achievement.jpg.asset.json";
import unitSummaryAsset from "@/assets/training-providers/learner-unit-summary.jpg.asset.json";
import { ORG_TIERS, CERTIFICATE_UNIT_PRICE_LABEL } from "@/lib/billing";

const TIER = ORG_TIERS.training_provider;

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What does REPs-endorsed mean?",
    a: '"REPs-endorsed" means REPs has reviewed the course against REPs professional standards. It does not mean the course is Ofqual-regulated, UKAS-accredited, government-approved or part of a regulated qualifications framework unless explicitly stated.',
  },
  {
    q: "Is this Ofqual regulated?",
    a: "No. REPs endorsement is an independent professional standards review — separate from Ofqual regulation. Providers who also hold Ofqual-regulated qualifications may list them alongside REPs-endorsed courses, but a REPs endorsement itself is not a regulated qualification.",
  },
  {
    q: "Can I submit unlimited courses?",
    a: "Yes. Training Provider membership covers unlimited course submissions and unlimited REPs-endorsed course listings. There are no per-course endorsement fees.",
  },
  {
    q: "What evidence do I need to submit a course?",
    a: "Syllabus, learning outcomes, assessment method and sample assessment, tutor CV and qualifications, delivery format (in-person, online, blended), learner support arrangements and proof of appropriate insurance. Full submission guidance is provided in the provider portal.",
  },
  {
    q: "How long does endorsement review take?",
    a: "Most course submissions are reviewed within 10 working days. Larger catalogues are batched — you can list a first course while the rest are in review.",
  },
  {
    q: "How do certificates work?",
    a: "You issue certificates through the provider portal. Each certificate carries the learner name, course title, unique certificate number, REPs course number, issue date and a public verification URL with QR code. Learners receive a digital PDF, and optional print-and-post is available.",
  },
  {
    q: "Are certificates included in the annual fee?",
    a: `No — certificates are the only paid add-on. They are ${CERTIFICATE_UNIT_PRICE_LABEL} per issued certificate. The annual membership covers unlimited course listings, your provider website, the endorsement badge, review widget, directory placement and welcome article.`,
  },
  {
    q: "What happens if my course is not endorsed?",
    a: "You'll receive written feedback against the review standards with the specific gaps. You can revise and resubmit at no extra cost. If REPs cannot endorse at least one of your courses, the annual fee is refundable within 30 days.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. Cancellation is immediate termination with no grace period. There is no monthly option; membership is annual. Refunds are only offered within 30 days if REPs cannot endorse at least one course.",
  },
  {
    q: "What happens to already-issued certificates if I leave REPs?",
    a: "Every certificate you have already issued remains valid and verifiable at its public URL. The learner's record does not depend on your active membership status.",
  },
];

export const Route = createFileRoute("/training-providers")({
  head: () => ({
    meta: [
      { title: "Training Provider Membership — REPs-endorsed courses · REPs" },
      {
        name: "description",
        content:
          "Get your fitness courses REPs-endorsed. Unlimited course listings, provider website, endorsement badge, verified reviews and verifiable learner certificates. £479/year.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Become a REPs-endorsed Training Provider" },
      {
        property: "og:description",
        content:
          "Unlimited REPs-endorsed course listings, provider website, endorsement badge, verified reviews, verifiable certificates. £479/year.",
      },
      { property: "og:url", content: "https://repsuk.org/training-providers" },
      {
        property: "og:image",
        content: `https://repsuk.org${certificateAsset.url}`,
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Become a REPs-endorsed Training Provider" },
      {
        name: "twitter:description",
        content:
          "REPs-endorsed course listings, provider website, verified reviews and verifiable certificates. £479/year.",
      },
    ],
    links: [{ rel: "canonical", href: "https://repsuk.org/training-providers" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "REPs-endorsed Training Provider Membership",
          description:
            "Annual membership for fitness training providers. Unlimited REPs-endorsed course listings, public provider website, digital endorsement badge, verified learner review collection and verifiable learner certificate issuance.",
          brand: { "@type": "Organization", name: "REPs" },
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
      <h3 className="mt-5 font-display text-[18px] font-bold leading-tight text-white">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-white/70">{body}</p>
    </div>
  );
}

const FEATURES = [
  {
    icon: Building2,
    title: "Public provider website",
    body: "A dedicated page at repsuk.org/t/your-brand with your endorsed courses, reviews, enquiry form and verification badge.",
  },
  {
    icon: BookOpen,
    title: "Unlimited REPs-endorsed course listings",
    body: "Submit as many courses as you like. Every approved course gets its own detail page, listing and endorsement badge.",
  },
  {
    icon: Users,
    title: "Course directory placement",
    body: "Endorsed courses are featured in the searchable REPs training-provider and course directory used by fitness professionals.",
  },
  {
    icon: Sparkles,
    title: "Homepage carousel eligibility",
    body: "Featured provider slots on the REPs homepage carousel for eligible endorsed courses.",
  },
  {
    icon: BadgeCheck,
    title: "Digital endorsement badge & widget",
    body: "Embed the REPs-endorsed badge on your website, learner emails, PDFs and social — every badge links back to your live REPs profile.",
  },
  {
    icon: MessageSquareQuote,
    title: "Verified learner review collection",
    body: "Reviews are invited from learners who received a certificate — no drive-by ratings. Displayed on your provider website and embeddable elsewhere.",
  },
  {
    icon: FileCheck2,
    title: "Certificate of Achievement issuance",
    body: "Issue Certificates of Achievement plus a Learner Unit Summary for every completed course, with a public verification URL.",
  },
  {
    icon: Newspaper,
    title: "Welcome article slot",
    body: "A featured editorial slot on the REPs blog when you launch as a REPs-endorsed provider.",
  },
  {
    icon: ShieldCheck,
    title: "Priority provider support",
    body: "Dedicated provider support channel for onboarding, course submissions and learner queries.",
  },
];

const CERT_POINTS = [
  { icon: FileCheck2, text: "Digital PDF certificate" },
  { icon: FileBadge, text: "Optional print-and-post workflow" },
  { icon: Link2, text: "Public verification token" },
  { icon: ClipboardCheck, text: "Learner Unit Summary included" },
  { icon: QrCode, text: `${CERTIFICATE_UNIT_PRICE_LABEL} per issued certificate` },
];

const ENDORSEMENT_STEPS = [
  {
    n: "1",
    icon: ClipboardCheck,
    title: "Apply",
    body: "Submit your organisation details and course information.",
  },
  {
    n: "2",
    icon: BookOpen,
    title: "Submit courses",
    body: "Upload syllabus, learning outcomes, assessment method, tutor evidence and delivery info.",
  },
  {
    n: "3",
    icon: ShieldCheck,
    title: "REPs reviews",
    body: "We assess course quality, assessment, tutor competence, insurance and wording.",
  },
  {
    n: "4",
    icon: BadgeCheck,
    title: "Publish & issue certificates",
    body: "Endorsed courses go live in the directory and you can issue verifiable certificates.",
  },
];

const STANDARDS = [
  {
    icon: BookOpen,
    title: "Course design",
    body: "Syllabus, outcomes, structure and learner journey.",
  },
  {
    icon: ClipboardCheck,
    title: "Assessment quality",
    body: "Assessment criteria, sample assessment, marking guidance and pass standard.",
  },
  {
    icon: UserCheck,
    title: "Tutor competence",
    body: "Tutor CV, qualifications, experience and scope of practice.",
  },
  {
    icon: ShieldCheck,
    title: "Delivery & quality assurance",
    body: "Learner support, complaints, appeals, delivery controls and certificate integrity.",
  },
];

const COMPARISON_ROWS: Array<[string, string | boolean, string | boolean, string | boolean]> = [
  ["Fitness-specific", true, false, "Varies"],
  ["Course endorsement review", true, false, true],
  ["Unlimited course listings", true, "Limited", "Varies"],
  ["Public provider website", true, false, "Limited"],
  ["Directory visibility", true, "Low", "Limited"],
  ["Certificate of Achievement", true, false, "Varies"],
  ["Learner Unit Summary", true, false, "Varies"],
  ["Public verification URL", true, false, "Limited"],
  ["Review widget", true, false, "Limited"],
  ["Digital badge", true, false, "Limited"],
  ["Annual price", "£479 / year", "Free / % commission", "Often higher fees"],
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
          alt="Fitness education classroom with REPs-endorsed provider delivering a course"
          width={1600}
          height={1008}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <HeroOverlay copySide="left" />
        <div className="relative mx-auto grid min-h-[720px] max-w-[1320px] items-start gap-10 px-6 pt-24 pb-20 lg:grid-cols-[1.05fr_1fr] lg:px-10 lg:pt-28 lg:pb-24">
          <div>
            <MarketingHeroEyebrow icon={GraduationCap} style={{ animationDelay: "0ms" }}>
              For training providers
            </MarketingHeroEyebrow>
            <h1
              className="mt-5 animate-fade-in font-display text-[38px] font-bold leading-[1.05] text-white lg:text-[58px]"
              style={{ animationDelay: "80ms" }}
            >
              Get your fitness courses{" "}
              <span className="text-reps-orange">REPs-endorsed.</span>
            </h1>
            <p
              className="mt-5 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/80"
              style={{ animationDelay: "180ms" }}
            >
              Submit unlimited courses for REPs endorsement, publish a verified
              provider website, issue verifiable learner certificates and get
              discovered by the professional fitness market — for £479/year.
            </p>
            <div
              className="mt-7 flex animate-fade-in flex-wrap gap-3"
              style={{ animationDelay: "260ms" }}
            >
              <Link
                to="/signup"
                search={{ type: "training_provider" } as never}
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Apply to become a REPs provider <ArrowRight className="h-4 w-4" />
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
              <TrustChip>£479/year</TrustChip>
              <TrustChip>Unlimited course listings</TrustChip>
              <TrustChip>Certificates £15 each</TrustChip>
              <TrustChip>Built for fitness education</TrustChip>
            </div>
          </div>

          {/* Hero certificate collage */}
          <div className="relative hidden min-h-[520px] lg:block">
            <div className="absolute right-[10%] top-[6%] w-[68%] rotate-[6deg] overflow-hidden rounded-[14px] border border-white/15 bg-white shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]">
              <img
                src={unitSummaryAsset.url}
                alt="Example REPs Learner Unit Summary showing completed units for a Level 3 course"
                className="block h-auto w-full"
              />
            </div>
            <div className="absolute left-0 top-[24%] w-[72%] -rotate-[4deg] overflow-hidden rounded-[14px] border border-white/15 bg-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.75)]">
              <img
                src={certificateAsset.url}
                alt="Example REPs Certificate of Achievement issued by a REPs-endorsed training provider"
                className="block h-auto w-full"
              />
            </div>
            <div className="absolute bottom-[2%] right-[2%] w-[34%] max-w-[180px] drop-shadow-[0_20px_40px_rgba(255,122,0,0.25)]">
              <img
                src={badgeAsset.url}
                alt="REPs-endorsed digital badge"
                className="block h-auto w-full"
              />
            </div>
          </div>

          {/* Mobile stacked visual */}
          <div className="relative flex flex-col gap-4 lg:hidden">
            <div className="overflow-hidden rounded-[14px] border border-white/15 bg-white shadow-2xl">
              <img
                src={certificateAsset.url}
                alt="Example REPs Certificate of Achievement"
                className="block h-auto w-full"
              />
            </div>
            <div className="overflow-hidden rounded-[14px] border border-white/15 bg-white shadow-2xl">
              <img
                src={unitSummaryAsset.url}
                alt="Example REPs Learner Unit Summary"
                className="block h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section id="included" className="bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>What's included</SectionEyebrow>
            <SectionHeading className="mt-3">
              Everything a training provider needs in one annual fee.
            </SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              No per-course fees, no per-listing surcharges, no paid add-ons —
              except learner certificates. Every feature in Training Provider
              membership is included in the £479 annual fee.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* CERTIFICATE SHOWCASE */}
      <section className="bg-reps-ink">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div>
              <SectionEyebrow>Certificate system</SectionEyebrow>
              <SectionHeading className="mt-3">
                Issue certificates learners can verify.
              </SectionHeading>
              <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
                Every issued certificate includes a Certificate of Achievement,
                Learner Unit Summary, unique certificate number, REPs course
                number and public verification URL.
              </p>
              <ul className="mt-7 space-y-3 text-[14.5px] text-white/85">
                {CERT_POINTS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-[14px] border border-reps-border bg-reps-panel/40 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-reps-orange" />
                  <p className="text-[13.5px] leading-relaxed text-white/75">
                    This certificate confirms completion of a provider-issued
                    course endorsed by REPs. It is not an Ofqual-regulated
                    qualification unless explicitly stated.
                  </p>
                </div>
              </div>
            </div>

            {/* Overlapping certificate mocks */}
            <div className="relative min-h-[520px] lg:min-h-[640px]">
              <div className="absolute right-0 top-0 w-[78%] rotate-[4deg] overflow-hidden rounded-[14px] border border-white/15 bg-white shadow-[0_40px_80px_-25px_rgba(0,0,0,0.7)]">
                <img
                  src={unitSummaryAsset.url}
                  alt="REPs Learner Unit Summary listing the completed units on a REPs-endorsed course"
                  className="block h-auto w-full"
                />
              </div>
              <div className="absolute bottom-0 left-0 w-[80%] -rotate-[3deg] overflow-hidden rounded-[14px] border border-white/15 bg-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.75)]">
                <img
                  src={certificateAsset.url}
                  alt="REPs Certificate of Achievement issued by a REPs-endorsed training provider"
                  className="block h-auto w-full"
                />
              </div>
            </div>
          </div>
          <p className="mt-10 text-center text-[12.5px] uppercase tracking-[0.18em] text-white/45">
            Example REPs-issued Certificate of Achievement and Learner Unit Summary.
          </p>
        </div>
      </section>

      {/* PROVIDER WEBSITE */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div>
              <SectionEyebrow>Provider website</SectionEyebrow>
              <SectionHeading className="mt-3">
                Turn your provider profile into a discovery page.
              </SectionHeading>
              <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
                Your provider website gives learners and professionals a live
                place to verify your organisation, view endorsed courses and
                make enquiries.
              </p>
              <ul className="mt-6 space-y-3 text-[14.5px] text-white/80">
                {[
                  "Provider name, logo and about section",
                  "Digital REPs-endorsed badge and course listings",
                  "Verified learner reviews and star rating",
                  "Enquiry CTA that routes leads to your inbox",
                  "Certificate verification trust markers",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ProviderPageMock />
          </div>
        </div>
      </section>

      {/* REVIEWS & BADGE TRUST */}
      <section className="bg-reps-ink">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="grid gap-6 sm:grid-cols-[1.15fr_1fr]">
                <ReviewsWidgetMock />
                <BadgeShowcase />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <SectionEyebrow>Reviews & badge</SectionEyebrow>
              <SectionHeading className="mt-3">
                Turn learner feedback into trust.
              </SectionHeading>
              <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
                Collect verified learner reviews after certificate issuance and
                display them on your REPs provider website or your own external
                website using the provider review widget.
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-white/60">
                Preview of the provider review widget and endorsement badge —
                part of the REPs provider trust assets and review collection
                and display toolkit.
              </p>
              <ul className="mt-6 space-y-3 text-[14.5px] text-white/85">
                <li className="flex items-start gap-2">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 fill-reps-orange text-reps-orange" />
                  <span>Only learners who received a certificate can review</span>
                </li>
                <li className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  <span>Embeddable score badge and full review widget</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  <span>Reply publicly and flag issues for REPs moderation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW ENDORSEMENT WORKS */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>How endorsement works</SectionEyebrow>
            <SectionHeading className="mt-3">
              From application to issued certificates.
            </SectionHeading>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {ENDORSEMENT_STEPS.map(({ n, icon: Icon, title, body }) => (
              <div
                key={n}
                className="relative rounded-[18px] border border-reps-border bg-reps-panel/40 p-7"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange text-[14px] font-bold text-white">
                  {n}
                </span>
                <Icon className="mt-6 h-6 w-6 text-reps-orange" />
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">
                  {title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENDORSEMENT STANDARDS */}
      <section className="bg-reps-ink">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>Endorsement standards</SectionEyebrow>
            <SectionHeading className="mt-3">
              Reviewed against REPs course standards.
            </SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              Endorsement is a quality review — not a pay-to-badge scheme.
              Every submitted course is assessed against four core standards
              before it can carry the REPs-endorsed mark.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STANDARDS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-7"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-reps-orange-border bg-reps-orange-soft">
                  <Icon className="h-5 w-5 text-reps-orange" />
                </div>
                <h3 className="mt-5 font-display text-[17px] font-bold text-white">
                  {title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[720px] text-center">
            <SectionEyebrow>Pricing</SectionEyebrow>
            <SectionHeading className="mt-3">
              One annual fee. Everything included.
            </SectionHeading>
          </div>

          <div className="mx-auto mt-12 grid max-w-[1080px] gap-6 lg:grid-cols-[1.35fr_1fr]">
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
                  <span className="text-[15px] text-white/60">
                    {TIER.intervalLabel}
                  </span>
                </div>
                <p className="mt-3 max-w-[440px] text-[15px] leading-relaxed text-white/75">
                  {TIER.blurb}
                </p>

                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    "Unlimited REPs-endorsed course listings",
                    "Public provider website (/t/your-brand)",
                    "Course directory placement",
                    "Homepage carousel eligibility",
                    "Digital endorsement badge & widget",
                    "Verified learner review collection",
                    "Welcome article slot",
                    "Priority provider support",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[14.5px] text-white/85"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-9 flex flex-wrap gap-3">
                  <Link
                    to="/signup"
                    search={{ type: "training_provider" } as never}
                    className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                  >
                    Apply to become a REPs provider <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/contact"
                    search={{ topic: "training-provider" } as never}
                    className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
                  >
                    Talk to us
                  </Link>
                </div>

                <p className="mt-6 text-[12.5px] leading-relaxed text-white/55">
                  Annual only · VAT added where applicable · Immediate
                  cancellation (no grace period) · Refundable within 30 days
                  only if REPs cannot endorse at least one provider course.
                </p>
              </div>
            </div>

            {/* Add-on */}
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
                Digital PDF certificate included. Optional print-and-post
                workflow available. Includes Learner Unit Summary and a public
                verification URL for every learner.
              </p>
              <ul className="mt-5 space-y-2 text-[13.5px] text-white/75">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
                  <span>Certificate of Achievement + Learner Unit Summary</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
                  <span>Unique certificate number & REPs course number</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
                  <span>QR code + public verification URL</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="bg-reps-ink">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>How REPs compares</SectionEyebrow>
            <SectionHeading className="mt-3">
              Why providers choose REPs.
            </SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              A side-by-side against generic course marketplaces and
              traditional quality-licence schemes. Methodology in our{" "}
              <Link
                to="/comparison-methodology"
                className="text-reps-orange underline underline-offset-2"
              >
                comparison methodology
              </Link>
              . Last checked: July 2026.
            </p>
          </div>
          <div className="mt-10 overflow-hidden rounded-[18px] border border-reps-border">
            <div className="grid grid-cols-4 border-b border-reps-border bg-reps-panel/60 text-[12px] font-semibold uppercase tracking-wider text-white/55">
              <div className="px-5 py-4">Feature</div>
              <div className="bg-reps-orange-soft px-5 py-4 text-reps-orange">
                REPs Training Provider
              </div>
              <div className="px-5 py-4">Generic course marketplace</div>
              <div className="px-5 py-4">Traditional quality licence scheme</div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row[0] as string}
                className={`grid grid-cols-4 text-[13.5px] ${
                  i % 2 === 0 ? "bg-reps-ink" : "bg-reps-panel/25"
                }`}
              >
                <div className="border-t border-reps-border/60 px-5 py-4 font-semibold text-white/90">
                  {row[0]}
                </div>
                {[row[1], row[2], row[3]].map((cell, ci) => (
                  <div
                    key={ci}
                    className={`border-t border-reps-border/60 px-5 py-4 ${
                      ci === 0
                        ? "bg-reps-orange-soft/25 text-white/90"
                        : "text-white/70"
                    }`}
                  >
                    {typeof cell === "boolean" ? (
                      cell ? (
                        <CheckCircle2 className="h-4 w-4 text-reps-orange" />
                      ) : (
                        <span className="text-white/40">—</span>
                      )
                    ) : (
                      cell
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-white/45">
            Correct at time of publishing. Features and pricing may change.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <MarketingFaq
        heading="Frequently asked questions."
        items={FAQ_ITEMS.map((item) => ({ q: item.q, a: item.a }))}
      />

      {/* FINAL CTA */}
      <FinalCta
        eyebrow={{ icon: Award, label: "Applications open" }}
        heading="Get your fitness courses"
        headingAccent="REPs-endorsed."
        lede="Apply for Training Provider membership and start submitting your courses for REPs review."
        primary={{
          to: "/signup",
          label: "Apply to become a REPs provider",
        }}
        secondary={{
          to: "/contact",
          label: "Talk to us",
        }}
      />

      <PublicFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */

function ProviderPageMock() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel/50 shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-reps-border bg-reps-ink px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-3 truncate text-[11px] text-white/45">
          repsuk.org/t/your-brand
        </span>
      </div>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] border border-reps-orange-border bg-reps-orange-soft">
            <GraduationCap className="h-7 w-7 text-reps-orange" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-[18px] font-bold text-white">
                Your Fitness Education
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2 py-0.5 text-[10px] font-semibold text-reps-orange">
                <BadgeCheck className="h-3 w-3" /> Endorsed
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[12px] text-white/70">
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className="h-3 w-3 fill-reps-orange text-reps-orange"
                  />
                ))}
              </div>
              <span>4.8 · 128 reviews</span>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            { level: "Level 3", title: "Personal Trainer" },
            { level: "Level 4", title: "Strength & Conditioning" },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-[12px] border border-reps-border bg-reps-ink p-4"
            >
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-reps-orange">
                {c.level} · Endorsed
              </p>
              <p className="mt-1 text-[13px] font-semibold text-white">
                {c.title}
              </p>
              <p className="mt-1 text-[11.5px] text-white/60">
                Blended · 12 weeks
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-[10px] border border-reps-border bg-reps-ink px-4 py-3">
          <span className="text-[12.5px] text-white/70">
            Interested in a course?
          </span>
          <span className="inline-flex items-center gap-1 rounded-[8px] bg-reps-orange px-3 py-1.5 text-[11.5px] font-semibold text-white">
            Enquire now <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

function ReviewsWidgetMock() {
  const reviews = [
    { name: "Amelia R.", body: "Excellent course and support.", stars: 5 },
    { name: "Jordan T.", body: "Great learning experience.", stars: 5 },
  ];
  return (
    <div className="w-full rounded-[18px] border border-reps-border bg-reps-panel/50 p-6 shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
            REPs verified reviews
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display text-[26px] font-bold text-white">
              4.8
            </span>
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5 fill-reps-orange text-reps-orange"
                />
              ))}
            </div>
          </div>
          <p className="mt-1 text-[11.5px] text-white/60">
            Based on 128 verified reviews
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-reps-orange-border bg-reps-orange-soft">
          <BadgeCheck className="h-5 w-5 text-reps-orange" />
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {reviews.map((r) => (
          <div
            key={r.name}
            className="rounded-[10px] border border-reps-border bg-reps-ink p-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-2.5 w-2.5 fill-reps-orange text-reps-orange"
                  />
                ))}
              </div>
              <span className="text-[11px] font-semibold text-white/70">
                {r.name}
              </span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
                Verified
              </span>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/80">
              "{r.body}"
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-reps-border pt-3 text-[11px] text-white/55">
        <span className="inline-flex items-center gap-1.5">
          <Layers className="h-3 w-3" /> Embed on your site
        </span>
        <span className="inline-flex items-center gap-1.5 text-reps-orange">
          <FileBadge className="h-3 w-3" /> Powered by REPs
        </span>
      </div>
    </div>
  );
}

function BadgeShowcase() {
  return (
    <div className="relative flex items-center justify-center rounded-[18px] border border-reps-border bg-reps-panel/40 p-6">
      <div className="absolute inset-0 rounded-[18px] bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,122,0,0.18),transparent_72%)]" />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <img
          src={badgeAsset.url}
          alt="REPs-endorsed digital badge"
          className="h-auto w-full max-w-[180px] drop-shadow-[0_20px_40px_rgba(255,122,0,0.25)]"
        />
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-white/70">
          Embed our badge on your website
        </p>
        <p className="text-[11.5px] text-white/55">
          Includes a live link back to your REPs profile.
        </p>
        <span className="mt-1 text-[11.5px] font-semibold text-reps-orange">
          Download badge
        </span>
      </div>
    </div>
  );
}
