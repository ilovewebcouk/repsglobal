import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Receipt, ShieldCheck } from "lucide-react";
import { PPanel } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { getMyLegacyPaymentHistory } from "@/lib/billing/history.functions";

function formatGBP(pence: number, currency = "gbp") {
  const v = (pence / 100).toFixed(2);
  return currency === "gbp" ? `£${v}` : `${v} ${currency.toUpperCase()}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusVariant(status: string, refunded: number) {
  if (refunded > 0) return { label: "Refunded", cls: "border-amber-400/30 bg-amber-500/15 text-amber-300" };
  if (status === "Paid") return { label: "Paid", cls: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300" };
  return { label: status, cls: "border-white/20 bg-white/5 text-white/60" };
}

export function SubscriptionHistoryPanel() {
  const fetchHistory = useServerFn(getMyLegacyPaymentHistory);
  const { data, isLoading } = useQuery({
    queryKey: ["legacy-payment-history"],
    queryFn: () => fetchHistory(),
  });

  return (
    <PPanel>
      <div className="border-b border-reps-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-white/55" />
          <h2 className="text-[14px] font-semibold text-white">REPs membership payments</h2>
        </div>
        <p className="mt-0.5 text-[12px] text-white/55">
          Every payment you've made for your REPs membership.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 p-6 text-[13px] text-white/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading payment history…
        </div>
      ) : !data || data.rows.length === 0 ? (
        <div className="p-6 text-[13px] text-white/55">No previous REPs payments on file.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-reps-border text-left text-[11px] uppercase tracking-wider text-white/45">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Description</th>
                <th className="px-3 py-3 font-semibold">Card</th>
                <th className="px-3 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const s = statusVariant(r.status, r.refunded_amount_pence);
                return (
                  <tr key={r.charge_id} className="border-b border-reps-border/60 last:border-b-0">
                    <td className="px-5 py-3 text-white/85">{formatDate(r.paid_at)}</td>
                    <td className="px-3 py-3 text-white/70">
                      {r.description?.replace(/^REPs\s*-?\s*/i, "REPs ") || "REPs membership"}
                    </td>
                    <td className="px-3 py-3 text-white/55">
                      {r.card_brand && r.card_last4
                        ? `${r.card_brand} •••• ${r.card_last4}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 font-semibold text-white">
                      {formatGBP(r.amount_pence, r.currency)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-reps-border px-5 py-4">
        {data?.is_lifetime ? (
          <div className="flex items-center gap-2 text-[13px] text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-semibold">Lifetime member</span>
            <span className="text-white/55">— no further payments due.</span>
          </div>
        ) : data?.next_due_at ? (
          <div className="flex flex-wrap items-baseline gap-x-2 text-[13px] text-white/70">
            <span className="text-white/55">Next renewal:</span>
            <span className="font-semibold text-white">{formatDate(data.next_due_at)}</span>
            {data.next_due_amount_pence ? (
              <Badge variant="outline" className="border-reps-border text-[11px] font-semibold text-white/75">
                {formatGBP(data.next_due_amount_pence)}
              </Badge>
            ) : null}
          </div>
        ) : (
          <div className="text-[12px] text-white/55">
            No renewal scheduled. If this looks wrong, contact REPs support.
          </div>
        )}
      </div>
    </PPanel>
  );
}
