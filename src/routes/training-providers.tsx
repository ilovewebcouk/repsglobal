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
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";

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
      {
        property: "og:title",
        content: "REPs-endorsed Training Provider Membership",
      },
      {
        property: "og:description",
        content:
          "Unlimited REPs-endorsed course listings, provider website, endorsement badge, verified reviews, verifiable certificates. £479/year.",
      },
      { property: "og:type", content: "product" },
      { property: "og:url", content: "https://repsuk.org/training-providers" },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: "REPs-endorsed Training Provider Membership",
      },
      {
        name: "twitter:description",
        content:
          "REPs-endorsed course listings, provider website, verified reviews and verifiable certificates. £479/year.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://repsuk.org/training-providers" },
    ],
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

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "certificates", label: "Certificates" },
  { id: "trust", label: "Reviews & badge" },
  { id: "pricing", label: "Pricing" },
  { id: "endorsement", label: "Endorsement" },
  { id: "faq", label: "FAQ" },
];

function SectionNav() {
  return (
    <nav
      aria-label="On this page"
      className="sticky top-14 z-30 hidden bg-reps-ink/85 backdrop-blur shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)] md:block"
    >
      <div className="mx-auto flex h-12 max-w-[1320px] items-center gap-1 overflow-x-auto px-6 lg:px-10">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-white/60 transition-colors hover:bg-reps-panel/60 hover:text-white"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function TrustChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-border bg-reps-panel/70 px-3 py-1.5 text-[12px] font-medium text-white/80 backdrop-blur">
      <CheckCircle2 className="h-3.5 w-3.5 text-reps-orange" />
      {children}
    </span>
  );
}

/**
 * In-DOM REPs-endorsed digital badge. Semantic tokens only — no PNG.
 * Replaces the previous flat "accredited" PNG mockup.
 */
function EndorsedBadge({ size = 160 }: { size?: number }) {
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-label="REPs-endorsed digital badge"
      role="img"
    >
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,122,0,0.28),transparent_72%)]" />
      <svg viewBox="0 0 200 200" className="relative h-full w-full">
        <defs>
          <linearGradient id="rep-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF9A3C" />
            <stop offset="1" stopColor="#E56A00" />
          </linearGradient>
          <path
            id="rep-arc-top"
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
          />
          <path
            id="rep-arc-bottom"
            d="M 34 108 A 66 66 0 0 0 166 108"
            fill="none"
          />
        </defs>
        {/* Ring */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="url(#rep-ring)"
          strokeWidth="2.5"
        />
        <circle
          cx="100"
          cy="100"
          r="82"
          fill="hsl(220 22% 8%)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
        {/* Arc text top */}
        <text
          fill="#FF7A00"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="12.5"
          fontWeight="700"
          letterSpacing="3"
        >
          <textPath href="#rep-arc-top" startOffset="50%" textAnchor="middle">
            REPS · ENDORSED
          </textPath>
        </text>
        {/* Arc text bottom */}
        <text
          fill="rgba(255,255,255,0.55)"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="9.5"
          fontWeight="600"
          letterSpacing="3.5"
        >
          <textPath
            href="#rep-arc-bottom"
            startOffset="50%"
            textAnchor="middle"
          >
            TRAINING · PROVIDER
          </textPath>
        </text>
        {/* Star separators */}
        <g fill="#FF7A00">
          <circle cx="42" cy="100" r="1.6" />
          <circle cx="158" cy="100" r="1.6" />
        </g>
        {/* Centre monogram R */}
        <text
          x="100"
          y="118"
          textAnchor="middle"
          fill="#FF7A00"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="60"
          fontWeight="800"
          letterSpacing="-2"
        >
          R
        </text>
      </svg>
    </div>
  );
}

/**
 * Elegant placeholder for the Certificate of Achievement.
 * Replaces the low-fidelity JPG. You upload the real design later
 * and we swap this back to <img />.
 */
