import { Check, X } from "lucide-react";

import {
  COMPETITOR_LIST,
  REPS_SIDE,
  DATA_VERIFIED_DATE,
  type Competitor,
} from "@/data/competitor-data";

/**
 * Plans & limits strip — sits above the feature parity table on /compare and on
 * each head-to-head page. The whole point: make the add-on tax visible.
 */
export function PlansLimitsStrip({
  competitors = COMPETITOR_LIST,
}: {
  competitors?: Competitor[];
}) {
  // REPs always shown first.
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.1fr_repeat(var(--n),minmax(0,1fr))]" style={{ ["--n" as never]: competitors.length }}>
      <RepsCard />
      {competitors.map((c) => (
        <CompetitorCard key={c.slug} c={c} />
      ))}
    </div>
  );
}

function RepsCard() {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-reps-orange/40 bg-gradient-to-b from-reps-orange/10 to-reps-orange/[0.02] p-6">
      <div className="absolute right-4 top-4 inline-flex h-6 items-center rounded-full bg-reps-orange px-2.5 text-[10px] font-semibold uppercase tracking-wider text-white">
        Recommended
      </div>
      <h3 className="font-display text-[20px] font-bold text-white">REPs Pro</h3>
      <p className="mt-1 text-[12.5px] text-white/60">{REPS_SIDE.bestFor}</p>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-[28px] font-bold text-white">£59</span>
        <span className="text-[13px] text-white/55">/mo</span>
        <span className="text-[12px] text-white/40 line-through">£79</span>
      </div>
      <p className="text-[12.5px] text-white/55">
        Unlimited clients · Founding pricing locked for life
      </p>

      <div className="mt-5 rounded-[16px] border border-reps-orange/35 bg-reps-orange/10 p-3.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
          <Check className="h-3.5 w-3.5" /> Everything in this comparison is included in Pro
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/80">
          Directory profile, verification, CRM, bookings, payments, programmes,
          check-ins, nutrition, client portal and REPs AI. No paid add-on stack,
          no per-client charges, no per-extra-trainer fee.
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
        <Fact label="Booking commission" value="None" tone="good" />
        <Fact label="Add-on stack" value="None" tone="good" />
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-white/45">
        Verified (£99/yr) is a separate public register listing, not coaching
        software, and is not included in this comparison. See{" "}
        <a href="/pricing" className="underline underline-offset-2 hover:text-white/70">/pricing</a>{" "}
        for the full ladder.
      </p>
    </div>
  );
}

function CompetitorCard({ c }: { c: Competitor }) {
  const entry = c.tiers[0];
  const top = c.tiers[c.tiers.length - 1];
  return (
    <div className="rounded-[22px] border border-reps-border bg-reps-panel p-6">
      <div className="flex h-7 items-center">
        <img src={c.logo} alt={c.name} style={{ height: c.logoHeight }} className="w-auto" />
      </div>
      <p className="mt-2 text-[12.5px] text-white/55">{c.bestFor}</p>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-[22px] font-bold text-white">
          {entry.price}
        </span>
        <span className="text-[12px] text-white/45">entry tier</span>
      </div>
      <p className="text-[12.5px] text-white/55">
        {entry.clientCap} · up to {top.price} for {top.clientCap.toLowerCase()}
      </p>
      <p className="mt-1 text-[12px] text-white/45">{c.freeTrial}</p>

      <div className="mt-5 rounded-[16px] border border-reps-border bg-reps-ink p-3.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          <X className="h-3.5 w-3.5 text-white/40" /> Paid add-ons
        </div>
        <ul className="mt-2 space-y-1.5 text-[12.5px] text-white/70">
          {c.addOns.slice(0, 4).map((a) => (
            <li key={a.name} className="flex items-baseline justify-between gap-3">
              <span className="text-white/80">{a.name}</span>
              <span className="shrink-0 text-white/55">{a.cost}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
        <Fact
          label="Transaction fee"
          value={c.transactionFees}
          tone={c.transactionFees.toLowerCase().includes("none") || c.transactionFees.toLowerCase().includes("included") ? "good" : "bad"}
        />
        <Fact label="Add-on stack" value={`${c.addOns.length}+`} tone="bad" />
      </div>
    </div>
  );
}

function Fact({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" }) {
  return (
    <div className="rounded-[10px] border border-reps-border/60 bg-reps-ink/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
      <div
        className={`mt-0.5 font-semibold ${
          tone === "good" ? "text-reps-green" : "text-white/85"
        }`}
        style={{ fontSize: 12.5 }}
      >
        {value}
      </div>
    </div>
  );
}

export function PlansLimitsFootnote() {
  return (
    <p className="mt-4 text-[11px] text-white/40">
      Pricing, limits and add-ons verified {DATA_VERIFIED_DATE} from each
      platform&apos;s public pricing page.
    </p>
  );
}
