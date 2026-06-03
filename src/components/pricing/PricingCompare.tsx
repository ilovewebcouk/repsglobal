import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";

import { COMPARE_GROUPS, TIER_META, type CellValue, type TierKey } from "./pricing-data";

function Cell({ value, dim = false }: { value: CellValue; dim?: boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  if (value === false) {
    return <Minus className="h-3.5 w-3.5 text-white/25" />;
  }
  return <span className={`text-[13px] ${dim ? "text-white/55" : "text-white/80"}`}>{value}</span>;
}

export function PricingCompare() {
  const [activeTier, setActiveTier] = useState<TierKey>("pro");

  return (
    <div>
      {/* Mobile tier selector */}
      <div className="-mx-6 mt-8 border-y border-reps-border bg-reps-ink/85 px-6 py-3 backdrop-blur lg:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {(Object.keys(TIER_META) as TierKey[]).map((t) => {
            const active = activeTier === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTier(t)}
                className={
                  active
                    ? "flex shrink-0 items-center gap-2 rounded-full bg-reps-orange px-4 py-1.5 text-[12px] font-semibold text-white shadow-none"
                    : "flex shrink-0 items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-4 py-1.5 text-[12px] font-semibold text-white/75 hover:text-white"
                }
              >
                <span>{TIER_META[t].label}</span>
                <span className={active ? "text-white/85" : "text-white/45"}>{TIER_META[t].price}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
        {/* Desktop table */}
        <table className="hidden w-full lg:table">
          <thead>
            <tr className="border-b border-reps-border">
              <th className="w-[34%] px-6 py-5 text-left text-[12px] font-semibold uppercase tracking-wider text-white/45">
                Feature
              </th>
              {(Object.keys(TIER_META) as TierKey[]).map((t) => {
                const isPro = t === "pro";
                return (
                  <th
                    key={t}
                    className={
                      isPro
                        ? "border-x border-reps-orange/30 bg-reps-orange-soft/40 px-4 py-5 text-center"
                        : "px-4 py-5 text-center"
                    }
                  >
                    <div className="font-display text-[15px] font-bold text-white">{TIER_META[t].label}</div>
                    <div className="mt-0.5 text-[12px] text-white/55">{TIER_META[t].price}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COMPARE_GROUPS.map((group) => (
              <Fragment key={`g-${group.title}`}>
                <tr className="bg-reps-panel-soft/60">
                  <td colSpan={4} className="px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/55">
                    {group.title}
                  </td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={`${group.title}-${row.label}`} className="border-t border-reps-border/60">
                    <td className="px-6 py-3 text-[14px] text-white/80">{row.label}</td>
                    <td className="px-4 py-3 text-center"><Cell value={row.verified} /></td>
                    <td className="border-x border-reps-orange/30 bg-reps-orange-soft/20 px-4 py-3 text-center"><Cell value={row.pro} /></td>
                    <td className="px-4 py-3 text-center"><Cell value={row.studio} /></td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>

        {/* Mobile table */}
        <table className="w-full lg:hidden">
          <thead>
            <tr className="border-b border-reps-border">
              <th className="w-[60%] px-5 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-white/45">
                Feature
              </th>
              <th className="px-4 py-4 text-center">
                <div className="font-display text-[14px] font-bold text-white">{TIER_META[activeTier].label}</div>
                <div className="mt-0.5 text-[11px] text-white/55">{TIER_META[activeTier].price}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_GROUPS.map((group) => (
              <Fragment key={`mg-${group.title}`}>
                <tr className="bg-reps-panel-soft/60">
                  <td colSpan={2} className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/55">
                    {group.title}
                  </td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={`m-${group.title}-${row.label}`} className="border-t border-reps-border/60">
                    <td className="px-5 py-3 text-[14px] text-white/80">{row.label}</td>
                    <td className="px-4 py-3 text-center"><Cell value={row[activeTier]} /></td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 text-center text-[13px] text-white/55">
        Need API, SSO, bulk verification or migration?{" "}
        <Link to="/contact" className="text-reps-orange hover:underline">
          See Enterprise →
        </Link>
      </div>
    </div>
  );
}
