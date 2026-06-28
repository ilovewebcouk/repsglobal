// Admin panel for the BD → Stripe Subscription rail-swap (Phase 2 of the
// "Rail Swap" plan in docs/admin-v2/bd-rail-swap-audit-2026-06-28.md).
//
// Shows the population breakdown and lets an admin run a capped batch in
// either dry-run (preview) or live mode. The "live" toggle requires an
// explicit checkbox so this can't be triggered by accident.
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getBdConvertCandidates,
  runBdConvertBatch,
} from "@/lib/billing/convert-legacy.functions";
import { Button } from "@/components/ui/button";

export function BdRailSwapCard() {
  const getCandidates = useServerFn(getBdConvertCandidates);
  const runBatch = useServerFn(runBdConvertBatch);

  const candidatesQ = useQuery({
    queryKey: ["bd-rail-swap-candidates"],
    queryFn: () => getCandidates(),
    refetchInterval: 60_000,
  });

  const [limit, setLimit] = useState(10);
  const [confirmLive, setConfirmLive] = useState(false);
  const [environment, setEnvironment] = useState<"sandbox" | "live">("sandbox");

  const batchMut = useMutation({
    mutationFn: (dryRun: boolean) =>
      runBatch({ data: { dryRun, limit, environment } }),
    onSuccess: () => candidatesQ.refetch(),
  });

  const c = candidatesQ.data;
  const result = batchMut.data;

  return (
    <section className="rounded-[16px] border border-reps-border bg-reps-panel/40">
      <header className="border-b border-reps-border px-4 py-3">
        <div className="text-sm font-semibold">BD → Stripe subscription rail-swap</div>
        <div className="text-xs text-reps-text/60">
          Converts BD legacy members onto native Stripe Subscriptions with their
          original renewal date anchored as <code>trial_end</code>. Stripe charges
          £99/yr on that date, then auto-renews. No charge happens before the
          original BD renewal date.
        </div>
      </header>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        {c ? (
          <>
            <Tile label="Auto-convertible" value={c.auto_convertible} tone="ok" />
            <Tile label="Grace (≤30d past due)" value={c.grace_cohort} tone="warn" />
            <Tile label="Needs reactivation" value={c.reactivation_cohort} tone="warn" />
            <Tile label="Needs setup link" value={c.setup_link_cohort} tone="warn" />
            <Tile label="Total open" value={c.total_open} />
          </>
        ) : (
          <div className="text-reps-text/60">Loading…</div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-reps-border px-4 py-3">
        <label className="text-xs text-reps-text/70">
          Batch size
          <input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="mt-1 block w-24 rounded-md border border-reps-border bg-reps-ink/40 px-2 py-1 text-sm text-reps-text"
          />
        </label>
        <label className="text-xs text-reps-text/70">
          Environment
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as "sandbox" | "live")}
            className="mt-1 block rounded-md border border-reps-border bg-reps-ink/40 px-2 py-1 text-sm text-reps-text"
          >
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-reps-text/70">
          <input
            type="checkbox"
            checked={confirmLive}
            onChange={(e) => setConfirmLive(e.target.checked)}
          />
          I understand this will create real Stripe subscriptions
        </label>

        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={batchMut.isPending}
            onClick={() => batchMut.mutate(true)}
          >
            Dry-run preview
          </Button>
          <Button
            size="sm"
            disabled={batchMut.isPending || !confirmLive}
            onClick={() => batchMut.mutate(false)}
          >
            {batchMut.isPending ? "Running…" : `Convert ${limit} now`}
          </Button>
        </div>
      </div>

      {batchMut.isError && (
        <div className="border-t border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
          {(batchMut.error as Error).message}
        </div>
      )}

      {result && (
        <div className="border-t border-reps-border px-4 py-3 text-sm">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-reps-text/80">
            <span>Examined: <b>{result.examined}</b></span>
            <span>Converted: <b className="text-emerald-300">{result.converted}</b></span>
            <span>Skipped: <b>{result.skipped}</b></span>
            <span>Needs setup: <b className="text-amber-300">{result.needs_setup_link}</b></span>
            <span>Needs reactivation: <b className="text-amber-300">{result.needs_reactivation}</b></span>
            <span>Errors: <b className="text-rose-300">{result.errors}</b></span>
          </div>
          {result.outcomes.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-reps-text/60">
                Per-row outcomes ({result.outcomes.length})
              </summary>
              <ul className="mt-2 max-h-64 overflow-y-auto rounded border border-reps-border bg-reps-ink/40 p-2 text-xs">
                {result.outcomes.map((o, i) => (
                  <li key={i} className="font-mono">
                    BD#{o.bd_member_id} — {o.status}
                    {"reason" in o ? ` (${o.reason})` : ""}
                    {"error" in o ? ` ${o.error}` : ""}
                    {"stripe_subscription_id" in o ? ` → ${o.stripe_subscription_id}` : ""}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" }) {
  const cls =
    tone === "ok"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      : tone === "warn" && value > 0
      ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
      : "border-reps-border bg-reps-panel/40 text-reps-text";
  return (
    <div className={`rounded-[16px] border p-4 ${cls}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
