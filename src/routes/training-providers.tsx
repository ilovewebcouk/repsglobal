import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HeroOverlay } from "@/components/marketing/HeroOverlay";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { BlockHeading } from "@/components/marketing/BlockHeading";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";

import { ORG_TIERS, CERTIFICATE_UNIT_PRICE_LABEL } from "@/lib/billing";

import heroDocumentsAsset from "@/assets/training-providers/hero-documents.jpg.asset.json";
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
      { property: "og:image", content: heroDocumentsAsset.url },
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

      {/* 1. Hero -------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-[1320px] items-center gap-12 px-6 pt-16 pb-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:px-10 lg:pt-24 lg:pb-24">
          <div className="max-w-[620px]">
            <MarketingHeroEyebrow icon={GraduationCap}>
              REPs Training Provider Membership
            </MarketingHeroEyebrow>
            <h1
              className="mt-5 font-display text-[40px] font-bold leading-[1.05] text-white animate-fade-in lg:text-[60px]"
              style={{ animationDelay: "80ms", animationDuration: "640ms" }}
            >
              Get your fitness courses REPs-endorsed.
            </h1>
            <p
              className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-white/75 animate-fade-in"
              style={{ animationDelay: "180ms", animationDuration: "560ms" }}
            >
              A professional endorsement scheme for training providers who want independent course
              review, public recognition, verified learner reviews and REPs-issued learner
              certificates.
            </p>

            <div
              className="mt-8 grid max-w-[520px] grid-cols-3 gap-px overflow-hidden rounded-[16px] border border-reps-border bg-reps-border animate-fade-in"
              style={{ animationDelay: "260ms", animationDuration: "560ms" }}
            >
              <div className="bg-reps-panel px-4 py-4">
                <div className="font-display text-[22px] font-bold leading-none text-white">
                  {TIER.priceLabel}
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/55">
                  per year
                </div>
              </div>
              <div className="bg-reps-panel px-4 py-4">
                <div className="font-display text-[22px] font-bold leading-none text-white">
                  Unlimited
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/55">
                  course submissions
                </div>
              </div>
              <div className="bg-reps-panel px-4 py-4">
                <div className="font-display text-[22px] font-bold leading-none text-white">
                  {CERTIFICATE_UNIT_PRICE_LABEL}
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/55">
                  per learner certificate
                </div>
              </div>
            </div>

            <div
              className="mt-8 flex flex-wrap gap-3 animate-fade-in"
              style={{ animationDelay: "340ms", animationDuration: "560ms" }}
            >
              <Link
                to="/signup"
                search={{ type: "training_provider" }}
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Apply to become a provider <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#endorsement"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
              >
                View endorsement criteria
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
              <img
                src={heroDocumentsAsset.url}
                alt="A Certificate of Achievement and a Learner Unit Summary printed on cream stock, a wax seal on the certificate and a QR verification code on the unit summary, laid on a black leather desk mat beside a fountain pen and reading glasses."
                className="aspect-[4/3] w-full object-cover"
                fetchPriority="high"
                width={1600}
                height={1200}
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_60%_60%,rgba(255,122,0,0.16),transparent_70%)] blur-2xl"
            />
          </div>
        </div>
      </section>

      {/* 2. Three-pillar value proposition ------------------------ */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>Why providers choose REPs</SectionEyebrow>
            <SectionHeading className="mt-3">
              An endorsement scheme, not a marketplace.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
              REPs endorses fitness courses against professional standards. Providers keep full
              ownership of their courses, their learners and their pricing — REPs adds independent
              review, public recognition and verifiable certificate evidence.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[22px] border border-reps-border bg-reps-border lg:grid-cols-3">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.n} className="bg-reps-panel p-8 lg:p-10">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-[13px] font-bold tracking-[0.18em] text-reps-orange">
                      {p.n}
                    </span>
                    <span className="h-px flex-1 bg-reps-border" />
                    <Icon className="h-5 w-5 text-reps-orange" strokeWidth={1.75} />
                  </div>
                  <BlockHeading className="mt-5">{p.title}</BlockHeading>
                  <p className="mt-4 text-[15px] leading-relaxed text-white/70">{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. What REPs reviews ------------------------------------- */}
      <section>
        <div className="mx-auto grid max-w-[1320px] items-start gap-12 px-6 py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:px-10 lg:py-28">
          <div className="lg:sticky lg:top-24">
            <SectionEyebrow>What REPs reviews</SectionEyebrow>
            <SectionHeading className="mt-3">
              Reviewed against REPs course standards.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
              Every course is reviewed against a published set of professional standards covering
              design, assessment, tutor competence and delivery. Endorsement is a professional
              standards review — not a regulated qualification.
            </p>
            <div className="mt-8 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
              <img
                src={classroomAsset.url}
                alt="A REPs-registered tutor stands at a whiteboard explaining anatomy to a group of adult fitness students taking notes at desks with open workbooks and laptops."
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
                width={1600}
                height={1200}
              />
            </div>
          </div>

          <ul className="grid gap-4">
            {REVIEW_STANDARDS.map((s, i) => (
              <li
                key={s.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel/60 p-7 lg:p-8"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-[13px] font-bold tracking-[0.18em] text-reps-orange">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <BlockHeading className="text-[22px] lg:text-[26px]">{s.title}</BlockHeading>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-white/70">{s.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Editorial break — the courses we endorse -------------- */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>The courses we endorse</SectionEyebrow>
            <SectionHeading className="mt-3">
              Fitness education, across the professions REPs registers.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
              Personal training, group exercise, indoor cycling, strength and conditioning, Pilates,
              yoga, nutrition and specialist CPD. If your course prepares learners for professional
              practice in fitness, REPs will review it.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <figure className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel">
              <img
                src={pilatesAsset.url}
                alt="A Pilates instructor in a REPS-branded t-shirt guides a client on a reformer during a small group class in a bright arched-window studio."
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
                width={1600}
                height={1200}
              />
              <figcaption className="border-t border-reps-border px-5 py-4 text-[13px] text-white/65">
                Reformer Pilates instructor training — endorsed for course design and tutor competence.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel">
              <img
                src={spinAsset.url}
                alt="An indoor cycling instructor in a REPS-branded t-shirt cues a class of riders in a dark boutique studio with soft tungsten downlights."
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
                width={1600}
                height={1200}
              />
              <figcaption className="border-t border-reps-border px-5 py-4 text-[13px] text-white/65">
                Indoor cycling / group exercise instructor courses — endorsed for delivery and assessment.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel">
              <img
                src={studyingAsset.url}
                alt="An adult learner studies an anatomy textbook and takes handwritten notes at an oak desk beside an open laptop showing a course learning-objectives page."
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
                width={1600}
                height={1200}
              />
              <figcaption className="border-t border-reps-border px-5 py-4 text-[13px] text-white/65">
                Home-study and blended-learning courses — endorsed for learner support and assessment integrity.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* 5. Certificate system ------------------------------------ */}
      <section>
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-10 lg:py-28">
          <div className="relative">
            <div className="overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
              <img
                src={heroDocumentsAsset.url}
                alt="Certificate of Achievement with a wax seal and a Learner Unit Summary with a QR verification code laid on a leather desk mat."
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
                width={1600}
                height={1200}
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_55%_at_50%_85%,rgba(255,122,0,0.18),transparent_70%)] blur-2xl"
            />
          </div>
          <div>
            <SectionEyebrow>Certificate system</SectionEyebrow>
            <SectionHeading className="mt-3">
              Issue certificates learners can verify.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
              Every REPs-endorsed certificate is issued through the provider portal and carries a
              certificate number, a REPs course number, the Learner Unit Summary and a public
              verification URL with QR code.
            </p>
            <ul className="mt-8 divide-y divide-reps-border border-y border-reps-border">
              {[
                { label: "Certificate of Achievement", body: "Named learner, course, date and REPs course number." },
                { label: "Learner Unit Summary", body: "Every unit, level, credit and grade — auditable evidence." },
                { label: "Public verification URL", body: "Anyone can confirm the certificate is genuine at repsuk.org/verify." },
                { label: "QR code", body: "Printed on every certificate — one tap opens the verification page." },
              ].map((r) => (
                <li key={r.label} className="flex items-start gap-4 py-4">
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

      {/* 6. What providers receive -------------------------------- */}
      <section className="bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>What providers receive</SectionEyebrow>
            <SectionHeading className="mt-3">
              Included with every Training Provider membership.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
              One annual fee covers the full provider surface — course listings, provider website,
              endorsement badge, review collection and directory placement. Certificates are the
              only paid add-on.
            </p>
          </div>
          <ul className="mt-12 grid gap-px overflow-hidden rounded-[22px] border border-reps-border bg-reps-border sm:grid-cols-2 lg:grid-cols-3">
            {RECEIVE.map((label) => (
              <li key={label} className="flex items-center gap-3 bg-reps-panel px-6 py-5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-reps-orange" />
                <span className="text-[14.5px] text-white/85">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. How endorsement works --------------------------------- */}
      <section id="endorsement">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>How endorsement works</SectionEyebrow>
            <SectionHeading className="mt-3">
              A clear, procedural review — not a marketing gate.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
              Five stages from application to your first issued certificate. Each stage has a
              defined evidence requirement and a defined REPs decision point.
            </p>
          </div>

          <ol className="mt-14 space-y-px overflow-hidden rounded-[22px] border border-reps-border bg-reps-border">
            {ENDORSEMENT_STEPS.map((s) => (
              <li key={s.n} className="grid gap-6 bg-reps-panel px-6 py-7 lg:grid-cols-[120px_240px_1fr] lg:items-start lg:gap-10 lg:px-10 lg:py-8">
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

      {/* 8. Pricing ----------------------------------------------- */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[760px] text-center">
            <SectionEyebrow>Pricing</SectionEyebrow>
            <SectionHeading className="mt-3">
              One annual provider fee. Unlimited course submissions.
            </SectionHeading>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/70">
              No per-course endorsement fees, no marketplace commission, no cut of learner revenue.
              Certificates are the only paid add-on.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-[980px] gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative overflow-hidden rounded-[22px] border border-reps-orange-border bg-gradient-to-br from-reps-panel via-reps-panel to-reps-ink p-8 lg:p-12">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,122,0,0.18),transparent_70%)]"
              />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                  <Sparkles className="h-3 w-3" /> Training Provider
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-[64px] font-bold leading-none text-white">
                    {TIER.priceLabel}
                  </span>
                  <span className="text-[15px] text-white/60">/ year</span>
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
                <Link
                  to="/signup"
                  search={{ type: "training_provider" }}
                  className="mt-8 inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  Apply to become a provider <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <aside className="rounded-[22px] border border-reps-border bg-reps-panel/60 p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
                <FileCheck2 className="h-3 w-3" /> Learner certificates
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-[48px] font-bold leading-none text-white">
                  {CERTIFICATE_UNIT_PRICE_LABEL}
                </span>
                <span className="text-[14px] text-white/60">per issued certificate</span>
              </div>
              <p className="mt-4 text-[14px] leading-relaxed text-white/70">
                Certificate of Achievement, Learner Unit Summary, public verification URL and QR
                code — issued only when you complete a learner.
              </p>
              <p className="mt-6 text-[13px] leading-relaxed text-white/50">
                Refunds are only offered within 30 days if REPs cannot endorse at least one of your
                courses. Cancellation is immediate — no monthly option; membership is annual.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* 9. FAQ --------------------------------------------------- */}
      <section id="faq">
        <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[760px]">
            <SectionEyebrow>Frequently asked</SectionEyebrow>
            <SectionHeading className="mt-3">
              Endorsement, evidence and certificates.
            </SectionHeading>
          </div>
          <div className="mt-10">
            <MarketingFaq items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      {/* 10. Final CTA -------------------------------------------- */}
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
                <Link
                  to="/signup"
                  search={{ type: "training_provider" }}
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                >
                  Apply to become a provider <ArrowRight className="h-4 w-4" />
                </Link>
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

      <PublicFooter />
    </div>
  );
}

// Preserve import reference to keep tree-shaker + type imports honest.
void UserCheck;
void HeroOverlay;
