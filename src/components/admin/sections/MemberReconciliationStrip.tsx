import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Info, ArrowRight } from "lucide-react";

import { AdminCard } from "@/components/admin/AdminCard";
import { getAdminProfessionalsKpis } from "@/lib/admin/professionals.functions";
import { listPaymentFailedSubs } from "@/lib/admin/payment-recovery.functions";

/**
 * "Why these numbers differ" explainer strip.
 *
 * Sits near the top of /admin and only renders when the canonical numbers
 * disagree (Active Paying Members ≠ Active Professionals) or when there
 * are exception cohorts (Failed Payments > 0). Hidden when there is
 * nothing to explain so the cockpit stays calm.
 */
export function MemberReconciliationStrip({
  activePayingMembers,
}: {
  activePayingMembers: number;
}) {
  const prosFn = useServerFn(getAdminProfessionalsKpis);
  const failedFn = useServerFn(listPaymentFailedSubs);

  const prosQ = useQuery({
    queryKey: ["admin-overview", "pros-kpis"],
    queryFn: () => prosFn(),
    staleTime: 60_000,
  });
  const failedQ = useQuery({
    queryKey: ["admin-overview", "payment-failed-count"],
    queryFn: () => failedFn(),
    staleTime: 60_000,
  });

  const activePros = prosQ.data?.activeCount ?? null;
  const paidPros = prosQ.data?.paidCount ?? null;
  const failedCount = failedQ.data?.length ?? 0;

  const proGap =
    activePros !== null && activePros !== activePayingMembers
      ? activePros - activePayingMembers
      : 0;

  // Hide entirely when nothing differs and no exceptions.
  if (proGap === 0 && failedCount === 0) return null;

  return (
    <AdminCard size="panel" className="bg-reps-panel/60">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-white/5 text-white/70">
          <Info className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-white">
            Why these numbers differ
          </div>
          <div className="mt-0.5 text-[11.5px] text-white/55">
            Different concepts, different denominators. Each row links to the
            page that owns the underlying records.
          </div>

          <ul className="mt-3 divide-y divide-reps-border/60 rounded-[12px] border border-reps-border/60 bg-reps-ink/40">
            <ReconRow
              label="Active Paying Members"
              sub="Stripe + legacy + BD, deduped"
              value={activePayingMembers}
              to="/admin/memberships"
            />
            {activePros !== null ? (
              <ReconRow
                label="Active Professionals"
                sub="All confirmed pros, including Free"
                value={activePros}
                to="/admin/professionals"
              />
            ) : null}
            {proGap > 0 ? (
              <ReconRow
                label="Free / non-paying professionals"
                sub="Active Professionals − Active Paying Members"
                value={proGap}
                to="/admin/professionals"
                search={{ plan: "free" }}
                muted
              />
            ) : null}
            {paidPros !== null && paidPros !== activePayingMembers ? (
              <ReconRow
                label="Paid Professionals"
                sub="Professionals with active paid entitlement"
                value={paidPros}
                to="/admin/professionals"
                search={{ plan: "paid" }}
                muted
              />
            ) : null}
            {failedCount > 0 ? (
              <ReconRow
                label="Payment Recovery"
                sub="Members in recovery lifecycle after a failed payment"
                value={failedCount}
                to="/admin/churn"
                tone="warn"
              />
            ) : null}
          </ul>

        </div>
      </div>
    </AdminCard>
  );
}

function ReconRow({
  label,
  sub,
  value,
  to,
  hash,
  tone = "neutral",
  muted = false,
}: {
  label: string;
  sub: string;
  value: number;
  to: string;
  hash?: string;
  tone?: "neutral" | "warn";
  muted?: boolean;
}) {
  const valueClass =
    tone === "warn"
      ? "text-amber-300"
      : muted
        ? "text-white/65"
        : "text-white";
  return (
    <li>
      <Link
        to={to}
        hash={hash}
        className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
      >
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-white">{label}</div>
          <div className="text-[11px] text-white/55">{sub}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`font-display text-[16px] font-bold leading-none ${valueClass}`}
          >
            {value.toLocaleString()}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-white/35" />
        </div>
      </Link>
    </li>
  );
}
