import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import type { Competitor } from "@/data/competitor-data";

/**
 * Interactive monthly-cost calculator. Slider sets client count; we compute the
 * competitor's monthly bill from their public tier structure and a sensible
 * always-on add-on assumption (payments + AI + branded app where applicable).
 *
 * Heuristics live here, not in data, so each competitor can have its own
 * scaling rule without bloating the data shape.
 */
export function CostCalculator({ c }: { c: Competitor }) {
  const [clients, setClients] = useState(20);

  const competitorMonthly = useMemo(() => computeMonthly(c, clients), [c, clients]);
  const repsTier = useMemo(() => pickRepsTier(clients), [clients]);
  const cur = c.currency;

  return (
    <div className="rounded-[22px] border border-reps-border bg-reps-panel p-6 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <label
            htmlFor="cost-slider"
            className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange"
          >
            How many active clients?
          </label>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-[56px] font-bold leading-none text-white">
              {clients}
            </span>
            <span className="text-[14px] text-white/55">clients</span>
          </div>
          <input
            id="cost-slider"
            type="range"
            min={1}
            max={100}
            value={clients}
            onChange={(e) => setClients(parseInt(e.target.value, 10))}
            className="mt-5 w-full accent-reps-orange"
            aria-label="Number of active clients"
          />
          <div className="mt-1 flex justify-between text-[11px] text-white/45">
            <span>1</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
          <p className="mt-6 text-[13px] leading-relaxed text-white/55">
            Move the slider to see how each platform&apos;s monthly bill changes
            as you grow. {c.name}&apos;s figure includes the base tier plus the
            always-on add-ons a serious coach actually needs. The REPs side
            shows the tier you&apos;d sit on — every feature in that tier is
            included.
          </p>
        </div>

        <div className="space-y-3">
          {/* Competitor card */}
          <div className="rounded-[18px] border border-reps-border bg-reps-ink p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-white/55">
                {c.name} monthly
              </span>
              <span className="text-[11px] text-white/45">
                {competitorMonthly.tierName}
              </span>
            </div>
            <div className="mt-2 font-display text-[40px] font-bold leading-none text-white">
              {cur}
              {competitorMonthly.total.toFixed(competitorMonthly.total % 1 === 0 ? 0 : 2)}
              <span className="text-[14px] font-normal text-white/45">/mo</span>
            </div>
            <ul className="mt-4 space-y-1 text-[12.5px] text-white/65">
              <li className="flex justify-between">
                <span>Base tier</span>
                <span>{cur}{competitorMonthly.base.toFixed(competitorMonthly.base % 1 === 0 ? 0 : 2)}</span>
              </li>
              {competitorMonthly.lines.map((l) => (
                <li key={l.name} className="flex justify-between">
                  <span>{l.name}</span>
                  <span>+ {cur}{l.cost.toFixed(l.cost % 1 === 0 ? 0 : 2)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* REPs card */}
          <div className="rounded-[18px] border border-reps-orange/40 bg-gradient-to-b from-reps-orange/15 to-reps-orange/[0.03] p-5">
            <div className="flex items-baseline justify-between">
              <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
                <Sparkles className="h-3 w-3" /> REPs tier
              </span>
              <span className="text-[11px] text-white/55">{repsTier.label}</span>
            </div>
            <div className="mt-2 font-display text-[40px] font-bold leading-none text-white">
              {repsTier.price}
              <span className="text-[14px] font-normal text-white/45">/{repsTier.unit}</span>
            </div>
            <p className="mt-3 text-[12.5px] text-white/70">
              Every feature in the {repsTier.label} tier is included — register
              listing, the operating system, programmes, nutrition, AI across
              the platform. No paid add-ons sitting on top.
            </p>
            <p className="mt-2 text-[11px] text-white/45">
              See the full 4-tier ladder on{" "}
              <a href="/pricing" className="underline underline-offset-2 hover:text-white/70">
                /pricing
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type Computed = {
  tierName: string;
  base: number;
  lines: { name: string; cost: number }[];
  total: number;
};

type RepsTier = { label: string; price: string; unit: "mo" | "yr" };

/** Map client count to the REPs tier that fits at this scale. */
function pickRepsTier(clients: number): RepsTier {
  if (clients <= 5) return { label: "Verified", price: "£99", unit: "yr" };
  if (clients <= 50) return { label: "Pro", price: "£59", unit: "mo" };
  return { label: "Studio", price: "£149", unit: "mo" };
}

/** Per-competitor monthly-cost rules. */
function computeMonthly(c: Competitor, clients: number): Computed {
  if (c.slug === "trainerize") {
    let tierName = "Basic (free)";
    let base = 0;
    const lines: { name: string; cost: number }[] = [];
    if (clients <= 1) {
      tierName = "Basic";
      base = 0;
    } else if (clients <= 15) {
      tierName = "Grow";
      base = 10;
    } else if (clients <= 100) {
      tierName = "Pro / Small Business";
      base = 79;
    } else {
      tierName = "Studio Plus";
      base = 248;
    }
    if (clients > 1) {
      lines.push({ name: "Stripe Payments add-on", cost: 10 });
      lines.push({ name: "Advanced Nutrition add-on", cost: 10 });
      if (base < 248) lines.push({ name: "Custom Branded App add-on", cost: 49 });
    }
    return { tierName, base, lines, total: base + lines.reduce((a, l) => a + l.cost, 0) };
  }

  if (c.slug === "mypthub") {
    let tierName = "Starter";
    let base = 25;
    if (clients > 3) {
      tierName = "Premium";
      base = 59;
    }
    const lines: { name: string; cost: number }[] = [
      { name: "Check-Ins AI add-on", cost: 12 },
      { name: "Branded app (amortised)", cost: 8 },
    ];
    if (clients > 25) lines.push({ name: "Zapier integration", cost: 19 });
    return { tierName, base, lines, total: base + lines.reduce((a, l) => a + l.cost, 0) };
  }

  // pt-distinction
  if (clients <= 3) {
    return { tierName: "Basic (at cap)", base: 19.9, lines: [], total: 19.9 };
  }
  if (clients <= 25) {
    const extras = clients - 3;
    return {
      tierName: "Basic + extra clients",
      base: 19.9,
      lines: [{ name: `${extras} extra clients × $6`, cost: extras * 6 }],
      total: 19.9 + extras * 6,
    };
  }
  if (clients <= 50) {
    const extras = clients - 25;
    return {
      tierName: "Pro + extra clients",
      base: 59.9,
      lines: extras
        ? [{ name: `${extras} extra clients × $2.40`, cost: +(extras * 2.4).toFixed(2) }]
        : [],
      total: +(59.9 + extras * 2.4).toFixed(2),
    };
  }
  const extras = clients - 50;
  return {
    tierName: "Master + extra clients",
    base: 89.9,
    lines: extras
      ? [{ name: `${extras} extra clients × $1.60`, cost: +(extras * 1.6).toFixed(2) }]
      : [],
    total: +(89.9 + extras * 1.6).toFixed(2),
  };
}
