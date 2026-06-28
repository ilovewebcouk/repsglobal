// Admin panel for BD Workstreams 2 & 3 — setup-link (no-customer cohort) and
// reactivation (lapsed cohort). Mirrors BdRailSwapCard but talks to the
// setup-link rails. Lives next to it on /admin/ops/billing.
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getBdSetupCohorts,
  runBdSetupLinkBatch,
} from "@/lib/billing/convert-legacy.functions";
import { Button } from "@/components/ui/button";

type Kind = "setup" | "reactivate";

export function BdSetupLinkCard() {
  const getCohorts = useServerFn(getBdSetupCohorts);
  const runBatch = useServerFn(runBdSetupLinkBatch);

  const cohortsQ = useQuery({
    queryKey: ["bd-setup-cohorts"],
    queryFn: () => getCohorts(),
    refetchInterval: 60_000,
  });

  const [kind, setKind] = useState<Kind>("setup");
  const [limit, setLimit] = useState(10);
  const [environment, setEnvironment] = useState<"sandbox" | "live">("live");
  const [confirmLive, setConfirmLive] = useState(false);

  const batchMut = useMutation({
    mutationFn: (dryRun: boolean) =>
      runBatch({ data: { dryRun, limit, environment, kind } }),
    onSuccess: () => cohortsQ.refetch(),
  });

  const c = cohortsQ.data;
  const result = batchMut.data;
  const pool = kind === "setup" ? c?.setup_count ?? 0 : c?.reactivate_count ?? 0;

  return (
    <section className="rounded-[16px] border border-reps-border bg-reps-panel/40">
      <header className="border-b border-reps-border px-4 py-3">
        <div className="text-sm font-semibold">BD setup-link &amp; reactivation</div>
        <div className="text-xs text-reps-text/60">
          Sends a token-gated card-capture link to BD members who can't be
          auto-converted: no Stripe customer (setup) or &gt; 30 days lapsed
          (reactivation). On submit, Stripe Checkout creates a real subscription
          and the webhook stamps the legacy row converted.
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        <Tile label="Setup cohort" value={c?.setup_count ?? "—"} hint="no Stripe customer" />
        <Tile label="Reactivate cohort" value={c?.reactivate_count ?? "—"} hint="lapsed > 30d / awaiting" />
        <Tile label="Unactionable" value={c?.unactionable_count ?? "—"} hint="no renewal date on file" />
      </div>

      <div className="border-t border-reps-border px-4 py-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-reps-text/60">Kind</span>
          <select
            className="rounded bg-reps-bg border border-reps-border px-2 py-1"
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
          >
            <option value="setup">setup (no customer)</option>
            <option value="reactivate">reactivate (lapsed)</option>
          </select>
          <span className="ml-3 text-reps-text/60">Limit</span>
          <input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Math.min(100, Number(e.target.value))))}
            className="w-20 rounded bg-reps-bg border border-reps-border px-2 py-1"
          />
          <span className="ml-3 text-reps-text/60">Env</span>
          <select
            className="rounded bg-reps-bg border border-reps-border px-2 py-1"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as "sandbox" | "live")}
          >
            <option value="sandbox">sandbox</option>
            <option value="live">live</option>
          </select>
          <span className="ml-3 text-reps-text/50">{pool} eligible in this cohort</span>
        </div>

        <label className="flex items-center gap-2 text-xs text-reps-text/70">
          <input type="checkbox" checked={confirmLive} onChange={(e) => setConfirmLive(e.target.checked)} />
          I understand this sends real emails to real members
        </label>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={batchMut.isPending} onClick={() => batchMut.mutate(true)}>
            {batchMut.isPending ? "Running…" : "Dry-run preview"}
          </Button>
          <Button
            size="sm"
            disabled={batchMut.isPending || !confirmLive}
            onClick={() => batchMut.mutate(false)}
          >
            {batchMut.isPending ? "Sending…" : `Send ${kind === "setup" ? "setup links" : "reactivation links"}`}
          </Button>
        </div>

        {batchMut.error && (
          <div className="text-xs text-rose-300">
            {batchMut.error instanceof Error ? batchMut.error.message : String(batchMut.error)}
          </div>
        )}

        {result && (
          <div className="rounded border border-reps-border bg-reps-bg/40 p-3">
            <div className="text-xs text-reps-text/70 mb-2">
              examined {result.examined} · sent {result.sent} · skipped {result.skipped} · errors {result.errors}
            </div>
            <div className="max-h-56 overflow-auto text-xs">
              {result.outcomes.map((o) => (
                <div key={`${o.bd_member_id}`} className="flex justify-between border-b border-reps-border/40 py-1">
                  <span className="truncate">{o.email}</span>
                  <span className={o.status === "error" ? "text-rose-300" : "text-reps-text/60"}>
                    {o.status}{o.reason ? ` · ${o.reason}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Tile({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded border border-reps-border bg-reps-bg/40 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-reps-text/50">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-reps-text/40">{hint}</div>}
    </div>
  );
}
