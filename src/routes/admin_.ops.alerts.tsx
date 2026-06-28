import { OpsSubNav } from "@/components/ops/OpsSubNav";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getRecentAlerts, ackAlert, runAlertEvaluator } from "@/lib/ops/operations.functions";
import { muteAlert, setAlertNotes, sendTestAlertEmail } from "@/lib/ops/alerts-extra.functions";
import { humaniseAlert } from "@/lib/ops/alert-humanizer";

export const Route = createFileRoute("/admin_/ops/alerts")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Alerts — REPS Ops" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const getFn = useServerFn(getRecentAlerts);
  const ackFn = useServerFn(ackAlert);
  const runFn = useServerFn(runAlertEvaluator);
  const muteFn = useServerFn(muteAlert);
  const notesFn = useServerFn(setAlertNotes);
  const testFn = useServerFn(sendTestAlertEmail);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["ops-alerts-recent"], queryFn: () => getFn(), refetchInterval: 60_000 });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["ops-alerts-recent"] });

  const ackM = useMutation({
    mutationFn: (alert_id: string) => ackFn({ data: { alert_id } }),
    onSuccess: async () => { await invalidate(); toast.success("Acknowledged"); },
  });
  const runM = useMutation({
    mutationFn: () => runFn(),
    onSuccess: async (r) => { await invalidate(); toast.success(`Evaluator ran (${r.opened} opens)`); },
  });
  const muteM = useMutation({
    mutationFn: (v: { alert_id: string; duration_minutes: number }) => muteFn({ data: v }),
    onSuccess: async () => { await invalidate(); toast.success("Mute updated"); },
  });
  const notesM = useMutation({
    mutationFn: (v: { alert_id: string; notes: string }) => notesFn({ data: v }),
    onSuccess: async () => { await invalidate(); toast.success("Notes saved"); },
  });
  const testM = useMutation({
    mutationFn: () => testFn(),
    onSuccess: (r) => toast.success(`Test alert sent to ${r.sent}/${r.total} admins`),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <DashboardShell role="admin" active="Operations" title="Alerts" subtitle="Open and recently-resolved alerts (last 7 days).">
      <div className="space-y-4 p-6">
        <OpsSubNav />
        <div className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-3 text-xs text-reps-text/70">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              Notifications: <span className="font-semibold text-reps-fg">Email only</span>. Thresholds are
              defined in code (this sprint). Mute, notes, and ack are available below.
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => testM.mutate()} disabled={testM.isPending}>
                Send test email
              </Button>
              <Button size="sm" variant="outline" onClick={() => runM.mutate()} disabled={runM.isPending}>
                Re-evaluate now
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-[16px] border border-reps-border bg-reps-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-reps-ink/40 text-left text-xs uppercase tracking-wide text-reps-text/60">
              <tr>
                <th className="px-3 py-2 w-[44%]">What happened</th>
                <th className="px-3 py-2">Sev</th>
                <th className="px-3 py-2">Opened</th>
                <th className="px-3 py-2">Resolved</th>
                <th className="px-3 py-2">Mute</th>
                <th className="px-3 py-2 w-[220px]">Notes</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-reps-border/60">
              {(q.data ?? []).map((a) => (
                <AlertRow
                  key={a.id}
                  a={a}
                  onAck={() => ackM.mutate(a.id)}
                  onMute={(min) => muteM.mutate({ alert_id: a.id, duration_minutes: min })}
                  onNotes={(notes) => notesM.mutate({ alert_id: a.id, notes })}
                />
              ))}
              {q.data && q.data.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-reps-text/60">No alerts in the last 7 days. 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}

type AlertRecord = {
  id: string;
  kind: string;
  severity: string;
  opened_at: string;
  resolved_at: string | null;
  ack_at: string | null;
  context: unknown;
  muted_until?: string | null;
  notes?: string | null;
};

function AlertRow({ a, onAck, onMute, onNotes }: {
  a: AlertRecord;
  onAck: () => void;
  onMute: (min: number) => void;
  onNotes: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(a.notes ?? "");
  const [customMin, setCustomMin] = useState("");
  const muted = a.muted_until && new Date(a.muted_until) > new Date();
  return (
    <tr className={a.resolved_at ? "opacity-60" : ""}>
      <td className="px-3 py-2 font-mono text-xs align-top">{a.kind}</td>
      <td className="px-3 py-2 align-top">
        {a.severity === "crit" ? <Badge variant="destructive">crit</Badge>
          : a.severity === "warn" ? <Badge>warn</Badge>
          : <Badge variant="outline">info</Badge>}
      </td>
      <td className="px-3 py-2 text-reps-text/80 align-top">{new Date(a.opened_at).toLocaleString("en-GB")}</td>
      <td className="px-3 py-2 text-reps-text/80 align-top">{a.resolved_at ? new Date(a.resolved_at).toLocaleString("en-GB") : "—"}</td>
      <td className="px-3 py-2 align-top">
        {muted ? (
          <div className="text-xs text-amber-200">
            until {new Date(a.muted_until!).toLocaleString("en-GB")}
            <Button size="sm" variant="ghost" className="ml-1 h-6 px-2 text-xs" onClick={() => onMute(0)}>Clear</Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {[60, 240, 1440].map((m) => (
              <Button key={m} size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => onMute(m)}>
                {m < 1440 ? `${m / 60}h` : `${m / 1440}d`}
              </Button>
            ))}
            <Input
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              placeholder="min"
              className="h-6 w-14 px-1 text-xs"
            />
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs"
              onClick={() => { const n = Number(customMin); if (Number.isFinite(n) && n > 0) onMute(n); }}>
              Set
            </Button>
          </div>
        )}
      </td>
      <td className="px-3 py-2 align-top max-w-[280px]">
        <code className="text-[11px] text-reps-text/70 break-words">{JSON.stringify(a.context)}</code>
      </td>
      <td className="px-3 py-2 align-top">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => { if ((a.notes ?? "") !== notes) onNotes(notes); }}
          placeholder="Add notes…"
          rows={2}
          className="min-h-[44px] text-xs bg-reps-ink/40"
        />
      </td>
      <td className="px-3 py-2 align-top">
        {a.resolved_at ? "—" :
          a.ack_at ? <span className="text-xs text-emerald-300">acked</span> :
          <Button size="sm" variant="ghost" onClick={onAck}>Ack</Button>}
      </td>
    </tr>
  );
}
