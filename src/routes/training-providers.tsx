import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  ListChecks,
  Newspaper,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HeroOverlay } from "@/components/marketing/HeroOverlay";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { BlockHeading } from "@/components/marketing/BlockHeading";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";

import { ORG_TIERS, CERTIFICATE_UNIT_PRICE_LABEL } from "@/lib/billing";

import certificateAsset from "@/assets/training-providers/certificate-of-achievement.png.asset.json";
import unitSummaryAsset from "@/assets/training-providers/learner-unit-summary.png.asset.json";
import classroomAsset from "@/assets/training-providers/classroom-tutor.jpg.asset.json";
import pilatesAsset from "@/assets/training-providers/pilates-class.jpg.asset.json";
import spinAsset from "@/assets/training-providers/spin-class.jpg.asset.json";
import studyingAsset from "@/assets/training-providers/studying.jpg.asset.json";

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
          "A professional endorsement scheme for fitness training providers. Independent course review, public recognition, verified learner reviews and REPs-issued certificates. £479/year.",
      },
      { property: "og:title", content: "REPs-endorsed Training Provider Membership" },
      {
        property: "og:description",
        content:
          "Independent course review, public recognition, verified learner reviews and REPs-issued certificates. £479/year.",
      },
      { property: "og:type", content: "product" },
      { property: "og:image", content: `https://repsuk.org${certificateAsset.url}` },
      { property: "og:url", content: "https://repsuk.org/training-providers" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "REPs-endorsed Training Provider Membership" },
      {
        name: "twitter:description",
        content:
          "Independent course review, verified learner reviews and REPs-issued certificates. £479/year.",
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

/* ---------------------------------------------------------------- */
/* Static content                                                    */
/* ---------------------------------------------------------------- */

const PILLARS = [
  {
    n: "01",
    icon: ClipboardCheck,
    title: "Independent course endorsement.",
    body: "REPs reviews syllabus, learning outcomes, assessment method, tutor competence and quality controls before a course carries the REPs-endorsed mark.",
  },
  {
    n: "02",
    icon: ShieldCheck,
    title: "Public trust and visibility.",
    body: "Approved providers receive a public provider website, a place in the REPs course directory and an endorsement badge that resolves to a live public verification page.",
  },
  {
    n: "03",
    icon: FileCheck2,
    title: "Learner certificate evidence.",
    body: "Issue REPs-endorsed Certificates of Achievement and Learner Unit Summaries. Every certificate carries a unique number and a public verification URL learners can share.",
  },
];

const REVIEW_STANDARDS = [
  {
    title: "Course design",
    body: "Aims, learning outcomes and structure reviewed against REPs course standards — appropriate scope, sequencing and depth for the stated level.",
  },
  {
    title: "Assessment quality",
    body: "Assessment method, evidence requirements and sample assessment materials reviewed for validity, reliability and fairness.",
  },
  {
    title: "Tutor competence",
    body: "Tutor qualifications, occupational experience and CPD reviewed to confirm competence to deliver and assess the course as designed.",
  },
  {
    title: "Delivery and quality assurance",
    body: "Delivery format, learner support, internal verification and complaint handling reviewed against REPs professional standards.",
  },
];

const RECEIVE = [
  "Public provider website",
  "Unlimited endorsed course listings",
  "REPs course directory placement",
  "Homepage carousel eligibility",
  "Digital endorsement badge",
  "Verified learner reviews",
  "Certificate issuing (per learner)",
  "Welcome article on launch",
  "Priority provider support",
];

const FEATURE_REEL = [
  {
    eyebrow: "Course delivery",
    title: "Tutor-led learning environments",
    body: "Training providers can evidence how learners are taught, supported and assessed in real course settings.",
    image: classroomAsset.url,
    alt: "A REPs tutor teaching anatomy and course evidence to adult fitness learners in a classroom.",
  },
  {
    eyebrow: "Practical instruction",
    title: "Pilates, yoga and movement courses",
    body: "Programmes are reviewed for course structure, tutor competence and assessment quality.",
    image: pilatesAsset.url,
    alt: "A Pilates instructor in a REPS-branded top guiding a learner through reformer practice.",
  },
  {
    eyebrow: "Group exercise",
    title: "Indoor cycling and studio formats",
    body: "Group exercise courses can show delivery controls, learner support and safe instruction standards.",
    image: spinAsset.url,
    alt: "An indoor cycling instructor in a REPS-branded top coaching a studio class.",
  },
];

const PRODUCT_SURFACE = [
  {
    icon: UserCheck,
    title: "Provider website",
    body: "A public provider page for your endorsed courses, learner-facing proof and provider details.",
  },
  {
    icon: ListChecks,
    title: "Course listings",
    body: "Unlimited REPs-endorsed course listings under one annual membership.",
  },
  {
    icon: BadgeCheck,
    title: "Endorsement badge",
    body: "A digital badge for approved courses that links back to live public verification.",
  },
  {
    icon: Sparkles,
    title: "Verified learner reviews",
    body: "Collect reviews from learners after completion and show them where prospects make decisions.",
  },
  {
    icon: FileCheck2,
    title: "Certificate issuing",
    body: "Issue learner certificates and unit summaries only when a learner completes.",
  },
  {
    icon: Newspaper,
    title: "Welcome article",
    body: "A launch article introduces your provider, course focus and endorsement decision.",
  },
];

const ENDORSEMENT_STEPS = [
  {
    n: "01",
    title: "Apply",
    body: "Submit your provider details and pay the annual membership. You get immediate access to the provider portal.",
  },
  {
    n: "02",
    title: "Submit course evidence",
    body: "Upload syllabus, learning outcomes, assessment, tutor CVs and insurance for each course you want endorsed.",
  },
  {
    n: "03",
    title: "REPs reviews",
    body: "Our review team assesses the course against REPs standards — typically within 10 working days.",
  },
  {
    n: "04",
    title: "Course is endorsed",
    body: "Approved courses go live on your provider website and in the REPs directory, carrying the REPs-endorsed mark.",
  },
  {
    n: "05",
    title: "Issue certificates",
    body: `Issue a Certificate of Achievement and Learner Unit Summary for each completing learner at ${CERTIFICATE_UNIT_PRICE_LABEL} per certificate — each one publicly verifiable.`,
  },
];

/* ---------------------------------------------------------------- */
/* Page                                                              */
/* ---------------------------------------------------------------- */

function TrainingProvidersPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <HeroSection />
      <FeatureReelSection />
      <CertificateShowcaseSection />
      <AuthoritySection />
      <ProviderSurfaceSection />
      <PricingSection />
      <EndorsementProcessSection />

      <div id="faq">
        <MarketingFaq
          eyebrow="Frequently asked"
          heading="Endorsement, evidence and certificates."
          items={FAQ_ITEMS}
        />
      </div>

      <FinalActionSection />

      <PublicFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate min-h-[760px] overflow-hidden lg:min-h-[820px]">
      <img
        src={classroomAsset.url}
        alt="Fitness tutor leading a professional training provider course with adult learners and course materials."
        className="absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
        width={1600}
        height={1200}
      />
      <HeroOverlay copySide="left" intensity="standard" />

      <div className="relative mx-auto grid max-w-[1320px] gap-12 px-6 pt-24 pb-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-16 lg:px-10 lg:pt-28 lg:pb-24">
        <div className="max-w-[650px]">
          <MarketingHeroEyebrow icon={GraduationCap}>
            REPs Training Provider Membership
          </MarketingHeroEyebrow>
          <h1
            className="mt-5 font-display text-[44px] font-bold leading-[1.03] text-white animate-fade-in lg:text-[72px]"
            style={{ animationDelay: "80ms", animationDuration: "640ms" }}
          >
            Get your fitness courses REPs-endorsed.
          </h1>
          <p
            className="mt-5 max-w-[570px] text-[16px] leading-relaxed text-white/80 animate-fade-in"
            style={{ animationDelay: "180ms", animationDuration: "560ms" }}
          >
            Independent course review, public provider recognition, verified learner reviews and
            REPs-issued certificates for serious fitness education providers.
          </p>

          <div
            className="mt-8 flex flex-wrap gap-3 animate-fade-in"
            style={{ animationDelay: "260ms", animationDuration: "560ms" }}
          >
            <a
              href="/signup?type=training_provider"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
            >
              Apply to become a provider <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/contact"
              search={{ topic: "training-provider" }}
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-reps-ink/30 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
            >
              Talk to the review team
            </Link>
          </div>

          <div
            className="mt-8 grid max-w-[560px] grid-cols-3 gap-px overflow-hidden rounded-[16px] border border-reps-border bg-reps-border animate-fade-in"
            style={{ animationDelay: "340ms", animationDuration: "560ms" }}
          >
            <MetricTile value={TIER.priceLabel} label="per year" />
            <MetricTile value="Unlimited" label="course submissions" />
            <MetricTile value={CERTIFICATE_UNIT_PRICE_LABEL} label="per certificate" />
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="relative overflow-hidden rounded-[24px] border border-reps-border bg-reps-ink/88 p-5 shadow-[0_42px_110px_-50px_rgba(0,0,0,0.95)] backdrop-blur">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
                  Certificate evidence
                </div>
                <p className="mt-1 text-[13.5px] leading-snug text-white/70">
                  Achievement certificate and unit summary, issued from the provider portal.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold text-reps-orange">
                {CERTIFICATE_UNIT_PRICE_LABEL} each
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-[14px] border border-reps-border bg-white shadow-[0_32px_80px_-40px_rgba(0,0,0,0.95)]">
                <img
                  src={certificateAsset.url}
                  alt="REPs-endorsed Certificate of Achievement showing learner, course and verification details."
                  className="aspect-[1/1.414] w-full object-cover"
                  width={1240}
                  height={1754}
                />
              </div>
              <div className="overflow-hidden rounded-[14px] border border-reps-border bg-white shadow-[0_32px_80px_-40px_rgba(0,0,0,0.95)]">
                <img
                  src={unitSummaryAsset.url}
                  alt="REPs Learner Unit Summary with completed units and verification QR code."
                  className="aspect-[1/1.414] w-full object-cover"
                  width={1240}
                  height={1754}
                />
              </div>
            </div>
          </div>

          <div className="absolute -bottom-8 left-8 right-8 grid grid-cols-3 gap-px overflow-hidden rounded-[16px] border border-reps-border bg-reps-border shadow-[0_26px_70px_-42px_rgba(0,0,0,0.95)]">
            {[
              "Unique certificate number",
              "Public verification URL",
              "Learner unit record",
            ].map((label) => (
              <div key={label} className="bg-reps-panel/95 px-4 py-4 backdrop-blur">
                <CheckCircle2 className="h-4 w-4 text-reps-orange" />
                <div className="mt-2 text-[12px] font-semibold leading-snug text-white/80">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureReelSection() {
  const [featured, ...sideItems] = FEATURE_REEL;

  return (
    <section className="bg-reps-panel/30">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Feature overview"
          heading="Built for providers teaching real fitness skills."
          lede="The page needs to sell the world your courses actually prepare learners for: coaching, cueing, assessing and supporting people in professional fitness settings."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
          <figure className="group overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel transition-colors hover:border-reps-orange">
            <div className="relative aspect-[16/9] overflow-hidden bg-reps-ink">
              <img
                src={featured.image}
                alt={featured.alt}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                width={1600}
                height={1200}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-reps-ink/90 via-reps-ink/40 to-transparent p-6 lg:p-8">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
                  {featured.eyebrow}
                </span>
                <h2 className="mt-2 font-display text-[26px] font-bold leading-tight text-white lg:text-[34px]">
                  {featured.title}
                </h2>
                <p className="mt-2 max-w-[620px] text-[15px] leading-relaxed text-white/70">
                  {featured.body}
                </p>
              </div>
            </div>
          </figure>

          <div className="grid gap-4">
            {sideItems.map((item) => (
              <figure
                key={item.title}
                className="grid overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel transition-colors hover:border-reps-orange sm:grid-cols-[190px_1fr] lg:grid-cols-1 xl:grid-cols-[190px_1fr]"
              >
                <img
                  src={item.image}
                  alt={item.alt}
                  className="aspect-[16/10] h-full w-full object-cover sm:aspect-auto lg:aspect-[16/9] xl:aspect-auto"
                  loading="lazy"
                  width={1600}
                  height={1200}
                />
                <figcaption className="p-5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
                    {item.eyebrow}
                  </span>
                  <h3 className="mt-2 font-display text-[19px] font-bold leading-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{item.body}</p>
                </figcaption>
              </figure>
            ))}

            <div className="rounded-[18px] border border-reps-border bg-reps-ink/50 p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                Course categories
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-white/75">
                Personal training, group exercise, indoor cycling, strength and conditioning,
                Pilates, yoga, nutrition and specialist CPD.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CertificateShowcaseSection() {
  const certificateRows = [
    { label: "Certificate of Achievement", body: "Named learner, course, issue date, certificate number and REPs course number." },
    { label: "Learner Unit Summary", body: "Unit-by-unit evidence of what the learner completed." },
    { label: "Public verification URL", body: "A shareable verification page for employers, learners and partners." },
    { label: "QR code", body: "Printed on the certificate so the record can be checked immediately." },
  ];

  return (
    <section>
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-10 lg:py-28">
        <CertificatePair />
        <div>
          <SectionHeader
            eyebrow="Certificate system"
            heading="Certificates that look and behave like official learner evidence."
            lede="Every REPs-endorsed certificate is issued through the provider portal and tied to a public verification record."
          />
          <ul className="mt-8 grid gap-px overflow-hidden rounded-[18px] border border-reps-border bg-reps-border">
            {certificateRows.map((r) => (
              <li key={r.label} className="flex items-start gap-4 bg-reps-panel px-5 py-5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                <div>
                  <div className="text-[15px] font-semibold text-white">{r.label}</div>
                  <div className="mt-1 text-[13.5px] leading-snug text-white/55">{r.body}</div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[13px] leading-relaxed text-white/50">
            This certificate confirms completion of a provider-issued course endorsed by REPs. It
            is not an Ofqual-regulated qualification unless explicitly stated.
          </p>
        </div>
      </div>
    </section>
  );
}

function AuthoritySection() {
  return (
    <section className="bg-reps-panel/15" id="endorsement">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="What REPs reviews"
          heading="A standards decision, not a pay-to-display badge."
          lede="Every course is reviewed against professional standards covering design, assessment, tutor competence and delivery. Endorsement is a professional standards review — not a regulated qualification."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
            <img
              src={studyingAsset.url}
              alt="An adult learner reviewing course materials, unit notes and assessment evidence for a fitness education programme."
              className="aspect-[4/5] h-full w-full object-cover"
              loading="lazy"
              width={1600}
              height={1200}
            />
          </div>

          <ul className="grid gap-px overflow-hidden rounded-[22px] border border-reps-border bg-reps-border sm:grid-cols-2">
            {REVIEW_STANDARDS.map((s, i) => (
              <li key={s.title} className="bg-reps-panel p-7 lg:p-8">
                <span className="font-display text-[13px] font-bold tracking-[0.18em] text-reps-orange">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <BlockHeading className="mt-4 text-[22px] lg:text-[26px]">{s.title}</BlockHeading>
                <p className="mt-3 text-[15px] leading-relaxed text-white/70">{s.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ProviderSurfaceSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="What providers receive"
          heading="The public proof layer around your endorsed courses."
          lede="One annual membership gives your provider the recognition surface, course proof and learner evidence needed to sell serious fitness education."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="relative overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel p-7 lg:p-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
                  REPs-endorsed provider
                </div>
                <h3 className="mt-1 font-display text-[24px] font-bold leading-tight text-white">
                  Built for public confidence
                </h3>
              </div>
            </div>
            <p className="mt-6 text-[15px] leading-relaxed text-white/70">
              Your provider website, course listings, endorsement badge, learner reviews and welcome
              article all point back to the same standards decision: REPs has reviewed the course.
            </p>
            <ul className="mt-7 grid gap-3">
              {RECEIVE.slice(0, 6).map((label) => (
                <li key={label} className="flex items-center gap-3 text-[14.5px] text-white/80">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-reps-orange" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-px overflow-hidden rounded-[22px] border border-reps-border bg-reps-border sm:grid-cols-2">
            {PRODUCT_SURFACE.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="bg-reps-panel p-6">
                  <Icon className="h-5 w-5 text-reps-orange" strokeWidth={1.75} />
                  <h3 className="mt-4 font-display text-[19px] font-bold leading-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="bg-reps-panel/30" id="pricing">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="Pricing"
          heading="One annual provider fee. Certificates only when learners complete."
          lede="No per-course endorsement fees, no marketplace commission, no cut of learner revenue."
          align="center"
        />

        <div className="mx-auto mt-12 grid max-w-[1080px] gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="relative overflow-hidden rounded-[22px] border border-reps-orange-border bg-gradient-to-br from-reps-panel via-reps-panel to-reps-ink p-8 lg:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,122,0,0.18),transparent_70%)]"
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                <Sparkles className="h-3 w-3" /> Training Provider
              </div>
              <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-[64px] font-bold leading-none text-white lg:text-[76px]">
                  {TIER.priceLabel}
                </span>
                <span className="text-[15px] text-white/70">per year</span>
              </div>
              <p className="mt-3 text-[14px] text-white/60">Annual only. VAT added where applicable.</p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {RECEIVE.map((label) => (
                  <li key={label} className="flex items-start gap-2 text-[14px] text-white/85">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                    {label}
                  </li>
                ))}
              </ul>
              <a
                href="/signup?type=training_provider"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Apply to become a provider <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <aside className="rounded-[22px] border border-reps-border bg-reps-panel p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-ink/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
              <FileCheck2 className="h-3 w-3" /> Learner certificates
            </div>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-[52px] font-bold leading-none text-white">
                {CERTIFICATE_UNIT_PRICE_LABEL}
              </span>
              <span className="text-[14px] text-white/60">per issued certificate</span>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-white/70">
              Certificate of Achievement, Learner Unit Summary, public verification URL and QR code
              — issued only when a learner completes.
            </p>
            <p className="mt-6 text-[13px] leading-relaxed text-white/50">
              Refunds are only offered within 30 days if REPs cannot endorse at least one of your
              courses. Cancellation is immediate — no monthly option; membership is annual.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

function EndorsementProcessSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeader
          eyebrow="How endorsement works"
          heading="A clear review path from application to issued certificate."
          lede="Each stage has a defined evidence requirement and a defined REPs decision point."
        />

        <ol className="mt-12 grid gap-px overflow-hidden rounded-[22px] border border-reps-border bg-reps-border">
          {ENDORSEMENT_STEPS.map((s) => (
            <li
              key={s.n}
              className="grid gap-5 bg-reps-panel px-6 py-7 lg:grid-cols-[96px_240px_1fr] lg:items-start lg:gap-10 lg:px-10 lg:py-8"
            >
              <span className="font-display text-[32px] font-bold leading-none text-reps-orange lg:text-[40px]">
                {s.n}
              </span>
              <span className="font-display text-[20px] font-bold leading-tight text-white lg:text-[24px]">
                {s.title}
              </span>
              <span className="text-[15px] leading-relaxed text-white/70">{s.body}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FinalActionSection() {
  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
        <div className="relative overflow-hidden rounded-[24px] border border-reps-border bg-gradient-to-br from-reps-panel via-reps-panel to-reps-ink p-10 text-center lg:p-16">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,122,0,0.18),transparent_70%)]"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
              <BookOpen className="h-3 w-3" /> Applications open
            </span>
            <h2 className="mt-5 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
              Get your courses reviewed by REPs.
              <br />
              <span className="text-reps-orange">Endorsed. Verifiable. Recognised.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[560px] text-[15px] text-white/70">
              Apply in a few minutes. Submit your first course evidence the same day.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href="/signup?type=training_provider"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Apply to become a provider <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/contact"
                search={{ topic: "training-provider" }}
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
              >
                Talk to the review team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CertificatePair() {
  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-4">
        <div className="overflow-hidden rounded-[14px] border border-reps-border bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.75)]">
          <img
            src={certificateAsset.url}
            alt="REPs Certificate of Achievement showing learner name, course title, certificate number and verification URL."
            className="aspect-[1/1.414] w-full object-cover"
            loading="lazy"
            width={1240}
            height={1754}
          />
        </div>
        <div className="overflow-hidden rounded-[14px] border border-reps-border bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.75)]">
          <img
            src={unitSummaryAsset.url}
            alt="REPs Learner Unit Summary listing completed course units and a verification QR code."
            className="aspect-[1/1.414] w-full object-cover"
            loading="lazy"
            width={1240}
            height={1754}
          />
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_55%_at_50%_85%,rgba(255,122,0,0.18),transparent_70%)] blur-2xl"
      />
    </div>
  );
}

function MetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-reps-panel/95 px-4 py-4 backdrop-blur">
      <div className="font-display text-[22px] font-bold leading-none text-white">{value}</div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/55">{label}</div>
    </div>
  );
}
