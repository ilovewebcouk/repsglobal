import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  Eye,
  FileSearch,
  Gavel,
  Heart,
  IdCard,
  Lock,
  MessageSquare,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Users,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";

const CANONICAL = "https://repsglobal.lovable.app/standards";
const META_TITLE = "REPS Standards — Code of Conduct & Verification";
const META_DESC =
  "The conduct, verification and qualification standards every professional listed on REPS is held to — and how concerns are raised and acted on.";

const LAST_REVIEWED = "26 June 2026";

export const Route = createFileRoute("/standards")({
  head: () => ({
    meta: [
      { title: META_TITLE },
      { name: "description", content: META_DESC },
      { property: "og:title", content: META_TITLE },
      { property: "og:description", content: META_DESC },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: META_TITLE },
      { name: "twitter:description", content: META_DESC },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: StandardsPage,
});

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const CONDUCT_PILLARS = [
  {
    icon: Heart,
    title: "Client safety first",
    body: "Every session is planned around the client in front of you — screening, technique, recovery and load are non-negotiable.",
  },
  {
    icon: Eye,
    title: "Honest marketing",
    body: "Claims about results, qualifications and specialisms must be accurate. No fabricated outcomes, fake reviews or borrowed credentials.",
  },
  {
    icon: Target,
    title: "Scope of practice",
    body: "Coach within what you're trained for. Refer out for medical, clinical or specialist needs that fall outside your qualification.",
  },
  {
    icon: ShieldCheck,
    title: "Safeguarding & duty of care",
    body: "Take reasonable steps to protect vulnerable clients, young people and anyone disclosing harm. Act on concerns, don't bury them.",
  },
  {
    icon: Users,
    title: "Inclusive practice",
    body: "Treat every client with respect regardless of body, background, identity or ability. Discrimination is grounds for removal.",
  },
  {
    icon: Lock,
    title: "Confidentiality",
    body: "Client health information, conversations and progress data stay private. Share only with consent or where the law requires it.",
  },
];

type VerificationRow = {
  icon: typeof IdCard;
  title: string;
  checks: string;
  evidence: string;
  cadence: string;
};

const VERIFICATION_ROWS: VerificationRow[] = [
  {
    icon: IdCard,
    title: "Identity",
    checks:
      "We confirm the person on the profile is a real human, matches their photo and is who they say they are.",
    evidence: "Government-issued photo ID and a live selfie check.",
    cadence: "Once at onboarding. Re-checked if the profile changes hands or fraud is suspected.",
  },
  {
    icon: ScrollText,
    title: "Qualifications",
    checks:
      "We confirm each listed qualification is genuine, current and from a recognised awarding body — and matches the specialism it's claimed against.",
    evidence:
      "Original certificate (PDF / JPG / PNG) from an Ofqual-regulated or recognised awarding body.",
    cadence: "Checked at upload and on every new specialism added.",
  },
  {
    icon: ShieldCheck,
    title: "Insurance",
    checks:
      "We confirm active professional liability cover, in the professional's name, valid for the work they're listing.",
    evidence: "Insurance schedule or certificate showing provider, policy holder and expiry date.",
    cadence: "Re-verified annually and flagged automatically before expiry.",
  },
];

const QUAL_ROWS = [
  { profession: "Personal Trainer", minimum: "Level 3" },
  { profession: "Group Exercise Instructor", minimum: "Level 2" },
  { profession: "Strength & Conditioning Coach", minimum: "Level 3 or above" },
  {
    profession: "Nutritionist",
    minimum: "Registered with a recognised body in the practitioner's jurisdiction",
  },
  { profession: "Yoga Teacher", minimum: "Recognised training (typically 200+ hours)" },
  { profession: "Pilates Instructor", minimum: "Recognised matwork or apparatus qualification" },
];

const COMPLAINT_STEPS = [
  {
    icon: MessageSquare,
    title: "Raise",
    body: "Anyone can report a concern about a listed professional via /contact. Anonymous reports are accepted; named reports get a faster response.",
  },
  {
    icon: ClipboardList,
    title: "Acknowledge",
    body: "We confirm receipt within 2 working days and tell you what happens next. Serious safety reports are triaged the same day.",
  },
  {
    icon: FileSearch,
    title: "Investigate",
    body: "We review evidence, contact the professional, and where needed put their public profile on hold while we look into it.",
  },
  {
    icon: Gavel,
    title: "Outcome",
    body: "Outcomes range from no action, to coaching, to a public sanction, to permanent removal — communicated to both parties in writing.",
  },
];

const REMOVAL_GROUNDS = [
  "Misrepresentation of qualifications, insurance or experience",
  "Lapsed or invalid professional insurance",
  "Safeguarding breach or failure to act on disclosed harm",
  "Repeated or unresolved client complaints with credible evidence",
  "Discrimination, harassment or abusive conduct",
  "Fraudulent reviews, payments or identity",
];

const FAQS = [
  {
    q: "Who can join REPS?",
    a: "Any fitness, movement or nutrition professional who can evidence a recognised qualification, hold active professional insurance and pass identity verification. We list individuals, not unverified brands.",
  },
  {
    q: "How do I report a concern about a professional?",
    a: (
      <>
        Use the{" "}
        <Link to="/contact" className="text-reps-orange underline-offset-4 hover:underline">
          contact form
        </Link>{" "}
        and include the professional's name or profile link. Anonymous reports are accepted. Safety concerns are triaged the same day.
      </>
    ),
  },
  {
    q: "Do you actually remove professionals?",
    a: "Yes. Removal is a real outcome — not a threat. Grounds are listed on this page and decisions are made by the REPS team based on evidence, not popularity.",
  },
  {
    q: "How often do you re-check standards?",
    a: "Identity is checked once at onboarding. Qualifications are checked at upload and whenever a new specialism is added. Insurance is re-verified every year and flagged automatically before it expires.",
  },
  {
    q: "Is REPS a regulator?",
    a: "No. REPS is a global register and standards platform for fitness professionals. We set and enforce platform standards for who appears on REPS — we don't replace statutory regulators, awarding bodies or the courts.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function StandardsPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <PublicHeader />

      {/* Hero — type-led, no image */}
      <section className="relative overflow-hidden border-b border-reps-border">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_15%,rgba(255,122,0,0.10),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-reps-ink"
        />
        <div className="relative mx-auto max-w-[1320px] px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-24">
          <div className="max-w-[760px]">
            <MarketingHeroEyebrow icon={ShieldCheck}>
              What REPS stands for
            </MarketingHeroEyebrow>

            <h1 className="mt-6 font-display text-[36px] font-bold leading-[1.04] text-white sm:text-[46px] lg:text-[60px]">
              The standard behind every
              <br />
              <span className="text-reps-orange">REPS professional.</span>
            </h1>

            <p className="mt-6 max-w-[620px] text-[16px] leading-relaxed text-white/80">
              Being listed on REPS isn't a logo you buy — it's a set of
              standards every professional commits to and is verified against.
              This page sets out the conduct we expect, the checks we run, and
              what happens when something goes wrong.
            </p>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-reps-orange" />
                Independently verified
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-reps-orange" />
                Reviewed regularly
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Last reviewed strip */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-8 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-reps-border bg-reps-panel/60 px-5 py-4">
            <p className="text-[13.5px] text-white/70">
              <span className="font-semibold text-white">Last reviewed:</span>{" "}
              {LAST_REVIEWED}. We publish the date so you can see when the
              standards on this page were last checked.
            </p>
            <a
              href="#verification"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-reps-orange hover:underline"
            >
              How we verify <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Code of conduct */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Code of conduct"
            heading={<>What every REPS professional commits to.</>}
            lede={
              <>
                These aren't aspirations — they're the baseline. Ongoing learning
                sits alongside this on{" "}
                <Link
                  to="/cpd"
                  className="text-reps-orange underline-offset-4 hover:underline"
                >
                  /cpd
                </Link>
                .
              </>
            }
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CONDUCT_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-[18px] font-bold text-white">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                    {pillar.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Verification standards */}
      <section id="verification" className="bg-reps-panel/30 scroll-mt-24">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Verification standards"
            heading={<>What we check — and how often.</>}
            lede="The same three pillars appear on every professional's profile. Each one is verified by REPS, not self-declared."
          />

          <div className="mt-12 space-y-5">
            {VERIFICATION_ROWS.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.title}
                  className="rounded-[18px] border border-reps-border bg-reps-panel p-6 lg:p-8"
                >
                  <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-display text-[20px] font-bold text-white">
                          {row.title}
                        </h3>
                        <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-300">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified by REPS
                        </span>
                      </div>
                    </div>

                    <dl className="grid gap-5 sm:grid-cols-3">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                          What we check
                        </dt>
                        <dd className="mt-2 text-[14px] leading-relaxed text-white/80">
                          {row.checks}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                          Evidence accepted
                        </dt>
                        <dd className="mt-2 text-[14px] leading-relaxed text-white/80">
                          {row.evidence}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                          Re-check cadence
                        </dt>
                        <dd className="mt-2 text-[14px] leading-relaxed text-white/80">
                          {row.cadence}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Qualifications framework */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Qualifications framework"
            heading={<>The minimum bar, by profession.</>}
            lede="Every qualification must come from an Ofqual-regulated or recognised awarding body. Higher qualifications and specialisms layer on top of the minimum."
          />

          <div className="mt-12 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
            <div className="hidden grid-cols-[1.2fr_1fr] border-b border-reps-border bg-reps-panel/80 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 sm:grid">
              <span>Profession</span>
              <span>Minimum standard</span>
            </div>
            <ul>
              {QUAL_ROWS.map((row, i) => (
                <li
                  key={row.profession}
                  className={`grid gap-2 px-6 py-5 sm:grid-cols-[1.2fr_1fr] sm:items-center ${
                    i > 0 ? "border-t border-reps-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-4 w-4 text-reps-orange" />
                    <span className="font-display text-[15.5px] font-semibold text-white">
                      {row.profession}
                    </span>
                  </div>
                  <span className="text-[14px] text-white/80">{row.minimum}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-5 text-[13.5px] text-white/55">
            Professions or specialisms not listed are reviewed case-by-case against the
            same recognised-body principle.
          </p>
        </div>
      </section>

      {/* Complaints & removal */}
      <section className="bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Complaints & removal"
            heading={<>How concerns are raised — and acted on.</>}
            lede="A real complaints process, with real outcomes. Anyone can raise a concern; every report is logged."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {COMPLAINT_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-[18px] border border-reps-border bg-reps-panel p-7"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-[18px] font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 rounded-[22px] border border-reps-border bg-reps-panel p-7 lg:p-10">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-[20px] font-bold text-white">
                  Grounds for removal
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                  Any of the following can lead to a professional being removed
                  from REPS — temporarily or permanently — based on the evidence
                  reviewed.
                </p>
              </div>
            </div>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {REMOVAL_GROUNDS.map((ground) => (
                <li
                  key={ground}
                  className="flex items-start gap-3 rounded-[12px] border border-reps-border bg-reps-ink/50 px-4 py-3 text-[14px] text-white/80"
                >
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                  {ground}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <MarketingFaq heading={<>Standards FAQ.</>} items={FAQS} />

      <FinalCta
        eyebrow={null}
        heading="Raise a concern or"
        headingAccent="ask about a pro."
        lede="Standards only matter if they're enforced. If something's not right, tell us — we read every report."
        primary={{ to: "/contact", label: "Contact REPS" }}
        secondary={{ to: "/find-a-professional", label: "Find a professional" }}
      />

      <PublicFooter />
    </div>
  );
}
