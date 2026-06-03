import { Sparkles } from "lucide-react";

import type { Competitor } from "@/data/competitor-data";

/**
 * Hidden Add-Ons block — the wedge. Shows the competitor's real monthly cost
 * at three client tiers (worked example), against REPs' one flat plan.
 */
export function HiddenAddOns({ c }: { c: Competitor }) {
  return (
    <section className="rounded-[22px] border border-reps-border bg-reps-panel p-6 lg:p-10">
      <div className="max-w-[760px]">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
          The hidden add-ons
        </span>
        <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
          What you actually pay on {c.name}.
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-white/65">
          The headline tier is the start. {c.name} sells {c.addOns.length} paid
          add-ons on top — things a serious coach typically needs from day one.
          Here&apos;s the real monthly cost at three client counts, against
          REPs&apos; one flat plan.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {c.workedExample.map((row) => (
          <div
            key={row.label}
            className="flex flex-col rounded-[18px] border border-reps-border bg-reps-ink p-5"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
              At {row.clients} clients
            </div>
            <div className="mt-1 text-[14px] font-semibold text-white">{row.label}</div>

            <div className="mt-4 space-y-1.5 text-[13px] text-white/65">
              <Line label={`Base tier`} value={fmt(row.base, c.currency)} />
              {row.addOnsApplied.map((a) => (
                <Line key={a.name} label={a.name} value={`+ ${fmt(a.cost, c.currency)}`} />
              ))}
            </div>

            <div className="mt-4 border-t border-reps-border pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] uppercase tracking-wider text-white/55">
                  {c.name} total
                </span>
                <span className="font-display text-[20px] font-bold text-white">
                  {fmt(row.total, c.currency)}
                  <span className="text-[12px] font-normal text-white/45">/mo</span>
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between rounded-[10px] bg-reps-orange/15 px-3 py-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                  <Sparkles className="h-3 w-3" /> REPs
                </span>
                <span className="font-display text-[15px] font-bold text-white">
                  One plan, all-in
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[12px] text-white/45">
        Add-ons modelled at typical street prices. {c.name}&apos;s exact add-on
        pricing varies by tier and region. See {" "}
        <a
          href={c.pricingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/70 underline underline-offset-2 hover:text-white"
        >
          their pricing page
        </a>
        .
      </p>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-white/65">{label}</span>
      <span className="shrink-0 font-medium text-white/85">{value}</span>
    </div>
  );
}

function fmt(n: number, currency: "$" | "£" | "€") {
  const fixed = Number.isInteger(n) ? n.toString() : n.toFixed(2);
  return `${currency}${fixed}`;
}
