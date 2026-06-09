import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";

import { BlockHeading } from "@/components/marketing/BlockHeading";
import { HeroHeading } from "@/components/marketing/HeroHeading";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { StatValue } from "@/components/marketing/StatValue";
import { FinalCta } from "@/components/marketing/FinalCta";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { RegisterProof } from "@/components/marketing/RegisterProof";
import { PressMarquee } from "@/components/marketing/PressMarquee";
import { VerifySteps } from "@/components/marketing/VerifySteps";
import { UseCaseTriad } from "@/components/marketing/UseCaseTriad";
import { WeekWithReps } from "@/components/marketing/WeekWithReps";
import { ComparisonStrip } from "@/components/marketing/ComparisonStrip";
import { ReplacedStackBoard } from "@/components/marketing/ReplacedStackBoard";
import { AiCommandCentreMock } from "@/components/marketing/AiCommandCentreMock";
import { HeroDeviceCluster } from "@/components/marketing/HeroDeviceCluster";

export const Route = createFileRoute("/dev/section-library")({
  head: () => ({
    meta: [
      { title: "REPs Marketing Section Library — Internal" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Internal development reference for approved REPs marketing components." },
    ],
  }),
  component: SectionLibraryPage,
});

function Group({
  id,
  eyebrow,
  heading,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="border-t border-reps-border py-16 first:border-t-0 lg:py-20"
    >
      <SectionHeader eyebrow={eyebrow} heading={heading} lede={description} />
      <div className="mt-10 flex flex-col gap-12">{children}</div>
    </section>
  );
}

function Specimen({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-panel/40 p-6 lg:p-8">
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-reps-orange">
          {label}
        </span>
        {note ? (
          <span className="text-[12.5px] text-white/55">{note}</span>
        ) : null}
      </div>
      <div className="rounded-[14px] bg-reps-ink/60 p-5 lg:p-6">{children}</div>
    </div>
  );
}

function Catalogued({ items }: { items: { name: string; reason: string }[] }) {
  return (
    <div className="rounded-[18px] border border-dashed border-reps-border bg-reps-panel/20 p-6">
      <p className="text-[12.5px] uppercase tracking-[0.18em] text-white/55">
        Catalogued but not rendered
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((i) => (
          <li
            key={i.name}
            className="rounded-[10px] border border-reps-border bg-reps-ink/40 px-3 py-2 text-[13px] text-white/75"
          >
            <span className="font-mono font-semibold text-white">{i.name}</span>
            <span className="ml-1 text-white/55">— {i.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const FAQ_SAMPLE = [
  { q: "Is this page public?", a: "No. /dev/section-library is internal-only and is set to noindex,nofollow. It is not linked from the header, footer, homepage CTAs or sitemap." },
  { q: "Can I add a new section here?", a: "Yes — but only after the underlying component lives in src/components/marketing/. This page is a viewer, not a workshop." },
];

const VERIFY_SAMPLE = [
  { icon: ShieldCheck, title: "Submit credentials", body: "Upload qualifications, insurance and ID — REPs reviews each one before your profile goes live." },
  { icon: BadgeCheck, title: "Manual verification", body: "A real human checks the documents against the issuing body. No automated rubber-stamping." },
  { icon: Sparkles, title: "Listed in the register", body: "Your verified profile appears in the public register with a visible verified badge." },
];

function SectionLibraryPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-white">
      {/* Internal banner */}
      <div className="border-b border-reps-orange-border bg-reps-orange-soft">
        <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-6 py-3 lg:px-10">
          <span className="inline-flex h-6 items-center rounded-full border border-reps-orange-border bg-reps-ink/40 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
            Internal
          </span>
          <span className="text-[13px] font-medium text-white/85">
            Internal development reference. Not a public page.
          </span>
        </div>
      </div>

      {/* Page intro */}
      <header className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <MarketingHeroEyebrow>Source of truth</MarketingHeroEyebrow>
          <HeroHeading className="mt-4 max-w-[820px]">
            REPs Marketing Section Library
          </HeroHeading>
          <p className="mt-5 max-w-[680px] text-[16px] leading-relaxed text-white/70">
            Approved primitives, sections and product mock-ups used to assemble
            every public marketing page on REPs. Build pillar pages by composing
            from this library — never by hand-rolling typography, eyebrows or
            section headers in route files.
          </p>
          <p className="mt-4 max-w-[680px] text-[14px] leading-relaxed text-white/55">
            Source-of-truth order: <span className="text-white/80">/reps-project-source-of-truth</span> →
            tokens, colours, radius and typography rules → marketing primitives →
            reusable section components → mock-up components → shadcn/ui (accessible
            behaviour only) → Tailwind utilities (approved layout & spacing only).
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        {/* 1. Typography primitives */}
        <Group
          id="typography"
          eyebrow="01 — Typography"
          heading="Heading primitives"
          description="Use these instead of hand-rolling font-display + arbitrary text-[Npx] sizes in route files. The audit script blocks raw heading utilities in marketing routes."
        >
          <Specimen label="HeroHeading" note="Default 36 → 46 → 60px. Per-page sizes may pass className to lock visual output.">
            <HeroHeading>
              The verified home for fitness professionals
              <span className="text-reps-orange"> worldwide.</span>
            </HeroHeading>
          </Specimen>
          <Specimen label="SectionHeading" note="Mid-page H2 — locked 30 → 40px. Always pure white (no orange split).">
            <SectionHeading>One register. Every credential.</SectionHeading>
          </Specimen>
          <Specimen label="BlockHeading" note="In-block H3 used inside 50/50 ProductBlock and feature blocks — 28 → 36px.">
            <BlockHeading>Programmes your clients show off.</BlockHeading>
          </Specimen>
          <Specimen label="SectionEyebrow" note="Small uppercase kicker above a SectionHeading. Orange or muted.">
            <SectionEyebrow>How verification works</SectionEyebrow>
          </Specimen>
          <Specimen label="MarketingHeroEyebrow" note="Hero-specific kicker — slightly different rhythm to SectionEyebrow.">
            <MarketingHeroEyebrow>For professionals</MarketingHeroEyebrow>
          </Specimen>
          <Specimen label="StatValue" note="Semantic span for numeric stats — never wrap in <h2>/<h3>.">
            <div className="flex items-baseline gap-2">
              <StatValue className="text-[48px]" tabular>
                £59
              </StatValue>
              <span className="text-[14px] text-white/55">/ month — Pro Founding</span>
            </div>
          </Specimen>
          <Specimen label="SectionHeader" note="Composite of SectionEyebrow + SectionHeading + optional lede. Default opener for every section.">
            <SectionHeader
              eyebrow="Trust"
              heading="Built on a real verification process."
              lede="Every credential on REPs is reviewed by a human before it goes live — not auto-imported."
            />
          </Specimen>
        </Group>

        {/* 2. CTA and conversion */}
        <Group
          id="cta"
          eyebrow="02 — Conversion"
          heading="CTA and conversion primitives"
          description="One FinalCta per page. Never rebuild end-of-page CTAs per route."
        >
          <Specimen label="FinalCta" note="Canonical end-of-page CTA. Pass copy via props; panel/radius/glow/buttons are fixed.">
            <div className="-mx-5 -my-6 lg:-mx-6 lg:-my-6">
              <FinalCta
                heading="Build your verified profile in"
                headingAccent="under 10 minutes."
                lede="Join the register, get found, and run your whole practice from one tool."
                primary={{ to: "/signup", label: "Start free" }}
                secondary={{ to: "/pricing", label: "See pricing" }}
              />
            </div>
          </Specimen>
          <Specimen label="MarketingFaq" note="Single accordion FAQ block per page — no Card wrapper.">
            <div className="-mx-5 -my-6 lg:-mx-6 lg:-my-6">
              <MarketingFaq
                heading="Section-library FAQ"
                items={FAQ_SAMPLE}
              />
            </div>
          </Specimen>
        </Group>

        {/* 3. Proof and trust */}
        <Group
          id="proof"
          eyebrow="03 — Proof & trust"
          heading="Proof and trust sections"
          description="Use these to evidence the register, verification and external mentions. Never hand-roll a 3-step verification strip or a logo marquee."
        >
          <Specimen label="RegisterProof" note="Register stat / trust block — verified pros, cities, etc.">
            <RegisterProof />
          </Specimen>
          <Specimen label="PressMarquee" note="Editorial wordmark marquee below marketing heroes.">
            <PressMarquee />
          </Specimen>
          <Specimen label="VerifySteps" note="Locked 3-step verification strip + orange-soft accent banner.">
            <div className="-mx-5 -my-6 lg:-mx-6 lg:-my-6">
              <VerifySteps
                eyebrow="How verification works"
                heading="Real humans, real documents, every time."
                steps={VERIFY_SAMPLE}
                bannerText="Every credential on REPs is verified before it goes live."
              />
            </div>
          </Specimen>
        </Group>

        {/* 4. Product-led sections */}
        <Group
          id="product"
          eyebrow="04 — Product"
          heading="Product-led sections"
          description="ProductBlock and TrainerToPlatformComposite are the canonical 50/50 blocks. They require page-specific copy, images and routed mock-ups, so a representative example is shown for HeroDeviceCluster only; the others are catalogued for reference."
        >
          <Specimen label="HeroDeviceCluster" note="Laptop + phone hero cluster. Defaults to /dashboard and /portal/today preview routes.">
            <div className="mx-auto max-w-[820px] pb-12">
              <HeroDeviceCluster />
            </div>
          </Specimen>
          <Specimen label="AiCommandCentreMock" note="Static AI command-centre product tile — no data, no logic.">
            <div className="mx-auto max-w-[680px]">
              <AiCommandCentreMock />
            </div>
          </Specimen>
          <Catalogued
            items={[
              { name: "ProductBlock", reason: "Requires page-specific copy, image label and mockup route — see /for-professionals 5 pillars." },
              { name: "TrainerToPlatformComposite", reason: "Requires trainer photo + composition-specific stats/devices — see locked memory `trainer-to-platform-composite`." },
              { name: "DeviceMockup / LaptopFrame / PhoneFrame / MockupStage / ScaledFrame", reason: "Lower-level frames composed by HeroDeviceCluster and ProductBlock — not used standalone." },
              { name: "UiSideBySide", reason: "Page-specific before/after UI comparison — needs two real screenshots." },
            ]}
          />
        </Group>

        {/* 5. Pillar and feature */}
        <Group
          id="pillars"
          eyebrow="05 — Pillars"
          heading="Pillar and feature sections"
          description="Use these to lay out 'for X / for Y / for Z' rows and 'a week with REPs' narratives."
        >
          <Specimen label="UseCaseTriad" note="3-up tile row — Solo PT / Online coach / Studio.">
            <UseCaseTriad />
          </Specimen>
          <Specimen label="WeekWithReps" note="Narrative 'a week with REPs' block.">
            <WeekWithReps />
          </Specimen>
          <Catalogued
            items={[
              { name: "PillarTabs", reason: "Tab nav across pillar features — uses page-specific tab data + routed mockups. Shown live on /for-professionals." },
              { name: "ProductBlock (alternating)", reason: "Pillar pages alternate 5 ProductBlocks — needs full pillar copy set." },
            ]}
          />
        </Group>

        {/* 6. Comparison and pricing */}
        <Group
          id="comparison"
          eyebrow="06 — Comparison"
          heading="Comparison and pricing sections"
          description="Used across /compare/* and the value-prop sections of marketing pages."
        >
          <Specimen label="ComparisonStrip" note="Short REPs vs competitor strip used on /compare/* heros and inline.">
            <ComparisonStrip />
          </Specimen>
          <Specimen label="ReplacedStackBoard" note="'REPs replaces these tools' board.">
            <ReplacedStackBoard />
          </Specimen>
          <Catalogued
            items={[
              { name: "PlansLimitsStrip / PlansLimitsSummary", reason: "Render against the live pricing matrix — preview on /compare and /pricing." },
              { name: "CompetitorCompare / HeadToHead / VerdictScorecard", reason: "Render on individual /compare/reps-vs-* pages with locked competitor data." },
              { name: "CostCalculator / HiddenAddOns / MigrationChecklist / MethodologyNotice", reason: "Comparison-page utilities — see /compare and /comparison-methodology." },
              { name: "ReplacesStrip", reason: "Compact 'replaces' strip variant — used inline on /for-professionals." },
            ]}
          />
        </Group>

        {/* 7. AI / product mock-ups (continuation already partly above) */}
        <Group
          id="other"
          eyebrow="07 — Other catalogued"
          heading="Remaining marketing components"
          description="Components that exist in src/components/marketing/ but render against live page data or use one-off cinematic compositions. Documented here, rendered on their host pages."
        >
          <Catalogued
            items={[
              { name: "ActIntro", reason: "Three-act narrative intro used on /for-professionals — full-bleed copy block." },
              { name: "DayInTheLife", reason: "Narrative 'day in the life' block — page-specific copy and mockup wiring." },
              { name: "AICapabilities", reason: "AI capability grid — see /features/ai for live render." },
              { name: "ScenarioCards", reason: "Scenario cards block — page-specific scenario data." },
              { name: "TestimonialFeature / TestimonialTriad", reason: "Render with real testimonials and stat tiles — see /for-professionals." },
              { name: "VenueMarquee / VenueStrip / VenueWordmarks / PressWordmarks", reason: "Wordmark/logo strips driven by editorial SVG data." },
              { name: "VerificationCard", reason: "Floating verification card overlay — composed into hero compositions." },
              { name: "StickyCtaPill", reason: "Sticky bottom CTA pill — global page chrome, not a section." },
              { name: "SectionDivider", reason: "Hairline divider — utility only." },
              { name: "ForProsFaq", reason: "Pre-composed FAQ data set for /for-professionals — wraps MarketingFaq." },
            ]}
          />
        </Group>
      </div>

      <footer className="border-t border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-10 text-[12.5px] text-white/45 lg:px-10">
          Internal — not a public page. See <span className="font-mono text-white/70">src/components/marketing/README.md</span> for the full catalogue and shadcn/ui usage rules.
        </div>
      </footer>
    </div>
  );
}