function CertificatePlaceholder() {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-reps-border bg-gradient-to-br from-[#12131a] to-[#0a0b10] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(65%_45%_at_50%_0%,rgba(255,122,0,0.10),transparent_70%)]"
      />
      {/* Watermark R */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center opacity-[0.04]"
      >
        <span className="font-display text-[280px] font-bold leading-none text-white">
          R
        </span>
      </div>
      <div className="relative aspect-[1.414/1] p-8 lg:p-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-reps-orange">
              <span className="font-display text-[15px] font-bold leading-none text-white">
                R
              </span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
              REPs · Endorsed
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/40">
            Cert № 000-000
          </span>
        </div>

        {/* Body */}
        <div className="mt-8 lg:mt-12">
          <p className="text-[10.5px] uppercase tracking-[0.28em] text-reps-orange">
            Certificate of Achievement
          </p>
          <p className="mt-4 font-display text-[22px] font-bold leading-tight text-white lg:text-[28px]">
            [ Learner name ]
          </p>
          <p className="mt-3 max-w-[520px] text-[12.5px] leading-relaxed text-white/55">
            has successfully completed the REPs-endorsed course
          </p>
          <p className="mt-2 text-[15px] font-semibold text-white/90 lg:text-[17px]">
            [ Course title · Level 3 ]
          </p>
        </div>

        {/* Footer row */}
        <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between lg:bottom-10 lg:left-12 lg:right-12">
          <div>
            <p className="text-[9.5px] uppercase tracking-[0.22em] text-white/35">
              Issue date
            </p>
            <p className="mt-1 text-[12px] font-medium text-white/70">
              — · — · ——
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9.5px] uppercase tracking-[0.22em] text-white/35">
              Verify at
            </p>
            <p className="mt-1 text-[12px] font-medium text-reps-orange">
              repsuk.org/verify/…
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-[6px] border border-white/15 bg-white/[0.03]">
            <QrCode className="h-6 w-6 text-white/45" />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wider text-reps-orange">
        Preview
      </div>
    </div>
  );
}

/**
 * Placeholder for the Learner Unit Summary — companion document.
 * Portrait-leaning, lists placeholder units.
 */
