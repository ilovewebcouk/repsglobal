import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getActivityStream, type ActivityKind } from "@/lib/ops/activity.functions";

export const Route = createFileRoute("/admin_/ops/activity")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Activity stream — REPS Ops" }] }),
  component: ActivityPage,
});

const ALL_KINDS: ActivityKind[] = [
  "member_joined",
  "tier_upgrade",
  "payment_succeeded",
  "payment_failed",
  "payment_refunded",
  "recovery_completed",
  "verification_decision",
  "pro_published",
  "support_ticket",
  "review_pending",
  "email_failure",
  "cron_failure",
  "alert_opened",
  "admin_action",
];

const KIND_LABEL: Record<ActivityKind, string> = {
  member_joined: "Member joined",
  tier_upgrade: "Tier upgrade",
  payment_succeeded: "Payment",
  payment_failed: "Payment failed",
  payment_refunded: "Refund",
  recovery_completed: "Recovery",
  verification_decision: "Verification",
  pro_published: "Profile published",
  support_ticket: "Support",
  review_pending: "Review",
  email_failure: "Email failure",
  cron_failure: "Cron failure",
  alert_opened: "Alert opened",
  admin_action: "Admin action",
};

function ActivityPage() {
  const fn = useServerFn(getActivityStream);
  const [enabled, setEnabled] = useState<Set<ActivityKind>>(new Set(ALL_KINDS));
  const [hours, setHours] = useState<24 | 72 | 168>(24);

  const since = useMemo(() => new Date(Date.now() - hours * 3600_000).toISOString(), [hours]);
  const q = useQuery({
    queryKey: ["ops-activity", since, hours],
    queryFn: () => fn({ data: { since, limit: 500 } }),
    refetchInterval: 30_000,
  });

  const filtered = useMemo(
    () => (q.data ?? []).filter((e) => enabled.has(e.kind as ActivityKind)),
    [q.data, enabled],
  );

  const groups = useMemo(() => {
    const m = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const day = e.ts.slice(0, 10);
      if (!m.has(day)) m.set(day, []);
      m.get(day)!.push(e);
    }
    return [...m.entries()];
  }, [filtered]);

  function toggle(k: ActivityKind) {
    const next = new Set(enabled);
    if (next.has(k)) next.delete(k); else next.add(k);
    setEnabled(next);
  }

  return (
    <DashboardShell role="admin" active="Operations" title="Activity stream" subtitle="The operational heartbeat of REPS — everything happening across the platform.">
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2 rounded-[16px] border border-reps-border bg-reps-panel/40 p-3">
          <div className="flex gap-1">
            {([24, 72, 168] as const).map((h) => (
              <Button key={h} size="sm" variant={hours === h ? "default" : "outline"} onClick={() => setHours(h)}>
                {h === 24 ? "24h" : h === 72 ? "3d" : "7d"}
              </Button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-1">
            {ALL_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => toggle(k)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wide transition ${
                  enabled.has(k)
                    ? "border-reps-orange/40 bg-reps-orange/15 text-reps-orange"
                    : "border-reps-border bg-reps-panel/40 text-reps-text/60"
                }`}
              >
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        {q.isLoading && <div className="text-reps-text/60">Loading activity…</div>}
        {q.error && <div className="text-rose-300">Failed to load: {(q.error as Error).message}</div>}

        {groups.map(([day, evs]) => (
          <section key={day}>
            <div className="sticky top-0 z-10 -mx-6 mb-2 bg-reps-ink/95 px-6 py-2 text-xs uppercase tracking-wide text-reps-text/60">
              {new Date(day).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" })}
            </div>
            <ol className="ml-4 border-l border-reps-border/60">
              {evs.map((e, i) => (
                <li key={`${e.ts}-${i}`} className="relative pl-4 py-2">
                  <span className={`absolute -left-[5px] top-3 size-2 rounded-full ${
                    e.severity === "crit" ? "bg-rose-400" : e.severity === "warn" ? "bg-amber-400" : "bg-emerald-400"
                  }`} />
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs tabular-nums text-reps-text/60">{e.ts.slice(11, 19)}</span>
                    <Badge variant="outline" className="text-[10px] uppercase">{KIND_LABEL[e.kind as ActivityKind] ?? e.kind}</Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-sm text-reps-text/90">
                    <span>{e.summary}</span>
                    {e.href && (
                      <Link to={e.href} className="text-xs text-reps-orange hover:underline">Open →</Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {q.data && filtered.length === 0 && (
          <div className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-8 text-center text-reps-text/60">
            Nothing in the window. Quiet day. 🎉
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
