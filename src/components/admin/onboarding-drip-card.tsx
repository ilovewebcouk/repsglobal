import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  dryRunOnboardingNudges,
  triggerOnboardingNudges,
} from "@/lib/onboarding/nudge-dispatcher.functions";

type DryRun = {
  total: number;
  byStage: Record<string, number>;
  sample: Array<{
    email: string;
    stage: string;
    step: number;
    daysInStage: number;
    templateKey: string;
  }>;
};

const STAGE_LABEL: Record<string, string> = {
  not_signed_in: "Not signed in",
  verify_incomplete: "Verify incomplete",
  website_unpublished: "Website unpublished",
  complete: "Complete (one-time)",
};

export function OnboardingDripCard() {
  const dry = useServerFn(dryRunOnboardingNudges);
  const trigger = useServerFn(triggerOnboardingNudges);
  const [snapshot, setSnapshot] = useState<DryRun | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    processed: number;
    sent: number;
    failed: number;
    remaining: number;
    firstErrors: Array<{ email: string; error?: string; stage: string; step: number }>;
  } | null>(null);

  async function refresh() {
    setBusy(true);
    try { setSnapshot(await dry() as DryRun); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Preview failed"); }
    finally { setBusy(false); }
  }

  useEffect(() => { refresh().catch(() => {}); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function runNow() {
    setBusy(true);
    setResult(null);
    try {
      const r = await trigger({ data: { limit: 75 } });
      setResult(r);
      toast.success(`Sent ${r.sent} of ${r.processed} · ${r.remaining} remaining`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Trigger failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="font-display text-[14px] font-semibold text-white">
            Onboarding drip
          </h3>
          <p className="mt-1 text-[12px] text-white/55">
            Automated per-member email sequence. Runs daily at 08:00 UTC.
            Advances people through log-in → verify → website → complete.
            No manual sends.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={refresh} disabled={busy} className="text-reps-orange hover:text-reps-orange">
          Refresh
        </Button>
      </div>

      {snapshot ? (
        <div className="mt-3 rounded-[10px] border border-reps-border bg-reps-ink p-3 text-[12px] text-white/85">
          <div className="mb-2 font-semibold text-white">
            {snapshot.total.toLocaleString()} member{snapshot.total === 1 ? "" : "s"} would receive an email today
          </div>
          <ul className="space-y-1">
            {Object.entries(STAGE_LABEL).map(([k, label]) => (
              <li key={k} className="flex justify-between">
                <span className="text-white/70">{label}</span>
                <span className="font-semibold text-white">{snapshot.byStage[k] ?? 0}</span>
              </li>
            ))}
          </ul>
          {snapshot.sample.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-reps-orange">Sample ({snapshot.sample.length})</summary>
              <ul className="mt-2 space-y-1 text-white/70">
                {snapshot.sample.map((s, i) => (
                  <li key={i}>
                    {s.email} · <span className="text-white/85">{s.templateKey}</span> · d{s.daysInStage}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ) : (
        <div className="mt-3 text-[12px] text-white/45">Loading cohort…</div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={runNow} disabled={busy || !snapshot || snapshot.total === 0}>
          {busy ? "Sending…" : `Trigger now (up to 75)`}
        </Button>
      </div>

      {result ? (
        <div className="mt-3 rounded-[10px] border border-emerald-400/30 bg-emerald-500/10 p-3 text-[12px] text-emerald-100">
          Processed <strong>{result.processed}</strong> · sent {result.sent} · failed {result.failed} · remaining {result.remaining}
          {result.firstErrors.length > 0 && (
            <ul className="mt-2 list-disc pl-4 text-emerald-200/80">
              {result.firstErrors.map((e, i) => (
                <li key={i}>{e.email} ({e.stage}#{e.step}) — {e.error}</li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
