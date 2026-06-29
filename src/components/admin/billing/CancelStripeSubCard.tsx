// Admin maintenance — cancel a Stripe subscription by ID.
// Surgical operator action for cleaning up duplicates / migration leftovers.
// Stripe is source of truth; we cancel there and re-sync the local mirror.

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCancelStripeSubscription,
  adminListCustomerSubscriptions,
  type CancelStripeSubResult,
  type CustomerSubSummary,
} from "@/lib/admin/cancel-stripe-sub.functions";

type Props = {
  /** Optional prefill (e.g. the duplicate we're chasing today). */
  defaultSubId?: string;
  defaultReason?: string;
};

export function CancelStripeSubCard({ defaultSubId = "", defaultReason = "" }: Props) {
  const cancelFn = useServerFn(adminCancelStripeSubscription);
  const listFn = useServerFn(adminListCustomerSubscriptions);
  const qc = useQueryClient();

  const [subId, setSubId] = useState(defaultSubId);
  const [reason, setReason] = useState(defaultReason);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<CancelStripeSubResult | null>(null);
  const [readback, setReadback] = useState<CustomerSubSummary[] | null>(null);

  const cancelMut = useMutation({
    mutationFn: async () => {
      const r = (await cancelFn({
        data: { stripeSubscriptionId: subId.trim(), env: "live", reason: reason.trim() || undefined },
      })) as CancelStripeSubResult;
      setResult(r);
      if (r.ok && r.customerId) {
        const list = (await listFn({ data: { customerId: r.customerId, env: "live" } })) as CustomerSubSummary[];
        setReadback(list);
      }
      // Refresh the surrounding billing console queries
      qc.invalidateQueries({ queryKey: ["admin", "billing"] });
      return r;
    },
  });

  const canSubmit = /^sub_/.test(subId.trim()) && confirm && !cancelMut.isPending;

  return (
    <div className="rounded-[16px] border border-amber-500/25 bg-amber-500/[0.04] p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full border border-amber-400/30 bg-amber-500/15 p-1.5 text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-medium text-white">Cancel Stripe subscription by ID</div>
          <div className="text-[12px] text-white/55">
            Surgical action for duplicate or migration-era subscriptions. Cancels live in Stripe
            (no proration, no final invoice) and re-syncs the local mirror if present.
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr]">
            <Input
              value={subId}
              onChange={(e) => setSubId(e.target.value)}
              placeholder="sub_..."
              className="font-mono text-[12px]"
            />
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional, written to audit log)"
              className="text-[12px]"
            />
          </div>

          <label className="mt-3 flex items-center gap-2 text-[12px] text-white/70">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-amber-400/40 bg-transparent"
            />
            I have verified this is the correct Stripe subscription to cancel.
          </label>

          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={!canSubmit}
              onClick={() => cancelMut.mutate()}
              className="h-8"
            >
              {cancelMut.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Cancel subscription
            </Button>
            {subId && (
              <a
                href={`https://dashboard.stripe.com/subscriptions/${subId.trim()}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[12px] text-white/55 hover:text-reps-orange"
              >
                Open in Stripe <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {result && (
            <div
              className={`mt-3 rounded-[12px] border p-3 text-[12px] ${
                result.ok
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-red-400/30 bg-red-500/10 text-red-200"
              }`}
            >
              {result.ok ? (
                <>
                  Cancelled. Status: <span className="font-mono">{result.status}</span>
                  {result.customerId && (
                    <>
                      {" "}· customer{" "}
                      <a
                        className="underline"
                        href={`https://dashboard.stripe.com/customers/${result.customerId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {result.customerId}
                      </a>
                    </>
                  )}
                </>
              ) : (
                <>Failed: {result.message ?? "unknown error"}</>
              )}
            </div>
          )}

          {readback && readback.length > 0 && (
            <div className="mt-3 rounded-[12px] border border-reps-border bg-reps-panel/40 p-3">
              <div className="text-[11px] uppercase tracking-wider text-white/55">
                Remaining subs on this customer
              </div>
              <ul className="mt-2 space-y-1 text-[12px] text-white/80">
                {readback.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-2 font-mono">
                    <a
                      href={`https://dashboard.stripe.com/subscriptions/${s.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white hover:text-reps-orange"
                    >
                      {s.id}
                    </a>
                    <span className="text-white/55">·</span>
                    <span>{s.status}</span>
                    {s.amountPence != null && s.interval && (
                      <>
                        <span className="text-white/55">·</span>
                        <span>
                          £{(s.amountPence / 100).toFixed(2)} / {s.interval}
                        </span>
                      </>
                    )}
                    {s.cancelAtPeriodEnd && (
                      <span className="ml-1 rounded-full border border-amber-400/30 bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-200">
                        cancels at period end
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