function UnitSummaryPlaceholder() {
  const units = [
    "Anatomy & physiology fundamentals",
    "Programme design for hypertrophy",
    "Nutrition for body composition",
    "Client screening & consultation",
    "Ethics, safeguarding & scope of practice",
  ];
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-reps-border bg-gradient-to-br from-[#12131a] to-[#0a0b10] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(65%_45%_at_50%_0%,rgba(255,122,0,0.08),transparent_70%)]"
      />
      <div className="relative p-8 lg:p-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-reps-orange">
              <span className="font-display text-[13px] font-bold leading-none text-white">
                R
              </span>
            </div>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/70">
              Learner Unit Summary
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/40">
            Companion doc
          </span>
        </div>

        <div className="mt-6 border-t border-reps-border/60 pt-5">
          <p className="text-[10.5px] uppercase tracking-[0.22em] text-white/40">
            Learner
          </p>
          <p className="mt-1 text-[15px] font-semibold text-white/90">
            [ Learner name ]
          </p>
        </div>

        <div className="mt-5">
          <p className="text-[10.5px] uppercase tracking-[0.22em] text-white/40">
            Units completed
          </p>
          <ul className="mt-3 divide-y divide-reps-border/50">
            {units.map((u, i) => (
              <li
                key={u}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="flex items-center gap-2.5 text-[12.5px] text-white/80">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-reps-orange-border bg-reps-orange-soft text-[10px] font-semibold text-reps-orange">
                    {i + 1}
                  </span>
                  {u}
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-reps-orange" />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-reps-border/60 pt-4 text-[11px]">
          <span className="text-white/45">Endorsed by REPs</span>
          <span className="font-medium text-reps-orange">
            repsuk.org/verify/…
          </span>
        </div>
      </div>
      <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wider text-reps-orange">
        Preview
      </div>
    </div>
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
    body: "Submit your organisation details and course information through the provider portal.",
  },
  {
    n: "2",
    icon: BookOpen,
    title: "Submit courses",
    body: "Upload syllabus, learning outcomes, assessment method, tutor evidence and delivery format.",
  },
  {
    n: "3",
    icon: ShieldCheck,
    title: "REPs reviews",
    body: "REPs assesses course design, assessment, tutor competence, insurance and wording against endorsement standards.",
  },
  {
    n: "4",
    icon: BadgeCheck,
    title: "Publish & issue",
    body: "Endorsed courses go live in the directory. Start issuing verifiable certificates the same day.",
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

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-reps-ink">
        {/* Ambient glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 65% at 12% 0%, rgba(255,122,0,0.18), transparent 70%), radial-gradient(50% 60% at 100% 30%, rgba(255,122,0,0.10), transparent 72%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-reps-ink"
        />

        <div className="relative mx-auto grid max-w-[1320px] items-center gap-14 px-6 pb-20 pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-10 lg:pb-28 lg:pt-28">
          {/* Copy */}
          <div className="flex flex-col">
            <MarketingHeroEyebrow icon={GraduationCap} style={{ animationDelay: "0ms" }}>
              For training providers
            </MarketingHeroEyebrow>

            <h1
              className="mt-6 animate-fade-in font-display text-[38px] font-bold leading-[1.05] text-white lg:text-[64px]"
              style={{ animationDelay: "80ms" }}
            >
              Get your courses
              <br />
              <span className="text-reps-orange">REPs-endorsed.</span>
            </h1>

            <p
              className="mt-6 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/75"
              style={{ animationDelay: "180ms" }}
            >
              Submit unlimited courses for REPs endorsement, publish a verified
              provider website, issue verifiable learner certificates and get
              discovered by the professional fitness market — for £479/year.
            </p>

            <div
              className="mt-8 flex animate-fade-in flex-wrap gap-3"
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
                href="#pricing"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
              >
                See what's included
              </a>
            </div>

            <div
              className="mt-8 flex animate-fade-in flex-wrap gap-2"
              style={{ animationDelay: "340ms" }}
            >
              <TrustChip>£479/year · annual</TrustChip>
              <TrustChip>Unlimited course listings</TrustChip>
              <TrustChip>Certificates £15 each</TrustChip>
            </div>
          </div>

          {/* Single certificate feature — no tilted collage */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-8 rounded-[32px] bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,122,0,0.16),transparent_72%)]"
            />
            <div className="relative animate-fade-in" style={{ animationDelay: "220ms" }}>
              <CertificatePlaceholder />

              {/* Floating verified card */}
              <div className="absolute -bottom-6 -left-6 hidden max-w-[260px] rounded-[16px] border border-reps-border bg-reps-panel/95 p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur lg:block">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/15">
                    <BadgeCheck className="h-4.5 w-4.5 text-emerald-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                      REPs-endorsed
                    </p>
                    <p className="mt-1 text-[12.5px] leading-snug text-white/75">
                      Every certificate carries a public verification URL and
                      QR code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION NAV (sticky) ─────────────────────────────── */}
      <SectionNav />

      {/* ─── WHAT'S INCLUDED ──────────────────────────────────── */}
      <section id="overview" className="bg-reps-panel/20 scroll-mt-32">
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

      {/* ─── CERTIFICATE SHOWCASE ─────────────────────────────── */}
      <section id="certificates" className="bg-reps-ink scroll-mt-32">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>Certificate system</SectionEyebrow>
            <SectionHeading className="mt-3">
              Issue certificates learners can verify.
            </SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              Every issued certificate includes a Certificate of Achievement,
              Learner Unit Summary, unique certificate number, REPs course
              number and public verification URL.
            </p>
          </div>

          {/* Single-column feature — one big certificate, then companion doc + copy */}
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
            <div>
              <CertificatePlaceholder />
              <p className="mt-4 text-center text-[11.5px] uppercase tracking-[0.18em] text-white/45">
                Example REPs Certificate of Achievement · design placeholder
              </p>
            </div>
            <div className="flex flex-col gap-8">
              <UnitSummaryPlaceholder />
              <div className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-7">
                <h3 className="font-display text-[18px] font-bold text-white">
                  Every certificate includes
                </h3>
                <ul className="mt-4 space-y-3 text-[14px] text-white/85">
                  {CERT_POINTS.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-2.5">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 rounded-[10px] border border-reps-border bg-reps-ink p-4">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                    <p className="text-[12.5px] leading-relaxed text-white/70">
                      REPs certificates confirm completion of a provider-issued
                      course endorsed by REPs. They are not Ofqual-regulated
                      qualifications unless explicitly stated.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROVIDER WEBSITE ─────────────────────────────────── */}
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
                  "REPs-endorsed badge and course listings",
                  "Verified learner reviews and star rating",
                  "Enquiry CTA that routes leads to your inbox",
                  "Certificate verification trust markers",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
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

      {/* ─── REVIEWS & BADGE ──────────────────────────────────── */}
      <section id="trust" className="bg-reps-ink scroll-mt-32">
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
              <ul className="mt-6 space-y-3 text-[14.5px] text-white/85">
                <li className="flex items-start gap-2.5">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 fill-reps-orange text-reps-orange" />
                  <span>Only learners who received a certificate can review</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  <span>Embeddable score badge and full review widget</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  <span>Reply publicly and flag issues for REPs moderation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING (moved up to ~55% of page) ───────────────── */}
      <section id="pricing" className="bg-reps-panel/25 scroll-mt-32">
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
                className="absolute inset-0 bg-[radial-gradient(50%_50%_at_100%_0%,rgba(255,122,0,0.22),transparent_70%)]"
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

      {/* ─── HOW ENDORSEMENT WORKS + STANDARDS (vertical timeline) ── */}
      <section id="endorsement" className="bg-reps-ink scroll-mt-32">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>How endorsement works</SectionEyebrow>
            <SectionHeading className="mt-3">
              From application to issued certificates.
            </SectionHeading>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
              Endorsement is a quality review — not a pay-to-badge scheme.
              Every submitted course is assessed against four core standards
              before it can carry the REPs-endorsed mark.
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1fr]">
            {/* Vertical timeline */}
            <ol className="relative border-l border-reps-border/70 pl-6">
              {ENDORSEMENT_STEPS.map(({ n, icon: Icon, title, body }) => (
                <li key={n} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[34px] flex h-9 w-9 items-center justify-center rounded-full border border-reps-orange-border bg-reps-orange text-[13px] font-bold text-white">
                    {n}
                  </span>
                  <div className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-6">
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4.5 w-4.5 text-reps-orange" />
                      <h3 className="font-display text-[17px] font-bold text-white">
                        {title}
                      </h3>
                    </div>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Standards panel */}
            <div className="rounded-[22px] border border-reps-border bg-reps-panel/30 p-8 lg:p-10">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange">
                Endorsement standards
              </span>
              <h3 className="mt-3 font-display text-[22px] font-bold leading-tight text-white lg:text-[26px]">
                Reviewed against four core standards.
              </h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {STANDARDS.map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    className="rounded-[14px] border border-reps-border bg-reps-ink/60 p-5"
                  >
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-reps-orange-border bg-reps-orange-soft">
                      <Icon className="h-4 w-4 text-reps-orange" />
                    </div>
                    <h4 className="mt-4 font-display text-[15px] font-bold text-white">
                      {title}
                    </h4>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ───────────────────────────────────────── */}
      <section className="bg-reps-panel/15">
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

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <div id="faq" className="scroll-mt-32">
        <MarketingFaq
          heading="Frequently asked questions."
          items={FAQ_ITEMS.map((item) => ({ q: item.q, a: item.a }))}
        />
      </div>

      {/* ─── FINAL CTA (inline, carries search params) ────────── */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
          <div className="relative overflow-hidden rounded-[24px] border border-reps-border bg-gradient-to-br from-reps-panel via-reps-panel to-reps-ink p-10 text-center lg:p-16">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,122,0,0.20),transparent_70%)]"
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                <Award className="h-3 w-3" />
                Applications open
              </span>
              <h2 className="mt-5 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
                Get your fitness courses
                <br />
                <span className="text-reps-orange">REPs-endorsed.</span>
              </h2>
              <p className="mx-auto mt-3 max-w-[540px] text-[15px] text-white/70">
                Apply for Training Provider membership and start submitting
                your courses for REPs review.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  to="/signup"
                  search={{ type: "training_provider" } as never}
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  Apply to become a REPs provider{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  search={{ topic: "training-provider" } as never}
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
                >
                  Talk to us
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
              <span>Example provider preview</span>
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
    { name: "Learner A", body: "Course structure and support were excellent.", stars: 5 },
    { name: "Learner B", body: "Great tutor and clear assessment.", stars: 5 },
  ];
  return (
    <div className="w-full rounded-[18px] border border-reps-border bg-reps-panel/50 p-6 shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
            REPs verified reviews
          </p>
          <p className="mt-2 text-[12px] text-white/55">
            Preview · your rating appears once learners review
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
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
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
    <div className="relative flex flex-col items-center justify-center gap-4 rounded-[18px] border border-reps-border bg-reps-panel/40 p-6 text-center">
      <EndorsedBadge size={168} />
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-white/70">
        Embed the badge on your website
      </p>
      <p className="text-[11.5px] text-white/55">
        Every badge links back to your live REPs provider profile.
      </p>
      <span className="mt-1 text-[11.5px] font-semibold text-reps-orange">
        Download badge
      </span>
    </div>
  );
}
