import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, ShieldCheck, Zap } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CellIcon } from "@/components/marketing/CompetitorCompare";
import { CostCalculator } from "@/components/marketing/CostCalculator";
import { DayInTheLife } from "@/components/marketing/DayInTheLife";
import { UiSideBySide } from "@/components/marketing/UiSideBySide";
import { ScenarioCards } from "@/components/marketing/ScenarioCards";
import { VerdictScorecard } from "@/components/marketing/VerdictScorecard";
import { MigrationChecklist } from "@/components/marketing/MigrationChecklist";

import {
  COMPETITORS,
  DATA_VERIFIED_DATE,
  type Competitor,
} from "@/data/competitor-data";
import { EDITORIAL } from "@/data/competitor-editorial";
import {
  FEATURE_GROUPS,
  FEATURE_INDEX,
  type CompetitorSlug,
} from "@/data/feature-matrix";

export function HeadToHeadPage({ slug }: { slug: CompetitorSlug }) {
  const c = COMPETITORS[slug];
  const e = EDITORIAL[slug];
  const idx = FEATURE_INDEX[slug];
  const others = (Object.keys(COMPETITORS) as CompetitorSlug[]).filter((s) => s !== slug);

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-reps-border">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,122,0,0.10),transparent)]" />
        <div className="relative mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
                <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Deep dive · REPs vs {c.name}
              </span>
              <h1 className="mt-5 font-display text-[36px] font-bold leading-tight text-white lg:text-[52px]">
                REPs vs {c.name}: which is right for UK personal trainers in 2026?
              </h1>
              <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
                An honest, opinionated 10-minute read. Real pricing maths, a
                workflow comparison, three real-world scenarios, a weighted
                verdict, and a 5-step migration guide.
              </p>

              <div className="mt-6 rounded-[18px] border border-reps-orange/30 bg-reps-orange/5 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                  The verdict in 30 seconds
                </div>
                <ul className="mt-3 space-y-2 text-[13.5px] text-white/85">
                  {e.verdictBullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/signup"
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
                >
                  Join REPs <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/compare"
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
                >
                  See all comparisons
                </Link>
              </div>
              <p className="mt-4 text-[12px] text-white/45">
                Pricing verified {DATA_VERIFIED_DATE} from {c.name}&apos;s public
                pricing page.
              </p>
            </div>
            <div className="relative">
              <img
                src={c.hero}
                alt={`REPs vs ${c.name}`}
                width={1600}
                height={900}
                className="w-full rounded-[24px] border border-reps-border"
              />
            </div>
          </div>
        </div>
      </section>

      {/* LONG-FORM INTRO */}
      <Editorial
        eyebrow={`What ${c.name} actually is`}
        title={`The honest take on ${c.name}.`}
        paragraphs={e.intro}
      />

      {/* THE HIDDEN COST STORY + CALCULATOR */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[760px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              The real monthly cost
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              What you actually pay on {c.name}.
            </h2>
          </div>
          <div className="mt-6 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <Prose paragraphs={e.costStory} />
            <CostCalculator c={c} />
          </div>
        </div>
      </section>

      {/* DAY IN THE LIFE */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[760px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              A day in the life
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              Four jobs every PT does. How each platform handles them.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              No marketing fluff — the actual workflow. Where {c.name} needs a
              paid add-on or a third-party app, we flag it.
            </p>
          </div>
          <div className="mt-8">
            <DayInTheLife c={c} rows={e.dayInTheLife} />
          </div>
        </div>
      </section>

      {/* SIDE-BY-SIDE UI */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[760px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Side by side
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              The two products, end to end.
            </h2>
          </div>
          <div className="mt-8">
            <UiSideBySide c={c} />
          </div>
        </div>
      </section>

      {/* SCENARIOS */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[760px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Three real scenarios
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              Who wins at your stage.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              The right answer changes with where you are in your career. Here
              are three honest pictures.
            </p>
          </div>
          <div className="mt-8">
            <ScenarioCards c={c} scenarios={e.scenarios} />
          </div>
        </div>
      </section>

      {/* VERDICT SCORECARD */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[760px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              The weighted verdict
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              Scored across seven criteria.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              Public discoverability is weighted highest because that&apos;s the
              real difference between a register and a piece of private
              software. Everything else is balanced.
            </p>
          </div>
          <div className="mt-8">
            <VerdictScorecard c={c} rows={e.scorecard} />
          </div>
        </div>
      </section>

      {/* FEATURE PARITY TABLE (the receipts) */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[760px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              The receipts
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              Full feature parity, line by line.
            </h2>
          </div>

          <div className="mt-8 overflow-clip rounded-[22px] border border-reps-border bg-reps-ink">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-reps-panel">
                    <th
                      scope="col"
                      className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-white/50 md:w-[50%] md:px-5"
                    >
                      Feature
                    </th>
                    <th
                      scope="col"
                      className="bg-reps-orange-soft px-4 py-4 text-[13px] font-display font-bold text-reps-orange md:px-5"
                    >
                      REPs
                    </th>
                    <th scope="col" className="px-4 py-4 md:px-5">
                      <img
                        src={c.logo}
                        alt={c.name}
                        style={{ height: c.logoHeight }}
                        className="w-auto"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_GROUPS.map((group) => (
                    <GroupRows key={group.label} group={group} idx={idx} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* MIGRATION GUIDE */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <MigrationChecklist competitorName={c.name} steps={e.migration} />
        </div>
      </section>

      {/* WHEN COMPETITOR IS RIGHT */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[22px] border border-reps-border bg-reps-panel p-6 lg:p-10">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-white/55">
                When {c.name} is the right choice
              </span>
              <h3 className="mt-2 font-display text-[24px] font-bold leading-tight text-white">
                We&apos;ll say it plainly.
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                {c.whenCompetitorIsRight}
              </p>
            </div>

            <div className="rounded-[22px] border border-reps-orange/40 bg-gradient-to-b from-reps-orange/10 to-reps-orange/[0.02] p-6 lg:p-10">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
                Why UK trainers move to REPs
              </span>
              <h3 className="mt-2 font-display text-[24px] font-bold leading-tight text-white">
                Built around the register, not the workout builder.
              </h3>
              <ul className="mt-4 space-y-3 text-[14px] text-white/80">
                {[
                  "The public register clients already search — verified, since 2009.",
                  "One flat plan. Payments, branded app, nutrition, AI — all included.",
                  "AI as the operating layer, not a $12/mo add-on.",
                  "UK-built, GDPR-first, GBP pricing, REPs credential displayed on profile.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[920px] px-6 py-16 lg:px-10 lg:py-20">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              FAQ
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              REPs vs {c.name} — common questions.
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {e.faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-[16px] border border-reps-border bg-reps-panel p-5 open:bg-reps-panel-soft"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15px] font-semibold text-white">
                  {f.q}
                  <span className="text-reps-orange transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-white/70">{f.a}</p>
              </details>
            ))}
          </div>

          {/* JSON-LD FAQPage schema */}
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: e.faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              }),
            }}
          />
        </div>
      </section>

      {/* CROSS-LINKS + CTA */}
      <section>
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="grid gap-4 md:grid-cols-2">
            {others.map((s) => {
              const o = COMPETITORS[s];
              const href =
                s === "trainerize"
                  ? "/compare/reps-vs-trainerize"
                  : s === "mypthub"
                    ? "/compare/reps-vs-mypthub"
                    : "/compare/reps-vs-pt-distinction";
              return (
                <Link
                  key={s}
                  to={href}
                  className="group rounded-[18px] border border-reps-border bg-reps-panel p-6 transition hover:border-reps-orange/40 hover:bg-reps-panel-soft"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-white/55">
                    Also considering {o.name}?
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="font-display text-[20px] font-bold text-white">
                      REPs vs {o.name}
                    </span>
                    <ArrowRight className="h-4 w-4 text-reps-orange transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 rounded-[24px] border border-reps-border bg-reps-panel p-10 text-center lg:p-14">
            <h2 className="font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              Ready to be found — not just signed up?
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[15px] text-white/70">
              Start free, get REPs verified, and run your whole practice on one
              platform. Founding pricing locked for life on paid plans — before
              public launch.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                Join REPs <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/compare"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                See all comparisons
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

/* ---------- helpers ---------- */

function Editorial({
  eyebrow,
  title,
  paragraphs,
}: {
  eyebrow: string;
  title: string;
  paragraphs: string[];
}) {
  return (
    <section className="border-b border-reps-border">
      <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
        <div className="max-w-[760px]">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
            {eyebrow}
          </span>
          <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
            {title}
          </h2>
          <div className="mt-6">
            <Prose paragraphs={paragraphs} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-4 text-[15.5px] leading-[1.7] text-white/75">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function GroupRows({
  group,
  idx,
}: {
  group: (typeof FEATURE_GROUPS)[number];
  idx: number;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={3}
          className="bg-reps-ink px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange md:px-5"
        >
          {group.label}
        </td>
      </tr>
      {group.rows.map((row) => {
        const repsCell = row.cells[0];
        const competitorCell = row.cells[idx];
        return (
          <tr
            key={row.feature}
            className="[&>*]:border-t [&>*]:border-reps-border/40"
          >
            <th
              scope="row"
              className="bg-reps-panel/30 px-4 py-4 text-left text-[13px] font-semibold text-white/90 md:px-5 md:text-[13.5px]"
            >
              {row.feature}
            </th>
            <td className="bg-reps-orange-soft/40 px-4 py-4 align-top text-[12.5px] md:px-5 md:text-[13px]">
              <CellIcon cell={repsCell} highlight />
            </td>
            <td className="px-4 py-4 align-top text-[12.5px] md:px-5 md:text-[13px]">
              <CellIcon cell={competitorCell} />
            </td>
          </tr>
        );
      })}
    </>
  );
}

// re-export for routes
export type { Competitor };
