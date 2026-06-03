import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, ShieldCheck } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HiddenAddOns } from "@/components/marketing/HiddenAddOns";
import { CellIcon } from "@/components/marketing/CompetitorCompare";

import {
  COMPETITORS,
  REPS_SIDE,
  DATA_VERIFIED_DATE,
  type Competitor,
} from "@/data/competitor-data";
import {
  FEATURE_GROUPS,
  FEATURE_INDEX,
  type CompetitorSlug,
} from "@/data/feature-matrix";

export function HeadToHeadPage({ slug }: { slug: CompetitorSlug }) {
  const c = COMPETITORS[slug];
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
                <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> REPs vs {c.name}
              </span>
              <h1 className="mt-5 font-display text-[36px] font-bold leading-tight text-white lg:text-[52px]">
                REPs vs {c.name}: which is right for UK personal trainers in 2026?
              </h1>
              <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
                {c.name} is private coaching software — you bring your own clients,
                then pay for the features you need as add-ons. REPs is the verified
                public register, plus the operations, coaching delivery and AI
                layer — in one flat plan with nothing sold separately.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/signup"
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
                >
                  Join REPs <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
                >
                  See REPs pricing
                </Link>
              </div>
              <p className="mt-4 text-[12px] text-white/45">
                Data verified {DATA_VERIFIED_DATE} from {c.name}&apos;s public
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

      {/* TL;DR */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[760px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              The short version
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              Pick REPs if… pick {c.name} if…
            </h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <TldrCard
              kind="reps"
              title={`Pick REPs if…`}
              bullets={c.tldr.repsWins}
            />
            <TldrCard
              kind="competitor"
              title={`Pick ${c.name} if…`}
              bullets={c.tldr.competitorWins}
            />
          </div>
        </div>
      </section>

      {/* PRICING SIDE-BY-SIDE */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[760px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Pricing side-by-side
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              REPs vs {c.name} — what each tier costs.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <PricingCard
              name="REPs"
              isReps
              tagline={REPS_SIDE.bestFor}
              tiers={REPS_SIDE.tiers}
              freeTrial={REPS_SIDE.freeTrial}
              fees={REPS_SIDE.transactionFees}
              note={REPS_SIDE.whatsIncluded}
            />
            <PricingCard
              name={c.name}
              tagline={c.bestFor}
              tiers={c.tiers}
              freeTrial={c.freeTrial}
              fees={c.transactionFees}
              note={`Plus ${c.addOns.length} paid add-ons — see below.`}
            />
          </div>
        </div>
      </section>

      {/* HIDDEN ADD-ONS — the wedge */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <HiddenAddOns c={c} />
        </div>
      </section>

      {/* FEATURE PARITY 2-COL */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[760px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Feature parity
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              What you get, line by line.
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

      {/* WHEN COMPETITOR IS THE RIGHT CHOICE — credibility */}
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
            {c.faqs.map((f) => (
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
        </div>
      </section>

      {/* CROSS-LINKS + CTA */}
      <section>
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="grid gap-4 md:grid-cols-2">
            {others.map((s) => {
              const o = COMPETITORS[s];
              return (
                <Link
                  key={s}
                  to="/compare/$slug"
                  params={{ slug: `reps-vs-${s}` }}
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

function TldrCard({
  kind,
  title,
  bullets,
}: {
  kind: "reps" | "competitor";
  title: string;
  bullets: string[];
}) {
  const isReps = kind === "reps";
  return (
    <div
      className={
        isReps
          ? "rounded-[22px] border border-reps-orange/40 bg-gradient-to-b from-reps-orange/10 to-reps-orange/[0.02] p-6 lg:p-8"
          : "rounded-[22px] border border-reps-border bg-reps-panel p-6 lg:p-8"
      }
    >
      <div
        className={`text-[12px] font-semibold uppercase tracking-wider ${
          isReps ? "text-reps-orange" : "text-white/55"
        }`}
      >
        {title}
      </div>
      <ul className="mt-4 space-y-3 text-[14px] text-white/85">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5">
            <Check
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                isReps ? "text-reps-orange" : "text-white/45"
              }`}
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PricingCard({
  name,
  isReps,
  tagline,
  tiers,
  freeTrial,
  fees,
  note,
}: {
  name: string;
  isReps?: boolean;
  tagline: string;
  tiers: { name: string; price: string; clientCap: string }[];
  freeTrial: string;
  fees: string;
  note: string;
}) {
  return (
    <div
      className={
        isReps
          ? "rounded-[22px] border border-reps-orange/40 bg-gradient-to-b from-reps-orange/10 to-reps-orange/[0.02] p-6 lg:p-8"
          : "rounded-[22px] border border-reps-border bg-reps-panel p-6 lg:p-8"
      }
    >
      <h3 className="font-display text-[22px] font-bold text-white">{name}</h3>
      <p className="mt-1 text-[13px] text-white/60">{tagline}</p>

      <div className="mt-5 space-y-2.5">
        {tiers.map((t) => (
          <div
            key={t.name}
            className="flex items-baseline justify-between gap-3 rounded-[12px] border border-reps-border/60 bg-reps-ink/40 px-4 py-3"
          >
            <div>
              <div className="text-[13px] font-semibold text-white">{t.name}</div>
              <div className="text-[12px] text-white/55">{t.clientCap}</div>
            </div>
            <div className="font-display text-[16px] font-bold text-white">
              {t.price}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-[12.5px]">
        <Mini label="Free trial" value={freeTrial} />
        <Mini label="Transaction fee" value={fees} />
      </div>

      <p className="mt-5 text-[13px] leading-relaxed text-white/65">{note}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-reps-border/60 bg-reps-ink/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="mt-0.5 text-[12.5px] font-medium text-white/85">{value}</div>
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
