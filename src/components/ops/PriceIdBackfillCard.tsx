// Admin card to backfill subscriptions.stripe_price_id with real Stripe price IDs.
// Lives on /admin/ops/billing.
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { backfillSubscriptionPriceIds } from "@/lib/admin/backfill-price-ids.functions";
import { Button } from "@/components/ui/button";

export function PriceIdBackfillCard() {
  const run = useServerFn(backfillSubscriptionPriceIds);
  const [environment, setEnvironment] = useState<"sandbox" | "live">("live");
  const [limit, setLimit] = useState(50);
  const [confirmLive, setConfirmLive] = useState(false);

  const mut = useMutation({
    mutationFn: (dryRun: boolean) => run({ data: { dryRun, limit, environment } }),
  });
  const r = mut.data;

  return (
    <section className="rounded-[16px] border border-reps-border bg-reps-panel/40">
      <header className="border-b border-reps-border px-4 py-3">
        <div className="text-sm font-semibold">Subscription price-ID backfill</div>
        <div className="text-xs text-reps-text/60">
          Replaces internal lookup keys (e.g. <code>verified_annual</code>) with
          real Stripe price IDs (<code>price_…</code>) on{" "}
          <code>subscriptions.stripe_price_id</code>. Required for Stripe-mirror
          reconciliation. Safe to dry-run.
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 px-4 py-4 text-xs">
        <label className="flex items-center gap-2">
          <span className="text-reps-text/60">Environment</span>
          <select
            className="rounded-md border border-reps-border bg-reps-ink/40 px-2 py-1"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as "sandbox" | "live")}
          >
            <option value="live">live</option>
            <option value="sandbox">sandbox</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-reps-text/60">Limit</span>
          <input
            type="number"
            min={1}
            max={500}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Math.min(500, Number(e.target.value) || 50)))}
            className="w-20 rounded-md border border-reps-border bg-reps-ink/40 px-2 py-1"
          />
        </label>
        <Button
          size="sm"
          variant="outline"
          onClick={() => mut.mutate(true)}
          disabled={mut.isPending}
        >
          {mut.isPending ? "Running…" : "Dry-run"}
        </Button>
        <label className="flex items-center gap-2 text-reps-text/70">
          <input
            type="checkbox"
            checked={confirmLive}
            onChange={(e) => setConfirmLive(e.target.checked)}
          />
          I understand this writes to {environment}
        </label>
        <Button
          size="sm"
          onClick={() => mut.mutate(false)}
          disabled={mut.isPending || !confirmLive}
        >
          Run live
        </Button>
      </div>

      {r && (
        <div className="border-t border-reps-border px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
            <Stat label="Mode" value={r.dryRun ? "dry-run" : "LIVE"} />
            <Stat label="Scanned" value={r.scanned} />
            <Stat label="Would/Did update" value={r.dryRun ? r.rows.filter(x => x.status === "would-update").length : r.updated} />
            <Stat label="Unchanged" value={r.unchanged} />
            <Stat label="Errors" value={r.errors} tone={r.errors > 0 ? "warn" : undefined} />
          </div>
          <div className="overflow-x-auto rounded-[12px] border border-reps-border/60">
            <table className="w-full text-xs">
              <thead className="bg-reps-ink/40 text-left uppercase tracking-wide text-reps-text/60">
                <tr>
                  <th className="px-3 py-2">Sub</th>
                  <th className="px-3 py-2">Before</th>
                  <th className="px-3 py-2">After</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-reps-border/60">
                {r.rows.slice(0, 50).map((row) => (
                  <tr key={row.subscription_id}>
                    <td className="px-3 py-2 font-mono text-[11px]">{row.stripe_subscription_id.slice(0, 18)}…</td>
                    <td className="px-3 py-2 font-mono text-[11px]">{row.before ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-[11px]">{row.after ?? "—"}</td>
                    <td className="px-3 py-2">{row.status}{row.error ? ` · ${row.error}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "warn" }) {
  const cls = tone === "warn"
    ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
    : "border-reps-border bg-reps-ink/30 text-reps-text";
  return (
    <div className={`rounded-md border px-3 py-2 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
